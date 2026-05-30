---
name: Belajar Matematika Seru
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#584237'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#785a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c19300'
  on-tertiary-container: '#412f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdf9a'
  tertiary-fixed-dim: '#f7be1d'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-child:
    fontFamily: Nunito Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  h1-child:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  h2-child:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  body-child:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  h1-admin:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  h2-admin:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-admin:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-admin:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  touch_target_min: 44px
---

## Brand & Style

The design system is built on a dual-natured philosophy: **Playful Learning** for students and **Clarity of Progress** for guardians. The student-facing interface leverages a "Soft-Modern" aesthetic characterized by high-energy colors, large interactive zones, and a friendlier, rounded geometry to reduce math-related anxiety. For parents and admins, the system shifts toward a "Clean Corporate" style, prioritizing data density and professional oversight while maintaining brand continuity through strategic orange accents.

The emotional response should be one of confidence and joy for the child, and reliability and insight for the adult. The system uses a tactile approach where interactive elements feel "plump" and responsive, encouraging exploration through clear visual feedback.

## Colors

The palette is centered around **Primary Orange**, used for core actions and "Aha!" moments. This is supported by **Primary Blue** for instructional or informational context. 

- **Child UI:** High usage of Primary Orange and Yellow/Gold to signal rewards and excitement. Large surface areas of Orange Light are used to create a warm environment without causing eye strain.
- **Parent/Admin UI:** Predominantly White and Background Gray. Primary Orange is reserved for high-priority CTAs and status indicators, while Blue is used for analytical data visualization.
- **Semantic Logic:** Green and Red are used strictly for feedback—Green for "Correct" or "Resolved" and Red for "Try Again" or "Error."

## Typography

This design system utilizes a tiered font strategy to distinguish between different user modes:

1.  **Nunito Sans:** Used exclusively for the Student/Child interface. Its rounded terminals and open apertures provide high readability for young learners and a friendly, approachable tone. Weights are kept heavy (600+) to maintain visual weight against vibrant backgrounds.
2.  **Inter:** Used for Parents and Admin dashboards. It is chosen for its systematic neutrality and superior performance in data-heavy environments (tables, reports, and settings).

**Scaling:** On mobile devices, `display-child` should scale down to 32px. Use `body-child` for all interactive prompts to ensure legibility on smaller touch screens.

## Layout & Spacing

The layout follows a **Fluid Grid** model with specific constraints based on the user persona:

- **Child UI:** Uses a 4-column layout on mobile and an 8-column centered layout on tablet/desktop. Gutters are wide (24px) to prevent accidental taps. Elements should be generously spaced with `lg` or `xl` units to maintain a "low-pressure" feel.
- **Parent/Admin UI:** Uses a standard 12-column grid on desktop with a fixed side navigation (240px). Gutters are tighter (16px) to allow for comparative data analysis and denser information architecture.

**Breakpoints:**
- Mobile: 0 - 599px (4 columns, 16px margins)
- Tablet: 600 - 1023px (8 columns, 24px margins)
- Desktop: 1024px+ (12 columns, 32px margins)

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Soft Shadows**:

- **Child UI:** Uses "Elevated Cards." These feature a 2px stroke (using a darker tint of the card color) combined with a soft, 10% opacity shadow of the same hue. This creates a tactile "sticker" look that feels interactive.
- **Parent/Admin UI:** Uses "Flat Depth." Layers are separated by 1px borders (#E5E7EB) or subtle background shifts. Shadows are only used on floating elements like dropdowns or modals to maintain a clean, professional profile.
- **Global Shadow:** `0px 4px 12px rgba(17, 24, 39, 0.05)` for standard elevation.

## Shapes

The design system employs a "Contextual Rounding" strategy. 

- **Student Interface:** Large components (cards, banners) use a significant 24px radius to feel soft and safe. Interactive objects like buttons use 12px for a "squishy" appearance.
- **Admin/Parent Interface:** Radii are reduced to 4px-12px to maximize space for charts and tables, providing a more structured and professional feel.
- **Feedback Elements:** Success/Failure badges and progress bar ends should always be fully rounded (pill-shaped) to distinguish them from structural containers.

## Components

### Buttons
- **Primary (Orange):** `background: #F97316; color: #FFFFFF`. Large height (56px) for children; standard height (44px) for adults. Semi-bold text.
- **Secondary (White):** `background: #FFFFFF; border: 2px solid #E5E7EB; color: #374151`.
- **Danger (Red):** `background: #EF4444; color: #FFFFFF`. Used for "Locked" states or "Stop" actions.

### Progress Bars
Used extensively for math mastery. 
- **Track:** `background: #F3F4F6`.
- **Indicator:** `background: #22C55E` (Success) or `background: #F97316` (Current progress).
- **Style:** Height of 12px with fully rounded caps.

### Cards
- **Child Learning Card:** 24px radius, white background, 1px #FFF7ED border, soft orange shadow. Include a large emoji top-right.
- **Admin Data Card:** 12px radius, white background, 1px #E5E7EB border, no shadow.

### Inputs
- **Style:** 4px radius, 14px Inter Regular text, 2px border. Focus state uses Primary Blue (`#3B82F6`) border with a 4px soft glow.

### Badges & Rewards
- **Achievement Badge:** Gold (`#EAB308`) background, white icon.
- **Status Chip:** Pill-shaped, light tints (`Orange Light` or `Blue Light`) with bold colored text.