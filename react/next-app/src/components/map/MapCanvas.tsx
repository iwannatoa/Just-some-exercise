'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WorldMap, Country, Landmass } from '@/lib/types/map';
import { TERRAIN_COLORS, TERRAIN_OUTLINES } from '@/lib/constants/terrain';
import * as turf from '@turf/turf';
import Color from 'color';

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

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs for stable values
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Refs for throttling hover updates
  const hoverAnimationFrameRef = useRef<number | null>(null);
  const lastHoveredCountryRef = useRef<string | null>(null);

  // Ref for drawing animation frame
  const drawAnimationFrameRef = useRef<number | null>(null);

  // Use color library for color manipulation
  const lightenColor = useCallback(
    (color: string, percent: number): string =>
      Color(color)
        .lighten(percent / 100)
        .hex(),
    []
  );

  const darkenColor = useCallback(
    (color: string, percent: number): string =>
      Color(color)
        .darken(percent / 100)
        .hex(),
    []
  );

  const calculateLandmassShape = useCallback(
    (countries: Country[]): { x: number; y: number }[] => {
      const points = countries.flatMap((country) => country.vertices);

      if (points.length === 0) return [];
      if (points.length < 3) return points;

      // Convert to format expected by turf.js (FeatureCollection of Points)
      const turfPoints = turf.featureCollection(
        points.map((p) => turf.point([p.x, p.y]))
      );

      // Calculate maxEdge based on point distribution
      // Use a percentage of the bounding box diagonal as maxEdge
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const diagonal = Math.sqrt(
        Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)
      );
      const maxEdge = diagonal * 0.4; // 10% of diagonal as max edge length

      // Compute concave hull using turf.js
      const hull = turf.concave(turfPoints, {
        maxEdge: maxEdge,
        units: 'meters', // Units don't matter for pixel coordinates, but required
      });

      if (!hull || !hull.geometry || hull.geometry.coordinates.length === 0) {
        // Fallback: return original points if hull computation fails
        return points;
      }

      // Extract coordinates from the hull polygon
      // turf.concave returns a Polygon, so we need to get the first ring (exterior ring)
      const coordinates = hull.geometry.coordinates[0];

      // Convert back to Point format (exclude the last point if it's a duplicate of the first)
      const hullPoints: { x: number; y: number }[] = coordinates.map(
        (coord) => {
          const [x, y] = coord as [number, number];
          return { x, y };
        }
      );

      // Remove duplicate last point if it matches the first (closed polygon)
      if (
        hullPoints.length > 1 &&
        hullPoints[0].x === hullPoints[hullPoints.length - 1].x &&
        hullPoints[0].y === hullPoints[hullPoints.length - 1].y
      ) {
        hullPoints.pop();
      }

      return hullPoints.length >= 3 ? hullPoints : points;
    },
    []
  );

  // 根据高度计算颜色（从深绿到浅绿/棕色，表示从低到高）
  const getElevationColor = useCallback(
    (avgElevation: number, threshold: number = 0): string => {
      // 计算相对于阈值的高度差
      const elevationDiff = avgElevation - threshold;

      // 归一化高度（假设高度范围在0-3000之间）
      const normalized = Math.max(0, Math.min(1, elevationDiff / 2000));

      // 从深绿色（低海拔）到浅绿色/棕色（高海拔）
      // 低海拔：深绿色 rgb(34, 139, 34)
      // 中海拔：浅绿色 rgb(144, 238, 144)
      // 高海拔：棕色 rgb(139, 90, 43)

      if (normalized < 0.33) {
        // 低海拔：深绿色
        const t = normalized / 0.33;
        const r = Math.round(34 + (100 - 34) * t);
        const g = Math.round(139 + (180 - 139) * t);
        const b = Math.round(34 + (100 - 34) * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (normalized < 0.66) {
        // 中海拔：浅绿色到黄绿色
        const t = (normalized - 0.33) / 0.33;
        const r = Math.round(100 + (180 - 100) * t);
        const g = Math.round(180 + (200 - 180) * t);
        const b = Math.round(100 + (100 - 100) * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // 高海拔：黄绿色到棕色
        const t = (normalized - 0.66) / 0.34;
        const r = Math.round(180 + (139 - 180) * t);
        const g = Math.round(200 + (90 - 200) * t);
        const b = Math.round(100 + (43 - 100) * t);
        return `rgb(${r}, ${g}, ${b})`;
      }
    },
    []
  );

  const drawLandmassBackgrounds = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      worldMap: WorldMap,
      currentScale: number = 1,
      currentPan: { x: number; y: number } = { x: 0, y: 0 }
    ): void => {
      // 如果有elevationMap，使用像素级绘制显示高度分布
      if (worldMap.elevationMap && worldMap.elevationThreshold !== undefined) {
        const elevationMap = worldMap.elevationMap;
        const threshold = worldMap.elevationThreshold;
        const mapWidth = worldMap.width;
        const mapHeight = worldMap.height;
        const canvas = ctx.canvas;

        // 计算可见区域（世界坐标）
        const toWorldX = (canvasX: number) =>
          (canvasX - currentPan.x) / currentScale;
        const toWorldY = (canvasY: number) =>
          (canvasY - currentPan.y) / currentScale;
        const padding = 10 / currentScale;
        const visibleMinX = Math.max(0, Math.floor(toWorldX(0) - padding));
        const visibleMaxX = Math.min(
          mapWidth,
          Math.ceil(toWorldX(canvas.width) + padding)
        );
        const visibleMinY = Math.max(0, Math.floor(toWorldY(0) - padding));
        const visibleMaxY = Math.min(
          mapHeight,
          Math.ceil(toWorldY(canvas.height) + padding)
        );

        // 根据scale动态调整绘制精度和块大小
        const minStep = 1;
        const maxStep = Math.min(20, Math.ceil(mapWidth / 50));

        let step = 1;
        if (currentScale < 2) {
          step = Math.ceil(2 / currentScale);
          step = Math.max(minStep, Math.min(maxStep, step));
        }

        // 当step=1时，使用ImageData批量绘制以提高性能
        if (step === 1) {
          // 计算可见区域大小（世界坐标）
          const visibleWidth = visibleMaxX - visibleMinX;
          const visibleHeight = visibleMaxY - visibleMinY;

          // 计算canvas坐标中的尺寸（考虑scale）
          const canvasWidth = Math.ceil(visibleWidth * currentScale);
          const canvasHeight = Math.ceil(visibleHeight * currentScale);

          // 创建ImageData（使用canvas坐标尺寸）
          const imageData = ctx.createImageData(canvasWidth, canvasHeight);
          const data = imageData.data;
          const oceanColor = { r: 26, g: 75, b: 109 };

          // 统计绘制的块数量
          let blockCount = 0;
          let landBlockCount = 0;

          // 遍历可见区域（世界坐标），但写入ImageData时使用canvas坐标索引
          for (let worldY = visibleMinY; worldY < visibleMaxY; worldY++) {
            for (let worldX = visibleMinX; worldX < visibleMaxX; worldX++) {
              blockCount++;
              const elevation = elevationMap[worldY]?.[worldX] || 0;

              // 计算在canvas坐标中的位置
              const canvasX = Math.floor((worldX - visibleMinX) * currentScale);
              const canvasY = Math.floor((worldY - visibleMinY) * currentScale);

              // 为每个canvas像素填充颜色（因为scale可能>1，一个世界坐标点对应多个canvas像素）
              const pixelSize = Math.ceil(currentScale);
              for (
                let dy = 0;
                dy < pixelSize && canvasY + dy < canvasHeight;
                dy++
              ) {
                for (
                  let dx = 0;
                  dx < pixelSize && canvasX + dx < canvasWidth;
                  dx++
                ) {
                  const finalCanvasX = canvasX + dx;
                  const finalCanvasY = canvasY + dy;
                  const index = (finalCanvasY * canvasWidth + finalCanvasX) * 4;

                  if (elevation > threshold) {
                    // 陆地：根据高度计算颜色
                    const color = getElevationColor(elevation, threshold);
                    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (match) {
                      data[index] = parseInt(match[1]);
                      data[index + 1] = parseInt(match[2]);
                      data[index + 2] = parseInt(match[3]);
                      data[index + 3] = 255;
                    } else {
                      data[index] = 34;
                      data[index + 1] = 139;
                      data[index + 2] = 34;
                      data[index + 3] = 255;
                    }
                    landBlockCount++;
                  } else {
                    // 海洋：深蓝色
                    data[index] = oceanColor.r;
                    data[index + 1] = oceanColor.g;
                    data[index + 2] = oceanColor.b;
                    data[index + 3] = 255;
                  }
                }
              }
            }
          }

          // 一次性绘制ImageData（非常高效）
          // 注意：putImageData会忽略当前的transform，直接使用canvas坐标
          // 所以我们需要将世界坐标转换为canvas坐标
          // canvasX = worldX * scale + pan.x
          const canvasMinX = visibleMinX * currentScale + currentPan.x;
          const canvasMinY = visibleMinY * currentScale + currentPan.y;
          ctx.putImageData(imageData, canvasMinX, canvasMinY);
        } else {
          // 当step > 1时，使用fillRect绘制（因为块较大，数量较少）
          const blockSize = step;
          let blockCount = 0;
          let landBlockCount = 0;

          // 只遍历可见区域
          for (let y = visibleMinY; y < visibleMaxY; y += step) {
            for (let x = visibleMinX; x < visibleMaxX; x += step) {
              blockCount++;
              // 计算当前块周围区域的平均高度
              let sumElevation = 0;
              let count = 0;
              const sampleRadius = Math.max(1, Math.floor(step / 2));

              // 在块周围采样多个点计算平均高度
              for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
                for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                  const sampleX = x + dx;
                  const sampleY = y + dy;
                  if (
                    sampleX >= 0 &&
                    sampleX < mapWidth &&
                    sampleY >= 0 &&
                    sampleY < mapHeight
                  ) {
                    const elevation = elevationMap[sampleY]?.[sampleX] || 0;
                    sumElevation += elevation;
                    count++;
                  }
                }
              }

              const avgElevation = count > 0 ? sumElevation / count : 0;

              if (avgElevation > threshold) {
                const color = getElevationColor(avgElevation, threshold);
                ctx.fillStyle = color;
                ctx.fillRect(x, y, blockSize, blockSize);
                landBlockCount++;
              }
            }
          }
        }

        // 绘制大陆边界（只在scale较大时绘制，避免性能问题）
        if (
          worldMap.landmasses &&
          worldMap.landmasses.length > 0 &&
          currentScale > 0.5
        ) {
          worldMap.landmasses.forEach((landmass: Landmass) => {
            if (landmass.vertices.length < 3) return;

            // 简化边界绘制：如果顶点太多，进行简化
            let verticesToDraw = landmass.vertices;
            if (landmass.vertices.length > 200) {
              // 对于很大的边界，只绘制每N个点
              const skip = Math.floor(landmass.vertices.length / 200);
              verticesToDraw = landmass.vertices.filter(
                (_, i) => i % skip === 0
              );
            }

            // Use subtle dark color for boundaries
            ctx.strokeStyle = '#2d5016'; // Dark green, more subtle
            ctx.lineWidth = Math.max(1, 1.5 / currentScale); // Thinner lines, minimum 1px
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.moveTo(verticesToDraw[0].x, verticesToDraw[0].y);
            for (let i = 1; i < verticesToDraw.length; i++) {
              ctx.lineTo(verticesToDraw[i].x, verticesToDraw[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            // Reset shadow
            ctx.shadowBlur = 0;

            // 绘制 boundaryPoints（用于调试）
            // boundaryPoints 现在是二维数组：第一个是外圈，其余是内圈
            if (landmass.boundaryPoints && landmass.boundaryPoints.length > 0) {
              // Draw each ring separately - each ring must be completely independent
              landmass.boundaryPoints.forEach((ring, ringIndex) => {
                if (ring.length === 0) return;

                // Draw each boundary point as a small circle
                ctx.fillStyle = '#ff0000'; // Red color for boundary points
                ring.forEach((point) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 2 / currentScale, 0, Math.PI * 2);
                  ctx.fill();
                });

                // Draw lines connecting boundary points in this ring
                // Each ring must start a new path and close it completely
                if (ring.length > 1) {
                  ctx.strokeStyle = ringIndex === 0 ? '#ff0000' : '#ff6666'; // Different color for interior rings
                  ctx.lineWidth = 0.5 / currentScale;

                  // Start a completely new path for this ring
                  ctx.beginPath();
                  ctx.moveTo(ring[0].x, ring[0].y);

                  // Draw all points in the ring
                  for (let i = 1; i < ring.length; i++) {
                    ctx.lineTo(ring[i].x, ring[i].y);
                  }

                  // Close the ring explicitly
                  ctx.closePath();

                  // Stroke and finish this path completely
                  ctx.stroke();
                }
              });
            }
          });
        }
        return;
      }

      // 如果没有elevationMap，使用原来的方法（基于平均高度）
      if (worldMap.landmasses && worldMap.landmasses.length > 0) {
        console.log(
          'Drawing landmasses (fallback):',
          worldMap.landmasses.length
        );
        worldMap.landmasses.forEach((landmass: Landmass, index: number) => {
          if (landmass.vertices.length < 3) {
            console.warn(
              `Landmass ${index} has less than 3 vertices:`,
              landmass.vertices.length
            );
            return;
          }

          // 根据平均高度计算颜色
          const threshold = landmass.elevationThreshold || 0;
          const avgElevation = landmass.avgElevation || threshold;
          const color = getElevationColor(avgElevation, threshold);

          ctx.fillStyle = color;
          // Use subtle dark color for boundaries
          ctx.strokeStyle = '#2d5016';
          ctx.lineWidth = 1.5; // Thinner lines
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 1;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          ctx.beginPath();
          ctx.moveTo(landmass.vertices[0].x, landmass.vertices[0].y);

          for (let i = 1; i < landmass.vertices.length; i++) {
            ctx.lineTo(landmass.vertices[i].x, landmass.vertices[i].y);
          }

          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Reset shadow
          ctx.shadowBlur = 0;

          // 绘制 boundaryPoints（用于调试）
          // boundaryPoints 现在是二维数组：第一个是外圈，其余是内圈
          if (landmass.boundaryPoints && landmass.boundaryPoints.length > 0) {
            // Draw each ring separately - each ring must be completely independent
            landmass.boundaryPoints.forEach((ring, ringIndex) => {
              if (ring.length === 0) return;

              // Draw each boundary point as a small circle
              ctx.fillStyle = '#ff0000'; // Red color for boundary points
              ring.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
              });

              // Draw lines connecting boundary points in this ring
              // Each ring must start a new path and close it completely
              if (ring.length > 1) {
                ctx.strokeStyle = ringIndex === 0 ? '#ff0000' : '#ff6666'; // Different color for interior rings
                ctx.lineWidth = 0.5;

                // Start a completely new path for this ring
                ctx.beginPath();
                ctx.moveTo(ring[0].x, ring[0].y);

                // Draw all points in the ring
                for (let i = 1; i < ring.length; i++) {
                  ctx.lineTo(ring[i].x, ring[i].y);
                }

                // Close the ring explicitly
                ctx.closePath();

                // Stroke and finish this path completely
                ctx.stroke();
              }
            });
          }
        });
        return;
      } else {
        console.warn('No landmasses found in worldMap:', {
          hasLandmasses: !!worldMap.landmasses,
          landmassesLength: worldMap.landmasses?.length || 0,
          countriesCount: worldMap.countries.size,
        });
      }

      // 如果没有landmasses，使用原来的方法（基于countries）
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
        // Use subtle dark color for boundaries
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 1.5; // Thinner lines
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.moveTo(landmassVertices[0].x, landmassVertices[0].y);

        for (let i = 1; i < landmassVertices.length; i++) {
          ctx.lineTo(landmassVertices[i].x, landmassVertices[i].y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Reset shadow
        ctx.shadowBlur = 0;
      });
    },
    [calculateLandmassShape, darkenColor, getElevationColor]
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

      // Use curves for smoother borders
      if (country.vertices.length >= 3) {
        const first = country.vertices[0];
        ctx.moveTo(first.x, first.y);

        // Draw smooth curves between vertices
        for (let i = 0; i < country.vertices.length; i++) {
          const current = country.vertices[i];
          const next = country.vertices[(i + 1) % country.vertices.length];
          const afterNext = country.vertices[(i + 2) % country.vertices.length];

          // Calculate control point for smooth curve
          const controlX = (current.x + next.x) / 2;
          const controlY = (current.y + next.y) / 2;

          // Use quadratic curve for smooth transitions
          if (i === 0) {
            ctx.lineTo(controlX, controlY);
          } else {
            ctx.quadraticCurveTo(current.x, current.y, controlX, controlY);
          }
        }

        // Close the path smoothly
        const last = country.vertices[country.vertices.length - 1];
        const controlX = (last.x + first.x) / 2;
        const controlY = (last.y + first.y) / 2;
        ctx.quadraticCurveTo(last.x, last.y, controlX, controlY);
        ctx.quadraticCurveTo(first.x, first.y, first.x, first.y);
      } else {
        // Fallback to simple polygon for very small polygons
        ctx.moveTo(country.vertices[0].x, country.vertices[0].y);
        for (let i = 1; i < country.vertices.length; i++) {
          ctx.lineTo(country.vertices[i].x, country.vertices[i].y);
        }
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

  // Calculate world bounds from all countries or landmasses
  const calculateWorldBounds = useCallback((worldMap: WorldMap) => {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    // 如果有landmasses，从landmasses计算边界
    if (worldMap.landmasses && worldMap.landmasses.length > 0) {
      worldMap.landmasses.forEach((landmass) => {
        landmass.vertices.forEach((vertex) => {
          minX = Math.min(minX, vertex.x);
          maxX = Math.max(maxX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxY = Math.max(maxY, vertex.y);
        });
      });
    } else {
      // 否则从countries计算边界
      worldMap.countries.forEach((country) => {
        country.vertices.forEach((vertex) => {
          minX = Math.min(minX, vertex.x);
          maxX = Math.max(maxX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxY = Math.max(maxY, vertex.y);
        });
      });
    }

    // 如果没有找到任何边界，使用默认值
    if (minX === Infinity) {
      minX = 0;
      maxX = worldMap.width || 800;
      minY = 0;
      maxY = worldMap.height || 600;
    }

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }, []);

  // Initialize scale and pan on world map change
  useEffect(() => {
    if (!worldMap) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    // Helper function to initialize canvas
    // Note: This function needs access to drawLandmassBackgrounds, drawCountry, etc.
    // These are defined in the component scope, so they're accessible here
    const initializeCanvas = (
      canvas: HTMLCanvasElement,
      container: HTMLElement,
      worldMap: WorldMap
    ) => {
      // Set canvas size to match container size
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Use the entire world map dimensions for initial view
      const mapWidth = worldMap.width;
      const mapHeight = worldMap.height;

      // Calculate initial scale to fit entire map in container
      const scaleX = container.clientWidth / mapWidth;
      const scaleY = container.clientHeight / mapHeight;
      const initialScale = Math.min(scaleX, scaleY) * 0.95;

      // Center the entire map (starting from 0,0)
      const initialPanX = (container.clientWidth - mapWidth * initialScale) / 2;
      const initialPanY =
        (container.clientHeight - mapHeight * initialScale) / 2;

      // Update refs first (for immediate use in drawing)
      scaleRef.current = initialScale;
      offsetRef.current = { x: initialPanX, y: initialPanY };

      // Then update state (which will trigger re-render and drawing)
      setScale(initialScale);
      setPan({ x: initialPanX, y: initialPanY });
    };

    // Ensure container has valid dimensions before proceeding
    // If container size is 0, wait for next frame
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      // Use requestAnimationFrame to wait for layout
      requestAnimationFrame(() => {
        if (!canvas || !container) return;
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          // Try one more time
          requestAnimationFrame(() => {
            if (!canvas || !container) return;
            if (container.clientWidth === 0 || container.clientHeight === 0)
              return;
            initializeCanvas(canvas, container, worldMap);
          });
          return;
        }
        initializeCanvas(canvas, container, worldMap);
      });
      return;
    }

    // Container has valid dimensions, proceed immediately
    initializeCanvas(canvas, container, worldMap);
  }, [worldMap]);

  // Initialize canvas size immediately on mount
  // This ensures canvas has fixed dimensions as soon as component loads
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    // Set canvas size immediately
    const setCanvasSize = () => {
      if (!canvas || !container) return;

      // Use getBoundingClientRect for more reliable size
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      } else {
        // Fallback to clientWidth/clientHeight
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }
    };

    // Try immediately
    setCanvasSize();

    // If size is 0, wait for next frame
    if (canvas.width === 0 || canvas.height === 0) {
      requestAnimationFrame(() => {
        setCanvasSize();
        // Try one more time if still 0
        if (canvas.width === 0 || canvas.height === 0) {
          requestAnimationFrame(setCanvasSize);
        }
      });
    }

    // Handle container resize (only for window resize, not initial load)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && canvas) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Empty deps - only run on mount

  // Drawing function that will be called by requestAnimationFrame
  const performDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size should match container size (set in initialization/resize effects)
    // Only update if container has valid dimensions and canvas size doesn't match
    const container = canvas.parentElement;
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
      if (
        canvas.width !== container.clientWidth ||
        canvas.height !== container.clientHeight
      ) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }

    // Get current values from refs (for consistency during animation)
    const currentScale = scaleRef.current;
    const currentPan = offsetRef.current;

    // Clear canvas (before transform)
    ctx.fillStyle = '#1a4b6d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save state and apply transformations FIRST
    ctx.save();
    ctx.translate(currentPan.x, currentPan.y);
    ctx.scale(currentScale, currentScale);

    // Draw map elements
    drawLandmassBackgrounds(ctx, worldMap, currentScale, currentPan);

    // 只有在有国家时才绘制国家和连接（国家生成被注释时跳过）
    if (worldMap.countries.size > 0) {
      drawCountryConnections(ctx, worldMap);

      worldMap.countries.forEach((country, name) => {
        const isSelected = name === selectedCountry;
        const isHovered = name === hoveredCountry;
        drawCountry(ctx, country, isSelected, isHovered);
      });

      worldMap.countries.forEach((country) => {
        drawCountryLabel(ctx, country, selectedCountry, hoveredCountry);
      });
    }

    // Restore state
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

  // Use requestAnimationFrame to control drawing frequency
  useEffect(() => {
    if (!worldMap) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    // Cancel any pending draw
    if (drawAnimationFrameRef.current !== null) {
      cancelAnimationFrame(drawAnimationFrameRef.current);
    }

    // Update refs immediately for consistency
    scaleRef.current = scale;
    offsetRef.current = pan;

    // Ensure canvas has valid size before drawing
    // This is critical for first render when canvas size might be 0
    const ensureCanvasSizeAndDraw = () => {
      if (!canvas || !container) return;

      // Wait for container to have valid size
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        requestAnimationFrame(ensureCanvasSizeAndDraw);
        return;
      }

      // Ensure canvas size matches container
      if (
        canvas.width !== container.clientWidth ||
        canvas.height !== container.clientHeight
      ) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      // Now perform the draw
      performDraw();
      drawAnimationFrameRef.current = null;
    };

    // Schedule draw with size check
    // Use double RAF to ensure layout is complete, especially on first render
    drawAnimationFrameRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(ensureCanvasSizeAndDraw);
    });

    // Cleanup: cancel animation frame on unmount or dependency change
    return () => {
      if (drawAnimationFrameRef.current !== null) {
        cancelAnimationFrame(drawAnimationFrameRef.current);
        drawAnimationFrameRef.current = null;
      }
    };
  }, [worldMap, selectedCountry, hoveredCountry, scale, pan, performDraw]);

  // Cleanup: restore scroll and cancel animation frames when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';

      // Cancel any pending animation frames
      if (drawAnimationFrameRef.current !== null) {
        cancelAnimationFrame(drawAnimationFrameRef.current);
        drawAnimationFrameRef.current = null;
      }

      if (hoverAnimationFrameRef.current !== null) {
        cancelAnimationFrame(hoverAnimationFrameRef.current);
        hoverAnimationFrameRef.current = null;
      }
    };
  }, []);

  // Handle mouse wheel zoom using native event listener (non-passive)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      if (!worldMap) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Zoom factor
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const currentScale = scaleRef.current;
      const currentPan = offsetRef.current;
      const newScale = Math.max(0.1, Math.min(10, currentScale * zoomFactor));

      // Zoom towards mouse position
      const worldX = (mouseX - currentPan.x) / currentScale;
      const worldY = (mouseY - currentPan.y) / currentScale;

      const newPanX = mouseX - worldX * newScale;
      const newPanY = mouseY - worldY * newScale;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    };

    // Add event listener with { passive: false } to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [worldMap]);

  // Prevent page scroll when mouse enters canvas
  const handleMouseEnter = useCallback(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  // Restore page scroll when mouse leaves canvas
  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      document.body.style.overflow = '';
      setIsDragging(false);

      // Cancel any pending hover update
      if (hoverAnimationFrameRef.current !== null) {
        cancelAnimationFrame(hoverAnimationFrameRef.current);
        hoverAnimationFrameRef.current = null;
      }

      lastHoveredCountryRef.current = null;
      onCountryHover(null);
    },
    [onCountryHover]
  );

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      if (event.button !== 0) return; // Only left mouse button
      setIsDragging(true);
      setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    },
    [pan]
  );

  // Handle mouse move for dragging and hovering
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas || !worldMap) return;

      if (isDragging) {
        // Pan the map - update immediately for smooth dragging
        setPan({
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y,
        });
      } else {
        // Check for country hover - throttle updates using requestAnimationFrame
        const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);
        const currentPan = offsetRef.current;
        const currentScale = scaleRef.current;
        const mapX = (x - currentPan.x) / currentScale;
        const mapY = (y - currentPan.y) / currentScale;
        const countryName = getCountryAt(mapX, mapY, worldMap);

        // Only update if the country changed
        if (countryName !== lastHoveredCountryRef.current) {
          lastHoveredCountryRef.current = countryName;

          // Cancel any pending hover update
          if (hoverAnimationFrameRef.current !== null) {
            cancelAnimationFrame(hoverAnimationFrameRef.current);
          }

          // Schedule hover update for next frame
          hoverAnimationFrameRef.current = requestAnimationFrame(() => {
            onCountryHover(countryName);
            hoverAnimationFrameRef.current = null;
          });
        }
      }
    },
    [
      worldMap,
      isDragging,
      dragStart,
      getCountryAt,
      onCountryHover,
      getCanvasCoordinates,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  // Handle click
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      if (isDragging) return; // Don't click if we were dragging

      const canvas = canvasRef.current;
      if (!canvas || !worldMap) return;

      const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);
      const mapX = (x - pan.x) / scale;
      const mapY = (y - pan.y) / scale;
      const countryName = getCountryAt(mapX, mapY, worldMap);
      if (countryName) {
        onCountryClick(countryName);
      }
    },
    [
      worldMap,
      isDragging,
      pan,
      scale,
      getCountryAt,
      onCountryClick,
      getCanvasCoordinates,
    ]
  );

  return (
    <div
      className='relative w-full'
      style={{ minHeight: '600px', height: '600px' }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`border-2 border-gray-300 rounded-lg shadow-lg w-full h-full ${
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{ background: '#1a4b6d', touchAction: 'none' }}
      />
      {/* Zoom controls */}
      <div className='absolute top-4 right-4 flex flex-col gap-2'>
        <button
          onClick={() => {
            const newScale = Math.min(10, scale * 1.2);
            setScale(newScale);
          }}
          className='bg-white/90 hover:bg-white px-3 py-2 rounded shadow-md text-gray-700 font-bold'
          title='Zoom In'
        >
          +
        </button>
        <button
          onClick={() => {
            const newScale = Math.max(0.1, scale * 0.8);
            setScale(newScale);
          }}
          className='bg-white/90 hover:bg-white px-3 py-2 rounded shadow-md text-gray-700 font-bold'
          title='Zoom Out'
        >
          −
        </button>
        <button
          onClick={() => {
            if (!worldMap) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const container = canvas.parentElement;
            if (!container) return;

            // Use the entire world map dimensions for reset view
            const mapWidth = worldMap.width;
            const mapHeight = worldMap.height;

            const scaleX = container.clientWidth / mapWidth;
            const scaleY = container.clientHeight / mapHeight;
            const initialScale = Math.min(scaleX, scaleY) * 0.95;
            const initialPanX =
              (container.clientWidth - mapWidth * initialScale) / 2;
            const initialPanY =
              (container.clientHeight - mapHeight * initialScale) / 2;

            setScale(initialScale);
            setPan({ x: initialPanX, y: initialPanY });
            scaleRef.current = initialScale;
            offsetRef.current = { x: initialPanX, y: initialPanY };
          }}
          className='bg-white/90 hover:bg-white px-3 py-2 rounded shadow-md text-gray-700 text-xs'
          title='Reset View'
        >
          ⌂
        </button>
      </div>
    </div>
  );
};
