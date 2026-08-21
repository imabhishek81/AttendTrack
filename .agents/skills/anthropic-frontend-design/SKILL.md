---
name: anthropic-frontend-design
description: >-
  Anthropic Frontend Design standard for building thoughtful, editorial, clean,
  and highly usable interfaces with purposeful hierarchy, readable typography,
  and intuitive data visualisations.
---

# Anthropic Frontend Design Guide

Anthropic design principles focus on clarity, calm elegance, high information density with low cognitive load, and thoughtful user-centered flows.

## Core Tenets

1. **Clarity Over Clutter**:
   - Every element must have a clear purpose.
   - Use progressive disclosure for complex controls.
   - Generous breathing room (padding & margins) paired with sharp visual hierarchy.

2. **Refined Typography**:
   - Modern font stacks (Inter, Geist, Outfit, or system-ui).
   - High legibility contrast for body copy and subtle secondary tokens.
   - Strict scale: Headings (24-32px bold/tight tracking), Section titles (14-16px semibold), Body (13-14px regular), Metadata/Pills (11-12px medium).

3. **Thoughtful Interactive States**:
   - Hover states with smooth transitions (`transition-all duration-200`).
   - Active press states (`active:scale-[0.98]`).
   - Clear focus rings for full accessibility.

4. **Data Clarity & Visual Summaries**:
   - Visual badges (Safe, Warning, Danger) with distinct shapes and color harmony.
   - Instant visual progress rings and progress bars for metric comprehension.
   - Rich simulator projections (What-If engines) to make abstract numbers actionable.
