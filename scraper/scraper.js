import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// Directory Setup (relative to script location)
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'output');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
// File Naming Functions (all output goes to ./output folder)
// Each year-month gets its own output and index file
// ============================================
function getOutputFileName(seasonText, monthText) {
  const seasonPart = seasonText.replace('/', '-');
  const monthPart = monthText.toLowerCase();
  return path.join(outputDir, `cfa-scoreboards-${seasonPart}-${monthPart}.html`);
}

function getIndexFileName(seasonText, monthText) {
  const seasonPart = seasonText.replace('/', '-');
  const monthPart = monthText.toLowerCase();
  return path.join(outputDir, `cfa-scraped-index-${seasonPart}-${monthPart}.json`);
}

// Single error log file (in output folder)
const errorLogFile = path.join(outputDir, 'cfa-errors.log');

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
// Each year-month has its own index file for parallel safety
// ============================================
function loadIndex(indexFile) {
  if (fs.existsSync(indexFile)) {
    try {
      return JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    } catch (e) {
      console.log(`Warning: Could not parse ${path.basename(indexFile)}, starting fresh`);
      return {};
    }
  }
  return {};
}

function saveIndex(indexFile, index) {
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

function isScraped(index, show) {
  return index.shows?.includes(show);
}

function markScraped(indexFile, index, show) {
  if (!index.shows) index.shows = [];
  if (!index.shows.includes(show)) {
    index.shows.push(show);
  }
  saveIndex(indexFile, index);
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
console.log(`Output Directory: ${outputDir}`);
console.log('Files (per year-month):');
console.log('  Data: cfa-scoreboards-{year}-{month}.html');
console.log('  Index: cfa-scraped-index-{year}-{month}.json');
console.log(`  Errors: ${path.basename(errorLogFile)}`);
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

  // Helper: check if error is critical (requires page recovery)
  const isCriticalError = (err) => {
    const msg = err.message.toLowerCase();
    return msg.includes('execution context') ||
           msg.includes('target closed') ||
           msg.includes('session closed') ||
           msg.includes('page crashed') ||
           msg.includes('frame was detached');
  };

  // Helper: recover page state after critical error
  const recoverPage = async (seasonValue, monthValue) => {
    console.log('\n    >> Attempting page recovery...');
    try {
      // Navigate back to scoreboards
      await page.goto('https://ecat.cfa.org/ePoints/Scoreboards', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      // Wait for season dropdown
      await page.waitForSelector('#ddlSeason', { visible: true, timeout: 10000 });

      // Re-select season
      await page.select('#ddlSeason', seasonValue);
      await new Promise(r => setTimeout(r, 1500));

      // Wait for and re-select month
      await page.waitForSelector('#ddlMonths', { visible: true, timeout: 10000 });
      await page.select('#ddlMonths', monthValue);
      await new Promise(r => setTimeout(r, 1500));

      // Wait for show dropdown
      await page.waitForSelector('#ddlShow', { visible: true, timeout: 10000 });

      console.log('    >> Recovery successful!\n');
      return true;
    } catch (recoveryErr) {
      console.log(`    >> Recovery failed: ${recoveryErr.message}\n`);
      return false;
    }
  };

  let totalReports = 0;
  let skippedReports = 0;
  let errorCount = 0;
  let needsRecovery = false;

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

  // Track output files created this session
  const outputFiles = new Set();

  // Loop through seasons
  for (const season of seasons) {
    console.log(`\n========== SEASON: ${season.text} ==========`);

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

        // Get month-specific output and index files
        const outputFile = getOutputFileName(season.text, month.text);
        const indexFile = getIndexFileName(season.text, month.text);

        // Initialize output file if needed
        if (!outputFiles.has(outputFile)) {
          const fileExistsOnDisk = fs.existsSync(outputFile);

          if (fileExistsOnDisk && !forceMode) {
            // File exists - remove closing tags before appending
            console.log(`    Output file exists, preparing to append: ${path.basename(outputFile)}`);
            let existingContent = fs.readFileSync(outputFile, 'utf8');
            const footerPattern = /<hr>\s*<footer>[\s\S]*?<\/footer>\s*<\/body>\s*<\/html>\s*$/i;
            if (footerPattern.test(existingContent)) {
              existingContent = existingContent.replace(footerPattern, '\n<!-- Continued from previous run -->\n');
              fs.writeFileSync(outputFile, existingContent);
            }
          } else {
            // Create new file
            const htmlHeader = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CFA ePoints Scoreboards - ${season.text} - ${month.text}</title>
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
<h1>CFA ePoints Scoreboards - ${season.text} - ${month.text}</h1>
<p>Generated: ${new Date().toISOString()}</p>
<p>Output file: ${path.basename(outputFile)}</p>
<hr>
`;
            fs.writeFileSync(outputFile, htmlHeader);
            console.log(`    Output file created: ${path.basename(outputFile)}`);
          }
          outputFiles.add(outputFile);
        }

        // Load month-specific index
        const monthIndex = forceMode ? {} : loadIndex(indexFile);

        try {
          await page.select('#ddlMonths', month.value);
          await new Promise(r => setTimeout(r, 1500));

          const shows = await waitForOptions('ddlShow', 5000);
          console.log(`    Found ${shows.length} shows`);

          for (const show of shows) {
            const shortName = show.text.length > 50 ? show.text.substring(0, 50) + '...' : show.text;
            process.stdout.write(`      ${shortName} `);

            // Check if already scraped (resume capability)
            if (!forceMode && isScraped(monthIndex, show.text)) {
              console.log('(skipped - already scraped)');
              skippedReports++;
              continue;
            }

            // If previous error required recovery, attempt it now
            if (needsRecovery) {
              const recovered = await recoverPage(season.value, month.value);
              if (!recovered) {
                console.log('(skipped - recovery failed)');
                errorCount++;
                continue;
              }
              needsRecovery = false;
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

              // Capture ALL tables with their headers (Championship, Kittens, Premier, HHP)
              const tableHtml = await page.evaluate(() => {
                const tables = document.querySelectorAll('table');
                if (tables.length > 0) {
                  const results = [];
                  for (const table of tables) {
                    let headerHtml = '';
                    // Look for preceding header elements (h1-h6, strong, b, div with class containing 'header' or 'title')
                    let prev = table.previousElementSibling;
                    const headers = [];
                    // Walk backwards to find headers that belong to this table
                    while (prev) {
                      const tagName = prev.tagName.toLowerCase();
                      const isHeader = /^h[1-6]$/.test(tagName) ||
                                       tagName === 'strong' ||
                                       tagName === 'b' ||
                                       (prev.className && /header|title|label|caption/i.test(prev.className));
                      const isTextElement = prev.innerText && prev.innerText.trim().length > 0 && prev.innerText.trim().length < 100;

                      // Stop if we hit another table or a major block element
                      if (tagName === 'table' || tagName === 'hr') break;

                      // Capture headers and short text labels
                      if (isHeader || (isTextElement && !prev.querySelector('table'))) {
                        headers.unshift(prev.outerHTML);
                      }

                      // Only go back a few elements
                      if (headers.length >= 3) break;
                      prev = prev.previousElementSibling;
                    }

                    if (headers.length > 0) {
                      headerHtml = headers.join('\n');
                    }

                    results.push(headerHtml + '\n' + table.outerHTML);
                  }
                  return results.join('\n<hr class="table-separator">\n');
                }
                // Fallback: capture entire content area
                const content = document.querySelector('.results, .content, #results, main, .report-content, #main_pnlReport');
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

              // Mark as scraped in month index
              markScraped(indexFile, monthIndex, show.text);

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

              // Check if this is a critical error requiring page recovery
              if (isCriticalError(showErr)) {
                needsRecovery = true;
              }
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

          // If selector not found, page likely needs recovery
          if (monthErr.message.includes('No element found') || isCriticalError(monthErr)) {
            console.log('    >> Page state lost, attempting recovery before next month...');
            const recovered = await recoverPage(season.value, month.value);
            if (!recovered) {
              console.log('    >> Recovery failed, continuing to next month...');
            }
          }
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
  console.log(`Output files (${outputFiles.size}):`);
  for (const f of outputFiles) {
    console.log(`  - ${path.basename(f)}`);
  }
  if (errorCount > 0) {
    console.log(`Error log: ${path.basename(errorLogFile)}`);
  }
  console.log('==========================================\n');

  await browser.close();
})();
