---
name: vercel-composition-pattern
description: >-
  Vercel Composition Patterns: Compound components, slots, polymorphic primitives,
  render-delegation, headless UI architecture, clean decoupling, and modular layout structures.
---

# Vercel Composition Patterns

Build reusable, decoupled, and maintainable component architectures inspired by Radix UI, shadcn, and Vercel design system.

## Key Architecture Patterns

1. **Compound Component Structure**:
   - Deconstruct complex widgets into composable subcomponents:
     `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>`.
   - Allows flexible layouts without prop explosion or monolithic components.

2. **Polymorphic Render-Delegation (asChild)**:
   - Allow components to merge behavior and styles into children (e.g. Radix `Slot`).
   - Clean button wrapping without redundant DOM elements.

3. **Separation of Presentation and Data**:
   - Presentational components remain pure and stateless whenever possible.
   - Custom hooks encapsulate API fetching, caching, and optimistic mutations (`useSubjectData()`, `useAttendance()`).

4. **Controlled & Uncontrolled Flexibility**:
   - Provide standard `value` + `onChange` interfaces with internal fallback defaults for frictionless composition.
