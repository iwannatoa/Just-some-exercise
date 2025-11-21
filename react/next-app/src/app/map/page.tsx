'use client';

import { useState } from 'react';
import { useWorldMap } from '@/hooks/useWorldMap';
import { MapCanvas } from '@/components/map/MapCanvas';
import { MapControls } from '@/components/map/MapControls';
import { CountryInfo } from '@/components/map/CountryInfo';
import { WorldStatistics } from '@/components/map/WorldStatistics';
import { TerrainLegend } from '@/components/map/TerrainLegend';

export default function MapPage() {
  const {
    worldMap,
    selectedCountry,
    isLoading,
    generateWorld,
    selectCountry,
    getWorldStatistics,
  } = useWorldMap();

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [countryCount, setCountryCount] = useState(25);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const handleGenerateWorld = async () => {
    await generateWorld(countryCount);
  };

  const statistics = getWorldStatistics();

  return (
    <div className='container relative mx-auto p-4 space-y-6 min-h-screen'>
      <h1 className='text-3xl font-bold text-center text-gray-900'>
        World Map Generator
      </h1>

      <MapControls
        countryCount={countryCount}
        onCountryCountChange={setCountryCount}
        onGenerate={handleGenerateWorld}
        isLoading={isLoading}
      />

      {/* Terrain Legend */}
      <TerrainLegend
        isOpen={isLegendOpen}
        onToggle={() => setIsLegendOpen(!isLegendOpen)}
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          {worldMap ? (
            <MapCanvas
              worldMap={worldMap}
              selectedCountry={selectedCountry?.name || null}
              hoveredCountry={hoveredCountry}
              onCountryClick={selectCountry}
              onCountryHover={setHoveredCountry}
            />
          ) : (
            <div className='flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300'>
              <div className='text-center'>
                <p className='text-gray-500 text-lg mb-2'>
                  No world generated yet
                </p>
                <p className='text-gray-400 text-sm'>
                  Click &quot;Generate World&quot; to create your first map
                </p>
              </div>
            </div>
          )}
        </div>

        <div className='space-y-4'>
          {statistics && <WorldStatistics statistics={statistics} />}
          {selectedCountry && <CountryInfo country={selectedCountry} />}
          {!selectedCountry && statistics && (
            <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 text-lg'>💡</span>
                </div>
                <div>
                  <p className='text-blue-800 font-medium'>
                    Click on any country
                  </p>
                  <p className='text-blue-600 text-sm'>
                    Select a country on the map to see detailed information
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
