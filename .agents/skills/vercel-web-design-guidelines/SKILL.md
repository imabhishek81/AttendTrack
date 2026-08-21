---
name: vercel-web-design-guidelines
description: >-
  Vercel Web Design Guidelines: Obsidian dark themes (#08090E, #0D0F17), precise
  specular borders (white/[0.08]), crisp typography, pill badges, and refined
  high-performance layout patterns.
---

# Vercel Web Design Guidelines

Emulate the ultra-polished aesthetic of Vercel, Next.js, and Linear.

## Core Visual System

1. **Obsidian Surface Layers**:
   - Background: `#08090E` (Deep space obsidian).
   - Card Surface: `#0E111C` / `#131722`.
   - Popovers / Modals: `#181C2A` with backdrop blur (`backdrop-blur-xl`).

2. **Specular 1px Borders**:
   - Ultra-subtle borders: `border border-white/[0.08]` or `border-white/[0.06]`.
   - Gradient borders on active cards: `border-image` or pseudo-element glowing strokes.

3. **Status Badges & Live Radar**:
   - Rounded-full pill tags with inner glowing dot:
     - Safe: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
     - Warning: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
     - Danger: `bg-rose-500/10 text-rose-400 border border-rose-500/20`
   - Pulsing radar dot for real-time indicators.

4. **Interactive Hover & Elevation**:
   - `glass-card-hover`: Translate Y -2px, glowing border highlight, subtle radial lighting behind the card.
