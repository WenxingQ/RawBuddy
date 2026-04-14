// Lazy getters — require() is called at runtime inside UXP, not at bundle time
function ps() { return require('photoshop'); }
function bp() { return require('photoshop').action.batchPlay; }

/**
 * Run fn inside executeAsModal if available (PS 22.5+ / UXP API v2+),
 * otherwise call fn directly.
 */
async function withModal(commandName, fn) {
  const core = ps().core;
  if (core && typeof core.executeAsModal === 'function') {
    return core.executeAsModal(fn, { commandName });
  }
  return fn();
}

/**
 * Get basic context about the active document for Claude.
 */
export function getDocumentContext() {
  let doc;
  try {
    doc = ps().app.activeDocument;
  } catch {
    return null;
  }
  if (!doc) return null;

  let name = 'photo';
  let width = 0;
  let height = 0;
  let colorMode = 'unknown';

  try { name = String(doc.title || doc.name || 'photo'); } catch (e) { console.warn('[RawBuddy] doc.name', e); }
  try { width = Math.round(Number(doc.width)); } catch (e) { console.warn('[RawBuddy] doc.width', e); }
  try { height = Math.round(Number(doc.height)); } catch (e) { console.warn('[RawBuddy] doc.height', e); }
  try { colorMode = String(doc.mode); } catch (e) { console.warn('[RawBuddy] doc.mode', e); }

  return { name, width, height, colorMode };
}

function clamp(min, val, max) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function assertOk(results, label) {
  const r = results?.[0];
  if (r && r._obj === 'error') {
    throw new Error(label + ' failed: ' + JSON.stringify(r));
  }
}

// ---------------------------------------------------------------------------
// Adjustment layer creators — all called inside withModal
// ---------------------------------------------------------------------------

async function makeBrightnessContrast(brightness, contrast) {
  const r = await bp()([{
    _obj: 'make',
    _target: [{ _ref: 'adjustmentLayer' }],
    using: {
      _obj: 'adjustmentLayer',
      type: {
        _obj: 'brightnessEvent',
        brightness: Number(brightness),
        contrast: Number(contrast),
        useLegacy: false,
      },
    },
  }], { synchronousExecution: false });
  assertOk(r, 'BrightnessContrast');
}

async function makeHueSaturation(hue, saturation, lightness) {
  const r = await bp()([{
    _obj: 'make',
    _target: [{ _ref: 'adjustmentLayer' }],
    using: {
      _obj: 'adjustmentLayer',
      type: {
        _obj: 'hueSaturation',
        presetKind: { _enum: 'presetKindType', _value: 'presetKindCustom' },
        colorize: false,
        adjustment: [{
          _obj: 'hueSaturation',
          hue: Number(hue),
          saturation: Number(saturation),
          lightness: Number(lightness),
        }],
      },
    },
  }], { synchronousExecution: false });
  assertOk(r, 'HueSaturation');
}

async function makeVibrance(vibrance) {
  const r = await bp()([{
    _obj: 'make',
    _target: [{ _ref: 'adjustmentLayer' }],
    using: {
      _obj: 'adjustmentLayer',
      type: {
        _obj: 'vibrance',
        vibrance: Number(vibrance),
      },
    },
  }], { synchronousExecution: false });
  assertOk(r, 'Vibrance');
}

/**
 * Curves adjustment layer for highlights/shadows/whites/blacks.
 * Maps Camera Raw-style -100/+100 values to curve output levels (0-255).
 * Points are clamped to stay non-decreasing so the curve is always valid.
 *
 * blacks positive  → lifts black point (output > 0)
 * blacks negative  → deepens shadows via the shadow point (can't go below 0 on output)
 * whites negative  → pulls down the white point for highlight recovery (computed independently
 *                    of hiV, then enforced >= hiV to keep curve non-decreasing)
 */
async function makeToneCurve(highlights, shadows, whites, blacks) {
  const blacksVal = blacks ?? 0;
  const blackV  = clamp(0, blacksVal > 0 ? blacksVal * 0.30 : 0, 45);
  // Negative blacks pull the shadow point down to deepen shadows
  const shadowV = clamp(blackV, 64 + (shadows ?? 0) * 0.55 + (blacksVal < 0 ? blacksVal * 0.25 : 0), 200);
  const hiV     = clamp(shadowV, 192 + (highlights ?? 0) * 0.50, 255);
  // Compute whiteV independently so negative whites can recover below hiV,
  // then enforce non-decreasing invariant with Math.max.
  const whiteRaw = clamp(0, 255 + (whites ?? 0) * 0.25, 255);
  const whiteV   = Math.max(hiV, whiteRaw);

  const r = await bp()([{
    _obj: 'make',
    _target: [{ _ref: 'adjustmentLayer' }],
    using: {
      _obj: 'adjustmentLayer',
      type: {
        _obj: 'curves',
        presetKind: { _enum: 'presetKindType', _value: 'presetKindCustom' },
        adjustment: [{
          _obj: 'curvesAdjustment',
          channel: { _ref: 'channel', _enum: 'channel', _value: 'composite' },
          curve: [
            { _obj: 'point', horizontal: 0,   vertical: blackV  },
            { _obj: 'point', horizontal: 64,  vertical: shadowV },
            { _obj: 'point', horizontal: 192, vertical: hiV     },
            { _obj: 'point', horizontal: 255, vertical: whiteV  },
          ],
        }],
      },
    },
  }], { synchronousExecution: false });
  assertOk(r, 'ToneCurve');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply all edits returned by Claude using native PS adjustment layers.
 * camera_raw parameters are mapped to equivalent PS adjustment layers:
 *   exposure/contrast  → Brightness/Contrast layer
 *   highlights/shadows/whites/blacks → Curves layer
 *   vibrance/saturation → Vibrance layer
 * photoshop parameters map directly:
 *   hue/saturation_ps/lightness → Hue/Saturation layer
 *   brightness/contrast_ps → Brightness/Contrast layer
 */
export async function applyEdits(edits) {
  const cr  = edits.camera_raw ?? {};
  const adj = edits.photoshop  ?? {};

  await withModal('RawBuddy: Apply Adjustments', async () => {
    // Brightness/Contrast
    // camera_raw.exposure scaled to PS brightness (1 stop ≈ 40 units)
    const brightness = adj.brightness  ?? (cr.exposure  !== undefined ? clamp(-150, cr.exposure * 40, 150) : undefined);
    // PS Brightness/Contrast contrast range is -50 to +100; camera_raw.contrast is -100 to +100
    const rawContrast = adj.contrast_ps ?? cr.contrast;
    const contrast = rawContrast !== undefined ? clamp(-50, rawContrast, 100) : undefined;
    if (brightness !== undefined || contrast !== undefined) {
      await makeBrightnessContrast(brightness ?? 0, contrast ?? 0);
    }

    // Tone Curve — highlights, shadows, whites, blacks
    if (cr.highlights !== undefined || cr.shadows !== undefined ||
        cr.whites     !== undefined || cr.blacks  !== undefined) {
      await makeToneCurve(cr.highlights, cr.shadows, cr.whites, cr.blacks);
    }

    // Vibrance layer — cr.vibrance only (cr.saturation routes to Hue/Sat below)
    if (cr.vibrance !== undefined) {
      await makeVibrance(cr.vibrance);
    }

    // Hue/Saturation — photoshop section takes precedence; camera_raw.saturation is
    // a fallback. If both arrive in the same response, they are summed so neither is lost.
    const hue        = adj.hue;
    const saturation = (adj.saturation_ps !== undefined && cr.saturation !== undefined)
      ? adj.saturation_ps + cr.saturation
      : (adj.saturation_ps ?? cr.saturation);
    const lightness  = adj.lightness;
    if (hue !== undefined || saturation !== undefined || lightness !== undefined) {
      await makeHueSaturation(hue ?? 0, saturation ?? 0, lightness ?? 0);
    }
  });
}
