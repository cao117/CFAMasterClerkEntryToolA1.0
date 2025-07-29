// General tab validation logic extracted for reuse

// Local type definitions (not exported from GeneralTab.tsx)
export interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
  ringNumber: number;
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
  kittenCounts: {
    lhKittens: number;
    shKittens: number;
    total: number;
  };
  premiershipCounts: {
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
    gps: number;
    prs: number;
    total: number;
  };
  householdPetCount: number;
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
    if (!judge.name) {
      newErrors[`judge${judge.id}Name`] = `Judge ${judge.id} name is required`;
    }
    if (judge.name.length > 120) {
      newErrors[`judge${judge.id}Name`] = `Judge ${judge.id} name cannot exceed 120 characters`;
    }
    if (!judge.acronym) {
      newErrors[`judge${judge.id}Acronym`] = `Judge ${judge.id} acronym is required`;
    }
    if (judge.acronym.length > 6) {
      newErrors[`judge${judge.id}Acronym`] = `Judge ${judge.id} acronym cannot exceed 6 characters`;
    }
    
    // Ring Number validation - should be between 1 and max_judges (12)
    if (!judge.ringNumber || judge.ringNumber < 1) {
      newErrors[`judge${judge.id}RingNumber`] = `Judge ${judge.id} ring number must be between 1 and 12`;
    } else if (judge.ringNumber > 12) {
      newErrors[`judge${judge.id}RingNumber`] = `Judge ${judge.id} ring number cannot exceed 12 (max 12)`;
    }
  });

  // Duplicate judge names
  const judgeNames = judges.map(j => j.name).filter(name => name);
  const uniqueNames = new Set(judgeNames);
  if (judgeNames.length !== uniqueNames.size) {
    newErrors.judgeNames = 'Judge names must be unique';
  }

  // Ring numbers don't need to be unique - users can assign any valid ring number
  // No duplicate validation needed

  // Household Pet Count validation
  if (showData.householdPetCount < 0 || isNaN(showData.householdPetCount)) {
    newErrors.householdPetCount = 'Household Pet count must be a non-negative integer';
  }

  return newErrors;
} 