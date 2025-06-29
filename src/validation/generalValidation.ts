// General tab validation logic extracted for reuse

// Local type definitions (not exported from GeneralTab.tsx)
export interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

export interface ShowData {
  showDate: string;
  clubName: string;
  masterClerk: string;
  numberOfJudges: number;
  championshipCounts: {
    gcs: number;
    lhChs: number;
    shChs: number;
    novs: number;
    chs: number;
    total: number;
  };
  kittenCount: number;
  premiershipCounts: {
    gcs: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
    prs: number;
    total: number;
  };
}

/**
 * Validates the General tab form data and judges.
 * Returns an object with errors keyed by field name.
 */
export function validateGeneralForm(showData: ShowData, judges: Judge[]): { [key: string]: string } {
  const newErrors: { [key: string]: string } = {};

  // Required fields
  if (!showData.showDate) newErrors.showDate = 'Show Date is required';
  if (!showData.clubName.trim()) newErrors.clubName = 'Club Name is required';
  if (showData.clubName.length > 255) newErrors.clubName = 'Club Name cannot exceed 255 characters';
  if (!showData.masterClerk.trim()) newErrors.masterClerk = 'Master Clerk Name is required';
  if (showData.masterClerk.length > 120) newErrors.masterClerk = 'Master Clerk Name cannot exceed 120 characters';

  // Number of judges
  if (showData.numberOfJudges < 1) {
    newErrors.numberOfJudges = 'Number of judges must be between 1-12 for show submission';
  } else if (showData.numberOfJudges > 12) {
    newErrors.numberOfJudges = 'Maximum 12 judges allowed';
  }

  // Judges
  judges.forEach((judge, index) => {
    if (!judge.name) newErrors[`judge${index}Name`] = `Judge ${index + 1} name is required`;
    if (judge.name.length > 120) newErrors[`judge${index}Name`] = `Judge ${index + 1} name cannot exceed 120 characters`;
    if (!judge.acronym) newErrors[`judge${index}Acronym`] = `Judge ${index + 1} acronym is required`;
    if (judge.acronym.length > 6) newErrors[`judge${index}Acronym`] = `Judge ${index + 1} acronym cannot exceed 6 characters`;
  });

  // Duplicate judge names
  const judgeNames = judges.map(j => j.name).filter(name => name);
  const uniqueNames = new Set(judgeNames);
  if (judgeNames.length !== uniqueNames.size) {
    newErrors.judgeNames = 'Judge names must be unique';
  }

  return newErrors;
} 