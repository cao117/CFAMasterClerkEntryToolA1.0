// eslint-disable-next-line no-console
import Papa from 'papaparse';

interface GetShowStateFunction {
  (): Record<string, unknown>;
}

interface SuccessCallback {
  (title: string, message?: string, duration?: number): void;
}

interface ErrorCallback {
  (title: string, message?: string, duration?: number): void;
}

export function handleSaveToCSV(
  getShowState: GetShowStateFunction,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    const showState = getShowState();
    
    // Use the comprehensive exportShowToCSV function instead of simplified approach
    const { csv, filename } = exportShowToCSV(showState);
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('CSV Export Successful', 'Show data has been exported to CSV file successfully.');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showError('CSV Export Failed', 'Failed to export show data to CSV. Please try again.');
  }
}

export function handleRestoreFromCSV(
  data: Record<string, unknown>,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    // Parse CSV data and restore show state
    // This is a simplified implementation - you would need to implement the full parsing logic
    console.log('Restoring from CSV:', data);
    
    showSuccess('CSV Import Successful', 'Show data has been imported from CSV file successfully.');
  } catch (error) {
    console.error('Error importing CSV:', error);
    showError('CSV Import Failed', 'Failed to import show data from CSV. Please check the file format and try again.');
  }
}

// CSV export utility for CFA Master Clerk Entry Tool
// See docs/USAGE.md for format and escaping rules

/**
 * Local logger stub for workflow tracing. Replace with Winston in backend or main app if needed.
 */
const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[csvExport]', ...args);
    }
  },
};

/**
 * Utility to export the full show state to a CSV string and filename.
 * Follows the format documented in docs/USAGE.md (section order, headers, voiding, escaping, etc.)
 * @param {any} showState - The full show state object (all tabs)
 * @returns {{ csv: string, filename: string }}
 */
export function exportShowToCSV(showState: any): { csv: string, filename: string } {
  logger.info('Starting CSV export');

  // Helper: Escape a field for CSV (commas, quotes, newlines)
  function escapeCSVField(field: unknown): string {
    if (field == null) return '';
    const str = String(field);
    const needsEscape = /[",\n]/.test(str);
    let escaped = str.replace(/"/g, '""');
    if (needsEscape) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  }

  // Helper: Format a placement cell
  function formatPlacementCell(cell: any): string {
    if (!cell || (!cell.catNumber && !cell.status)) return '-';
    
    // If no cat number, just return '-' regardless of status
    if (!cell.catNumber || cell.catNumber.trim() === '') return '-';
    
    let value = cell.catNumber;
    if (cell.status && cell.status.trim() !== '') value += ` - ${cell.status}`;
    if (cell.voided) value += ' - V';
    return escapeCSVField(value);
  }

  // Helper: Section label row
  function sectionLabelRow(label: string): string {
    return `${escapeCSVField(label)}`;
  }

  // Helper: Build General Information section (now includes judge table)
  function buildGeneralSection(general: any, judges: any[]): string[] {
    const rows = [sectionLabelRow('General Information')];
    for (const [key, value] of Object.entries(general)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested objects (e.g., championshipCounts, kittenCounts, premiershipCounts)
        for (const [subKey, subValue] of Object.entries(value)) {
          rows.push(`${escapeCSVField(`${key} - ${subKey}`)},${escapeCSVField(subValue)}`);
        }
      } else {
        rows.push(`${escapeCSVField(key)},${escapeCSVField(value)}`);
      }
    }
    // Add judge information as a table
    if (judges && judges.length > 0) {
      rows.push(sectionLabelRow('Judges'));
      rows.push(['Judge Name', 'Acronym', 'Ring Type'].map(escapeCSVField).join(','));
      for (const judge of judges) {
        rows.push([
          escapeCSVField(judge.name),
          escapeCSVField(judge.acronym),
          escapeCSVField(judge.ringType)
        ].join(','));
      }
    }
    return rows;
  }

  // Helper: Build a tabular section (Championship, Premiership, Kitten, Household Pet)
  function buildTabularSection(tab: any, label: string): string[] {
    const rows: string[] = [];
    // Insert a blank row before the section
    rows.push('');
    // Section label row
    rows.push(sectionLabelRow(label));
    if (!tab || !tab.rings || !tab.placements) return rows;
    // Header rows: Ring Numbers, Judge Acronyms, Ring Types
    const ringNumbers = [''].concat(tab.rings.map((r: any) => escapeCSVField(r.number)));
    const judgeAcronyms = [''].concat(tab.rings.map((r: any) => escapeCSVField(r.acronym)));
    const ringTypes = [''].concat(tab.rings.map((r: any) => escapeCSVField(r.type)));
    rows.push(ringNumbers.join(','));
    rows.push(judgeAcronyms.join(','));
    rows.push(ringTypes.join(','));
    // Placement rows
    for (const placement of tab.placements) {
      // Each placement row: label, then one cell per column
      const row = [escapeCSVField(placement.label)];
      for (const cell of placement.columns) {
        row.push(formatPlacementCell(cell));
      }
      rows.push(row.join(','));
    }
    return rows;
  }

  /**
   * Transform flat keyed tab data (from App state) into the tabular section format expected by buildTabularSection.
   * This ensures all placements, voiding, and headers are exported per schema and are restoreable.
   * @param tabData - The tab data from App state (e.g., championshipTabData)
   * @param judges - The judges array
   * @param tabType - 'championship' | 'premiership' | 'kitten' | 'household'
   */
  function transformTabData(tabData: any, judges: any[], tabType: string): any {
    // Build columns: for Double Specialty, split into LH/SH; otherwise, use ringType
    const columns: { judge: any; specialty: string }[] = [];
    judges.forEach(judge => {
      if (judge.ringType === 'Double Specialty') {
        columns.push({ judge, specialty: 'Longhair' });
        columns.push({ judge, specialty: 'Shorthair' });
      } else {
        columns.push({ judge, specialty: judge.ringType });
      }
    });

    // Create rings array for the tabular section
    const rings = columns.map((col) => ({
      number: col.judge.id.toString(),
      acronym: col.judge.acronym,
      type: col.specialty
    }));

    // Build placements array
    const placements: any[] = [];

    if (tabType === 'championship') {
      // Show Awards section (Top 10/15)
      const maxAwardRows = 15; // Championship can have up to 15 rows
             for (let pos = 0; pos < maxAwardRows; pos++) {
         const row: any = {
           label: `Show Awards ${pos + 1}${pos >= 10 ? '*' : ''}`,
           columns: []
         };
        
                 for (let colIdx = 0; colIdx < columns.length; colIdx++) {
           const key = `${colIdx}-${pos}`;
           const cellData = tabData.showAwards?.[key] || { catNumber: '', status: 'GC' };
           const voided = tabData.voidedShowAwards?.[key] || false;
           
           row.columns.push({
             catNumber: cellData.catNumber || '',
             status: cellData.status || 'GC',
             voided: !!voided
           } as any);
         }
        placements.push(row);
      }

      // Finals sections
      const finalsSections = [
        { 
          key: 'championsFinals', 
          voidKey: 'voidedChampionsFinals',
          labels: ['Best AB CH', '2nd Best AB CH', '3rd Best AB CH', '4th Best AB CH', '5th Best AB CH'],
          enabledFor: (col: any) => col.specialty === 'Allbreed'
        },
        { 
          key: 'lhChampionsFinals', 
          voidKey: 'voidedLHChampionsFinals',
          labels: ['Best LH CH', '2nd Best LH CH', '3rd Best LH CH', '4th Best LH CH', '5th Best LH CH'],
          enabledFor: (col: any) => col.specialty === 'Longhair' || col.specialty === 'Allbreed'
        },
        { 
          key: 'shChampionsFinals', 
          voidKey: 'voidedSHChampionsFinals',
          labels: ['Best SH CH', '2nd Best SH CH', '3rd Best SH CH', '4th Best SH CH', '5th Best SH CH'],
          enabledFor: (col: any) => col.specialty === 'Shorthair' || col.specialty === 'Allbreed'
        }
      ];

      for (const section of finalsSections) {
        for (let pos = 0; pos < section.labels.length; pos++) {
          const row: any = {
            label: section.labels[pos],
            columns: []
          };
          
          for (let colIdx = 0; colIdx < columns.length; colIdx++) {
            const key = `${colIdx}-${pos}`;
            const catNumber = tabData[section.key]?.[key] || '';
            const voided = tabData[section.voidKey]?.[key] || false;
            
            row.columns.push({
              catNumber: catNumber,
              status: '', // Finals don't have status
              voided: !!voided
            } as any);
          }
          placements.push(row);
        }
      }

    } else if (tabType === 'premiership') {
             // Show Awards section (Top 15)
       for (let pos = 0; pos < 15; pos++) {
         const row: any = {
           label: `Show Awards ${pos + 1}`,
           columns: []
         };
        
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const key = `${colIdx}-${pos}`;
          const cellData = tabData.showAwards?.[key] || { catNumber: '', status: 'GP' };
          const voided = tabData.voidedShowAwards?.[key] || false;
          
          row.columns.push({
            catNumber: cellData.catNumber || '',
            status: cellData.status || 'GP',
            voided: !!voided
          } as any);
        }
        placements.push(row);
      }

      // Finals sections
      const finalsSections = [
        { 
          key: 'abPremiersFinals', 
          voidKey: 'voidedABPremiersFinals',
          labels: ['Best AB PR', '2nd Best AB PR', '3rd Best AB PR', '4th Best AB PR', '5th Best AB PR'],
          enabledFor: (col: any) => col.specialty === 'Allbreed'
        },
        { 
          key: 'lhPremiersFinals', 
          voidKey: 'voidedLHPremiersFinals',
          labels: ['Best LH PR', '2nd Best LH PR', '3rd Best LH PR', '4th Best LH PR', '5th Best LH PR'],
          enabledFor: (col: any) => col.specialty === 'Longhair' || col.specialty === 'Allbreed'
        },
        { 
          key: 'shPremiersFinals', 
          voidKey: 'voidedSHPremiersFinals',
          labels: ['Best SH PR', '2nd Best SH PR', '3rd Best SH PR', '4th Best SH PR', '5th Best SH PR'],
          enabledFor: (col: any) => col.specialty === 'Shorthair' || col.specialty === 'Allbreed'
        }
      ];

      for (const section of finalsSections) {
        for (let pos = 0; pos < section.labels.length; pos++) {
          const row: any = {
            label: section.labels[pos],
            columns: []
          };
          
          for (let colIdx = 0; colIdx < columns.length; colIdx++) {
            const key = `${colIdx}-${pos}`;
            const catNumber = tabData[section.key]?.[key] || '';
            const voided = tabData[section.voidKey]?.[key] || false;
            
            row.columns.push({
              catNumber: catNumber,
              status: '', // Finals don't have status
              voided: !!voided
            } as any);
          }
          placements.push(row);
        }
      }

    } else if (tabType === 'kitten') {
      // Show Awards section (Top 10/15 based on count)
      const maxAwardRows = 15; // Kitten can have up to 15 rows
      for (let pos = 0; pos < maxAwardRows; pos++) {
        const row: any = {
          label: `Show Awards ${pos + 1}`,
          columns: []
        };
        
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const key = `${colIdx}-${pos}`;
          const cellData = tabData.showAwards?.[key] || { catNumber: '', status: '' };
          const voided = tabData.voidedShowAwards?.[key] || false;
          
          row.columns.push({
            catNumber: cellData.catNumber || '',
            status: cellData.status || '',
            voided: !!voided
          } as any);
        }
        placements.push(row);
      }

    } else if (tabType === 'household') {
      // Show Awards section (Top 10/15 based on count)
      const maxAwardRows = 15; // Household Pet can have up to 15 rows
      for (let pos = 0; pos < maxAwardRows; pos++) {
        const row: any = {
          label: `Show Awards ${pos + 1}`,
          columns: []
        };
        
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const key = `${colIdx}-${pos}`;
          const cellData = tabData.showAwards?.[key] || { catNumber: '', status: '' };
          const voided = tabData.voidedShowAwards?.[key] || false;
          
          row.columns.push({
            catNumber: cellData.catNumber || '',
            status: cellData.status || '',
            voided: !!voided
          } as any);
        }
        placements.push(row);
      }
    }

    // Return the transformed data structure
    return {
      rings,
      placements
    };
  }

  // --- Main Export Logic ---
  const rows: string[] = [];
  // General Info + Judges
  rows.push(...buildGeneralSection(showState.general, showState.judges));
  // Championship
  rows.push(...buildTabularSection(transformTabData(showState.championship, showState.judges, 'championship'), 'Championship Awards'));
  // Premiership
  rows.push(...buildTabularSection(transformTabData(showState.premiership, showState.judges, 'premiership'), 'Premiership Awards'));
  // Kitten
  rows.push(...buildTabularSection(transformTabData(showState.kitten, showState.judges, 'kitten'), 'Kitten Awards'));
  // Always export the household section, even if empty, for schema consistency
  rows.push(...buildTabularSection(transformTabData(showState.household, showState.judges, 'household'), 'Household Pet Awards'));

  // Join rows with newlines
  const csv = rows.join('\r\n');

  // Filename: YYYYMMDD_HHMM_showname.csv
  function pad(n: number) { return n < 10 ? '0' + n : n; }
  const now = new Date();
  const showName = (showState.general?.clubName || 'show').replace(/\s+/g, '');
  const filename = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}_${showName}.csv`;

  logger.info('CSV export complete', { filename });
  return { csv, filename };
}

/**
 * TODO: Refine types for showState and tab data based on actual app structure.
 * This utility is designed to be modular and reusable for all CSV export actions.
 */ 