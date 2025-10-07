# Design Guidelines: Blocks NYC Apartment Search

## Design Approach: Clean Utility-First with Map Focus

**Selected Approach:** Apple HIG-inspired minimalism with Material Design map interactions  
**Rationale:** Real estate search tools prioritize clarity, efficiency, and trust. The map is the hero - everything else supports it.

**Core Principles:**
- Clarity over decoration: Every element serves the user's search goal
- Progressive disclosure: Show complexity only when needed
- Map-first design: The interactive blocks map is the destination, wizard steps are preparation
- Trust through professionalism: Clean, consistent, accessible

---

## Core Design Elements

### A. Color Palette

**Light Mode (Primary):**
- Primary: 220 90% 56% (Professional blue - trust and clarity)
- Surface: 0 0% 100% (Pure white backgrounds)
- Border: 220 13% 91% (Subtle gray borders)
- Text Primary: 220 9% 15% (Near black for readability)
- Text Secondary: 220 9% 46% (Muted gray for supporting text)
- Success (Selected): 142 71% 45% (NYC parks green for selected blocks)
- Hover State: 220 90% 96% (Light blue tint)

**Dark Mode:**
- Primary: 220 90% 65% (Lighter blue for dark backgrounds)
- Surface: 220 13% 10% (Rich dark gray)
- Border: 220 13% 20% (Subtle borders)
- Text Primary: 0 0% 98% (Off-white)
- Text Secondary: 220 9% 70% (Light gray)

### B. Typography

**Font Stack:** Inter (Google Fonts) for clean, professional readability
- Headings: 600 weight, tight tracking (-0.02em)
- Body: 400 weight, relaxed line-height (1.6)
- Labels: 500 weight, uppercase with letter-spacing (0.05em)

**Scale:**
- Step Labels: text-xs uppercase tracking-wide (10-11px)
- Body/Form: text-base (16px)
- Section Heads: text-lg font-semibold (18px)
- Page Titles: text-2xl font-semibold (24px)

### C. Layout System

**Spacing Units:** Use 4, 8, 16, 24, 32, 48 (p-1, p-2, p-4, p-6, p-8, p-12)
- Wizard step padding: p-6 md:p-8
- Card internal padding: p-6
- Section gaps: space-y-6
- Form field gaps: space-y-4
- Button padding: px-6 py-3

**Container Strategy:**
- Wizard: max-w-2xl centered (optimal form width)
- Map page: Full viewport width with sidebar
- Mobile: px-4, Desktop: px-8

### D. Component Library

**Wizard Flow (Steps 1-3):**
- Step indicator: Horizontal pills with numbers, connected line, completed steps in primary color
- Budget slider: Dual-thumb range with live value display above thumbs
- Borough cards: Large click targets (min-h-24), radio-style single select, hover lift effect (shadow-md)
- Neighborhood chips: Multi-select tags with checkmark icons, wrap gracefully, remove on click
- Navigation: Sticky bottom bar with Back/Next buttons, progress % indicator

**Map Interface (Step 4):**
- Sidebar (Desktop): Fixed left panel (w-80), scrollable neighborhood filters, selected blocks list
- Map controls: Top-right cluster (zoom, style toggle, reset view)
- Block interaction: Fill color change on hover, stroke highlight on select, tooltip with block ID
- Mobile: Bottom sheet with filters, full-screen map, swipe-up to expand sheet

**Forms & Inputs:**
- Text inputs: Minimal borders (border-b-2), focus:border-primary transition
- Buttons: Primary (solid primary bg), Secondary (outline), Ghost (text only)
- Select dropdowns: Custom styled with chevron icon, matches text input aesthetic
- Checkboxes/Radio: Larger touch targets (w-6 h-6), smooth check animation

**Navigation:**
- Header: Logo left, minimal (just "blocks" wordmark), optional dark mode toggle right
- No heavy navigation - wizard is linear flow

**Data Display:**
- Selected blocks counter: Floating badge on map
- Summary cards: Soft shadows (shadow-sm), rounded-2xl, white bg in light mode
- Lists: Subtle dividers (divide-y), adequate spacing (py-3)

### E. Animations

**Micro-interactions only:**
- Button hover: Slight scale (scale-105) + shadow increase
- Card selection: Border color pulse on click
- Wizard transitions: Subtle slide (transform translateX) between steps
- Map polygon: Smooth fill color transition (duration-200)

**No:**
- Page transitions
- Loading spinners (use skeleton screens)
- Elaborate entrance animations

---

## Specific Page Layouts

**Landing (Budget Step):**
- Centered card with step indicator top
- Title: "What's your budget?"
- Dual-thumb slider with $ values
- Recommended ranges helper text below

**Borough Selection:**
- Grid layout: 2 columns mobile, 3 desktop (grid-cols-2 lg:grid-cols-3)
- Each card: Icon + Borough name + quick stat ("500+ blocks")
- Selected state: Primary border + background tint

**Neighborhood Selection:**
- Scrollable chip container (flex-wrap)
- Search input at top (filter neighborhoods)
- Selected count badge: "12 neighborhoods selected"

**Map Page:**
Desktop: Sidebar left (filters + selected blocks) | Map right (fill remaining width)
Mobile: Full-screen map, bottom sheet with sticky header (filters expandable)

---

## Accessibility & Quality

- Focus states: 2px primary ring with offset
- Keyboard: Tab through wizard, Enter to select, Escape to deselect
- ARIA labels on all interactive map elements
- Color contrast: WCAG AAA for text, AA for UI elements
- Touch targets: Minimum 44x44px

---

## Images

No hero images needed - this is a utility app. The map IS the visual centerpiece. 

Optional map style thumbnail previews in settings (50x50px) showing light/dark/satellite options.