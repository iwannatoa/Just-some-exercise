'use client';

import { useEffect, useRef } from 'react';
import { WorldMap, Country } from '@/lib/types/map';
import { TERRAIN_OUTLINES } from '@/lib/constants/terrain';

interface MapCanvasProps {
  worldMap: WorldMap;
  selectedCountry: string | null;
  hoveredCountry: string | null;
  onCountryClick: (countryName: string) => void;
  onCountryHover: (countryName: string | null) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  worldMap,
  selectedCountry,
  hoveredCountry,
  onCountryClick,
  onCountryHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCountry = (
    ctx: CanvasRenderingContext2D,
    country: Country,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    ctx.fillStyle = isHovered ? lightenColor(country.color, 20) : country.color;
    ctx.strokeStyle = TERRAIN_OUTLINES[country.terrain];
    ctx.lineWidth = isHovered ? 3 : 1;

    ctx.beginPath();
    ctx.moveTo(country.vertices[0].x, country.vertices[0].y);

    for (let i = 1; i < country.vertices.length; i++) {
      ctx.lineTo(country.vertices[i].x, country.vertices[i].y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawCountryConnections = (
    ctx: CanvasRenderingContext2D,
    worldMap: WorldMap
  ) => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    worldMap.countries.forEach((country) => {
      country.neighbors.forEach((neighborName) => {
        const neighbor = worldMap.countries.get(neighborName);
        if (neighbor) {
          ctx.beginPath();
          ctx.moveTo(country.position.x, country.position.y);
          ctx.lineTo(neighbor.position.x, neighbor.position.y);
          ctx.stroke();
        }
      });
    });

    ctx.setLineDash([]);
  };

  const drawCountryLabel = (
    ctx: CanvasRenderingContext2D,
    country: Country
  ) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    // Draw text with outline
    ctx.strokeText(country.name, country.position.x, country.position.y - 15);
    ctx.fillText(country.name, country.position.x, country.position.y - 15);

    // Draw terrain label
    ctx.font = '8px Arial';
    ctx.strokeText(country.terrain, country.position.x, country.position.y);
    ctx.fillText(country.terrain, country.position.x, country.position.y);
  };
  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !worldMap) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const countryName = getCountryAt(x, y, worldMap);
    onCountryHover(countryName);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !worldMap) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const countryName = getCountryAt(x, y, worldMap);
    if (countryName) {
      onCountryClick(countryName);
    }
  };

  const getCountryAt = (
    x: number,
    y: number,
    worldMap: WorldMap
  ): string | null => {
    for (const [name, country] of worldMap.countries) {
      if (isPointInPolygon(x, y, country.vertices)) {
        return name;
      }
    }
    return null;
  };

  const isPointInPolygon = (
    x: number,
    y: number,
    vertices: { x: number; y: number }[]
  ): boolean => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x,
        yi = vertices[i].y;
      const xj = vertices[j].x,
        yj = vertices[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = worldMap.width;
    canvas.height = worldMap.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw country connections first
    drawCountryConnections(ctx, worldMap);

    // Draw countries
    worldMap.countries.forEach((country, name) => {
      const isSelected = name === selectedCountry;
      const isHovered = name === hoveredCountry;
      drawCountry(ctx, country, isSelected, isHovered);
    });

    // Draw country labels
    worldMap.countries.forEach((country) => {
      drawCountryLabel(ctx, country);
    });
  }, [worldMap, selectedCountry, hoveredCountry]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => onCountryHover(null)}
      className='border-2 border-gray-300 rounded-lg shadow-lg'
      style={{ background: '#1a4b6d' }}
    />
  );
};

export default MapCanvas;
