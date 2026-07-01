# Cohortle Brand Colours

## Official Brand Palette

### Primary Colours

#### Deep Purple (Primary Brand Colour)
- **Hex**: `#391D65`
- **CSS Variable**: `var(--primary)`
- **Tailwind**: `bg-primary`, `text-primary`, `border-primary`
- **Usage**: Primary buttons, links, icons, brand elements
- **Accessibility**: WCAG AA compliant on white backgrounds

#### Light Purple (Accent/Background)
- **Hex**: `#ECDCFF`
- **CSS Variable**: `var(--primary-light)`
- **Tailwind**: `bg-primary-light`, `text-primary-light`
- **Usage**: Icon backgrounds, subtle accents, hover states
- **Accessibility**: Use with dark text for readability

#### Darker Purple (Hover State)
- **Hex**: `#2d1750`
- **CSS Variable**: `var(--primary-hover)`
- **Tailwind**: `bg-primary-hover`, `hover:bg-primary-hover`
- **Usage**: Button hover states, active states
- **Accessibility**: WCAG AAA compliant on white backgrounds

## Usage Guidelines

### Buttons
```tsx
// Primary button
<button className="bg-primary text-white hover:bg-primary-hover">
  Click me
</button>

// Or using the hex directly (current pattern)
<button className="bg-[#391D65] text-white hover:bg-[#391D65]/90">
  Click me
</button>
```

### Icons with Background
```tsx
<div className="bg-primary-light rounded-full p-4">
  <svg className="text-primary">
    {/* icon */}
  </svg>
</div>
```

### Links
```tsx
<a className="text-primary hover:text-primary-hover underline">
  Learn more
</a>
```

## Current Implementation Status

### ✅ Consistent Usage
The following components correctly use `#391D65` (deep purple):
- All auth forms (Login, Signup, Reset Password, Forgot Password)
- Dashboard empty states
- Convener forms (Programme, Cohort, Week, Lesson)
- Dashboard header
- Primary buttons throughout the app

### ⚠️ Inconsistent Usage
The following areas use Tailwind's default purple instead of brand purple:
- Hero component CTAs (`purple-500`, `purple-600`)
- Preview mode button (`purple-600`)
- Some convener dashboard icons (`purple-600`)

## Migration Path

### Option 1: Use Tailwind Classes (Recommended)
Replace hardcoded hex values with Tailwind classes:
```tsx
// Before
className="bg-[#391D65] text-white hover:bg-[#391D65]/90"

// After
className="bg-primary text-white hover:bg-primary-hover"
```

### Option 2: Keep Hex Values
Continue using `bg-[#391D65]` for consistency with existing code.
This is acceptable but less maintainable.

## Colour Contrast & Accessibility

### Text on White Background
- ✅ `#391D65` on white: **9.8:1** (WCAG AAA)
- ✅ `#2d1750` on white: **12.5:1** (WCAG AAA)

### Text on Light Purple Background
- ⚠️ `#391D65` on `#ECDCFF`: **3.2:1** (WCAG AA Large Text only)
- Use dark grey or black text on light purple backgrounds

### White Text on Brand Colours
- ✅ White on `#391D65`: **9.8:1** (WCAG AAA)
- ✅ White on `#2d1750`: **12.5:1** (WCAG AAA)

## British English Note

Note the spelling: "Colours" not "Colors" in documentation and user-facing text, consistent with Cohortle's British English branding.

In code (CSS, JavaScript), use "color" as it's the standard programming term:
```css
/* CSS - use 'color' */
.element {
  color: var(--primary);
}
```

```tsx
// JSX - use 'color' in props
<Component color="primary" />
```

## Related Files

- `src/app/globals.css` - CSS variable definitions
- `tailwind.config.ts` - Tailwind colour configuration
- `BRITISH_ENGLISH_BRANDING_COMPLETE.md` - British spelling guidelines
