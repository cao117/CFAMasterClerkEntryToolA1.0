import { useState, useEffect } from 'react';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface ChampionshipResult {
  judgeId: number;
  specialty: string;
  placements: string[];
  specialAwards: string[];
}

interface ChampionshipTabProps {
  judges: Judge[];
}

export default function ChampionshipTab({ judges }: ChampionshipTabProps) {
  const [results, setResults] = useState<ChampionshipResult[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Generate columns based on judges and their ring types
  const generateColumns = (judges: Judge[]) => {
    const columns: Array<{ judge: Judge; specialty: string; enabled: boolean }> = [];
    
    judges.forEach(judge => {
      switch (judge.ringType) {
        case 'Double Specialty':
          columns.push({ judge, specialty: 'Longhair', enabled: true });
          columns.push({ judge, specialty: 'Shorthair', enabled: true });
          break;
        case 'Allbreed':
          columns.push({ judge, specialty: 'Allbreed', enabled: true });
          break;
        case 'Longhair':
          columns.push({ judge, specialty: 'Longhair', enabled: true });
          break;
        case 'Shorthair':
          columns.push({ judge, specialty: 'Shorthair', enabled: true });
          break;
        default:
          columns.push({ judge, specialty: 'Allbreed', enabled: true });
      }
    });
    
    return columns;
  };

  const columns = generateColumns(judges);

  const updateResult = (judgeId: number, specialty: string, placementIndex: number, value: string) => {
    // Validate cat number
    if (value && value.toLowerCase() !== 'void') {
      const catNum = parseInt(value);
      if (isNaN(catNum) || catNum < 1 || catNum > 450) {
        setErrors(prev => ({
          ...prev,
          [`${judgeId}-${specialty}-${placementIndex}`]: 'Cat number must be between 1-450 or VOID'
        }));
        return;
      }
    }

    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${judgeId}-${specialty}-${placementIndex}`];
      return newErrors;
    });

    setResults(prev => {
      const existing = prev.find(r => r.judgeId === judgeId && r.specialty === specialty);
      if (existing) {
        const updated = { ...existing };
        updated.placements[placementIndex] = value;
        return prev.map(r => r === existing ? updated : r);
      } else {
        const newResult: ChampionshipResult = {
          judgeId,
          specialty,
          placements: Array(10).fill(''),
          specialAwards: Array(9).fill('')
        };
        newResult.placements[placementIndex] = value;
        return [...prev, newResult];
      }
    });
  };

  const updateSpecialAward = (judgeId: number, specialty: string, awardIndex: number, value: string) => {
    // Validate cat number for special awards
    if (value && value.toLowerCase() !== 'void') {
      const catNum = parseInt(value);
      if (isNaN(catNum) || catNum < 1 || catNum > 450) {
        setErrors(prev => ({
          ...prev,
          [`${judgeId}-${specialty}-award-${awardIndex}`]: 'Cat number must be between 1-450 or VOID'
        }));
        return;
      }
    }

    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${judgeId}-${specialty}-award-${awardIndex}`];
      return newErrors;
    });

    setResults(prev => {
      const existing = prev.find(r => r.judgeId === judgeId && r.specialty === specialty);
      if (existing) {
        const updated = { ...existing };
        updated.specialAwards[awardIndex] = value;
        return prev.map(r => r === existing ? updated : r);
      } else {
        const newResult: ChampionshipResult = {
          judgeId,
          specialty,
          placements: Array(10).fill(''),
          specialAwards: Array(9).fill('')
        };
        newResult.specialAwards[awardIndex] = value;
        return [...prev, newResult];
      }
    });
  };

  const getResult = (judgeId: number, specialty: string, placementIndex: number): string => {
    const result = results.find(r => r.judgeId === judgeId && r.specialty === specialty);
    return result ? result.placements[placementIndex] || '' : '';
  };

  const getSpecialAward = (judgeId: number, specialty: string, awardIndex: number): string => {
    const result = results.find(r => r.judgeId === judgeId && r.specialty === specialty);
    return result ? result.specialAwards[awardIndex] || '' : '';
  };

  const getError = (judgeId: number, specialty: string, placementIndex: number): string => {
    return errors[`${judgeId}-${specialty}-${placementIndex}`] || '';
  };

  const getSpecialAwardError = (judgeId: number, specialty: string, awardIndex: number): string => {
    return errors[`${judgeId}-${specialty}-award-${awardIndex}`] || '';
  };

  if (judges.length === 0) {
    return (
      <div className="p-8 space-y-8">
        <div className="cfa-section">
          <h2 className="cfa-section-header">Championship Finals</h2>
          <p className="text-gray-600 mb-6">Dynamic championship table based on judge information from the General tab.</p>
          
          <div className="text-center py-12">
            <div className="cfa-badge cfa-badge-warning mb-4">No Judges Available</div>
            <p className="text-gray-600">Please add judges in the General tab to populate the championship table.</p>
          </div>
        </div>
      </div>
    );
  }

  const specialAwardLabels = [
    'Best CH', '2nd CH', '3rd CH',
    'Best LH CH', '2nd LH CH', '3rd LH CH',
    'Best SH CH', '2nd SH CH', '3rd SH CH'
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="cfa-section">
        <h2 className="cfa-section-header">Championship Finals</h2>
        <p className="text-gray-600 mb-6">Dynamic championship table based on judge information from the General tab.</p>
        
        <div className="cfa-table">
          <table className="w-full">
            <thead>
              <tr className="cfa-table-header">
                <th className="text-left py-3 pl-4">Category</th>
                {judges.map(judge => (
                  <th key={judge.id} className="text-center py-3 px-2">
                    <div className="text-sm font-medium">Ring {judge.id}</div>
                    <div className="text-xs opacity-90">{judge.name}</div>
                    <div className="text-xs opacity-75">({judge.acronym})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Top 15 Cats */}
              {Array.from({ length: 15 }, (_, i) => (
                <tr key={`top15-${i}`} className="cfa-table-row">
                  <td className="py-3 pl-4 font-medium text-sm">
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                  </td>
                  {judges.map(judge => (
                    <td key={judge.id} className="py-2 px-2">
                      <input
                        type="text"
                        className="cfa-input w-20 text-sm text-center"
                        placeholder="Cat #"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Best LH CH */}
              <tr className="cfa-table-row bg-blue-50">
                <td className="py-3 pl-4 font-semibold text-blue-800">Best LH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Shorthair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 2nd LH CH */}
              <tr className="cfa-table-row bg-blue-50">
                <td className="py-3 pl-4 font-semibold text-blue-800">2nd LH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Shorthair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 3rd LH CH */}
              <tr className="cfa-table-row bg-blue-50">
                <td className="py-3 pl-4 font-semibold text-blue-800">3rd LH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Shorthair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 4th LH CH */}
              <tr className="cfa-table-row bg-blue-50">
                <td className="py-3 pl-4 font-semibold text-blue-800">4th LH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Shorthair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 5th LH CH */}
              <tr className="cfa-table-row bg-blue-50">
                <td className="py-3 pl-4 font-semibold text-blue-800">5th LH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Shorthair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* Best SH CH */}
              <tr className="cfa-table-row bg-green-50">
                <td className="py-3 pl-4 font-semibold text-green-800">Best SH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Longhair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 2nd SH CH */}
              <tr className="cfa-table-row bg-green-50">
                <td className="py-3 pl-4 font-semibold text-green-800">2nd SH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Longhair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 3rd SH CH */}
              <tr className="cfa-table-row bg-green-50">
                <td className="py-3 pl-4 font-semibold text-green-800">3rd SH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Longhair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 4th SH CH */}
              <tr className="cfa-table-row bg-green-50">
                <td className="py-3 pl-4 font-semibold text-green-800">4th SH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Longhair'}
                    />
                  </td>
                ))}
              </tr>
              
              {/* 5th SH CH */}
              <tr className="cfa-table-row bg-green-50">
                <td className="py-3 pl-4 font-semibold text-green-800">5th SH CH</td>
                {judges.map(judge => (
                  <td key={judge.id} className="py-2 px-2">
                    <input
                      type="text"
                      className="cfa-input w-20 text-sm text-center"
                      placeholder="Cat #"
                      disabled={judge.ringType === 'Longhair'}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 