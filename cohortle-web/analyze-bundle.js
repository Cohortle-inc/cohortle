/**
 * Bundle Analysis Script
 * Analyzes Next.js build output to identify large dependencies and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('BUNDLE SIZE ANALYSIS');
console.log('='.repeat(80));
console.log('');

// Check if .next directory exists
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  console.log('❌ .next directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Read build manifest
const buildManifestPath = path.join(nextDir, 'build-manifest.json');
if (!fs.existsSync(buildManifestPath)) {
  console.log('❌ build-manifest.json not found. Build may have failed.');
  process.exit(1);
}

const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));

console.log('📦 Pages and their chunks:');
console.log('');

let totalSize = 0;
const pageSizes = [];

// Analyze each page
for (const [page, chunks] of Object.entries(buildManifest.pages)) {
  let pageSize = 0;
  
  for (const chunk of chunks) {
    const chunkPath = path.join(nextDir, chunk);
    if (fs.existsSync(chunkPath)) {
      const stats = fs.statSync(chunkPath);
      pageSize += stats.size;
    }
  }
  
  pageSizes.push({ page, size: pageSize, chunks: chunks.length });
  totalSize += pageSize;
}

// Sort by size
pageSizes.sort((a, b) => b.size - a.size);

// Display results
pageSizes.forEach(({ page, size, chunks }) => {
  const sizeKB = (size / 1024).toFixed(2);
  const status = size > 200 * 1024 ? '⚠️ ' : size > 100 * 1024 ? '📊' : '✅';
  console.log(`${status} ${page.padEnd(40)} ${sizeKB.padStart(10)} KB (${chunks} chunks)`);
});

console.log('');
console.log('-'.repeat(80));
console.log(`Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log('');

// Recommendations
console.log('='.repeat(80));
console.log('RECOMMENDATIONS');
console.log('='.repeat(80));
console.log('');

const largePages = pageSizes.filter(p => p.size > 200 * 1024);
if (largePages.length > 0) {
  console.log('⚠️  Large pages detected (>200KB):');
  largePages.forEach(({ page, size }) => {
    console.log(`   - ${page}: ${(size / 1024).toFixed(2)} KB`);
  });
  console.log('');
  console.log('   Recommendations:');
  console.log('   1. Use dynamic imports for heavy components');
  console.log('   2. Lazy load images and videos');
  console.log('   3. Code split large libraries');
  console.log('');
}

// Check for common large dependencies
console.log('📚 Common optimization opportunities:');
console.log('');
console.log('   1. React Icons: Use specific imports instead of full package');
console.log('      ❌ import { FaUser } from "react-icons/fa"');
console.log('      ✅ import FaUser from "react-icons/fa/FaUser"');
console.log('');
console.log('   2. Date-fns: Import only needed functions');
console.log('      ❌ import * as dateFns from "date-fns"');
console.log('      ✅ import { format, parseISO } from "date-fns"');
console.log('');
console.log('   3. Framer Motion: Use lazy loading for animations');
console.log('      ✅ const MotionDiv = dynamic(() => import("framer-motion").then(m => m.motion.div))');
console.log('');
console.log('   4. DOMPurify: Load only when needed');
console.log('      ✅ const DOMPurify = await import("dompurify")');
console.log('');

console.log('='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80));
console.log('');
console.log('1. Install @next/bundle-analyzer for detailed analysis:');
console.log('   npm install --save-dev @next/bundle-analyzer');
console.log('');
console.log('2. Add to next.config.mjs:');
console.log('   const withBundleAnalyzer = require("@next/bundle-analyzer")({');
console.log('     enabled: process.env.ANALYZE === "true",');
console.log('   });');
console.log('');
console.log('3. Run analysis:');
console.log('   ANALYZE=true npm run build');
console.log('');
console.log('4. Implement code splitting for large components');
console.log('5. Optimize imports from large libraries');
console.log('6. Use dynamic imports for route-specific code');
console.log('');
