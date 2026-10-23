# Design

> Auto-generated and maintained by frontend-god-mode.
> Source of truth for typography, color, motion, layout, and component tokens.
> Read this BEFORE touching the UI in any subsequent session.

## Aesthetic direction

Editorial archive tool: ink-dark surfaces, warm paper type, quiet copper actions, and image-first reference browsing.

## Dials

- DESIGN_VARIANCE: 8 / 10
- MOTION_INTENSITY: 6 / 10
- VISUAL_DENSITY: 4 / 10

## Type stack

- Display and body: Manrope
- Mono: DM Mono
- Loaded via: named local or system-installed font stack during development, to be self-hosted before Chrome Web Store release
- Display treatment: tight tracking, strong weight, short editorial line breaks

Banned in this project: Inter, Roboto, Arial, system-ui, purple-blue gradients, emojis, and generic dashboard card grids.

## Color tokens

```css
:root {
  --bg: oklch(0.12 0.012 65);
  --panel: oklch(0.16 0.012 65);
  --paper: oklch(0.94 0.015 70);
  --muted: oklch(0.67 0.018 70);
  --line: oklch(0.27 0.015 65);
  --accent: oklch(0.72 0.13 58);
  --success: oklch(0.72 0.12 145);
}
```

Copper is the only accent. Neutrals stay warm to match the archive and reference-library metaphor.

## Shadows

Avoid large black shadows. Use thin tinted borders and low-opacity warm surfaces instead.

## Motion

- CSS ease: `cubic-bezier(0.16, 1, 0.3, 1)`
- Candidate reveals stagger by 70ms.
- Image hover uses transform and filter only.
- Hero frame stack uses perspective transforms, slow drift, orbit breathing, and a pulsing status marker.
- Brand mark rotates on hover with a counter-rotating inner square.
- Info controls open on click and keyboard focus with plain-language explanations.
- Background depth uses repeated FrameVault diamond tiles with slow perspective drift.
- Source adapters use a small edge-faded marquee with verified brand marks, active and planned states, and no duplicate logo visible in one viewport.
- Collection runs use a fixed progress lock so partial writes cannot be interrupted by another UI action.
- Save rules expose an explicit Original, PNG, or JPG output format control beside metadata exports.
- Duplicate removal is an explicit switch with enabled and off states, so the collection behavior is visible before saving.
- Save controls reserve fixed space for switch labels. Completion separates saved count, wrapping folder path, failure details, and retry action. Background tiles are subdued behind task content.
- Reduced motion removes transitions and entrance animation.
- No width or height animation.

## Layout

- Side panel shell with a 860px maximum width and 24px desktop gutter.
- Header and collection context use thin rules instead of nested cards.
- Candidate grid is four columns on wide panels and two columns on narrow panels.
- Mobile collapses context and save-rule sections to one column.

## Component inventory

- Brand lockup
- Current page introduction
- Context row
- Candidate grid and candidate card
- Destination preview
- Save rules panel
- Completion summary
- Perspective frame-stack hero visual
- FrameVault vector source mark with PNG extension icons and favicon
- Empty first-run state with instructions to scan Behance or Dribbble, without sample images

## Brand voice

Direct, technical, slightly dry. Buttons use concrete verbs such as `Scan current page`, `Choose destination`, and `Collect selected`.

## Accessibility floor

- Visible focus rings on all controls
- Minimum 44px button height for primary actions
- Reduced motion support
- Inline status messaging with `role="status"`
- Labels for query and numeric controls
- Duplicate removal starts off, with stable control width in both states

## Last updated

2026-10-23 by collection progress lock, write-state feedback, output format control, and duplicate removal switch
