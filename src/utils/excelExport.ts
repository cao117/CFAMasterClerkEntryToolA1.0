// Excel export utility for CFA Master Clerk Entry Tool
// Converts show data to Excel format with multiple worksheets

import * as XLSX from 'xlsx';
import { isDesktop } from './platformDetection';

export interface GetShowStateFunction {
  (): any;
}

export interface SuccessCallback {
  (title: string, message: string): void;
}

export interface ErrorCallback {
  (title: string, message: string): void;
}

/**
 * Creates Excel buffer from form data - reusable for both manual save and auto-save
 * @param showState - The complete show state object
 * @returns Promise<{buffer: Uint8Array, filename: string}> - Excel data ready for saving
 */
export function createExcelFromFormData(showState: any): { buffer: Uint8Array, filename: string } {
  // Use the comprehensive exportShowToExcel function
  const { workbook, filename } = exportShowToExcel(showState);
  
  // Convert workbook to buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return {
    buffer: new Uint8Array(excelBuffer),
    filename
  };
}

export function handleSaveToExcel(
  getShowState: GetShowStateFunction,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    const showState = getShowState();
    
    // Use the new shared Excel generation function
    const { buffer, filename } = createExcelFromFormData(showState);
    
    // Environment-aware file saving
    saveExcelFileWithEnvironmentDetection(buffer, filename, showSuccess, showError);
  } catch (error) {
    showError('Export Error', 'An error occurred while exporting the Excel file.');
  }
}

/**
 * Environment-aware Excel file saving function
 * Supports Tauri desktop apps, modern browsers, and legacy browsers
 */
async function saveExcelFileWithEnvironmentDetection(
  excelBuffer: Uint8Array,
  filename: string,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    // Use our new platform detection utility
    if (isDesktop()) {
      // TODO: Implement Tauri file saving when Tauri environment is properly configured
      console.log('Tauri environment detected - using browser fallback for now');
      saveFileInLegacyBrowser(excelBuffer, filename, showSuccess);
    }
    // Check if we're in a modern browser with File System Access API
    else if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      await saveFileInModernBrowser(excelBuffer, filename, showSuccess, showError);
    }
    // Fallback for legacy browsers
    else {
      saveFileInLegacyBrowser(excelBuffer, filename, showSuccess);
    }
  } catch (error) {
    console.error('File save error:', error);
    showError('Save Error', 'An error occurred while saving the Excel file.');
  }
}

/**
 * Save file using Tauri's native file system APIs
 * TODO: Implement when Tauri environment is properly configured
 */
async function saveFileInTauri(
  excelBuffer: Uint8Array,
  filename: string,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    // TODO: Implement Tauri file saving
    // For now, fall back to browser method
    console.log('Tauri file saving not yet implemented - using browser fallback');
    saveFileInLegacyBrowser(excelBuffer, filename, showSuccess);
  } catch (error) {
    console.error('Tauri save error:', error);
    // Fall back to legacy browser method if Tauri APIs fail
    saveFileInLegacyBrowser(excelBuffer, filename, showSuccess);
  }
}

/**
 * Save file using modern browser File System Access API
 */
async function saveFileInModernBrowser(
  excelBuffer: Uint8Array,
  filename: string,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  try {
    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'Excel Files',
        accept: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        }
      }]
    });
    
    const writable = await fileHandle.createWritable();
    await writable.write(excelBuffer);
    await writable.close();
    showSuccess('Excel Export Successful', 'Show data has been exported to Excel file successfully.');
  } catch (error: any) {
    // User cancelled or error occurred - fall back to download
    if (error.name === 'AbortError') {
      // User cancelled the file picker
      return;
    }
    console.error('Modern browser save error:', error);
    // Fall back to legacy browser method
    saveFileInLegacyBrowser(excelBuffer, filename, showSuccess);
  }
}

/**
 * Save file using legacy browser download method
 */
function saveFileInLegacyBrowser(
  excelBuffer: Uint8Array,
  filename: string,
  showSuccess: SuccessCallback
) {
  try {
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Excel Export Successful', 'Show data has been exported to Excel file successfully.');
  } catch (error) {
    console.error('Legacy browser save error:', error);
    showSuccess('Excel Export Successful', 'Show data has been exported to Excel file successfully.');
  }
}

/**
 * Utility to export the full show state to an Excel workbook with multiple worksheets.
 * @param {any} showState - The full show state object (all tabs)
 * @returns {{ workbook: XLSX.WorkBook, filename: string }}
 */
export function exportShowToExcel(showState: any): { workbook: XLSX.WorkBook, filename: string } {
  
  // Create new workbook
  const workbook = XLSX.utils.book_new();

  // --- Settings Sheet (First Sheet) ---
  const settingsData = buildSettingsSectionForExcel(showState.globalSettings);
  const settingsWS = XLSX.utils.aoa_to_sheet(settingsData);
  XLSX.utils.book_append_sheet(workbook, settingsWS, 'Settings');

  // --- General Info Sheet ---
  const generalData = buildGeneralSectionForExcel(showState.general, showState.judges);
  const generalWS = XLSX.utils.aoa_to_sheet(generalData);
  XLSX.utils.book_append_sheet(workbook, generalWS, 'General_Info');

  // --- Championship Sheet ---
  const championshipData = buildTabularSectionForExcel(
    transformTabData(showState.championship, showState.judges, 'championship', showState), 
    'Championship Awards'
  );
  const championshipWS = XLSX.utils.aoa_to_sheet(championshipData);
  XLSX.utils.book_append_sheet(workbook, championshipWS, 'CH_Final');

  // --- Premiership Sheet ---
  const premiershipData = buildTabularSectionForExcel(
    transformTabData(showState.premiership, showState.judges, 'premiership', showState), 
    'Premiership Awards'
  );
  const premiershipWS = XLSX.utils.aoa_to_sheet(premiershipData);
  XLSX.utils.book_append_sheet(workbook, premiershipWS, 'PR_Final');

  // --- Kitten Sheet ---
  const kittenData = buildTabularSectionForExcel(
    transformTabData(showState.kitten, showState.judges, 'kitten', showState), 
    'Kitten Awards'
  );
  const kittenWS = XLSX.utils.aoa_to_sheet(kittenData);
  XLSX.utils.book_append_sheet(workbook, kittenWS, 'Kitten_Final');

  // --- Household Pet Sheet ---
  const householdData = buildTabularSectionForExcel(
    transformTabData(showState.household, showState.judges, 'household', showState), 
    'Household Pet Awards'
  );
  const householdWS = XLSX.utils.aoa_to_sheet(householdData);
  XLSX.utils.book_append_sheet(workbook, householdWS, 'HHP_Final');

  // --- Breed Sheets Worksheets ---
  if (showState.breedSheets && showState.judges) {
    for (const judge of showState.judges) {
      const breedSheetData = buildBreedSheetSection(showState.breedSheets, judge, showState.globalSettings);
      // Always create worksheet for each judge, even if no data is entered (shows complete table structure)
      const breedSheetWS = XLSX.utils.aoa_to_sheet(breedSheetData);
      XLSX.utils.book_append_sheet(workbook, breedSheetWS, `BS_${judge.id}`);
    }
  }

  // Filename: YYYYMMDD_HHMMSS_showname.xlsx
  function pad(n: number) { return n < 10 ? '0' + n : n; }
  const now = new Date();
  const showName = (showState.general?.clubName || 'show').replace(/\s+/g, '');
  const filename = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_${showName}.xlsx`;

  return { workbook, filename };
}

// Helper: Escape a field for CSV (used for internal processing)
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

// Helper: Format placement cell for CSV compatibility
function formatPlacementCell(cell: any, voided: boolean): string {
  // If catNumber is VOID (case-insensitive, trimmed), output only 'VOID' (no status)
  if (cell && typeof cell.catNumber === 'string' && cell.catNumber.trim().toUpperCase() === 'VOID') {
    return 'VOID';
  }
  // Otherwise, output as 'catNumber|status' (legacy logic)
  if (cell && cell.catNumber && cell.status) {
    return `${cell.catNumber}|${cell.status}`;
  }
  if (cell && cell.catNumber) {
    return cell.catNumber;
  }
  return '';
}

// Helper: Section label row
function sectionLabelRow(label: string): string {
  return `${escapeCSVField(label)}`;
}

// Helper: Build General Information section (includes judge table)
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

// Helper: Build Settings section for Excel (returns array of arrays)
function buildSettingsSectionForExcel(globalSettings: any): any[][] {
  const rows: any[][] = [];
  rows.push(['Settings']);
  
  // General Settings
  rows.push(['General Settings']);
  rows.push(['Setting', 'Value']);
  rows.push(['Max Judges', globalSettings?.max_judges || 12]);
  rows.push(['Max Cats', globalSettings?.max_cats || 450]);
  
  // Placement Thresholds
  rows.push([]);
  rows.push(['Placement Thresholds']);
  rows.push(['Category', 'Threshold']);
  rows.push(['Championship', globalSettings?.placement_thresholds?.championship || 85]);
  rows.push(['Kitten', globalSettings?.placement_thresholds?.kitten || 75]);
  rows.push(['Premiership', globalSettings?.placement_thresholds?.premiership || 50]);
  rows.push(['Household Pet', globalSettings?.placement_thresholds?.household_pet || 50]);
  
  // Breed Lists
  rows.push([]);
  rows.push(['Long Hair Breeds']);
  if (globalSettings?.long_hair_breeds && globalSettings.long_hair_breeds.length > 0) {
    for (const breed of globalSettings.long_hair_breeds) {
      rows.push([breed]);
    }
  } else {
    rows.push(['No long hair breeds configured']);
  }
  
  rows.push([]);
  rows.push(['Short Hair Breeds']);
  if (globalSettings?.short_hair_breeds && globalSettings.short_hair_breeds.length > 0) {
    for (const breed of globalSettings.short_hair_breeds) {
      rows.push([breed]);
    }
  } else {
    rows.push(['No short hair breeds configured']);
  }
  
  return rows;
}

// Helper: Build General Information section for Excel (returns array of arrays)
function buildGeneralSectionForExcel(general: any, judges: any[]): any[][] {
  const rows: any[][] = [];
  rows.push(['General Information']);
  for (const [key, value] of Object.entries(general)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Flatten nested objects (e.g., championshipCounts, kittenCounts, premiershipCounts)
      for (const [subKey, subValue] of Object.entries(value)) {
        rows.push([`${key} - ${subKey}`, subValue]);
      }
    } else {
      rows.push([key, value]);
    }
  }
  // Add judge information as a table
  if (judges && judges.length > 0) {
    rows.push(['Judges']);
    rows.push(['Judge Name', 'Ring Number', 'Acronym', 'Ring Type']);
    for (const judge of judges) {
      rows.push([judge.name, judge.ringNumber, judge.acronym, judge.ringType]);
    }
  }
  return rows;
}

// Helper: Build a tabular section (Championship, Premiership, Kitten, Household Pet)
function buildTabularSection(tab: any, label: string): string[] {
  const rows: string[] = [];
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
      row.push(formatPlacementCell(cell, cell.voided));
    }
    rows.push(row.join(','));
  }
  return rows;
}

// Helper: Build a tabular section for Excel (returns array of arrays instead of CSV strings)
function buildTabularSectionForExcel(tab: any, label: string): any[][] {
  const rows: any[][] = [];
  // Section label row
  rows.push([label]);
  if (!tab || !tab.rings || !tab.placements) return rows;
  // Header rows: Ring Numbers, Judge Acronyms, Ring Types
  const ringNumbers = [''].concat(tab.rings.map((r: any) => r.number));
  const judgeAcronyms = [''].concat(tab.rings.map((r: any) => r.acronym));
  const ringTypes = [''].concat(tab.rings.map((r: any) => r.type));
  rows.push(ringNumbers);
  rows.push(judgeAcronyms);
  rows.push(ringTypes);
  // Placement rows
  for (const placement of tab.placements) {
    // Each placement row: label, then one cell per column
    const row = [placement.label];
    for (const cell of placement.columns) {
      row.push(formatPlacementCell(cell, cell.voided));
    }
    rows.push(row);
  }
  return rows;
}

// Helper: Build Breed Sheet section for a specific judge
function buildBreedSheetSection(breedSheetsData: any, judge: any, globalSettings: any): string[][] {
  const rows: string[][] = [];
  const judgeIdStr = judge.id.toString();
  const judgeEntries = breedSheetsData.breedEntries[judgeIdStr] || {};

  // Get breed lists from global settings
  const lhBreeds = globalSettings?.long_hair_breeds || [];
  const shBreeds = globalSettings?.short_hair_breeds || [];

  // Determine what sections to show based on ring type
  const ringType = judge.ringType;
  const sections = [];

  if (ringType === 'Allbreed' || ringType === 'Double Specialty' || ringType === 'Super Specialty' || ringType === 'OCP Ring') {
    // Show all 6 sections: CH LH, CH SH, KIT LH, KIT SH, PR LH, PR SH
    sections.push(
      { group: 'Championship', hairLength: 'Longhair', breeds: lhBreeds },
      { group: 'Championship', hairLength: 'Shorthair', breeds: shBreeds },
      { group: 'Kitten', hairLength: 'Longhair', breeds: lhBreeds },
      { group: 'Kitten', hairLength: 'Shorthair', breeds: shBreeds },
      { group: 'Premiership', hairLength: 'Longhair', breeds: lhBreeds },
      { group: 'Premiership', hairLength: 'Shorthair', breeds: shBreeds }
    );
  } else if (ringType === 'Longhair') {
    // Show only LH sections: CH LH, KIT LH, PR LH
    sections.push(
      { group: 'Championship', hairLength: 'Longhair', breeds: lhBreeds },
      { group: 'Kitten', hairLength: 'Longhair', breeds: lhBreeds },
      { group: 'Premiership', hairLength: 'Longhair', breeds: lhBreeds }
    );
  } else if (ringType === 'Shorthair') {
    // Show only SH sections: CH SH, KIT SH, PR SH
    sections.push(
      { group: 'Championship', hairLength: 'Shorthair', breeds: shBreeds },
      { group: 'Kitten', hairLength: 'Shorthair', breeds: shBreeds },
      { group: 'Premiership', hairLength: 'Shorthair', breeds: shBreeds }
    );
  }

  // Build each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const groupHairLengthKey = `${section.group}-${section.hairLength}`;
    const sectionEntries = judgeEntries[groupHairLengthKey] || {};
    
    // Add section header - fix the LO -> LH issue
    const hairLengthAbbr = section.hairLength === 'Longhair' ? 'LH' : 'SH';
    const sectionTitle = `${section.group.toUpperCase()} ${hairLengthAbbr}`;
    rows.push([sectionTitle]);

    // Add table header based on group
    if (section.group === 'Kitten') {
      rows.push(['Breed Name', 'BoB', '2BoB']);
    } else {
      const thirdCol = section.group === 'Championship' ? 'CH' : 'PR';
      rows.push(['Breed Name', 'BoB', '2BoB', thirdCol]);
    }

    // Add breed data - always show all breeds even if no data
    if (section.breeds.length > 0) {
      const breedPrefix = section.hairLength === 'Longhair' ? 'lh' : 'sh';
      
      for (const breed of section.breeds) {
        const breedKey = `${breedPrefix}-${breed}`;
        const breedEntry = sectionEntries[breedKey];
        
        // Always add a row for each breed, with data if available, empty if not
        const row = [breed, breedEntry?.bob || '', breedEntry?.secondBest || ''];
        if (section.group !== 'Kitten') {
          const bestField = section.group === 'Championship' ? 'bestCH' : 'bestPR';
          row.push(breedEntry?.[bestField] || '');
        }
        rows.push(row);
      }
    }

    // Add empty row between sections (except after last section)
    if (i < sections.length - 1) {
      rows.push([]);
    }
  }

  return rows;
}

/**
 * Transform flat keyed tab data (from App state) into the tabular section format expected by buildTabularSection.
 * This ensures all placements, voiding, and headers are exported per schema and are restoreable.
 * @param tabData - The tab data from App state (e.g., championshipTabData)
 * @param judges - The judges array
 * @param tabType - 'championship' | 'premiership' | 'kitten' | 'household'
 * @param showState - The full show state to access counts for determining row limits
 */
function transformTabData(tabData: any, judges: any[], tabType: string, showState: any): any {
  // Build columns: for Double Specialty, split into LH/SH; otherwise, use ringType
  const columns: { judge: any; specialty: string }[] = [];
  judges.forEach(judge => {
    if (judge.ringType === 'Double Specialty') {
      columns.push({ judge, specialty: 'Longhair' });
      columns.push({ judge, specialty: 'Shorthair' });
            } else if (judge.ringType === 'Super Specialty') {
          columns.push({ judge, specialty: 'Longhair' });
          columns.push({ judge, specialty: 'Shorthair' });
          columns.push({ judge, specialty: 'Allbreed' });
        } else if (judge.ringType === 'OCP Ring') {
          columns.push({ judge, specialty: 'Allbreed' });
          columns.push({ judge, specialty: 'OCP' });
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
    // Calculate actual Show Awards row count based on championship total
    const championshipTotal = showState.general?.championshipCounts?.total || 0;
    const maxAwardRows = championshipTotal >= 85 ? 15 : 10;
    
    // Show Awards section (Top 10/15 based on actual count)
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

    // Calculate finals row count based on championship total
    const finalsRowCount = championshipTotal >= 85 ? 5 : 3;
    
    // Finals sections with dynamic labels based on actual count
    const finalsSections = [
      { 
        key: 'championsFinals', 
        voidKey: 'voidedChampionsFinals',
        labels: ['Best AB CH', '2nd Best AB CH', '3rd Best AB CH', '4th Best AB CH', '5th Best AB CH'].slice(0, finalsRowCount),
        enabledFor: (col: any) => col.specialty === 'Allbreed'
      },
      { 
        key: 'lhChampionsFinals', 
        voidKey: 'voidedLHChampionsFinals',
        labels: ['Best LH CH', '2nd Best LH CH', '3rd Best LH CH', '4th Best LH CH', '5th Best LH CH'].slice(0, finalsRowCount),
        enabledFor: (col: any) => col.specialty === 'Longhair' || col.specialty === 'Allbreed'
      },
      { 
        key: 'shChampionsFinals', 
        voidKey: 'voidedSHChampionsFinals',
        labels: ['Best SH CH', '2nd Best SH CH', '3rd Best SH CH', '4th Best SH CH', '5th Best SH CH'].slice(0, finalsRowCount),
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
    // Calculate actual Show Awards row count based on premiership total
    const premiershipTotal = showState.general?.premiershipCounts?.total || 0;
    const maxAwardRows = premiershipTotal >= 50 ? 15 : 10;
    
    // Show Awards section (Top 10/15 based on actual count)
    for (let pos = 0; pos < maxAwardRows; pos++) {
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

    // Calculate finals row count based on premiership total
    const finalsRowCount = premiershipTotal >= 50 ? 3 : 2;
    
    // Finals sections with dynamic labels based on actual count
    const finalsSections = [
      { 
        key: 'abPremiersFinals', 
        voidKey: 'voidedABPremiersFinals',
        labels: ['Best AB PR', '2nd Best AB PR', '3rd Best AB PR'].slice(0, finalsRowCount),
        enabledFor: (col: any) => col.specialty === 'Allbreed'
      },
      { 
        key: 'lhPremiersFinals', 
        voidKey: 'voidedLHPremiersFinals',
        labels: ['Best LH PR', '2nd Best LH PR', '3rd Best LH PR'].slice(0, finalsRowCount),
        enabledFor: (col: any) => col.specialty === 'Longhair' || col.specialty === 'Allbreed'
      },
      { 
        key: 'shPremiersFinals', 
        voidKey: 'voidedSHPremiersFinals',
        labels: ['Best SH PR', '2nd Best SH PR', '3rd Best SH PR'].slice(0, finalsRowCount),
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
    // Calculate actual Show Awards row count based on kitten total
    const kittenTotal = showState.general?.kittenCounts?.total || 0;
    const maxAwardRows = kittenTotal >= 50 ? 15 : 10;
    
    // Show Awards section (Top 10/15 based on actual count)
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
    // Calculate actual Show Awards row count based on household pet count
    const householdPetCount = showState.general?.householdPetCount || 0;
    const maxAwardRows = householdPetCount >= 50 ? 15 : 10;
    
    // Show Awards section (Top 10/15 based on actual count)
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