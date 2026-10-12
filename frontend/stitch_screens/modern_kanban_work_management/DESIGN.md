---
name: Modern Kanban Work Management
colors:
  surface: '#faf9ff'
  surface-dim: '#ccdaff'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#051a3e'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3054'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#285ab9'
  on-secondary: '#ffffff'
  secondary-container: '#709bfe'
  on-secondary-container: '#003179'
  tertiary: '#004e32'
  on-tertiary: '#ffffff'
  tertiary-container: '#006844'
  on-tertiary-container: '#7de7b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b1c6ff'
  on-secondary-fixed: '#001946'
  on-secondary-fixed-variant: '#00419d'
  tertiary-fixed: '#8df7c1'
  tertiary-fixed-dim: '#71dba6'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005235'
  background: '#faf9ff'
  on-background: '#051a3e'
  surface-variant: '#d8e2ff'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-mobile: 0.5rem
  margin: 1.5rem
  margin-mobile: 0.75rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system embodies a balanced, modern enterprise productivity aesthetic rooted in Atlassian design principles. It balances dense information delivery with visual clarity, systematic structure, and intuitive direct manipulation.

### Personality & Demeanor
- **Systematic & Dependable:** Predictable visual patterns reduce cognitive friction, allowing users to navigate high-density task boards effortlessly.
- **Approachable & Purposeful:** Functional color accents indicate state and progress without cluttering the screen or overwhelming the interface.
- **Tactile & Fluid:** Micro-interactions, subtle lifts, drag-and-drop feedback, and elevation shifts simulate working with physical index cards on a canvas.

### Design Movement
- **Corporate Modern with Tactile Nuance:** Structured layout grids, slate dividing borders, crisp surface tiers, and calibrated ambient drop shadows designed specifically for multi-column board layouts and nested card hierarchies.

## Colors

The color system establishes clear visual contrast between navigation anchors, column containers, and interactive task cards.

### Core Roles
- **Primary (`#0052CC`):** The definitive Atlassian blue. Used for primary calls-to-action, selected tab states, focus rings, and high-priority indicators.
- **Secondary (`#0747A6`):** Deep cobalt blue. Serves as active/hover state for primary elements, navigation bar foundations, and selected board header states.
- **Tertiary (`#00875A`):** Forest emerald. Signals completion states, successful operations, done-column indicators, and positive metric deltas.
- **Neutral (`#091E42`):** Classic deep ink. Serves as the base color for all text, high-contrast icons, and structural divider scales when alpha-stepped.

### Project & Board Palette
- **Warning / Blocked:** `#FFAB00` (Amber) for warnings, pending items, and medium priority badges.
- **Critical / Danger:** `#DE350B` (Crimson) for overdue deadlines, destructive actions, and urgent tags.
- **Information / Discovery:** `#5243AA` (Deep Purple) for feature labels, technical tags, and epics.
- **Canvas Base:** `#F4F5F7` (Slate 50) for the main board canvas.
- **Column Surface:** `#EBECF0` (Slate 100) for column shells and inactive drop containers.
- **Card Surface:** `#FFFFFF` (Pure White) for kanban cards, flyouts, and modal dialogs.
- **Border Rim:** `#DFE1E6` (Slate 200) for dividing lines, card borders, and input strokes.

## Typography

The type system relies on **Inter** for all functional board UI, data headers, and card meta-information, paired with **JetBrains Mono** for developer keys, issue tickets, and commit references.

- **Scale & Hierarchy:** Column headers utilize `headline-sm` with upper-tier font weights (`600`) to remain identifiable during fast horizontal scanning.
- **Card Titles:** Set strictly in `body-md` at weight `500` or `label-lg` at `600`, ensuring high density without compromising readability.
- **Metadata & Badges:** `label-sm` utilizes an all-caps treatment with a `0.04em` tracking offset to differentiate tags, priority flags, and task ID numbers from body descriptions.
- **Prose Fields:** Descriptions and comment fields strictly follow `body-md` (`14px`/`20px`) to align with Atlassian's standard paragraph scale.

## Layout & Spacing

This design system uses a horizontal-scroll board framework paired with an 8px base rhythm (subdivided to 4px and 2px for micro-spacing).

### Board Architecture
- **Horizontal Lane Canvas:** The kanban board layout operates as an edge-anchored flex canvas with horizontal scrolling. Columns maintain a fixed width of `272px` to `280px` on desktop viewports.
- **Column Padding:** Column shells use `space-sm` (8px) internal padding, with cards spaced vertically by `space-sm` (8px).
- **Responsive Adaptations:**
  - **Desktop (>= 1024px):** Columns line up horizontally with a `gutter` of `0.75rem` (12px). The board workspace fills the viewport height with independent column scrolling.
  - **Tablet (768px - 1023px):** Columns remain horizontal with snap-scrolling enabled and a reduced margin of `1rem`.
  - **Mobile (< 768px):** Columns switch to a swipeable carousel or a stacked accordion layout with `margin-mobile` of `0.75rem` (12px) and full-width card presentations.

## Elevation & Depth

Visual hierarchy uses three distinct layers: surface tinting, structural border definition, and diffuse ambient shadows.

### Elevation Levels
- **Canvas Base (Level 0):** Background canvas (`#F4F5F7`), no shadow, no border.
- **Column Level (Level 1):** Inset surfaces (`#EBECF0`) with a subtle `1px solid #DFE1E6` border to define boundaries without visual clutter.
- **Resting Card (Level 2):** Pure white cards (`#FFFFFF`) with a `1px solid #DFE1E6` border and a soft ambient shadow:
  `box-shadow: 0 1px 1px rgba(9, 30, 66, 0.08), 0 0 1px rgba(9, 30, 66, 0.16)`.
- **Card Hover (Level 3):** Elevates slightly to signal interactivity:
  `box-shadow: 0 4px 8px -2px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.25)`.
- **Dragging Card / Floating Element (Level 4):** Lifts above the board canvas with a slight tilt (1.5deg to 2deg):
  `box-shadow: 0 12px 24px -6px rgba(9, 30, 66, 0.2), 0 0 1px rgba(9, 30, 66, 0.3)`.
- **Modals & Overlays (Level 5):** Center-staged detail panels, popovers, and quick-card editors:
  `box-shadow: 0 20px 32px -8px rgba(9, 30, 66, 0.28), 0 0 1px rgba(9, 30, 66, 0.32)`.

## Shapes

The design system maintains a refined, soft geometric aesthetic (`roundedness: 1`). Elements favor crisp, compact corner radii to preserve interior usable space within dense productivity widgets.

- **Cards & Inputs:** `rounded-sm` (3px to 4px / `0.25rem`) provides clean corners that integrate with 1px slate borders.
- **Columns & Flyouts:** `rounded-md` (8px / `0.5rem`) frames the groupings.
- **Labels, Badges, & Avatars:** Fully rounded pill shapes (`9999px`) for functional status tags and member avatars to distinguish them from rectangular cards.

## Components

### Buttons
- **Primary:** Background `#0052CC`, text `#FFFFFF`, radius `4px`, height `32px` (standard) or `40px` (prominent). Hover state shifts to `#0747A6`.
- **Subtle / Ghost (Column footers & action triggers):** Transparent background, text `#42526E`, hover background `rgba(9, 30, 66, 0.08)`.
- **Icon Buttons:** Uniform `32x32px` squares with a `4px` radius, housing 16px neutral icons.

### Kanban Cards
- **Structure:** Background `#FFFFFF`, border `1px solid #DFE1E6`, border radius `4px`, padding `space-sm` to `space-md` (8px-12px).
- **Metadata Row:** Badges, checklist counters (e.g., `3/5`), attachment icons, and due-date chips sit at the bottom edge.
- **Member Pile:** Overlapping circular avatars (`24px` diameter) with a `2px` white rim anchored in the bottom-right corner.

### Chips & Badges
- **Status Tags:** Height `20px`, padding `0 6px`, font size `11px`, weight `700`, uppercase with `4px` corner radius.
  - Priority High: Background `#FFEBE6`, text `#DE350B`.
  - Priority Medium: Background `#FFF0B3`, text `#172B4D`.
  - Priority Low: Background `#E3FCEF`, text `#006644`.

### Lists & Columns
- **Header:** Sticky or static title bar with inline rename capability, task counter bubble (`label-sm`), and a trailing "three-dots" menu trigger.
- **Drop Indicator:** When a card is dragged between items, display a drop placeholder featuring a dashed border (`2px dashed #4C9AFF`) with an active background tint of `#DEEBFF`.

### Input Fields & Search Bars
- **Text Inputs:** Height `32px` or `40px`, background `#FAFBFC`, border `1px solid #DFE1E6`, transition to `#4C9AFF` border with an outer ring `0 0 0 2px rgba(0, 82, 204, 0.2)` on active focus.
- **Inline Card Creation:** An open text-area appearing directly at the bottom of a list with an instantaneous "Add card" primary button and a cancel "X" icon.

### Checkboxes & Progress
- **Checkbox:** `16x16px` square with `3px` radius. Resting border `2px solid #6B778C`. Checked state fills with `#0052CC` displaying a sharp white SVG checkmark.
- **Progress Bars:** Total height `6px`, background `#DFE1E6`, track fill `#00875A` (success) with full end-cap rounding.