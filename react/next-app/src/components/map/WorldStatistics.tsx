'use client';

interface WorldStatistics {
  totalCountries: number;
  totalPopulation: number;
  totalArea: number;
  averageDensity: number;
  mostCommonTerrain: string;
}

interface WorldStatisticsProps {
  statistics: WorldStatistics;
}

export const WorldStatistics: React.FC<WorldStatisticsProps> = ({
  statistics,
}) => {
  const {
    totalCountries,
    totalPopulation,
    totalArea,
    averageDensity,
    mostCommonTerrain,
  } = statistics;

  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-4'>
        <h2 className='text-xl font-bold text-white text-center'>
          World Statistics
        </h2>
      </div>

      <div className='p-6 space-y-6'>
        {/* Main Statistics Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-600'>
              {totalCountries}
            </div>
            <div className='text-sm text-gray-600 mt-1'>Countries</div>
          </div>

          <div className='text-center'>
            <div className='text-3xl font-bold text-green-600'>
              {formatLargeNumber(totalPopulation)}
            </div>
            <div className='text-sm text-gray-600 mt-1'>Total Population</div>
          </div>

          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-600'>
              {formatLargeNumber(totalArea)}
            </div>
            <div className='text-sm text-gray-600 mt-1'>Total Area (km²)</div>
          </div>

          <div className='text-center'>
            <div className='text-3xl font-bold text-orange-600'>
              {Math.round(averageDensity)}
            </div>
            <div className='text-sm text-gray-600 mt-1'>Avg. Density</div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className='space-y-3'>
          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
            <span className='text-sm font-medium text-gray-600'>
              Total Population:
            </span>
            <span className='font-semibold'>
              {totalPopulation.toLocaleString()}
            </span>
          </div>

          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
            <span className='text-sm font-medium text-gray-600'>
              Total Area:
            </span>
            <span className='font-semibold'>
              {totalArea.toLocaleString()} km²
            </span>
          </div>

          <div className='flex justify-between items-center py-2 border-b border-gray-100'>
            <span className='text-sm font-medium text-gray-600'>
              Average Density:
            </span>
            <span className='font-semibold'>
              {averageDensity.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}{' '}
              people/km²
            </span>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm font-medium text-gray-600'>
              Most Common Terrain:
            </span>
            <span className='font-semibold text-green-600'>
              {mostCommonTerrain}
            </span>
          </div>
        </div>

        {/* Quick Facts */}
        <div className='bg-blue-50 rounded-lg p-4'>
          <h3 className='text-sm font-semibold text-blue-800 mb-2'>
            Quick Facts
          </h3>
          <ul className='text-xs text-blue-700 space-y-1'>
            <li>
              • {Math.round(totalPopulation / totalCountries).toLocaleString()}{' '}
              average population per country
            </li>
            <li>
              • {Math.round(totalArea / totalCountries).toLocaleString()} km²
              average area per country
            </li>
            <li>
              • World is {((totalArea / 510_000_000) * 100).toFixed(1)}% of
              Earth&lsquo;s surface
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
        <div className='text-xs text-gray-500 text-center'>
          Generated on {new Date().toLocaleDateString()} at{' '}
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
export default WorldStatistics;
