'use client';

import { TERRAIN_COLORS, TERRAIN_OUTLINES } from '@/lib/constants/terrain';

interface TerrainLegendProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const TerrainLegend: React.FC<TerrainLegendProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <div className='absolute top-4 right-4 z-50'>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className='bg-white shadow-lg rounded-lg px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-2 flex items-center gap-2'
      >
        <span>Terrain Legend</span>
        <span
          className={`transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* Legend Panel */}
      {isOpen && (
        <div className='bg-white shadow-xl rounded-lg p-4 max-w-xs max-h-96 overflow-y-auto'>
          <h3 className='font-bold text-gray-800 mb-3'>Terrain Types</h3>
          <div className='space-y-2'>
            {Object.entries(TERRAIN_COLORS).map(([terrain, color]) => (
              <div
                key={terrain}
                className='flex items-center gap-3 py-1'
              >
                <div
                  className='w-6 h-6 rounded border-2 flex-shrink-0'
                  style={{
                    backgroundColor: color,
                    borderColor: TERRAIN_OUTLINES[terrain],
                  }}
                />
                <span className='text-sm text-gray-700'>{terrain}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default TerrainLegend;
