# RawBuddy

A Photoshop UXP panel plugin that lets you edit photos using plain English. Type a command like *"recover the blown-out sky"* or *"make this look like a warm golden hour shot"* and RawBuddy translates it into precise, non-destructive Photoshop adjustment layers — no sliders, no guesswork.

## What it does

RawBuddy sends your instruction to Claude (Anthropic's AI) which figures out the right combination of tonal and colour adjustments and returns specific numeric values. Those values are applied directly to your document as native Photoshop adjustment layers:

- **Brightness/Contrast** — exposure and contrast adjustments
- **Curves** — highlight recovery, shadow lifting, white/black point control
- **Hue/Saturation** — global saturation, hue rotation, lightness
- **Vibrance** — skin-tone-aware saturation boost

All edits are non-destructive and fully reversible. No pixels are touched. **No generative AI features are ever used** — no Generative Fill, no Neural Filters, no Content-Aware Fill — so your images remain eligible for photo competitions.

## Requirements

- Adobe Photoshop 2026 (v27+)
- An [Anthropic API key](https://console.anthropic.com)
- Adobe UXP Developer Tool (for loading the plugin)

## Setup

```bash
cd plugin
npm install
npm run build
```

Then in the **Adobe UXP Developer Tool**:
1. Add Plugin → select `plugin/manifest.json`
2. Click **Load**
3. In Photoshop: **Window → RawBuddy**
4. Go to the **Settings** tab, enter your Anthropic API key, click **Save Key**

After any code change: `npm run build`, then click **Reload** in UXP Developer Tool.

## Usage

Open a photo in Photoshop, select the layer you want to adjust, and type a command in the panel:

- *"increase exposure by half a stop"*
- *"the shadows are too dark, open them up"*
- *"make this moody and cinematic"*
- *"the sky is blown out — recover the highlights"*
- *"make it black and white"*
- *"boost the colours without oversaturating skin tones"*

RawBuddy explains what it changed and logs every edit in the History tab for the session.

## Development

```bash
npm run dev      # unminified build
npm run watch    # watch mode
```

See `CLAUDE.md` for architecture details and hard-won UXP/batchPlay lessons.
