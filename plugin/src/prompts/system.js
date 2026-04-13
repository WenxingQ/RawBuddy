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
