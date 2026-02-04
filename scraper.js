import puppeteer from 'puppeteer';
import fs from 'fs';

// ============================================
// Command Line Arguments
// ============================================
const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const clearLog = args.includes('--clearlog');

// Helper to get argument value safely
function getArgValue(argName) {
  const idx = args.findIndex(a => a.toLowerCase() === argName);
  if (idx === -1) return null;
  const value = args[idx + 1];
  // Check if value is missing or is another flag
  if (!value || value.startsWith('--')) {
    return { error: `Missing value for ${argName}` };
  }
  return value;
}

// Get --year value (e.g., 2026)
const yearResult = getArgValue('--year');
if (yearResult?.error) {
  console.log(`Error: ${yearResult.error}`);
  console.log('Usage: --year 2026');
  process.exit(1);
}
const yearArg = yearResult;

// Get --month value (e.g., "may", "MAY", "May")
const monthResult = getArgValue('--month');
if (monthResult?.error) {
  console.log(`Error: ${monthResult.error}`);
  console.log('Usage: --month may');
  process.exit(1);
}
const monthArg = monthResult?.toLowerCase();

// Map year to season string: 2026 -> "2025/2026"
function yearToSeason(year) {
  const y = parseInt(year);
  if (isNaN(y) || y < 1900 || y > 2100) {
    return { error: `Invalid year "${year}". Must be a 4-digit year (e.g., 2026)` };
  }
  return `${y - 1}/${y}`;
}

// Map 3-letter month abbrev to full name
const monthMap = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April',
  may: 'May', jun: 'June', jul: 'July', aug: 'August',
  sep: 'September', oct: 'October', nov: 'November', dec: 'December'
};

// Validate year argument
let seasonFilter = null;
if (yearArg) {
  const seasonResult = yearToSeason(yearArg);
  if (seasonResult?.error) {
    console.log(`Error: ${seasonResult.error}`);
    process.exit(1);
  }
  seasonFilter = seasonResult;
}

// Validate month argument
if (monthArg && !monthMap[monthArg]) {
  console.log(`Error: Invalid month abbreviation "${monthArg}".`);
  console.log('Valid options: jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec');
  process.exit(1);
}

const monthFull = monthArg ? monthMap[monthArg] : null;

// Check for unrecognized arguments
const validFlags = ['--year', '--month', '--force', '--clearlog'];
const unrecognized = args.filter(a => a.startsWith('--') && !validFlags.includes(a.toLowerCase()));
if (unrecognized.length > 0) {
  console.log(`Warning: Unrecognized argument(s): ${unrecognized.join(', ')}`);
  console.log('Valid arguments: --year <YYYY>, --month <XXX>, --force, --clearlog');
}

// ============================================
// File Naming Functions
// ============================================
function getOutputFileName(seasonText, monthText) {
  if (!seasonText) {
    return 'cfa-scoreboards-all.html';
  }
  const seasonPart = seasonText.replace('/', '-');
  if (monthText) {
    return `cfa-scoreboards-${seasonPart}-${monthText.toLowerCase()}.html`;
  }
  return `cfa-scoreboards-${seasonPart}.html`;
}

// Single error log file
const errorLogFile = 'cfa-errors.log';

// Clear log if --clearlog specified
if (clearLog) {
  if (fs.existsSync(errorLogFile)) {
    fs.unlinkSync(errorLogFile);
    console.log(`Cleared error log: ${errorLogFile}`);
  } else {
    console.log(`Error log does not exist: ${errorLogFile}`);
  }
}

// ============================================
// Scraped Index Functions (Resume Capability)
// ============================================
const indexFile = 'cfa-scraped-index.json';

function loadIndex() {
  if (fs.existsSync(indexFile)) {
    try {
      return JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    } catch (e) {
      console.log('Warning: Could not parse index file, starting fresh');
      return {};
    }
  }
  return {};
}

function saveIndex(index) {
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

function isScraped(index, season, month, show) {
  return index[season]?.[month]?.includes(show);
}

function markScraped(index, season, month, show) {
  if (!index[season]) index[season] = {};
  if (!index[season][month]) index[season][month] = [];
  if (!index[season][month].includes(show)) {
    index[season][month].push(show);
  }
  saveIndex(index);
}

// ============================================
// Display Usage
// ============================================
console.log('\n==========================================');
console.log('CFA ePoints Scoreboard Scraper');
console.log('==========================================');
console.log('Usage:');
console.log('  node scraper.js                        # All seasons');
console.log('  node scraper.js --year 2026            # 2025/2026 season');
console.log('  node scraper.js --year 2026 --month may');
console.log('  node scraper.js --force                # Re-scrape everything');
console.log('  node scraper.js --clearlog             # Clear error log');
console.log('==========================================');
console.log('Current Settings:');
if (seasonFilter) {
  console.log(`  Season Filter: ${seasonFilter}`);
} else {
  console.log('  Season Filter: All seasons');
}
if (monthFull) {
  console.log(`  Month Filter: ${monthFull}`);
} else {
  console.log('  Month Filter: All months');
}
if (forceMode) {
  console.log('  Mode: FORCE (will re-scrape already captured shows)');
} else {
  console.log('  Mode: Resume (will skip already captured shows)');
}
console.log('==========================================');
console.log('Output Files:');
console.log(`  Data: ${getOutputFileName(seasonFilter, monthFull)}`);
console.log(`  Errors: ${errorLogFile}`);
console.log('  Index: cfa-scraped-index.json');
console.log('==========================================\n');

// ============================================
// Main Scraper
// ============================================
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  console.log('Opening CFA ePoints...');
  await page.goto('https://ecat.cfa.org/ePoints/Scoreboards', { waitUntil: 'networkidle2' });

  console.log('\n==========================================');
  console.log('Please LOG IN manually now.');
  console.log('Waiting for you to log in and reach the scoreboards page...');
  console.log('(Auto-detecting when dropdowns become available)');
  console.log('==========================================\n');

  // Auto-detect login by waiting for the season dropdown to have options
  const waitForLogin = async (timeout = 600000) => {
    const start = Date.now();
    let checkCount = 0;
    while (Date.now() - start < timeout) {
      try {
        const pageInfo = await page.evaluate(() => {
          const select = document.querySelector('#ddlSeason');
          const url = window.location.href;
          return {
            hasSelect: !!select,
            optionCount: select ? select.options.length : 0,
            url: url
          };
        });

        checkCount++;
        if (checkCount % 15 === 0) {
          console.log(`\nStill waiting... URL: ${pageInfo.url}, Dropdown found: ${pageInfo.hasSelect}, Options: ${pageInfo.optionCount}`);
        }

        if (pageInfo.hasSelect && pageInfo.optionCount > 1) {
          console.log('\nLogin detected! Dropdowns are available.');
          return true;
        }
      } catch (e) {
        // Page might be navigating, ignore
      }
      await new Promise(r => setTimeout(r, 2000));
      process.stdout.write('.');
    }
    return false;
  };

  const loggedIn = await waitForLogin();
  if (!loggedIn) {
    console.log('\nTimeout waiting for login (10 min). Please restart the script.');
    await browser.close();
    process.exit(1);
  }
  console.log('');

  // Load scraped index for resume capability
  const scrapedIndex = forceMode ? {} : loadIndex();

  // Helper: get all options from a dropdown
  const getOptions = async (selectId) => {
    return await page.evaluate((id) => {
      const select = document.querySelector(`#${id}`);
      if (!select) return [];
      return [...select.options]
        .filter(o => o.value && !o.text.toLowerCase().includes('select'))
        .map(o => ({ value: o.value, text: o.text.trim() }));
    }, selectId);
  };

  // Helper: wait for dropdown to populate
  const waitForOptions = async (selectId, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const opts = await getOptions(selectId);
      if (opts.length > 0) return opts;
      await new Promise(r => setTimeout(r, 300));
    }
    return [];
  };

  // Helper: remove table if it exists (so we can detect new one)
  const removeExistingTable = async () => {
    await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      tables.forEach(t => t.remove());
    });
  };

  let totalReports = 0;
  let skippedReports = 0;
  let errorCount = 0;

  // Get all seasons
  console.log('Getting all seasons...');
  const allSeasons = await getOptions('ddlSeason');
  console.log(`Found ${allSeasons.length} seasons: ${allSeasons.map(s => s.text).join(', ')}\n`);

  // Filter seasons if --year specified
  const seasons = seasonFilter
    ? allSeasons.filter(s => s.text === seasonFilter)
    : allSeasons;

  if (seasonFilter && seasons.length === 0) {
    console.log(`Error: Season "${seasonFilter}" not found.`);
    console.log(`Available seasons: ${allSeasons.map(s => s.text).join(', ')}`);
    await browser.close();
    process.exit(1);
  }

  // Track output files created
  const outputFiles = new Set();

  // Loop through seasons
  for (const season of seasons) {
    console.log(`\n========== SEASON: ${season.text} ==========`);

    // Determine output file for this season
    const outputFile = getOutputFileName(seasonFilter ? season.text : null, monthFull);

    // Initialize output file if needed
    if (!outputFiles.has(outputFile)) {
      const htmlHeader = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CFA ePoints Scoreboards - ${seasonFilter ? season.text : 'All Seasons'}${monthFull ? ' - ' + monthFull : ''}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .report-section { margin-bottom: 40px; border: 1px solid #ccc; padding: 20px; page-break-inside: avoid; }
    .report-header { background: #f0f0f0; padding: 10px; margin-bottom: 10px; }
    .report-header h2 { margin: 0; font-size: 14px; }
    .report-header p { margin: 5px 0 0 0; color: #666; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
    th { background: #f5f5f5; }
    .error { color: red; }
  </style>
</head>
<body>
<h1>CFA ePoints Scoreboards${seasonFilter ? ' - ' + season.text : ''}${monthFull ? ' - ' + monthFull : ''}</h1>
<p>Generated: ${new Date().toISOString()}</p>
<p>Output file: ${outputFile}</p>
<hr>
`;
      fs.writeFileSync(outputFile, htmlHeader);
      outputFiles.add(outputFile);
      console.log(`Output file created: ${outputFile}`);
    }

    try {
      await page.select('#ddlSeason', season.value);
      await new Promise(r => setTimeout(r, 1500));

      const allMonths = await waitForOptions('ddlMonths', 5000);

      // Filter months if --month specified
      const months = monthFull
        ? allMonths.filter(m => m.text === monthFull)
        : allMonths;

      if (monthFull && months.length === 0) {
        console.log(`  Warning: Month "${monthFull}" not found in this season. Skipping.`);
        continue;
      }

      console.log(`  Found ${months.length} months to process`);

      for (const month of months) {
        console.log(`\n  --- ${month.text} ---`);

        try {
          await page.select('#ddlMonths', month.value);
          await new Promise(r => setTimeout(r, 1500));

          const shows = await waitForOptions('ddlShow', 5000);
          console.log(`    Found ${shows.length} shows`);

          for (const show of shows) {
            const shortName = show.text.length > 50 ? show.text.substring(0, 50) + '...' : show.text;
            process.stdout.write(`      ${shortName} `);

            // Check if already scraped (resume capability)
            if (!forceMode && isScraped(scrapedIndex, season.text, month.text, show.text)) {
              console.log('(skipped - already scraped)');
              skippedReports++;
              continue;
            }

            try {
              await page.select('#ddlShow', show.value);
              await new Promise(r => setTimeout(r, 500));

              // Remove any existing tables so we can detect new ones
              await removeExistingTable();

              // Click Run Report button with timeout wrapper
              await Promise.race([
                page.click('#main_lkbFilter'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Click timeout')), 10000))
              ]);

              // Wait for at least one table to appear
              await page.waitForSelector('table', { visible: true, timeout: 20000 }).catch(() => {});

              // Wait for network to be idle (page finished loading)
              await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});

              // Extra wait to ensure everything is rendered
              await new Promise(r => setTimeout(r, 1000));

              // Capture ALL tables and content
              const tableHtml = await page.evaluate(() => {
                const tables = document.querySelectorAll('table');
                if (tables.length > 0) {
                  return Array.from(tables).map(t => t.outerHTML).join('\n<hr>\n');
                }
                const content = document.querySelector('.results, .content, #results, main, .report-content');
                if (content) return content.innerHTML;
                return '<p class="error">No tables found</p>';
              });

              // Append to HTML file immediately
              const showSection = `
<div class="report-section">
  <div class="report-header">
    <h2>${show.text}</h2>
    <p>Season: ${season.text} | Month: ${month.text} | Captured: ${new Date().toISOString()}</p>
  </div>
  <div class="report-content">
    ${tableHtml}
  </div>
</div>
`;
              fs.appendFileSync(outputFile, showSection);

              // Mark as scraped in index
              markScraped(scrapedIndex, season.text, month.text, show.text);

              totalReports++;
              console.log('✓');

            } catch (showErr) {
              console.log(`✗ (${showErr.message.substring(0, 30)})`);
              const errorEntry = `[${new Date().toISOString()}] SHOW ERROR
  Season: ${season.text}
  Month: ${month.text}
  Show: ${show.text}
  Error: ${showErr.message}
  Stack: ${showErr.stack || 'N/A'}
${'='.repeat(80)}
`;
              fs.appendFileSync(errorLogFile, errorEntry);
              errorCount++;
            }
          }

        } catch (monthErr) {
          console.log(`    ✗ Month error: ${monthErr.message}`);
          const errorEntry = `[${new Date().toISOString()}] MONTH ERROR
  Season: ${season.text}
  Month: ${month.text}
  Error: ${monthErr.message}
  Stack: ${monthErr.stack || 'N/A'}
${'='.repeat(80)}
`;
          fs.appendFileSync(errorLogFile, errorEntry);
          errorCount++;
        }
      }

    } catch (seasonErr) {
      console.log(`  ✗ Season error: ${seasonErr.message}`);
      const errorEntry = `[${new Date().toISOString()}] SEASON ERROR
  Season: ${season.text}
  Error: ${seasonErr.message}
  Stack: ${seasonErr.stack || 'N/A'}
${'='.repeat(80)}
`;
      fs.appendFileSync(errorLogFile, errorEntry);
      errorCount++;
    }
  }

  // Append closing HTML footer to all output files
  for (const outputFile of outputFiles) {
    const htmlFooter = `
<hr>
<footer>
  <p><strong>Total reports captured this run:</strong> ${totalReports}</p>
  <p><strong>Skipped (already scraped):</strong> ${skippedReports}</p>
  <p><strong>Errors:</strong> ${errorCount}</p>
  <p><strong>Completed:</strong> ${new Date().toISOString()}</p>
</footer>
</body>
</html>
`;
    fs.appendFileSync(outputFile, htmlFooter);
  }

  console.log('\n==========================================');
  console.log('COMPLETE!');
  console.log(`Total reports captured: ${totalReports}`);
  console.log(`Skipped (already scraped): ${skippedReports}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output files: ${[...outputFiles].join(', ')}`);
  if (errorCount > 0) {
    console.log(`Error log: ${errorLogFile}`);
  }
  console.log(`Scraped index: ${indexFile}`);
  console.log('==========================================\n');

  await browser.close();
})();
