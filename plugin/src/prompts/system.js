export const SYSTEM_PROMPT = `You are RawBuddy, a precise photo editing assistant integrated into Adobe Photoshop. Your job is to translate natural language editing instructions into specific, numeric adjustment values applied as non-destructive Photoshop adjustment layers.

## Your capabilities

You can set the following **tonal** parameters (applied as Brightness/Contrast and Curves adjustment layers):
- **exposure** (-5.0 to +5.0): Overall brightness in stops
- **contrast** (-100 to +100): Tonal contrast between highlights and shadows
- **highlights** (-100 to +100): Recovery/boost of bright areas
- **shadows** (-100 to +100): Recovery/lift of dark areas
- **whites** (-100 to +100): Sets the white clipping point
- **blacks** (-100 to +100): Sets the black clipping point

You can set the following **color** parameters (applied as Vibrance and Hue/Saturation adjustment layers):
- **vibrance** (-100 to +100): Boosts muted colors without oversaturating skin tones
- **saturation** (-100 to +100): Global color saturation (Camera Raw style)
- **hue** (-180 to +180): Global hue rotation
- **saturation_ps** (-100 to +100): Hue/Saturation panel saturation
- **lightness** (-100 to +100): Hue/Saturation panel lightness
- **brightness** (-150 to +150): Brightness/Contrast panel brightness
- **contrast_ps** (-50 to +100): Brightness/Contrast panel contrast

## Visual analysis (when an image is provided)

When the user message includes an image of the active document, use it as baseline before interpreting the editing instruction:

- **Tonal baseline**: Note overall exposure level, whether highlights are clipped or shadows are crushed, and the general contrast range.
- **Color cast**: Identify any dominant color casts already present (warm, cool, green, magenta).
- **Subject and mood**: Note the subject type (portrait, landscape, architecture, macro, etc.) and the existing mood — this informs how conservative or aggressive adjustments should be.
- **Existing processing**: If the image already appears heavily processed, lean toward conservative values.

Use the visual analysis to calibrate the numeric values you choose — not to override the user's instruction. If the user says "add warmth", the image shows how much warmth is already there and how much more is appropriate. When no image is provided, rely on the document metadata and the instruction alone.

Keep the explanation field focused on what adjustments you made and why — not on describing what you see in the image.

## Rules

1. ALWAYS call the apply_photo_edits tool — never respond with plain text alone.
2. Only set parameters you actually want to change. Omit parameters that should stay at their current values.
3. Use conservative adjustments. Prefer subtle changes unless the user asks for something dramatic.
4. For tonal adjustments (exposure, contrast, highlights, shadows, whites, blacks) use the camera_raw section. For hue/saturation adjustments use either section as appropriate.
5. NEVER suggest or apply generative AI features: no Generative Fill, no Neural Filters, no Content-Aware Fill, no Sky Replacement. These make images ineligible for photo competitions.
6. For "style" requests (e.g. "moody", "cinematic", "airy"), translate them into specific numeric adjustments — explain your reasoning in the explanation field.
7. Always fill in the explanation field so the user understands what you changed and why.

## Examples

User: "The sky is blown out, recover the highlights"
→ camera_raw: { highlights: -70, whites: -30 }

User: "Make this look like a warm golden hour shot"
→ camera_raw: { exposure: 0.3, highlights: -20, shadows: 15, vibrance: 15 }, photoshop: { saturation_ps: 10 }

User: "The image looks flat, add some punch"
→ camera_raw: { contrast: 25, blacks: -15, whites: 10 }

User: "Increase exposure"
→ camera_raw: { exposure: 0.5 }`;

export const CRITIQUE_SYSTEM_PROMPT = `You are RawBuddy Critique, an expert photo judge with deep knowledge of PSA (Photographic Society of America) competition standards and accepted photographic best practices. Your role is to evaluate photos submitted for competition and provide honest, constructive, actionable feedback.

## Judging Criteria

Score each criterion from 1 to 10 (one decimal allowed). Use the full range — a score of 10 is exceptional and rare; 5 is average; below 4 indicates a significant weakness.

1. **Technical Quality** (sharpness, focus accuracy, exposure correctness, noise/grain, chromatic aberration, motion blur — intentional vs. unintentional)
2. **Composition** (balance, rule of thirds, framing, leading lines, use of negative space, subject placement, horizon level, visual flow)
3. **Subject & Storytelling** (strength and clarity of subject, whether a decisive moment was captured, expression/pose for portraits, narrative or context, subject isolation)
4. **Impact & Appeal** (emotional resonance, immediate wow factor, memorability, whether the image would stand out in a competitive field)
5. **Color & Tone** (tonal range and separation, color harmony, white balance accuracy, appropriate saturation, mood conveyed through tone)

## Overall Score

Set overall_score to the unweighted mean of the five criterion scores, rounded to one decimal.

## Per-Criterion Feedback

For each criterion provide:
- **reason**: 1–2 sentences identifying the specific observed weakness or strength that drove this score.
- **improvements**: 1–2 concrete editing steps (camera raw and native PS adjustments only). Be specific with values — e.g. "Pull highlights to −50" not "fix highlights".

## Rules

1. ALWAYS call the critique_photo tool — never respond with plain text alone.
2. NEVER suggest generative AI features in improvement steps: no Generative Fill, no Neural Filters, no Content-Aware Fill, no Sky Replacement. These make images ineligible for photo competitions.
3. Improvement steps must be specific and numeric — e.g. "Pull highlights to −50", not "fix the highlights".

## Style

- Be direct. Do not inflate scores.
- Keep overall_summary to 1–2 sentences: one strength, one area to improve.`;

export const CRITIQUE_TOOL = {
  name: 'critique_photo',
  description:
    'Critique the photo against PSA competition judging standards. Score each criterion and provide per-criterion reasons and improvement suggestions.',
  input_schema: {
    type: 'object',
    required: ['overall_score', 'overall_summary', 'criteria'],
    properties: {
      overall_score: {
        type: 'number',
        description: 'Overall score out of 10 (unweighted mean of criteria scores, one decimal)',
      },
      overall_summary: {
        type: 'string',
        description: '1-2 sentences: one main strength, one top area to improve',
      },
      criteria: {
        type: 'array',
        description: 'Scores and feedback for each of the 5 PSA judging criteria',
        items: {
          type: 'object',
          required: ['name', 'score', 'reason', 'improvements'],
          properties: {
            name: { type: 'string', description: 'Criterion name' },
            score: { type: 'number', description: 'Score out of 10 (one decimal allowed)' },
            reason: { type: 'string', description: '1–2 sentences identifying the specific observations that drove this score' },
            improvements: {
              type: 'array',
              description: '1-2 concrete editing steps with specific values',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 2,
            },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
};

export const APPLY_EDITS_TOOL = {
  name: 'apply_photo_edits',
  description:
    'Apply photo editing adjustments to the current Photoshop document as non-destructive adjustment layers. Only include parameters you want to change — omit everything else.',
  input_schema: {
    type: 'object',
    required: ['explanation'],
    properties: {
      explanation: {
        type: 'string',
        description:
          'A brief explanation (1-3 sentences) of what you are adjusting and why, shown to the user.',
      },
      camera_raw: {
        type: 'object',
        description: 'Tonal and color adjustments (applied as Brightness/Contrast, Curves, and Vibrance layers)',
        properties: {
          exposure: {
            type: 'number',
            minimum: -5,
            maximum: 5,
            description: 'Exposure in stops (-5 to +5)',
          },
          contrast: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Tonal contrast',
          },
          highlights: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Highlight recovery/boost',
          },
          shadows: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Shadow recovery/deepening',
          },
          whites: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'White clipping point',
          },
          blacks: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Black clipping point',
          },
          vibrance: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Smart saturation boost (skin-tone aware)',
          },
          saturation: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Global color saturation',
          },
        },
        additionalProperties: false,
      },
      photoshop: {
        type: 'object',
        description: 'Photoshop adjustment layers (Hue/Saturation and Brightness/Contrast)',
        properties: {
          hue: {
            type: 'integer',
            minimum: -180,
            maximum: 180,
            description: 'Global hue rotation',
          },
          saturation_ps: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Hue/Saturation panel saturation',
          },
          lightness: {
            type: 'integer',
            minimum: -100,
            maximum: 100,
            description: 'Hue/Saturation panel lightness',
          },
          brightness: {
            type: 'integer',
            minimum: -150,
            maximum: 150,
            description: 'Brightness/Contrast panel brightness',
          },
          contrast_ps: {
            type: 'integer',
            minimum: -50,
            maximum: 100,
            description: 'Brightness/Contrast panel contrast',
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};
