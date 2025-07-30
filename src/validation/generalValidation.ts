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
    lhGcs: number;
    shGcs: number;
    lhChs: number;
    shChs: number;
    lhNovs: number;
    shNovs: number;
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
    lhNovs: number;
    shNovs: number;
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
 * @param showData - The show data to validate
 * @param judges - Array of judges to validate
 * @param maxJudges - Maximum number of judges allowed (default: 12)
 * @param maxCats - Maximum number of cats allowed (default: 450)
 */
export function validateGeneralForm(showData: ShowData, judges: Judge[], maxJudges: number = 12, maxCats: number = 450): { [key: string]: string } {
  const newErrors: { [key: string]: string } = {};

  // Required fields
  if (!showData.showDate) newErrors.showDate = 'Show Date is required';
  if (!showData.clubName.trim()) newErrors.clubName = 'Club Name is required';
  if (showData.clubName.length > 255) newErrors.clubName = 'Club Name cannot exceed 255 characters';
  if (!showData.masterClerk.trim()) newErrors.masterClerk = 'Master Clerk Name is required';
  if (showData.masterClerk.length > 120) newErrors.masterClerk = 'Master Clerk Name cannot exceed 120 characters';

  // Number of judges
  if (showData.numberOfJudges < 1) {
    newErrors.numberOfJudges = `Number of judges must be between 1-${maxJudges} for show submission`;
  } else if (showData.numberOfJudges > maxJudges) {
    newErrors.numberOfJudges = `Maximum ${maxJudges} judges allowed`;
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
    
    // Ring Number validation - should be between 1 and max_judges
    if (!judge.ringNumber || judge.ringNumber < 1) {
      newErrors[`judge${judge.id}RingNumber`] = `Judge ${judge.id} ring number must be between 1 and ${maxJudges}`;
    } else if (judge.ringNumber > maxJudges) {
      newErrors[`judge${judge.id}RingNumber`] = `Judge ${judge.id} ring number cannot exceed ${maxJudges} (max ${maxJudges})`;
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

  // Show Count validation against maxCats
  // Championship Counts validation
  if (showData.championshipCounts.lhGcs > maxCats) {
    newErrors.championshipLhGcs = `Longhair GCs cannot exceed ${maxCats}`;
  }
  if (showData.championshipCounts.shGcs > maxCats) {
    newErrors.championshipShGcs = `Shorthair GCs cannot exceed ${maxCats}`;
  }
  if (showData.championshipCounts.lhChs > maxCats) {
    newErrors.championshipLhChs = `Longhair CHs cannot exceed ${maxCats}`;
  }
  if (showData.championshipCounts.shChs > maxCats) {
    newErrors.championshipShChs = `Shorthair CHs cannot exceed ${maxCats}`;
  }
  if (showData.championshipCounts.lhNovs > maxCats) {
    newErrors.championshipLhNovs = `Longhair NOVs cannot exceed ${maxCats}`;
  }
  if (showData.championshipCounts.shNovs > maxCats) {
    newErrors.championshipShNovs = `Shorthair NOVs cannot exceed ${maxCats}`;
  }

  // Kitten Counts validation
  if (showData.kittenCounts.lhKittens > maxCats) {
    newErrors.kittenLhKittens = `Longhair Kittens cannot exceed ${maxCats}`;
  }
  if (showData.kittenCounts.shKittens > maxCats) {
    newErrors.kittenShKittens = `Shorthair Kittens cannot exceed ${maxCats}`;
  }

  // Premiership Counts validation
  if (showData.premiershipCounts.lhGps > maxCats) {
    newErrors.premiershipLhGps = `Longhair GPs cannot exceed ${maxCats}`;
  }
  if (showData.premiershipCounts.shGps > maxCats) {
    newErrors.premiershipShGps = `Shorthair GPs cannot exceed ${maxCats}`;
  }
  if (showData.premiershipCounts.lhPrs > maxCats) {
    newErrors.premiershipLhPrs = `Longhair PRs cannot exceed ${maxCats}`;
  }
  if (showData.premiershipCounts.shPrs > maxCats) {
    newErrors.premiershipShPrs = `Shorthair PRs cannot exceed ${maxCats}`;
  }
  if (showData.premiershipCounts.lhNovs > maxCats) {
    newErrors.premiershipLhNovs = `Longhair NOVs cannot exceed ${maxCats}`;
  }
  if (showData.premiershipCounts.shNovs > maxCats) {
    newErrors.premiershipShNovs = `Shorthair NOVs cannot exceed ${maxCats}`;
  }

  return newErrors;
} 