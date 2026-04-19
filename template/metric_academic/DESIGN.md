# Design System Specification: The Academic Atelier

## 1. Overview & Creative North Star
**Creative North Star: The Academic Atelier**
This design system moves beyond the utility of a "management tool" to create a high-end, editorial environment for educational administration. Inspired by the clarity of Notion and the technical precision of Stripe, it treats school data not as a chore, but as a curated collection of insights. 

We break the "template" look by embracing **intentional asymmetry** and **tonal depth**. Instead of rigid grids, we use expansive whitespace to let information breathe. The experience is defined by "The Academic Atelier" philosophy: where the structural rigor of a school meets the soft, tactile elegance of a modern design studio. It is professional, authoritative, yet remarkably approachable.

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated interplay of monochromatic grays punctuated by a soulful, "Sea-Glass" teal (`primary`).

### The "No-Line" Rule
Standard 1px borders are largely prohibited for sectioning. To define boundaries, we rely on **Background Color Shifts**. For example, a student profile section (`surface-container-low`) should sit directly on the main page (`surface`) without a stroke. The change in tone is the boundary.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of fine paper. 
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Structural Layer:** `surface-container-low` (#f0f4f7)
- **Active Interactive Layer:** `surface-container-lowest` (#ffffff)
- **Information Depth:** Use `surface-container-high` (#e1e9ee) for nested elements like sidebar navigation or inset data widgets.

### The Glass & Gradient Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating elements (e.g., dropdowns, modals, or fixed headers). Apply the `surface-container-lowest` token at 80% opacity with a `24px` backdrop-blur. 
- **Signature Gradient:** For high-impact CTAs, use a subtle linear gradient from `primary` (#006a61) to `primary_dim` (#005d55) at a 135-degree angle. This adds "soul" and a premium finish that flat fills cannot replicate.

---

## 3. Typography
We use **Inter** exclusively. The editorial feel is achieved through extreme contrast between Display and Body scales.

- **Display-LG (3.5rem):** Reserved for high-level data summaries (e.g., "98% Attendance"). Use `on-background` with `-0.02em` letter spacing for a "tight" editorial look.
- **Headline-SM (1.5rem):** Use for section titles. Ensure ample top-margin (3x the bottom-margin) to create a clear "chapter" break.
- **Body-MD (0.875rem):** The workhorse. Use `on-surface-variant` (#566166) for secondary information to maintain a soft, low-fatigue reading experience.
- **Label-SM (0.6875rem):** All-caps with `0.05em` letter-spacing for category tags and metadata.

---

## 4. Elevation & Depth
We eschew traditional "box shadows" in favor of **Tonal Layering**.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container` background. This creates a "natural lift" via contrast rather than structural lines.
- **Ambient Shadows:** When an element must float (e.g., a "Mark Attendance" FAB), use an extra-diffused shadow: `0px 12px 32px rgba(42, 52, 57, 0.06)`. The shadow color is a tinted version of `on-surface`, never pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-contrast scenarios), use `outline-variant` (#a9b4b9) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_dim`), `on-primary` text, `lg` (0.5rem) roundedness.
- **Secondary:** `secondary_container` fill with `on-secondary_container` text. No border.
- **Tertiary (Ghost):** No fill or border. `primary` text. Use for low-emphasis actions like "Cancel."

### Input Fields
- **Container:** Use `surface-container-low` with a `Ghost Border` on focus.
- **Interaction:** On focus, the background shifts to `surface-container-lowest`. 
- **Error State:** Transition the background to `error_container` (at 20% opacity) and use `error` for the helper text.

### Cards & Lists
- **The Divider Rule:** Forbid 1px divider lines. Separate list items using `12px` of vertical whitespace or alternating `surface` and `surface-container-low` backgrounds.
- **Attendance Chips:** 
    - *Present:* `primary_container` (#89f5e7) / `on-primary_container` (#005c54).
    - *Absent:* `error_container` (#fe8983) / `on-error_container` (#752121).
    - *Late:* `secondary_container` (#d3e4fe) / `on-secondary_container` (#435368).

### Bespoke Component: The Attendance Ribbon
A horizontal, scrollable timeline using `surface-container-highest` for the track and `primary` for the active indicator. Use `xl` (0.75rem) corner radius to make the data feel approachable and tactile.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `surface-container-lowest` for the main content "stage" to make the data pop against the `surface` background.
- **Do** embrace asymmetrical white space. Let the right-hand side of a header have more room than the left to create a sense of movement.
- **Do** use `title-lg` for student names, giving them an "Editorial Profile" importance.

### Don't:
- **Don't** use 100% opaque borders to separate UI sections. Use color shifts.
- **Don't** use hard-edged shadows. If you can see the shadow’s edge, it’s too dark.
- **Don't** use pure black (#000000) for text. Always use `on-surface` (#2a3439) to maintain the soft-minimalist aesthetic.
- **Don't** crowd the interface. If a screen feels full, increase the page padding (`48px` minimum on desktop).