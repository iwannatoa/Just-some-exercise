'use client';

interface MapControlsProps {
  countryCount: number;
  onCountryCountChange: (count: number) => void;
  mapWidth: number;
  onMapWidthChange: (width: number) => void;
  mapHeight: number;
  onMapHeightChange: (height: number) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  countryCount,
  onCountryCountChange,
  mapWidth,
  onMapWidthChange,
  mapHeight,
  onMapHeightChange,
  onGenerate,
  isLoading,
}) => {
  return (
    <div className='bg-white rounded-lg shadow-md p-6 border border-gray-200'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <label
              htmlFor='countryCount'
              className='text-sm font-medium text-gray-700'
            >
              Number of Countries:
            </label>
            <div className='flex items-center gap-2'>
              <input
                id='countryCount'
                type='range'
                min='5'
                max='50'
                value={countryCount}
                onChange={(e) => onCountryCountChange(parseInt(e.target.value))}
                className='w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <span className='w-12 text-center font-medium text-gray-900'>
                {countryCount}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className={`
                px-6 py-2 rounded-lg font-medium text-white transition-all duration-200
                ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'
                }
              `}
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Generating...
                </div>
              ) : (
                'Generate New World'
              )}
            </button>

            <button
              onClick={() => {
                onCountryCountChange(25);
                onMapWidthChange(400);
                onMapHeightChange(300);
              }}
              disabled={isLoading}
              className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50'
            >
              Reset
            </button>
          </div>
        </div>

        {/* Map Dimensions */}
        <div className='flex items-center gap-4 pt-2 border-t border-gray-200'>
          <label className='text-sm font-medium text-gray-700'>
            Map Dimensions:
          </label>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <label
                htmlFor='mapWidth'
                className='text-xs text-gray-600'
              >
                Width:
              </label>
              <input
                id='mapWidth'
                type='number'
                min='100'
                max='2000'
                step='50'
                value={mapWidth}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    onMapWidthChange(value);
                  }
                }}
                className='w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
              />
            </div>
            <div className='flex items-center gap-2'>
              <label
                htmlFor='mapHeight'
                className='text-xs text-gray-600'
              >
                Height:
              </label>
              <input
                id='mapHeight'
                type='number'
                min='100'
                max='2000'
                step='50'
                value={mapHeight}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    onMapHeightChange(value);
                  }
                }}
                className='w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>


      <div className='mt-4 text-xs text-gray-500 flex flex-wrap gap-4'>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 bg-blue-600 rounded'></div>
          <span>Click countries for details</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 bg-green-600 rounded'></div>
          <span>Hover to highlight</span>
        </div>
      </div>
    </div>
  );
};
export default MapControls;
