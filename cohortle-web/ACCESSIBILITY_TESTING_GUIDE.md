# Accessibility Testing Guide

## Quick Start

This guide explains how to run accessibility tests on the Cohortle learner experience platform.

## Prerequisites

```bash
npm install --save-dev @axe-core/puppeteer puppeteer lighthouse
```

## Running Automated Audits

### 1. Start the Development Server

```bash
cd cohortle-web
npm run dev
```

### 2. Run the Accessibility Audit Script

```bash
# In a new terminal
node scripts/accessibility-audit.js
```

### 3. View Results

Reports are saved to `cohortle-web/accessibility-reports/`:
- `summary.json` - Overall summary
- `axe-*.json` - Detailed axe-core reports per page
- `lighthouse-*.json` - Lighthouse accessibility scores per page

## Manual Testing

### Screen Reader Testing

**Windows (NVDA)**:
1. Download NVDA from https://www.nvaccess.org/
2. Install and start NVDA
3. Navigate to http://localhost:3000
4. Use arrow keys to navigate
5. Listen for announcements

**Windows (JAWS)**:
1. Requires JAWS license
2. Start JAWS
3. Navigate to http://localhost:3000
4. Use JAWS commands to navigate

**macOS (VoiceOver)**:
1. Press Cmd+F5 to start VoiceOver
2. Navigate to http://localhost:3000
3. Use VO+arrow keys to navigate
4. Press Cmd+F5 to stop VoiceOver

### Browser Zoom Testing

1. Open page in browser
2. Press Ctrl/Cmd + Plus to zoom in
3. Test at 125%, 150%, 175%, 200%
4. Check for:
   - Horizontal scrolling
   - Text truncation
   - Layout breaks
   - Overlapping elements

### Keyboard Navigation Testing

1. Open page in browser
2. Press Tab to navigate forward
3. Press Shift+Tab to navigate backward
4. Press Enter/Space to activate
5. Check that:
   - All interactive elements are reachable
   - Focus order is logical
   - Focus indicators are visible
   - No keyboard traps exist

## Browser Extensions

### Recommended Extensions

1. **axe DevTools** (Chrome/Firefox)
   - Install from browser store
   - Open DevTools > axe tab
   - Click "Scan ALL of my page"

2. **WAVE** (Chrome/Firefox)
   - Install from browser store
   - Click WAVE icon in toolbar
   - Review errors and alerts

3. **Lighthouse** (Chrome built-in)
   - Open DevTools > Lighthouse tab
   - Select "Accessibility" category
   - Click "Generate report"

## Common Issues to Check

### Color Contrast
- Text vs background: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### ARIA
- All interactive elements have accessible names
- ARIA roles are used correctly
- ARIA states are updated dynamically

### Keyboard
- All functionality available via keyboard
- Focus order is logical
- Focus indicators are visible
- No keyboard traps

### Forms
- All inputs have labels
- Error messages are clear
- Required fields are indicated
- Validation is accessible

## Testing Checklist

### Per Page
- [ ] Run axe DevTools scan
- [ ] Run WAVE scan
- [ ] Run Lighthouse audit
- [ ] Test keyboard navigation
- [ ] Test screen reader
- [ ] Test at 200% zoom
- [ ] Check color contrast
- [ ] Verify ARIA labels

### Per Component
- [ ] Semantic HTML used
- [ ] Keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] Color contrast sufficient
- [ ] Works with screen reader
- [ ] Responsive at high zoom

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

## Continuous Testing

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: node scripts/accessibility-audit.js
      - uses: actions/upload-artifact@v2
        with:
          name: accessibility-reports
          path: accessibility-reports/
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint:a11y
```

## Getting Help

- Review `ASSISTIVE_TECHNOLOGY_TESTING.md` for detailed findings
- Check component documentation for accessibility notes
- Consult WCAG guidelines for specific criteria
- Test with real users when possible
