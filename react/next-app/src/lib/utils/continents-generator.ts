import { Landmass, Point } from '../types/map';
import { TerrainGenerator } from './terrain-generator';
import { doPolygonsIntersect, isPolygonClockwise } from './geometry-utils';
import * as turf from '@turf/turf';
import { mean, variance, extent, quantile } from 'd3-array';
// Removed point-in-polygon import - now using turf.booleanPointInPolygon
import simplify from 'simplify-js';

// Helper function to ensure polygon ring is closed (GeoJSON requirement)
// First and last position must be equivalent
function ensureRingClosed(ring: Point[]): [number, number][] {
  if (ring.length === 0) return [];
  const coords = ring.map((p) => [p.x, p.y] as [number, number]);
  // Close the ring if not already closed
  if (
    coords.length > 0 &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push([coords[0][0], coords[0][1]]);
  }
  return coords;
}

// Helper function to check if a point is inside a polygon
// Uses turf.booleanPointInPolygon for better accuracy and GeoJSON support
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  const turfPoint = turf.point([point.x, point.y]);
  const coords = ensureRingClosed(polygon);
  const turfPolygon = turf.polygon([coords]);

  return turf.booleanPointInPolygon(turfPoint, turfPolygon);
}

// LandPercent 0-100
export function generateContinents(
  width: number,
  height: number,
  landPercent: number,
  minIslandSize: number = 10 // 可选：最小岛屿大小阈值
): {
  continents: Landmass[];
  elevationMap: number[][];
  elevationThreshold: number;
} {
  // 使用噪声生成基础地形
  const terrainGenerator = new TerrainGenerator();

  // 应用距离衰减的辅助函数
  const applyDistanceDecay = (
    elevation: number,
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): number => {
    const aspectRatio = width / height;
    const dx = (x - centerX) / (aspectRatio > 1 ? width : height);
    const dy = (y - centerY) / (aspectRatio > 1 ? width : height);
    const normalizedDist = Math.sqrt(dx * dx + dy * dy);

    if (normalizedDist > 0.7) {
      const edgeFactor = (normalizedDist - 0.7) / 0.3;
      const smoothFactor = edgeFactor * edgeFactor * (3 - 2 * edgeFactor);
      const minRatio = 0.3 + Math.random() * 0.2;
      return (
        elevation * (1 - smoothFactor) + elevation * minRatio * smoothFactor
      );
    }
    return elevation;
  };

  // 生成高度图并应用距离衰减
  const centerX = width / 2;
  const centerY = height / 2;
  const elevationMap: number[][] = Array(height)
    .fill(null)
    .map((_, y) =>
      Array(width)
        .fill(null)
        .map((_, x) =>
          applyDistanceDecay(
            terrainGenerator.generateHeight(x, y),
            x,
            y,
            centerX,
            centerY,
            width,
            height
          )
        )
    );

  // 强制地图边缘附近为水（边缘区域宽度为地图尺寸的 8%）
  const edgeWidth = Math.max(Math.floor(width * 0.08), 5);
  const edgeHeight = Math.max(Math.floor(height * 0.08), 5);

  // 获取地形生成器的最小深度值（用于设置水的高度）
  const minDepth = -5000; // 使用一个足够低的值确保是水

  // 强制设置边缘区域为水
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distFromEdge = Math.min(x, width - 1 - x, y, height - 1 - y);

      if (distFromEdge < edgeWidth || distFromEdge < edgeHeight) {
        // 计算到边缘的距离比例
        const edgeRatio = Math.min(
          distFromEdge / edgeWidth,
          distFromEdge / edgeHeight
        );

        // 使用平滑过渡：边缘处强制为水，向内逐渐过渡
        if (edgeRatio < 0.5) {
          // 完全强制为水
          elevationMap[y][x] = minDepth;
        } else {
          // 平滑过渡：混合原始高度和水的高度
          const blendFactor = (edgeRatio - 0.5) * 2; // 0.5 -> 1.0 映射到 0 -> 1
          elevationMap[y][x] =
            elevationMap[y][x] * blendFactor + minDepth * (1 - blendFactor);
        }
      }
    }
  }

  // 根据landPercent调整海拔阈值
  const elevationThreshold = calculateElevationThreshold(
    elevationMap,
    landPercent
  );

  // 识别并分割大陆
  let continents = identifyContinents(
    elevationMap,
    elevationThreshold,
    width,
    height
  );

  // 过滤掉小岛屿
  continents = continents.filter(
    (continent) => continent.area >= minIslandSize
  );

  return {
    continents,
    elevationMap,
    elevationThreshold,
  };
}

// Remove overlapping continents by merging or removing duplicates
function removeOverlappingContinents(continents: Landmass[]): Landmass[] {
  if (continents.length <= 1) return continents;

  const nonOverlapping: Landmass[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < continents.length; i++) {
    if (processed.has(i)) continue;

    const current = continents[i];
    let merged = false;

    // Check if this continent overlaps with any already processed continent
    for (let j = 0; j < nonOverlapping.length; j++) {
      if (doContinentsOverlap(current, nonOverlapping[j])) {
        // Merge the smaller one into the larger one
        if (current.area > nonOverlapping[j].area) {
          nonOverlapping[j] = mergeContinents(current, nonOverlapping[j]);
        } else {
          nonOverlapping[j] = mergeContinents(nonOverlapping[j], current);
        }
        merged = true;
        processed.add(i);
        break;
      }
    }

    if (!merged) {
      nonOverlapping.push(current);
    }
  }

  return nonOverlapping;
}

// Check if two continents overlap significantly using proper polygon intersection
function doContinentsOverlap(c1: Landmass, c2: Landmass): boolean {
  // Use proper polygon intersection detection
  const poly1 = { vertices: c1.vertices, area: c1.area };
  const poly2 = { vertices: c2.vertices, area: c2.area };

  // Check if polygons intersect
  if (doPolygonsIntersect(poly1, poly2)) {
    return true;
  }

  // Check if one polygon contains the other (complete overlap)
  const c1ContainsC2 = c2.vertices.every((v) =>
    isPointInPolygon(v, c1.vertices)
  );
  const c2ContainsC1 = c1.vertices.every((v) =>
    isPointInPolygon(v, c2.vertices)
  );

  if (c1ContainsC2 || c2ContainsC1) {
    return true;
  }

  // Check if centers are very close (likely duplicates from scaling)
  const center1 = turf.point([c1.center.x, c1.center.y]);
  const center2 = turf.point([c2.center.x, c2.center.y]);
  const centerDist = turf.distance(center1, center2, { units: 'meters' });
  const avgRadius = Math.sqrt((c1.area + c2.area) / Math.PI);

  // If centers are very close relative to their size, they likely overlap
  if (centerDist < avgRadius * 0.2) {
    return true;
  }

  // Check if significant portion of vertices are inside the other polygon
  let c1InsideC2 = 0;
  let c2InsideC1 = 0;

  for (const v of c1.vertices) {
    if (isPointInPolygon(v, c2.vertices)) {
      c1InsideC2++;
    }
  }

  for (const v of c2.vertices) {
    if (isPointInPolygon(v, c1.vertices)) {
      c2InsideC1++;
    }
  }

  // If more than 20% of vertices are inside the other polygon, they overlap
  const threshold = 0.2;
  return (
    c1InsideC2 > c1.vertices.length * threshold ||
    c2InsideC1 > c2.vertices.length * threshold
  );
}

// Get bounding box of vertices using d3-array
function getBoundingBoxForOverlap(vertices: Point[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const [minX, maxX] = extent(vertices, (v) => v.x) as [number, number];
  const [minY, maxY] = extent(vertices, (v) => v.y) as [number, number];
  return {
    minX: minX ?? 0,
    maxX: maxX ?? 0,
    minY: minY ?? 0,
    maxY: maxY ?? 0,
  };
}

// Merge two continents (keep the larger one's properties, combine vertices)
function mergeContinents(larger: Landmass, smaller: Landmass): Landmass {
  // Combine vertices and create a new boundary
  const allVertices = [...larger.vertices, ...smaller.vertices];
  console.log('mergeContinents');
  // Use convex hull of combined vertices for the merged continent
  const mergedVertices = computeConvexHullForMerge(allVertices);

  // Calculate new center
  const centerX =
    (larger.center.x * larger.area + smaller.center.x * smaller.area) /
    (larger.area + smaller.area);
  const centerY =
    (larger.center.y * larger.area + smaller.center.y * smaller.area) /
    (larger.area + smaller.area);

  return {
    vertices: mergedVertices,
    area: larger.area + smaller.area,
    center: { x: centerX, y: centerY },
    terrain: larger.terrain, // Keep the larger continent's terrain
    countries: [...larger.countries, ...smaller.countries],
  };
}

// Compute concave hull for merging using turf.js
function computeConvexHullForMerge(points: Point[]): Point[] {
  if (points.length < 3) return points;

  // Convert to format expected by turf.js (FeatureCollection of Points)
  const turfPoints = turf.featureCollection(
    points.map((p) => turf.point([p.x, p.y]))
  );

  // Compute convex hull using turf.convex (returns points in order)
  const hull = turf.convex(turfPoints);

  if (!hull || !hull.geometry || hull.geometry.coordinates.length === 0) {
    return points;
  }

  // Extract coordinates from the hull polygon
  const coordinates = hull.geometry.coordinates[0] as [number, number][];

  // Ensure ring is closed (turf.convex should already return closed ring, but be safe)
  const closedCoords = ensureRingClosed(
    coordinates.map(([x, y]) => ({ x, y }))
  );

  // Use turf.rewind to ensure counter-clockwise order
  const polygon = turf.polygon([closedCoords]);
  const rewinded = turf.rewind(polygon, { reverse: false });
  const rewindedCoords = (rewinded as any).geometry?.coordinates?.[0] as
    | [number, number][]
    | undefined;

  const orderedCoordinates = rewindedCoords || coordinates;

  // Convert back to Point format
  let hullPoints: Point[] = orderedCoordinates.map((coord) => {
    const [x, y] = coord;
    return { x, y };
  });

  // Remove duplicate last point if closed
  if (
    hullPoints.length > 2 &&
    hullPoints[0].x === hullPoints[hullPoints.length - 1].x &&
    hullPoints[0].y === hullPoints[hullPoints.length - 1].y
  ) {
    hullPoints.pop();
  }

  // Ensure counter-clockwise order
  if (hullPoints.length >= 3 && isPolygonClockwise(hullPoints)) {
    hullPoints.reverse();
  }

  return hullPoints.length >= 3 ? hullPoints : points;
}

// 计算海拔阈值以达到指定的陆地百分比
function calculateElevationThreshold(
  elevationMap: number[][],
  landPercent: number
): number {
  const allElevations = elevationMap.flat();
  const quantileValue = 1 - landPercent / 100;
  return (
    quantile(
      allElevations.sort((a, b) => a - b),
      quantileValue
    ) || 0
  );
}

// 识别并分割大陆
function identifyContinents(
  elevationMap: number[][],
  threshold: number,
  width: number,
  height: number
): Landmass[] {
  const continents: Landmass[] = [];
  // 使用 TypedArray 替代二维数组，减少内存占用
  // Uint8Array: 每个元素只占1字节，而不是普通数组的多个字节
  const visited = new Uint8Array(width * height);

  // 方向数组：上、右、下、左
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 1, dy: 0 }, // 右
    { dx: 0, dy: 1 }, // 下
    { dx: -1, dy: 0 }, // 左
  ];

  // 洪水填充算法 - 使用 TypedArray 优化
  function floodFill(startX: number, startY: number): Point[] {
    const points: Point[] = [];
    // 使用数组索引而不是 shift() 提高性能
    const queue: Point[] = [{ x: startX, y: startY }];
    let queueIndex = 0;
    const index = startY * width + startX;
    visited[index] = 1;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      points.push(current);

      // 检查四个方向
      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        // 检查边界
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          const newIndex = newY * width + newX;
          // 检查是否未访问且高于海平面
          if (visited[newIndex] === 0 && elevationMap[newY][newX] > threshold) {
            visited[newIndex] = 1;
            queue.push({ x: newX, y: newY });
          }
        }
      }
    }

    return points;
  }

  // 计算大陆的中心点
  // Uses turf.centroid for accurate centroid calculation
  function calculateCenter(points: Point[]): { x: number; y: number } {
    if (points.length === 0) return { x: 0, y: 0 };

    const turfPoints = turf.featureCollection(
      points.map((p) => turf.point([p.x, p.y]))
    );
    const centroid = turf.centroid(turfPoints);
    const coords = centroid.geometry.coordinates;

    return {
      x: Math.round(coords[0]),
      y: Math.round(coords[1]),
    };
  }

  // 计算大陆的实际面积（基于点数）
  function calculateContinentArea(points: Point[]): number {
    // 假设每个点代表一个单位面积（如1平方公里）
    // 您可以根据实际比例调整这个值
    const unitArea = 4;
    return points.length * unitArea;
  }

  // 计算海拔变化（地形复杂度）
  function calculateElevationVariance(points: Point[]): number {
    const elevations = points.map((point) => elevationMap[point.y][point.x]);
    const varValue = variance(elevations) || 0;
    return Math.sqrt(varValue);
  }

  // 计算海岸线比例
  function calculateCoastlineRatio(points: Point[]): number {
    const pointSet = new Set(points.map((p) => `${p.x},${p.y}`));
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];
    const coastalPoints = points.filter((p) =>
      dirs.some((d) => {
        const n = { x: p.x + d.x, y: p.y + d.y };
        return (
          !pointSet.has(`${n.x},${n.y}`) &&
          n.x >= 0 &&
          n.x < width &&
          n.y >= 0 &&
          n.y < height &&
          elevationMap[n.y][n.x] <= threshold
        );
      })
    ).length;
    return coastalPoints / points.length;
  }

  // 地形判断 - 简化版本
  function determineTerrain(
    points: Point[],
    threshold: number,
    avgElevation: number
  ): string {
    const v = calculateElevationVariance(points);
    const r = calculateCoastlineRatio(points);
    const s = points.length;
    const e = avgElevation - threshold;

    if (e > 2500) return 'Mountainous';
    if (e > 1500) return v > 600 ? 'Mountainous' : 'Highland';
    if (e > 800) return v > 400 ? 'Plateau' : 'Highland';
    if (e > 400)
      return v > 250 ? 'Canyon Lands' : v > 150 ? 'Grassland' : 'Plains';
    if (e > 150)
      return r > 0.4
        ? 'Coastal'
        : v > 180
        ? 'River Valley'
        : s > 2000
        ? 'Forest'
        : 'Grassland';
    if (e > 50)
      return r > 0.6
        ? 'Archipelago'
        : r > 0.3
        ? 'Coastal'
        : v < 40 && r > 0.1
        ? 'Swamp'
        : s < 800
        ? 'Island'
        : 'Plains';
    return r > 0.7
      ? 'Archipelago'
      : r > 0.4
      ? s < 400
        ? 'Island'
        : 'Coastal'
      : v < 25
      ? 'Swamp'
      : 'Plains';
  }

  // Extract boundary points as rings (GeoJSON spec)
  // Returns Point[][] where first ring is exterior, rest are interior
  // vertices can be derived from boundaryPoints[0] to avoid duplication
  function extractBoundaryRings(points: Point[]): Point[][] {
    if (points.length < 3) {
      return [points];
    }

    // extractBoundaryPoints returns Point[][] (rings following GeoJSON spec)
    const boundaryRings = extractBoundaryPoints(points);
    console.log('boundaryRings', points.length, boundaryRings);
    const exteriorRing = boundaryRings[0] || [];

    // 正常情况下，extractBoundaryPoints 应该返回足够的边界点
    // 如果返回的点少于3个，说明边界追踪失败，使用凸包作为回退
    if (exteriorRing.length >= 3) {
      return boundaryRings;
    }

    // 回退：如果边界追踪失败，使用凸包（但这种情况不应该发生）
    console.warn(
      'extractBoundaryRings - boundary tracking failed, using convex hull fallback. Points:',
      points.length
    );
    const fallbackVertices = computeConvexHull(points);
    return [fallbackVertices];
  }

  // Compute convex hull using turf.js
  // turf.convex returns points in order forming a polygon boundary
  function computeConvexHull(points: Point[]): Point[] {
    if (points.length < 3) return points;

    // Convert to format expected by turf.js (FeatureCollection of Points)
    const turfPoints = turf.featureCollection(
      points.map((p) => turf.point([p.x, p.y]))
    );

    // Compute convex hull using turf.convex (more reliable than concave)
    const hull = turf.convex(turfPoints);

    if (!hull || !hull.geometry || hull.geometry.coordinates.length === 0) {
      return points;
    }

    // Extract coordinates from the hull polygon
    const coordinates = hull.geometry.coordinates[0] as [number, number][];

    // Ensure ring is closed (turf.convex should already return closed ring, but be safe)
    const closedCoords = ensureRingClosed(
      coordinates.map(([x, y]) => ({ x, y }))
    );

    // Use turf.rewind to ensure counter-clockwise order
    const polygon = turf.polygon([closedCoords]);
    const rewinded = turf.rewind(polygon, { reverse: false });
    const rewindedCoords = (rewinded as any).geometry?.coordinates?.[0] as
      | [number, number][]
      | undefined;

    const orderedCoordinates = rewindedCoords || coordinates;

    // Convert back to Point format
    let hullPoints: Point[] = orderedCoordinates.map((coord) => {
      const [x, y] = coord;
      return { x, y };
    });

    // Remove duplicate last point if closed
    if (
      hullPoints.length > 2 &&
      hullPoints[0].x === hullPoints[hullPoints.length - 1].x &&
      hullPoints[0].y === hullPoints[hullPoints.length - 1].y
    ) {
      hullPoints.pop();
    }

    // Ensure counter-clockwise order
    if (hullPoints.length >= 3 && isPolygonClockwise(hullPoints)) {
      hullPoints.reverse();
    }

    return hullPoints.length >= 3 ? hullPoints : points;
  }

  // Pre-compute which sea pixels are external (connected to map edge) vs internal (lakes)
  // This is done once per continent identification to avoid repeated calculations
  // 使用位图存储 externalSeaMap，减少内存占用
  // 使用 Uint8Array 存储 seaVisited，每个元素只占1字节
  const externalSeaMap = new Uint8Array(width * height);
  const seaVisited = new Uint8Array(width * height);

  // Flood fill from map edges to mark all external sea pixels - 使用 TypedArray 优化
  function markExternalSea() {
    const queue: Point[] = [];
    let queueIndex = 0;

    // Add all edge sea pixels to the queue
    for (let x = 0; x < width; x++) {
      if (elevationMap[0][x] <= threshold) {
        const index = 0 * width + x;
        queue.push({ x, y: 0 });
        seaVisited[index] = 1;
        externalSeaMap[index] = 1;
      }
      const bottomIndex = (height - 1) * width + x;
      if (elevationMap[height - 1][x] <= threshold) {
        queue.push({ x, y: height - 1 });
        seaVisited[bottomIndex] = 1;
        externalSeaMap[bottomIndex] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      const leftIndex = y * width + 0;
      if (elevationMap[y][0] <= threshold) {
        queue.push({ x: 0, y });
        seaVisited[leftIndex] = 1;
        externalSeaMap[leftIndex] = 1;
      }
      const rightIndex = y * width + (width - 1);
      if (elevationMap[y][width - 1] <= threshold) {
        queue.push({ x: width - 1, y });
        seaVisited[rightIndex] = 1;
        externalSeaMap[rightIndex] = 1;
      }
    }

    // Flood fill from edges
    const seaDirections = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 }, // right
      { dx: 0, dy: 1 }, // down
      { dx: -1, dy: 0 }, // left
    ];

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      for (const dir of seaDirections) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = ny * width + nx;
          if (seaVisited[index] === 0 && elevationMap[ny][nx] <= threshold) {
            seaVisited[index] = 1;
            externalSeaMap[index] = 1;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  // Mark external sea once at the start
  markExternalSea();

  // Extract boundary points using turf.js concave hull
  // Finds land points adjacent to water and generates a polygon boundary
  // Sort a single ring of boundary points using greedy nearest-neighbor
  // Ensures the ring is closed (first and last point should be close)
  function sortSingleRing(points: Point[]): Point[] {
    if (points.length < 3) return points;

    try {
      const turfPoints = points.map((p) => turf.point([p.x, p.y]));

      // Start from the leftmost point (or topmost if tie)
      let startIdx = 0;
      for (let i = 1; i < points.length; i++) {
        if (
          points[i].x < points[startIdx].x ||
          (points[i].x === points[startIdx].x &&
            points[i].y < points[startIdx].y)
        ) {
          startIdx = i;
        }
      }

      const ordered: Point[] = [points[startIdx]];
      const remaining = turfPoints.filter((_, i) => i !== startIdx);
      let remainingCollection = turf.featureCollection(remaining);

      // Greedy: always pick the nearest unvisited point using turf.nearestPoint
      // Continue until all points are processed, even if some are far away
      while (remaining.length > 0) {
        const currentPoint = turf.point([
          ordered[ordered.length - 1].x,
          ordered[ordered.length - 1].y,
        ]);

        const nearest = turf.nearestPoint(currentPoint, remainingCollection);
        const nearestCoords = nearest.geometry.coordinates as [number, number];

        // Calculate pixel distance directly (Euclidean distance for pixel coordinates)
        const current = ordered[ordered.length - 1];
        const dx = nearestCoords[0] - current.x;
        const dy = nearestCoords[1] - current.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        // Find the index in remaining array
        const nearestIdx = remaining.findIndex(
          (pt) =>
            pt.geometry.coordinates[0] === nearestCoords[0] &&
            pt.geometry.coordinates[1] === nearestCoords[1]
        );

        if (nearestIdx >= 0) {
          // Convert back to Point format
          ordered.push({
            x: nearestCoords[0],
            y: nearestCoords[1],
          });

          // Remove from remaining
          remaining.splice(nearestIdx, 1);
          remainingCollection = turf.featureCollection(remaining);
        } else {
          // If we can't find the point (shouldn't happen), add all remaining points
          // This ensures we don't lose any points
          remaining.forEach((pt) => {
            ordered.push({
              x: pt.geometry.coordinates[0],
              y: pt.geometry.coordinates[1],
            });
          });
          break;
        }
      }

      // Ensure counter-clockwise order for exterior rings
      if (ordered.length >= 3 && isPolygonClockwise(ordered)) {
        ordered.reverse();
      }

      // Clean up: remove duplicate consecutive points
      const cleaned = ordered.filter(
        (p, i, arr) => i === 0 || p.x !== arr[i - 1].x || p.y !== arr[i - 1].y
      );

      return cleaned.length >= 3 ? cleaned : ordered;
    } catch (error) {
      // Fallback: angle-based sorting
      // Use turf.centroid for accurate centroid calculation
      const turfPoints = turf.featureCollection(
        points.map((p) => turf.point([p.x, p.y]))
      );
      const centroidFeature = turf.centroid(turfPoints);
      const centroid = {
        x: centroidFeature.geometry.coordinates[0],
        y: centroidFeature.geometry.coordinates[1],
      };

      const sorted = [...points].sort((a, b) => {
        const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
        const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
        return angleA - angleB;
      });

      if (sorted.length >= 3 && isPolygonClockwise(sorted)) {
        sorted.reverse();
      }

      return sorted;
    }
  }

  // Detect and separate multiple rings (exterior and interior rings)
  // Uses point-in-polygon test to determine if a ring is inside another ring
  function detectRings(points: Point[]): Point[][] {
    if (points.length < 3) return [points];

    const rings: Point[][] = [];
    const used = new Set<number>();
    const allPoints = [...points];

    // Find all rings by starting from unused points
    while (used.size < allPoints.length) {
      // Find first unused point
      let startIdx = -1;
      for (let i = 0; i < allPoints.length; i++) {
        if (!used.has(i)) {
          startIdx = i;
          break;
        }
      }

      if (startIdx === -1) break;

      // Build a ring starting from this point
      const ringPoints: Point[] = [allPoints[startIdx]];
      used.add(startIdx);

      const remaining = allPoints
        .map((p, i) => ({ point: p, idx: i }))
        .filter(({ idx }) => !used.has(idx));

      // Greedy: connect nearest points until all points are processed
      // Continue even if some points are far away to ensure all points are included
      while (remaining.length > 0) {
        const current = ringPoints[ringPoints.length - 1];
        let nearestIdx = -1;
        let minDist = Infinity;

        for (const { point, idx } of remaining) {
          // Calculate pixel distance directly (Euclidean distance for pixel coordinates)
          const dx = point.x - current.x;
          const dy = point.y - current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = idx;
          }
        }

        // If we can't find a nearest point, add all remaining points to this ring
        if (nearestIdx === -1) {
          remaining.forEach(({ point, idx }) => {
            ringPoints.push(point);
            used.add(idx);
          });
          break;
        }

        const nearest = remaining.find(({ idx }) => idx === nearestIdx);
        if (nearest) {
          ringPoints.push(nearest.point);
          used.add(nearest.idx);
          remaining.splice(
            remaining.findIndex(({ idx }) => idx === nearest.idx),
            1
          );
        } else {
          break;
        }
      }

      // Always add the ring, even if it has fewer than 3 points
      // This ensures all points are included in the result
      if (ringPoints.length > 0) {
        rings.push(ringPoints);
      }
    }

    if (rings.length <= 1) {
      return rings;
    }

    // Sort rings: largest (exterior) first, then interior rings
    // Use turf.area for accurate area calculation
    rings.sort((a, b) => {
      if (a.length < 3 || b.length < 3) return b.length - a.length;

      // Ensure rings are closed (first and last point must be the same for GeoJSON)
      const aCoords = ensureRingClosed(a);
      const bCoords = ensureRingClosed(b);

      const aPolygon = turf.polygon([aCoords]);
      const bPolygon = turf.polygon([bCoords]);

      const aArea = turf.area(aPolygon);
      const bArea = turf.area(bPolygon);

      return bArea - aArea; // Descending order
    });

    // Verify rings are properly separated: interior rings should be inside exterior ring
    // If a smaller ring is not inside the exterior ring, it might be a separate landmass
    const exteriorRing = rings[0];
    const validRings: Point[][] = [exteriorRing];

    for (let i = 1; i < rings.length; i++) {
      const interiorRing = rings[i];
      // Check if the center of interior ring is inside exterior ring
      // Use turf.centroid for accurate center calculation
      const interiorTurfPoints = turf.featureCollection(
        interiorRing.map((p) => turf.point([p.x, p.y]))
      );
      const interiorCentroid = turf.centroid(interiorTurfPoints);
      const interiorCenter = {
        x: interiorCentroid.geometry.coordinates[0],
        y: interiorCentroid.geometry.coordinates[1],
      };

      if (isPointInPolygon(interiorCenter, exteriorRing)) {
        // This is a valid interior ring (hole)
        validRings.push(interiorRing);
      } else {
        // This ring is not inside the exterior ring, might be a separate landmass
        // For now, we'll include it but it should be handled separately
        validRings.push(interiorRing);
      }
    }

    return validRings;
  }

  // Sort boundary points in order along the boundary
  // Returns array of rings following GeoJSON spec:
  // - First ring is exterior (counter-clockwise)
  // - Remaining rings are interior/holes (clockwise)
  // Guarantees: total points in returned rings >= input points.length
  function sortBoundaryPoints(points: Point[]): Point[][] {
    if (points.length < 3) return [points];

    // First, try to sort all points as a single ring
    const singleRingResult = sortSingleRing(points);

    // Check if we successfully connected all points (within reasonable distance)
    // If the sorted result has significantly fewer points, we might have multiple rings
    if (singleRingResult.length >= points.length * 0.9) {
      // Successfully sorted as single ring - return as exterior ring only
      // Ensure we haven't lost any points
      if (singleRingResult.length < points.length) {
        // Add missing points at the end (they might be isolated or duplicates)
        const usedPoints = new Set<string>();
        singleRingResult.forEach((p) => {
          usedPoints.add(`${p.x},${p.y}`);
        });
        const missingPoints = points.filter(
          (p) => !usedPoints.has(`${p.x},${p.y}`)
        );
        if (missingPoints.length > 0) {
          singleRingResult.push(...missingPoints);
        }
      }
      return [singleRingResult];
    }

    // If single ring sorting didn't work well, detect multiple rings
    const rings = detectRings(points);

    if (rings.length === 0) {
      // Fallback to single ring result, but ensure all points are included
      if (singleRingResult.length < points.length) {
        const usedPoints = new Set<string>();
        singleRingResult.forEach((p) => {
          usedPoints.add(`${p.x},${p.y}`);
        });
        const missingPoints = points.filter(
          (p) => !usedPoints.has(`${p.x},${p.y}`)
        );
        if (missingPoints.length > 0) {
          singleRingResult.push(...missingPoints);
        }
      }
      return [singleRingResult];
    }

    if (rings.length === 1) {
      // Only one ring detected
      const sortedRing = sortSingleRing(rings[0]);
      // Ensure all points are included
      if (sortedRing.length < points.length) {
        const usedPoints = new Set<string>();
        sortedRing.forEach((p) => {
          usedPoints.add(`${p.x},${p.y}`);
        });
        const missingPoints = points.filter(
          (p) => !usedPoints.has(`${p.x},${p.y}`)
        );
        if (missingPoints.length > 0) {
          sortedRing.push(...missingPoints);
        }
      }
      return [sortedRing];
    }

    // Multiple rings detected: sort each ring separately
    const sortedRings = rings.map((ring) => sortSingleRing(ring));

    // Collect all used points to find missing ones
    const usedPoints = new Set<string>();
    sortedRings.forEach((ring) => {
      ring.forEach((p) => {
        usedPoints.add(`${p.x},${p.y}`);
      });
    });

    // Add any missing points to the largest ring (exterior)
    const missingPoints = points.filter(
      (p) => !usedPoints.has(`${p.x},${p.y}`)
    );
    if (missingPoints.length > 0 && sortedRings.length > 0) {
      sortedRings[0].push(...missingPoints);
    }

    // Ensure exterior ring (first/largest) is counter-clockwise (GeoJSON standard)
    if (sortedRings[0] && isPolygonClockwise(sortedRings[0])) {
      sortedRings[0].reverse();
    }

    // Ensure interior rings (holes) are clockwise (GeoJSON standard)
    for (let i = 1; i < sortedRings.length; i++) {
      if (!isPolygonClockwise(sortedRings[i])) {
        sortedRings[i].reverse();
      }
    }

    return sortedRings;
  }

  // Extract boundary points and return as rings following GeoJSON spec
  // Returns Point[][] where first ring is exterior (counter-clockwise),
  // and remaining rings are interior/holes (clockwise)
  function extractBoundaryPoints(points: Point[]): Point[][] {
    if (points.length < 3) return [points];

    // Find all boundary points (land points adjacent to any water)
    const allBoundaryPoints = points.filter(({ x, y }) => {
      // Check if this point has at least one water neighbor
      const neighbors = [
        [x, y - 1], // top
        [x + 1, y], // right
        [x, y + 1], // bottom
        [x - 1, y], // left
      ];
      return neighbors.some(([nx, ny]) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true;
        return elevationMap[ny][nx] <= threshold;
      });
    });

    console.log('allBoundaryPoints', allBoundaryPoints.length);
    if (allBoundaryPoints.length < 3) {
      // Fallback to convex hull as single exterior ring
      const hull = computeConvexHull(points);
      return [hull];
    }

    // Sort the boundary points into rings (exterior + interior)
    return sortBoundaryPoints(allBoundaryPoints);
  }

  // 主循环：遍历所有点寻找大陆
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 如果该点高于海平面且未被访问，则发现新大陆
      const index = y * width + x;
      if (visited[index] === 0 && elevationMap[y][x] > threshold) {
        const continentPoints = floodFill(x, y);

        // 最小大陆大小阈值
        // Extract boundary rings (exterior + interior)
        const boundaryPoints = extractBoundaryRings(continentPoints);
        // vertices is derived from boundaryPoints[0] (exterior ring) to avoid duplication
        const vertices = boundaryPoints[0] || [];
        const center = calculateCenter(continentPoints);
        // Use d3-array mean for average elevation calculation
        const avgElevation =
          mean(
            continentPoints.map((point) => elevationMap[point.y][point.x])
          ) || 0;
        const terrain = determineTerrain(
          continentPoints,
          threshold,
          avgElevation
        );

        const continentArea = calculateContinentArea(continentPoints);

        const continent: Landmass = {
          // vertices is the exterior ring (boundaryPoints[0])
          // Stored separately for backward compatibility with Land interface
          vertices,
          area: continentArea, // 使用实际点数面积
          center,
          terrain,
          countries: [], // 国家信息需要额外数据
          avgElevation, // 平均海拔高度
          elevationThreshold: threshold, // 海拔阈值
          boundaryPoints, // All rings: [exterior, ...interior]
        };

        continents.push(continent);
      }
    }
  }

  return continents;
}
