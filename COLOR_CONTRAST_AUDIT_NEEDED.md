# Color Contrast Audit - Task 28.4

## Overview
This document outlines the color contrast audit needed to ensure WCAG 2.1 AA compliance (4.5:1 for normal text, 3:1 for large text).

## Audit Approach

### Tools to Use:
1. **Browser DevTools**: Chrome/Edge Lighthouse accessibility audit
2. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
3. **axe DevTools**: Browser extension for automated testing
4. **Manual verification**: Check all text/background combinations

### WCAG 2.1 AA Requirements:
- **Normal text** (< 18pt or < 14pt bold): 4.5:1 contrast ratio
- **Large text** (≥ 18pt or ≥ 14pt bold): 3:1 contrast ratio
- **UI components and graphics**: 3:1 contrast ratio

## Color Combinations to Audit

### Tailwind Colors Used in Codebase:

#### Text Colors:
- `text-gray-500` on white backgrounds (helper text, secondary text)
- `text-gray-600` on white backgrounds (descriptions, labels)
- `text-gray-700` on white backgrounds (form labels, body text)
- `text-gray-900` on white backgrounds (headings, primary text)
- `text-blue-600` on white backgrounds (links, buttons)
- `text-blue-800` on `bg-blue-100` (badges, status indicators)
- `text-green-800` on `bg-green-50` (success messages)
- `text-red-800` on `bg-red-50` (error messages)
- `text-red-600` on white backgrounds (error text)

#### Background Colors:
- `bg-gray-50` (section backgrounds)
- `bg-gray-100` (disabled inputs)
- `bg-gray-200` (skeleton loaders, progress bars)
- `bg-blue-100` with `text-blue-800` (current week badge)
- `bg-blue-600` with white text (primary buttons)
- `bg-green-50` with `text-green-800` (success alerts)
- `bg-green-500` (progress bars)
- `bg-red-50` with `text-red-800` (error alerts)
- `bg-yellow-500` (star ratings)

## Known Tailwind Contrast Ratios

### Likely Compliant ✅:
- `text-gray-900` on white: ~15:1 (excellent)
- `text-gray-700` on white: ~8:1 (excellent)
- `text-gray-600` on white: ~5.7:1 (pass)
- `text-blue-600` on white: ~5.1:1 (pass)
- `text-red-600` on white: ~5.3:1 (pass)
- White text on `bg-blue-600`: ~5.1:1 (pass)

### Needs Verification ⚠️:
- `text-gray-500` on white: ~4.6:1 (borderline - needs verification)
- `text-blue-800` on `bg-blue-100`: Needs calculation
- `text-green-800` on `bg-green-50`: Needs calculation
- `text-red-800` on `bg-red-50`: Needs calculation
- `text-red-400` (icon color): Needs verification

## Audit Steps

### 1. Run Automated Tools
```bash
# In cohortle-web directory
npm run build
# Then run Lighthouse audit on key pages:
# - /dashboard
# - /programmes/[id]/learn
# - /lessons/[id]
# - /profile/settings
# - /browse
```

### 2. Manual Verification
For each page, check:
- All text is readable against its background
- Links are distinguishable (not by color alone)
- Form labels and inputs have sufficient contrast
- Error messages are clearly visible
- Success messages are clearly visible
- Disabled states are distinguishable but still meet 3:1 ratio

### 3. Test with Color Blindness Simulators
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Ensure information isn't conveyed by color alone

## Common Issues to Fix

### If `text-gray-500` fails (< 4.5:1):
Replace with `text-gray-600` for body text or `text-gray-700` for important secondary text.

### If alert backgrounds fail:
- Increase text color darkness (e.g., `text-green-900` instead of `text-green-800`)
- Or lighten background (e.g., use white background with colored border)

### If icon colors fail:
- Use darker shades for small icons
- Ensure icons have text labels (not relying on color alone)

## Files to Review

### High Priority (User-facing content):
- `cohortle-web/src/components/profile/*.tsx`
- `cohortle-web/src/components/lessons/*.tsx`
- `cohortle-web/src/components/community/*.tsx`
- `cohortle-web/src/components/learning/*.tsx`
- `cohortle-web/src/components/dashboard/*.tsx`
- `cohortle-web/src/components/discovery/*.tsx`
- `cohortle-web/src/components/auth/*.tsx`

### Medium Priority (Navigation and UI):
- `cohortle-web/src/components/navigation/*.tsx`
- `cohortle-web/src/components/ui/*.tsx`
- `cohortle-web/src/components/programmes/*.tsx`

### Lower Priority (Admin/Convener):
- `cohortle-web/src/components/convener/*.tsx`

## Next Steps

1. Run Lighthouse accessibility audit on all key pages
2. Use WebAIM Contrast Checker to verify borderline colors
3. Document any failures with specific color combinations
4. Create fixes for any non-compliant combinations
5. Re-test after fixes
6. Update tasks.md to mark Task 28.4 as complete

## Expected Outcome

All text and UI elements should meet WCAG 2.1 AA standards:
- ✅ Normal text: ≥ 4.5:1 contrast ratio
- ✅ Large text: ≥ 3:1 contrast ratio
- ✅ UI components: ≥ 3:1 contrast ratio
- ✅ Information not conveyed by color alone
