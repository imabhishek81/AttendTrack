---
name: ui-ux-pro-max
description: >-
  UI/UX Pro Max system: modern hierarchy, glassmorphism, dynamic animations,
  haptic visual feedback, ambient glow accents, zero-latency optimistic UI,
  and fluid spring physics.
---

# UI/UX Pro Max System

Build interfaces that look like world-class modern products. Never create simple, flat, or boring MVPs.

## Design Rules

1. **Vibrant & Tailored Palette**:
   - Never use flat generic primary colors. Use custom HSL tones with subtle saturation.
   - Gradients: Smooth dual-stop or three-stop gradients (`bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`).
   - Ambient Glow: Radial backdrop gradients (`radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%)`).

2. **Micro-Animations & Physics**:
   - Spring-like easing curves: `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Card entry cascades (`animation-delay: calc(index * 0.05s)`).
   - Dynamic pulse radar indicators for live or active statuses.

3. **Optimistic Zero-Latency UI**:
   - Reflect user actions instantly in local state before the server roundtrip finishes.
   - Provide non-intrusive toast notifications and seamless inline error recovery.

4. **Rich Empty States**:
   - Never show blank blankness or generic "No items found".
   - Include thematic icons, welcoming headers, descriptive guidance, and direct action triggers (`+ Add Subject`, `+ New Entry`).
