'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WorldMap, Country } from '@/lib/types/map';
import { TERRAIN_COLORS, TERRAIN_OUTLINES } from '@/lib/constants/terrain';

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

  // 添加缩放和偏移状态
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const lightenColor = useCallback((color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);

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
  }, []);

  const darkenColor = useCallback((color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);

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
  }, []);

  const crossProduct = useCallback(
    (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number }
    ): number => {
      return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    },
    []
  );

  const calculateLandmassShape = useCallback(
    (countries: Country[]): { x: number; y: number }[] => {
      const points = countries.flatMap((country) => country.vertices);

      if (points.length === 0) return [];

      let startPoint = points[0];
      points.forEach((point) => {
        if (
          point.y < startPoint.y ||
          (point.y === startPoint.y && point.x < startPoint.x)
        ) {
          startPoint = point;
        }
      });

      const sortedPoints = [...points].sort((a, b) => {
        const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
        const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
        return angleA - angleB;
      });

      const hull: { x: number; y: number }[] = [startPoint, sortedPoints[0]];

      for (let i = 1; i < sortedPoints.length; i++) {
        while (
          hull.length >= 2 &&
          crossProduct(
            hull[hull.length - 2],
            hull[hull.length - 1],
            sortedPoints[i]
          ) <= 0
        ) {
          hull.pop();
        }
        hull.push(sortedPoints[i]);
      }

      return hull;
    },
    [crossProduct]
  );

  const drawLandmassBackgrounds = useCallback(
    (ctx: CanvasRenderingContext2D, worldMap: WorldMap): void => {
      const terrainGroups = new Map<string, Country[]>();

      worldMap.countries.forEach((country) => {
        if (!terrainGroups.has(country.terrain)) {
          terrainGroups.set(country.terrain, []);
        }
        terrainGroups.get(country.terrain)!.push(country);
      });

      terrainGroups.forEach((countries, terrain) => {
        if (countries.length === 0) return;

        const landmassVertices = calculateLandmassShape(countries);

        ctx.fillStyle = darkenColor(TERRAIN_COLORS[terrain], 20);
        ctx.strokeStyle = TERRAIN_OUTLINES[terrain];
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(landmassVertices[0].x, landmassVertices[0].y);

        for (let i = 1; i < landmassVertices.length; i++) {
          ctx.lineTo(landmassVertices[i].x, landmassVertices[i].y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    },
    [calculateLandmassShape, darkenColor]
  );

  const drawCountry = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      country: Country,
      isSelected: boolean,
      isHovered: boolean
    ): void => {
      ctx.fillStyle = isHovered
        ? lightenColor(country.color, 20)
        : country.color;
      ctx.strokeStyle = isSelected
        ? '#ffffff'
        : TERRAIN_OUTLINES[country.terrain];
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.moveTo(country.vertices[0].x, country.vertices[0].y);

      for (let i = 1; i < country.vertices.length; i++) {
        ctx.lineTo(country.vertices[i].x, country.vertices[i].y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    [lightenColor]
  );

  const drawCountryConnections = useCallback(
    (ctx: CanvasRenderingContext2D, worldMap: WorldMap): void => {
      ctx.strokeStyle = '#2a5b7d';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

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
    },
    []
  );

  const drawCountryLabel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      country: Country,
      selectedCountry: string | null,
      hoveredCountry: string | null
    ): void => {
      const shouldShowLabel =
        country.area > 80000 ||
        country.name === selectedCountry ||
        country.name === hoveredCountry;

      if (!shouldShowLabel) return;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font =
        country.name === selectedCountry ? 'bold 11px Arial' : '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeText(country.name, country.position.x, country.position.y);
      ctx.fillText(country.name, country.position.x, country.position.y);

      if (country.name === selectedCountry) {
        ctx.font = '9px Arial';
        ctx.strokeText(
          country.terrain,
          country.position.x,
          country.position.y + 12
        );
        ctx.fillText(
          country.terrain,
          country.position.x,
          country.position.y + 12
        );
      }
    },
    []
  );

  const isPointInPolygon = useCallback(
    (x: number, y: number, vertices: { x: number; y: number }[]): boolean => {
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
    },
    []
  );

  // 修复：添加坐标转换函数
  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const getCountryAt = useCallback(
    (x: number, y: number, worldMap: WorldMap): string | null => {
      const countries = Array.from(worldMap.countries.entries()).reverse();

      for (const [name, country] of countries) {
        if (isPointInPolygon(x, y, country.vertices)) {
          return name;
        }
      }
      return null;
    },
    [isPointInPolygon]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸为容器尺寸，而不是地图原始尺寸
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // 计算缩放比例以适应容器
    const scaleX = canvas.width / worldMap.width;
    const scaleY = canvas.height / worldMap.height;
    scaleRef.current = Math.min(scaleX, scaleY);

    // 计算居中偏移
    offsetRef.current = {
      x: (canvas.width - worldMap.width * scaleRef.current) / 2,
      y: (canvas.height - worldMap.height * scaleRef.current) / 2,
    };

    // 清除画布
    ctx.fillStyle = '#1a4b6d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 保存当前状态并应用变换
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    // 绘制地图元素
    drawLandmassBackgrounds(ctx, worldMap);
    drawCountryConnections(ctx, worldMap);

    worldMap.countries.forEach((country, name) => {
      const isSelected = name === selectedCountry;
      const isHovered = name === hoveredCountry;
      drawCountry(ctx, country, isSelected, isHovered);
    });

    worldMap.countries.forEach((country) => {
      drawCountryLabel(ctx, country, selectedCountry, hoveredCountry);
    });

    // 恢复状态
    ctx.restore();
  }, [
    worldMap,
    selectedCountry,
    hoveredCountry,
    drawLandmassBackgrounds,
    drawCountryConnections,
    drawCountry,
    drawCountryLabel,
  ]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas || !worldMap) return;

      // 使用修复后的坐标转换
      const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);

      // 转换为地图坐标
      const mapX = (x - offsetRef.current.x) / scaleRef.current;
      const mapY = (y - offsetRef.current.y) / scaleRef.current;

      const countryName = getCountryAt(mapX, mapY, worldMap);
      onCountryHover(countryName);
    },
    [worldMap, getCountryAt, onCountryHover, getCanvasCoordinates]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas || !worldMap) return;

      // 使用修复后的坐标转换
      const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);

      // 转换为地图坐标
      const mapX = (x - offsetRef.current.x) / scaleRef.current;
      const mapY = (y - offsetRef.current.y) / scaleRef.current;

      const countryName = getCountryAt(mapX, mapY, worldMap);
      if (countryName) {
        onCountryClick(countryName);
      }
    },
    [worldMap, getCountryAt, onCountryClick, getCanvasCoordinates]
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => onCountryHover(null)}
      className='border-2 border-gray-300 rounded-lg shadow-lg w-full h-full cursor-pointer'
      style={{ background: '#1a4b6d' }}
    />
  );
};
