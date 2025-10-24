'use client';

import { useState, useCallback } from 'react';
import { WorldMap, Country } from '@/lib/types/map';
import { WorldGenerator } from '@/lib/utils/world-generator';

export const useWorldMap = () => {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateWorld = useCallback(async (countryCount: number = 25) => {
    setIsLoading(true);

    // Simulate async operation (could be actual API call in future)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const generator = new WorldGenerator();
    const newWorld = generator.generateWorld(countryCount);

    setWorldMap(newWorld);
    setSelectedCountry(null);
    setIsLoading(false);

    return newWorld;
  }, []);

  const selectCountry = useCallback(
    (countryName: string) => {
      if (worldMap) {
        const country = worldMap.countries.get(countryName);
        setSelectedCountry(country || null);
      }
    },
    [worldMap]
  );

  const getWorldStatistics = useCallback(() => {
    if (!worldMap) return null;

    const countries = Array.from(worldMap.countries.values());
    const totalCountries = countries.length;
    const totalPopulation = countries.reduce(
      (sum, country) => sum + country.population,
      0
    );
    const totalArea = countries.reduce((sum, country) => sum + country.area, 0);
    const averageDensity = totalPopulation / totalArea;

    const terrainCounts: { [key: string]: number } = {};
    countries.forEach((country) => {
      terrainCounts[country.terrain] =
        (terrainCounts[country.terrain] || 0) + 1;
    });

    const mostCommonTerrain = Object.entries(terrainCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    return {
      totalCountries,
      totalPopulation,
      totalArea,
      averageDensity,
      mostCommonTerrain,
    };
  }, [worldMap]);

  return {
    worldMap,
    selectedCountry,
    isLoading,
    generateWorld,
    selectCountry,
    getWorldStatistics,
  };
};
