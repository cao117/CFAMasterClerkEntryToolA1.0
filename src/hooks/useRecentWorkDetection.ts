/**
 * useRecentWorkDetection Hook
 * 
 * React hook that detects if recent work exists within the last 24 hours.
 * Uses the existing Recent Save localStorage structure to check for recent work.
 * Returns work data and formatted timestamp if recent work is found.
 */

import { useState, useEffect } from 'react';
import type { AutoSaveEntry } from '../types/autoSave';

interface RecentWorkData {
  hasRecentWork: boolean;
  timestamp: string;
  resumeData: any;
}

export const useRecentWorkDetection = (): RecentWorkData | null => {
  const [recentWork, setRecentWork] = useState<RecentWorkData | null>(null);

  useEffect(() => {
    const checkForRecentWork = () => {
      const recentStorageData = localStorage.getItem('Recent Save');
      
      if (!recentStorageData) {
        setRecentWork(null);
        return;
      }

      try {
        const parsedData: AutoSaveEntry = JSON.parse(recentStorageData);
        
        // Check if timestamp exists
        if (!parsedData.timestamp) {
          setRecentWork(null);
          return;
        }

        // Check if within last 24 hours
        const now = new Date();
        const savedDate = new Date(parsedData.timestamp);
        const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff <= 24) {
          const displayTimestamp = formatTimestamp(savedDate);
          
          setRecentWork({
            hasRecentWork: true,
            timestamp: displayTimestamp,
            resumeData: parsedData
          });
        } else {
          setRecentWork(null);
        }
      } catch (error) {
        console.error('Error checking recent work:', error);
        setRecentWork(null);
      }
    };

    checkForRecentWork();
  }, []);

  return recentWork;
};

/**
 * Formats timestamp to match the required format: "21:30   Oct. 27th, 2025"
 */
const formatTimestamp = (date: Date): string => {
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  const monthStr = date.toLocaleDateString('en-US', {
    month: 'short'
  });
  
  const dayStr = date.toLocaleDateString('en-US', {
    day: 'numeric'
  });
  
  const yearStr = date.toLocaleDateString('en-US', {
    year: 'numeric'
  });

  // Add ordinal suffix to day
  const dayWithSuffix = getOrdinalSuffix(dayStr);
  
  return `${timeStr}   ${monthStr}. ${dayWithSuffix}, ${yearStr}`;
};

/**
 * Adds ordinal suffix to day number
 */
const getOrdinalSuffix = (day: string): string => {
  const dayNum = parseInt(day);
  if (dayNum >= 11 && dayNum <= 13) {
    return `${day}th`;
  }
  
  switch (dayNum % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}; 