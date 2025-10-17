# Design Guidelines: Blocks NYC Apartment Search

## Design Approach: Refined Fintech Aesthetic

**Selected Approach:** Fintech-inspired sophistication with real estate listing platform polish  
**Rationale:** Real estate search tools need trust, clarity, and professionalism. Drawing from platforms like Stripe, Plaid, Zillow, and Redfin - we balance sophisticated fintech design with accessible, clear functionality. The map remains the hero, but with enhanced visual refinement.

**Core Principles:**
- **Trust through refinement**: Sophisticated color palette and subtle depth
- **Professional yet approachable**: Clean design that doesn't feel sterile
- **Clarity first**: Every element serves the user's search goal
- **Progressive disclosure**: Show complexity only when needed
- **Map-first design**: The interactive blocks map is the destination, wizard steps are preparation

---

## Core Design Elements

### A. Color Palette

**Light Mode (Primary):**
- **Primary**: 239 84% 67% (#6366F1 - Sophisticated indigo, inspired by modern fintech)
- **Surface**: 0 0% 100% (Pure white for cards and popovers)
- **Background**: 210 40% 98% (#F8FAFC - Subtle off-white for reduced eye strain)
- **Border**: 220 13% 91% (Refined neutral borders)
- **Text Primary**: 222 47% 11% (#0F172A - Deep slate for excellent readability)
- **Text Secondary**: 215 16% 47% (#64748B - Muted slate for supporting text)
- **Success**: 160 84% 39% (#10B981 - Refined emerald for selected blocks)
- **Destructive**: 0 84% 60% (#F43F5E - Modern rose)
- **Accent Light**: 226 100% 97% (#EEF2FF - Very light indigo for subtle highlights)

**Dark Mode:**
- **Primary**: 239 84% 67% (#6366F1 - Same indigo works beautifully in dark)
- **Surface**: 222 47% 15% (#1E293B - Rich slate)
- **Background**: 222 47% 11% (#0F172A - Deep navy background)
- **Border**: 215 25% 20% (Subtle dark borders)
- **Text Primary**: 210 40% 98% (#F8FAFC - Off-white)
- **Text Secondary**: 215 16% 47% (#64748B - Balanced gray)

### B. Typography

**Font Stack:** Inter (Google Fonts) - industry standard for fintech and modern web apps
- **Headings**: 600-700 weight, tight tracking (-0.02em)
- **Body**: 400 weight, relaxed line-height (1.6)
- **Labels**: 500-600 weight, subtle letter-spacing
- **Monospace**: UI Monospace for data/numbers when needed

**Scale:**
- **Small labels**: text-xs (11-12px)
- **Body/Form**: text-base (16px)
- **Section heads**: text-lg font-semibold (18px)
- **Page titles**: text-2xl font-bold (24px)
- **Large displays**: text-3xl+ for emphasis (rare)

### C. Layout System

**Spacing Philosophy:** Generous white space, clear visual hierarchy

**Spacing Units:** 
- Base: 4px increments (p-1, p-2, p-4, p-6, p-8, p-12, p-16)
- Cards: p-6 (standard), p-8 (hero cards)
- Sections: space-y-6 to space-y-8
- Form fields: space-y-4
- Component gaps: gap-3 to gap-4

**Border Radius:**
- Cards: rounded-lg (12px) - more refined than oversized radii
- Buttons/Inputs: rounded-md (12px)
- Small elements: rounded-md (12px)
- Consistent, professional feel

**Container Strategy:**
- Wizard: max-w-2xl centered
- Map page: Full viewport with optional sidebar
- Mobile: px-4, Desktop: px-6 to px-8

### D. Component Library

**Wizard Flow:**
- **Step indicator**: Refined horizontal progress with subtle connecting lines
- **Budget slider**: Dual-thumb range with clean value display, smooth interactions
- **Borough/Neighborhood cards**: Subtle shadows, clear selected states with indigo accent
- **Navigation**: Clean button hierarchy with proper spacing

**Map Interface:**
- **Desktop sidebar**: Clean panel with refined borders and backgrounds
- **Map controls**: Minimal, well-positioned controls
- **Block interaction**: Smooth color transitions, clear selected state
- **Mobile**: Thoughtful responsive design with bottom sheets

**Forms & Inputs:**
- **Text inputs**: Clean borders, focused ring states in indigo
- **Buttons**: 
  - Primary: Indigo with white text
  - Secondary: Subtle gray background
  - Ghost: Text-only for tertiary actions
  - Outline: Border-based for flexibility
- **Consistent sizing**: Proper min-height for all interactive elements

**Data Display:**
- **Cards**: Subtle shadows (shadow-card), clean backgrounds
- **Lists**: Clear dividers, adequate spacing
- **Badges**: Refined sizing and colors
- **Counters**: Clean, minimal presentation

### E. Shadows & Depth

**Philosophy:** Subtle, refined depth - not heavy drop shadows

- **Cards**: Very subtle shadow (shadow-card) - just enough for separation
- **Popovers**: Slightly more pronounced (shadow-popover)
- **Hover states**: Minimal shadow increase
- **Focus states**: Indigo ring, not shadow-based

### F. Interactions & Animations

**Micro-interactions:**
- **Hover**: Subtle elevation change via background overlay
- **Active**: Slightly more pronounced elevation
- **Transitions**: Fast (150-200ms) and smooth
- **Focus**: Clear ring states in brand color

**Philosophy:** Responsive and smooth, never slow or distracting

---

## Specific Improvements Over Previous Design

1. **Color Sophistication**: Moved from bright blue (#3D8BFF) to refined indigo (#6366F1)
2. **Better Neutrals**: Warmer, more sophisticated slate tones vs. stark grays
3. **Subtle Backgrounds**: Off-white (#F8FAFC) instead of pure white for reduced eye strain
4. **Refined Shadows**: More subtle, layered approach
5. **Tighter Radii**: 12px instead of 24px for cards - more professional
6. **Better Text Hierarchy**: Clearer primary/secondary text distinction
7. **Consistent Elevation**: Better use of subtle background overlays

---

## Accessibility & Quality

- **Focus states**: Clear indigo ring with proper offset
- **Keyboard navigation**: Full support through all interactive elements
- **ARIA labels**: Comprehensive coverage for map and dynamic elements
- **Color contrast**: WCAG AA minimum, AAA where possible
- **Touch targets**: Minimum 44x44px for all interactive elements
- **Responsive**: Mobile-first approach with thoughtful breakpoints

---

## Design References

This design draws inspiration from:
- **Stripe**: Sophisticated indigo palette, clean layouts
- **Plaid**: Professional fintech aesthetic, clear hierarchy
- **Zillow/Redfin**: Real estate listing professionalism
- **Linear**: Modern UI patterns, refined interactions
- **Vercel**: Clean, minimal approach with clear focus

The result is a design that feels trustworthy, professional, and modern - perfect for a NYC apartment search tool.
