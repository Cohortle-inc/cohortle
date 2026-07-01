/**
 * Automated Accessibility Audit Script
 * 
 * This script runs accessibility audits using axe-core and Lighthouse
 * on key pages of the Cohortle learner experience.
 * 
 * Usage: node scripts/accessibility-audit.js
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs');
const path = require('path');

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Browse Programmes', url: '/browse' },
  { name: 'Programme Learning View', url: '/programmes/1/learn' },
  { name: 'Lesson Viewer', url: '/lessons/1' },
  { name: 'Community Feed', url: '/programmes/1/community' },
  { name: 'Profile', url: '/profile' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../accessibility-reports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Run axe-core accessibility audit on a page
 */
async function runAxeAudit(page, pageName) {
  console.log(`Running axe audit on ${pageName}...`);
  
  try {
    const results = await new AxePuppeteer(page).analyze();
    
    const report = {
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
        examples: v.nodes.slice(0, 3).map(n => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary
        }))
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length
    };
    
    // Save report
    const filename = `axe-${pageName.toLowerCase().replace(/\s+/g, '-')}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`✓ ${pageName}: ${results.violations.length} violations found`);
    return report;
  } catch (error) {
    console.error(`✗ Error auditing ${pageName}:`, error.message);
    return null;
  }
}

/**
 * Run Lighthouse accessibility audit
 */
async function runLighthouseAudit(url, pageName) {
  console.log(`Running Lighthouse audit on ${pageName}...`);
  
  try {
    const result = await lighthouse(url, {
      port: 9222,
      onlyCategories: ['accessibility'],
      output: 'json'
    });
    
    const report = {
      pageName,
      url,
      timestamp: new Date().toISOString(),
      score: result.lhr.categories.accessibility.score * 100,
      audits: Object.entries(result.lhr.audits)
        .filter(([_, audit]) => audit.score !== null && audit.score < 1)
        .map(([id, audit]) => ({
          id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue
        }))
    };
    
    // Save report
    const filename = `lighthouse-${pageName.toLowerCase().replace(/\s+/g, '-')}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`✓ ${pageName}: Accessibility score ${report.score}/100`);
    return report;
  } catch (error) {
    console.error(`✗ Error running Lighthouse on ${pageName}:`, error.message);
    return null;
  }
}

/**
 * Main audit function
 */
async function runAudits() {
  console.log('Starting accessibility audits...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--remote-debugging-port=9222']
  });
  
  const axeResults = [];
  const lighthouseResults = [];
  
  try {
    for (const pageConfig of PAGES_TO_AUDIT) {
      const page = await browser.newPage();
      const url = `${BASE_URL}${pageConfig.url}`;
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Run axe audit
        const axeReport = await runAxeAudit(page, pageConfig.name);
        if (axeReport) axeResults.push(axeReport);
        
        // Run Lighthouse audit
        const lighthouseReport = await runLighthouseAudit(url, pageConfig.name);
        if (lighthouseReport) lighthouseResults.push(lighthouseReport);
        
      } catch (error) {
        console.error(`✗ Error loading ${pageConfig.name}:`, error.message);
      } finally {
        await page.close();
      }
      
      console.log(''); // Blank line between pages
    }
    
    // Generate summary report
    generateSummaryReport(axeResults, lighthouseResults);
    
  } finally {
    await browser.close();
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport(axeResults, lighthouseResults) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES_TO_AUDIT.length,
    axe: {
      totalViolations: axeResults.reduce((sum, r) => sum + r.violations.length, 0),
      byImpact: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      pages: axeResults.map(r => ({
        name: r.pageName,
        violations: r.violations.length,
        passes: r.passes
      }))
    },
    lighthouse: {
      averageScore: lighthouseResults.reduce((sum, r) => sum + r.score, 0) / lighthouseResults.length,
      pages: lighthouseResults.map(r => ({
        name: r.pageName,
        score: r.score,
        failedAudits: r.audits.length
      }))
    }
  };
  
  // Count violations by impact
  axeResults.forEach(result => {
    result.violations.forEach(v => {
      if (v.impact) summary.axe.byImpact[v.impact]++;
    });
  });
  
  // Save summary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Print summary
  console.log('\n=== AUDIT SUMMARY ===\n');
  console.log(`Total pages audited: ${summary.totalPages}`);
  console.log(`\nAxe Results:`);
  console.log(`  Total violations: ${summary.axe.totalViolations}`);
  console.log(`  Critical: ${summary.axe.byImpact.critical}`);
  console.log(`  Serious: ${summary.axe.byImpact.serious}`);
  console.log(`  Moderate: ${summary.axe.byImpact.moderate}`);
  console.log(`  Minor: ${summary.axe.byImpact.minor}`);
  console.log(`\nLighthouse Results:`);
  console.log(`  Average accessibility score: ${summary.lighthouse.averageScore.toFixed(1)}/100`);
  
  console.log(`\nDetailed reports saved to: ${OUTPUT_DIR}`);
}

// Run audits
runAudits().catch(console.error);
