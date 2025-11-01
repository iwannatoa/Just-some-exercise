'use client';

import { Country } from '@/lib/types/map';
import { TERRAIN_COLORS } from '@/lib/constants/terrain';

interface CountryInfoProps {
  country: Country;
}

export const CountryInfo: React.FC<CountryInfoProps> = ({ country }) => {
  const density = Math.round(country.population / country.area);

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
      {/* Header with terrain color */}
      <div
        className='h-2 w-full'
        style={{ backgroundColor: country.color }}
      />

      <div className='p-6'>
        {/* Country Name */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold text-gray-900'>{country.name}</h2>
          <span
            className='px-3 py-1 text-xs font-medium rounded-full text-white'
            style={{ backgroundColor: TERRAIN_COLORS[country.terrain] }}
          >
            {country.terrain}
          </span>
        </div>

        {/* Statistics Grid */}
        <div className='grid grid-cols-2 gap-4 mb-6'>
          <div className='bg-blue-50 rounded-lg p-3'>
            <div className='text-xs text-blue-600 font-medium uppercase tracking-wide'>
              Population
            </div>
            <div className='text-lg font-bold text-blue-900'>
              {country.population.toLocaleString()}
            </div>
          </div>

          <div className='bg-green-50 rounded-lg p-3'>
            <div className='text-xs text-green-600 font-medium uppercase tracking-wide'>
              Area
            </div>
            <div className='text-lg font-bold text-green-900'>
              {country.area.toLocaleString()} km²
            </div>
          </div>

          <div className='bg-purple-50 rounded-lg p-3'>
            <div className='text-xs text-purple-600 font-medium uppercase tracking-wide'>
              Density
            </div>
            <div className='text-lg font-bold text-purple-900'>
              {density.toLocaleString()}/km²
            </div>
          </div>

          <div className='bg-orange-50 rounded-lg p-3'>
            <div className='text-xs text-orange-600 font-medium uppercase tracking-wide'>
              Neighbors
            </div>
            <div className='text-lg font-bold text-orange-900'>
              {country.neighbors.length}
            </div>
          </div>
        </div>

        {/* Neighbors List */}
        {country.neighbors.length > 0 && (
          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-2'>
              Bordering Countries
            </h3>
            <div className='flex flex-wrap gap-2'>
              {country.neighbors.map((neighbor) => (
                <span
                  key={neighbor}
                  className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium'
                >
                  {neighbor}
                </span>
              ))}
            </div>
          </div>
        )}

        {country.neighbors.length === 0 && (
          <div className='text-center py-4 text-gray-500'>
            <p>This country has no neighboring countries.</p>
            <p className='text-sm mt-1'>It might be an island nation!</p>
          </div>
        )}
      </div>

      {/* Additional Info Footer */}
      <div className='bg-gray-50 px-6 py-3 border-t border-gray-200'>
        <div className='flex justify-between items-center text-xs text-gray-500'>
          <span>Terrain: {country.terrain}</span>
          <span>
            Position: ({Math.round(country.position.x)},{' '}
            {Math.round(country.position.y)})
          </span>
        </div>
      </div>
    </div>
  );
};
export default CountryInfo;
