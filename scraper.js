import puppeteer from 'puppeteer';
import fs from 'fs';

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
    const waitForLogin = async (timeout = 600000) => { // 10 minute timeout
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
          if (checkCount % 15 === 0) { // Every 30 seconds
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
        const table = document.querySelector('table');
        if (table) table.remove();
      });
    };

    // Collect all HTML content
    let allHtmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>CFA ePoints Scoreboards - All Data</title>
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
  <h1>CFA ePoints Scoreboards - Complete Data Export</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <hr>
  `;

    let totalReports = 0;
    let errors = [];

    // Get all seasons
    console.log('Getting all seasons...');
    const seasons = await getOptions('ddlSeason');
    console.log(`Found ${seasons.length} seasons: ${seasons.map(s => s.text).join(', ')}\n`);

    // Loop through all seasons
    for (const season of seasons) {
      console.log(`\n========== SEASON: ${season.text} ==========`);

      try {
        await page.select('#ddlSeason', season.value);
        await new Promise(r => setTimeout(r, 1500));

        const months = await waitForOptions('ddlMonths', 5000);
        console.log(`  Found ${months.length} months`);

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

              try {
                await page.select('#ddlShow', show.value);
                await new Promise(r => setTimeout(r, 500));

                // Remove any existing table so we can detect the new one
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
                  // Fallback: capture the main content area
                  const content = document.querySelector('.results, .content, #results, main, .report-content');
                  if (content) return content.innerHTML;
                  return '<p class="error">No tables found</p>';
                });

                // Add to combined HTML
                allHtmlContent += `
  <div class="report-section">
    <div class="report-header">
      <h2>${show.text}</h2>
      <p>Season: ${season.text} | Month: ${month.text}</p>
    </div>
    <div class="report-content">
      ${tableHtml}
    </div>
  </div>
  `;
                totalReports++;
                console.log('✓');

              } catch (showErr) {
                console.log(`✗ (${showErr.message.substring(0, 30)})`);
                errors.push({
                  season: season.text,
                  month: month.text,
                  show: show.text,
                  error: showErr.message
                });
              }
            }

          } catch (monthErr) {
            console.log(`    ✗ Month error: ${monthErr.message}`);
            errors.push({ season: season.text, month: month.text, error: monthErr.message });
          }
        }

      } catch (seasonErr) {
        console.log(`  ✗ Season error: ${seasonErr.message}`);
        errors.push({ season: season.text, error: seasonErr.message });
      }
    }

    // Close HTML
    allHtmlContent += `
  <hr>
  <footer>
    <p><strong>Total reports captured:</strong> ${totalReports}</p>
    <p><strong>Errors:</strong> ${errors.length}</p>
  </footer>
  </body>
  </html>
  `;

    // Save combined HTML
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cfa-scoreboards-all-${timestamp}.html`;
    fs.writeFileSync(filename, allHtmlContent);

    // Save error log if any
    if (errors.length > 0) {
      fs.writeFileSync(`cfa-errors-${timestamp}.json`, JSON.stringify(errors, null, 2));
      console.log(`\nErrors saved to: cfa-errors-${timestamp}.json`);
    }

    console.log('\n==========================================');
    console.log('COMPLETE!');
    console.log(`Total reports: ${totalReports}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Output: ${filename}`);
    console.log('==========================================\n');

    await browser.close();
  })();

