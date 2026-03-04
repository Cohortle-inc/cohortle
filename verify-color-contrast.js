/**
 * Color Contrast Verification Script
 * Verifies WCAG 2.1 AA compliance for Tailwind colors used in the codebase
 */

// Tailwind color values (from Tailwind v3 default palette)
const colors = {
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    600: '#2563eb',
    800: '#1e40af',
  },
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    800: '#166534',
  },
  red: {
    50: '#fef2f2',
    400: '#f87171',
    600: '#dc2626',
    800: '#991b1b',
  },
  yellow: {
    500: '#eab308',
  },
};

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.1 AA requirements
const WCAG_AA_NORMAL = 4.5;  // Normal text
const WCAG_AA_LARGE = 3.0;   // Large text (18pt+ or 14pt+ bold)
const WCAG_AA_UI = 3.0;      // UI components

// Color combinations to test
const combinations = [
  // Text on white backgrounds
  { fg: colors.gray[500], bg: colors.white, name: 'text-gray-500 on white', type: 'normal', usage: 'Helper text, secondary text' },
  { fg: colors.gray[600], bg: colors.white, name: 'text-gray-600 on white', type: 'normal', usage: 'Descriptions, labels' },
  { fg: colors.gray[700], bg: colors.white, name: 'text-gray-700 on white', type: 'normal', usage: 'Form labels, body text' },
  { fg: colors.gray[900], bg: colors.white, name: 'text-gray-900 on white', type: 'normal', usage: 'Headings, primary text' },
  { fg: colors.blue[600], bg: colors.white, name: 'text-blue-600 on white', type: 'normal', usage: 'Links, buttons' },
  { fg: colors.red[600], bg: colors.white, name: 'text-red-600 on white', type: 'normal', usage: 'Error text, icons' },
  
  // Colored backgrounds with text
  { fg: colors.blue[800], bg: colors.blue[100], name: 'text-blue-800 on bg-blue-100', type: 'normal', usage: 'Badges, status indicators' },
  { fg: colors.green[800], bg: colors.green[50], name: 'text-green-800 on bg-green-50', type: 'normal', usage: 'Success messages' },
  { fg: colors.red[800], bg: colors.red[50], name: 'text-red-800 on bg-red-50', type: 'normal', usage: 'Error messages' },
  
  // White text on colored backgrounds
  { fg: colors.white, bg: colors.blue[600], name: 'white on bg-blue-600', type: 'normal', usage: 'Primary buttons' },
  { fg: colors.white, bg: colors.green[600], name: 'white on bg-green-600', type: 'normal', usage: 'Progress bars (FIXED)' },
  
  // UI components
  { fg: colors.gray[200], bg: colors.white, name: 'bg-gray-200 on white', type: 'ui', usage: 'Skeleton loaders, progress bars' },
  { fg: colors.gray[100], bg: colors.white, name: 'bg-gray-100 on white', type: 'ui', usage: 'Disabled inputs' },
];

console.log('='.repeat(80));
console.log('COLOR CONTRAST AUDIT - WCAG 2.1 AA COMPLIANCE');
console.log('='.repeat(80));
console.log('');

let passCount = 0;
let failCount = 0;
let warnings = [];
let failures = [];

combinations.forEach(combo => {
  const ratio = getContrastRatio(combo.fg, combo.bg);
  const threshold = combo.type === 'normal' ? WCAG_AA_NORMAL : WCAG_AA_UI;
  const pass = ratio >= threshold;
  
  const status = pass ? '✅ PASS' : '❌ FAIL';
  const ratioStr = ratio.toFixed(2);
  
  console.log(`${status} | ${combo.name}`);
  console.log(`       Ratio: ${ratioStr}:1 (Required: ${threshold}:1)`);
  console.log(`       Usage: ${combo.usage}`);
  console.log('');
  
  if (pass) {
    passCount++;
    // Warn if close to threshold
    if (ratio < threshold + 0.5) {
      warnings.push({
        name: combo.name,
        ratio: ratioStr,
        threshold,
        usage: combo.usage
      });
    }
  } else {
    failCount++;
    failures.push({
      name: combo.name,
      ratio: ratioStr,
      threshold,
      usage: combo.usage,
      fg: combo.fg,
      bg: combo.bg
    });
  }
});

console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total combinations tested: ${combinations.length}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('');

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (Close to threshold):');
  warnings.forEach(w => {
    console.log(`   - ${w.name}: ${w.ratio}:1 (threshold: ${w.threshold}:1)`);
    console.log(`     Usage: ${w.usage}`);
  });
  console.log('');
}

if (failures.length > 0) {
  console.log('❌ FAILURES (Need fixing):');
  failures.forEach(f => {
    console.log(`   - ${f.name}: ${f.ratio}:1 (required: ${f.threshold}:1)`);
    console.log(`     Usage: ${f.usage}`);
    console.log(`     Colors: ${f.fg} on ${f.bg}`);
  });
  console.log('');
  console.log('RECOMMENDED FIXES:');
  failures.forEach(f => {
    if (f.name.includes('gray-500')) {
      console.log(`   - Replace text-gray-500 with text-gray-600 for better contrast`);
    } else if (f.name.includes('red-400')) {
      console.log(`   - Replace text-red-400 with text-red-600 for icons`);
    } else {
      console.log(`   - ${f.name}: Use darker text or lighter background`);
    }
  });
} else {
  console.log('🎉 All color combinations pass WCAG 2.1 AA standards!');
}

console.log('');
console.log('='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80));
console.log('1. Fix any failing color combinations');
console.log('2. Run Lighthouse audit on key pages to verify');
console.log('3. Test with color blindness simulators');
console.log('4. Update tasks.md to mark Task 28.4 as complete');
console.log('');
