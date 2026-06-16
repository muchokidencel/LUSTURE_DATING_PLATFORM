---
name: Lustre
colors:
  surface: '#13131a'
  surface-dim: '#13131a'
  surface-bright: '#393841'
  surface-container-lowest: '#0e0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#2a2931'
  surface-container-highest: '#34343c'
  on-surface: '#e4e1ec'
  on-surface-variant: '#cbc3d3'
  inverse-surface: '#e4e1ec'
  inverse-on-surface: '#303038'
  outline: '#958e9d'
  outline-variant: '#494551'
  surface-tint: '#d2bcff'
  primary: '#d2bcff'
  on-primary: '#3c167c'
  primary-container: '#7c5cbf'
  on-primary-container: '#f8efff'
  inverse-primary: '#6b4bad'
  secondary: '#ffb0ce'
  on-secondary: '#5f0d39'
  secondary-container: '#7b2650'
  on-secondary-container: '#ff94c0'
  tertiary: '#ecc246'
  on-tertiary: '#3d2e00'
  tertiary-container: '#cea62b'
  on-tertiary-container: '#4f3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bcff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#533294'
  secondary-fixed: '#ffd9e5'
  secondary-fixed-dim: '#ffb0ce'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#7b2650'
  tertiary-fixed: '#ffe08e'
  tertiary-fixed-dim: '#ecc246'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#13131a'
  on-background: '#e4e1ec'
  surface-variant: '#34343c'
typography:
  display-lg:
    fontFamily: ebGaramond
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: beVietnamPro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: beVietnamPro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is engineered to evoke an atmosphere of exclusivity, intimacy, and high-end sophistication. Targeting a discerning audience, it balances the mystery of a "midnight" environment with the precision of a luxury fashion house. 

The aesthetic is **Refined Glassmorphism** mixed with **Modern Minimalist Luxury**. It avoids the clutter of traditional social apps in favor of generous whitespace (breathing room), high-quality imagery, and subtle cinematic effects. The emotional response should be one of calm confidence, security, and premium quality. Every interaction should feel intentional and smooth, utilizing soft transitions and depth to guide the user through a curated romantic experience.

## Colors
This design system utilizes a deep, monochromatic foundation to allow photography and accent colors to pop. 

- **Foundations:** The primary background is a near-black obsidian. Card surfaces use a slightly lifted navy-grey to create soft separation without harsh lines.
- **Accents:** The "Amethyst Purple" and "Dusty Rose" are used primarily for interactive elements and brand moments. They should be applied sparingly to maintain the "high-end" feel—too much color dilutes the luxury.
- **Gold:** Reserved strictly for premium features, verified badges, or "VIP" status indicators. It should never be used for standard buttons or text.
- **Gradients:** Use the Brand Gradient for primary calls-to-action and active states to provide a sense of depth and energy.

## Typography
The typography strategy relies on a "Serif-for-Style, Sans-for-Function" approach.

- **EB Garamond** is used for the logo and specific "Editorial" moments (like welcome screens or quote blocks) to instill a sense of heritage and timelessness.
- **Manrope** provides a geometric, modern backbone for headlines. Increased letter spacing (tracking) on headlines is essential to achieve the luxury brand look.
- **Be Vietnam Pro** handles body copy, chosen for its warmth and approachability, ensuring that long profiles remain easy to read.
- **Case Styling:** Labels and small headers should frequently use uppercase with increased tracking to create a "gallery" or "boutique" feel.

## Layout & Spacing
The layout follows a **Fluid Grid** model with an emphasis on vertical rhythm and negative space. 

- **Desktop:** A 12-column grid with wide 40px margins to keep content centered and premium. 
- **Mobile:** A 4-column grid with 20px margins.
- **Philosophy:** Elements should never feel "cramped." If in doubt, increase the padding. Use the `stack-lg` (48px) to separate major sections, and `stack-md` (24px) for grouping related components. 
- **Alignment:** Content should predominantly be center-aligned for marketing/landing views and left-aligned for functional profile/discovery views.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layering** and **Glassmorphism**, rather than traditional heavy shadows.

- **Surface Tiers:** 
    - *Level 0 (Base):* #08080f.
    - *Level 1 (Cards):* #111119 with a subtle 1px border of #1e1e2e.
    - *Level 2 (Modals/Overlays):* #1a1a2a with a 20px backdrop blur (Glassmorphism).
- **Inner Glows:** Buttons and primary cards should feature a subtle 1px inner stroke (top-down) in a lighter shade of the background or accent color to simulate light catching an edge.
- **Shadows:** Use a single, very soft, highly diffused shadow for floating elements (e.g., `0px 20px 40px rgba(0,0,0,0.4)`). Avoid colored shadows to maintain a clean aesthetic.

## Shapes
The shape language is organic and soft, avoiding sharp technical angles.

- **Primary Cards:** Use `rounded-xl` (1.5rem / 24px) to create a soft, welcoming frame for user photography.
- **Buttons:** Use `rounded-lg` (1rem / 16px). This creates a distinct "pill-adjacent" look that feels modern but more structured than a full pill.
- **Inputs & Small UI:** Use `rounded-md` (0.5rem / 8px). 
- **Consistency:** All containers must have a subtle 1px border. No element should rely solely on color for its shape; the border defines the boundary in the dark environment.

## Components
- **Buttons:**
    - *Primary:* Brand Gradient background, white text, no border.
    - *Secondary:* Transparent background, 1px border (#1e1e2e), Text Primary.
    - *Ghost:* No background or border, Text Secondary.
- **Chips/Tags:** Small, `rounded-lg`, using Background Elevated (#1a1a2a) with Text Secondary for interests or traits.
- **Inputs:** Background Elevated (#1a1a2a), `rounded-md`, 1px border (#1e1e2e). On focus, the border should transition to the Primary Purple.
- **Cards:** The "Discovery Card" is the hero component. It should use an image-as-background approach with a subtle bottom-to-top dark gradient overlay for text legibility.
- **Icons:** Use thin-stroke (1px or 1.5px) icons. Avoid filled icons unless they represent an active state (e.g., a filled heart for "liked").
- **Dividers:** Do not use solid lines for horizontal rules. Use increased whitespace or a very subtle gradient line that fades out at the ends.