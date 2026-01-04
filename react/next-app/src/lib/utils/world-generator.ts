import { Country, Landmass, Point, WorldMap } from '@/lib/types/map';
import { TERRAIN_COLORS } from '@/lib/constants/terrain';
import {
  generateCountryName,
  generatePopulation,
  randomInt,
} from './common-generator';
import { generateContinents } from './continents-generator';
import { Delaunay } from 'd3-delaunay';
import * as martinez from 'martinez-polygon-clipping';
import * as turf from '@turf/turf';
// @ts-ignore - point-in-polygon doesn't have types
import pointInPolygon from 'point-in-polygon';
import simplify from 'simplify-js';

export class WorldGenerator {
  private countries: Map<string, Country> = new Map();
  private landmasses: Landmass[] = [];
  private width: number;
  private height: number;

  constructor(width: number = 800, height: number = 600) {
    this.width = width;
    this.height = height;
  }

  generateWorld(numCountries: number = 25): WorldMap {
    this.countries.clear();
    this.landmasses = [];

    // 1. 生成大陆
    const continentResult = generateContinents(this.width, this.height, 50);
    this.landmasses = continentResult.continents;
    console.log('Landmass count:', this.landmasses.length);

    // 2. 在大陆上生成国家 - 暂时注释掉以调试大陆生成
    // this.generateCountriesOnLandmasses(numCountries);

    // 3. 建立邻国关系 - 暂时注释掉
    // this.assignNeighbors();

    return {
      countries: this.countries,
      landmasses: this.landmasses, // 包含大陆信息用于调试和显示
      elevationMap: continentResult.elevationMap, // 高度图
      elevationThreshold: continentResult.elevationThreshold, // 海拔阈值
      width: this.width,
      height: this.height,
    };
  }

  private generateCountriesOnLandmasses(totalCountries: number): void {
    // 按大陆面积分配国家数量
    const countriesPerLandmass = this.distributeCountries(totalCountries);

    this.landmasses.forEach((landmass, index) => {
      const numCountries = countriesPerLandmass[index];
      this.divideLandmassIntoCountries(landmass, numCountries);
    });
  }

  private distributeCountries(totalCountries: number): number[] {
    const areas = this.landmasses.map((landmass) =>
      this.calculateArea(landmass.vertices)
    );
    const totalArea = areas.reduce((sum, area) => sum + area, 0);

    return areas.map((area) => {
      const ratio = area / totalArea;
      return Math.max(1, Math.floor(totalCountries * ratio));
    });
  }

  private calculateArea(vertices: Point[]): number {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area) / 2;
  }

  private divideLandmassIntoCountries(
    landmass: Landmass,
    numCountries: number
  ): void {
    if (numCountries <= 0 || !landmass.vertices || landmass.vertices.length < 3)
      return;

    // 生成更好的种子点
    const points = this.generateOptimizedPointsInLandmass(
      landmass,
      numCountries
    );

    if (points.length === 0) {
      // If no points generated, create a single country for the entire landmass
      const name = generateCountryName();
      const population = generatePopulation();
      const area = this.calculateArea(landmass.vertices);
      const centroid = this.calculatePolygonCentroid(landmass.vertices);

      const country: Country = {
        name,
        terrain: landmass.terrain,
        population,
        area,
        neighbors: [],
        color: TERRAIN_COLORS[landmass.terrain] || '#7CB368',
        position: centroid,
        vertices: landmass.vertices,
      };

      this.countries.set(name, country);
      landmass.countries.push(name);
      return;
    }

    // 使用真正的沃罗诺伊分割
    const polygons = this.createVoronoiDiagram(landmass, points);

    // Debug: log polygon count
    if (polygons.length === 0) {
      console.warn(
        'Voronoi diagram created no polygons for',
        points.length,
        'points'
      );
    }

    // 清理和优化多边形
    let cleanedPolygons = this.cleanAndOptimizePolygons(polygons, landmass);

    // Debug: log cleaned polygon count
    if (cleanedPolygons.length === 0 && polygons.length > 0) {
      console.warn('All polygons were filtered out during cleaning');
    }

    // Fill any gaps by creating additional polygons for uncovered areas
    // Only fill gaps if we have some polygons already
    if (cleanedPolygons.length > 0) {
      cleanedPolygons = this.fillGapsInLandmass(
        cleanedPolygons,
        landmass,
        points
      );
    }

    // Ensure we have the right number of countries
    if (cleanedPolygons.length === 0) {
      // If no valid polygons, create a single country
      cleanedPolygons = [this.fixPolygonOrder(landmass.vertices)];
    } else if (cleanedPolygons.length < numCountries && points.length > 0) {
      // If we have fewer countries than requested, try to split the largest ones
      while (cleanedPolygons.length < numCountries) {
        cleanedPolygons.sort(
          (a, b) => this.calculateArea(b) - this.calculateArea(a)
        );
        const largest = cleanedPolygons[0];
        if (
          this.calculateArea(largest) >
          (this.calculateArea(landmass.vertices) / numCountries) * 1.5
        ) {
          // Split the largest polygon
          const split = this.splitPolygon(largest, landmass);
          if (split.length >= 2) {
            cleanedPolygons = [...cleanedPolygons.slice(1), ...split];
          } else {
            break; // Can't split further
          }
        } else {
          break; // All polygons are small enough
        }
      }
    }

    // Limit to requested number of countries
    if (cleanedPolygons.length > numCountries) {
      // Sort by area and keep the largest ones
      cleanedPolygons.sort(
        (a, b) => this.calculateArea(b) - this.calculateArea(a)
      );
      cleanedPolygons = cleanedPolygons.slice(0, numCountries);
    }

    // Final pass: ensure all polygons fill the landmass completely
    cleanedPolygons = this.ensureCompleteCoverage(cleanedPolygons, landmass);

    cleanedPolygons.forEach((polygon) => {
      if (polygon.length < 3) return; // 跳过无效多边形

      // Ensure polygon is properly ordered
      const orderedPolygon = this.fixPolygonOrder(polygon);

      // Add more vertices for smoother curves (but limit to reasonable number)
      const curvedPolygon = this.addCurveVertices(orderedPolygon);

      // Limit vertices to prevent excessive points
      const finalPolygon =
        curvedPolygon.length > 100
          ? this.reducePolygonVertices(curvedPolygon, 100)
          : curvedPolygon;

      const name = generateCountryName();
      const population = generatePopulation();
      const area = this.calculateArea(finalPolygon);

      // 计算多边形质心
      const centroid = this.calculatePolygonCentroid(finalPolygon);

      const country: Country = {
        name,
        terrain: landmass.terrain,
        population,
        area,
        neighbors: [],
        color: TERRAIN_COLORS[landmass.terrain] || '#7CB368',
        position: centroid,
        vertices: finalPolygon,
      };

      this.countries.set(name, country);
      landmass.countries.push(name);
    });
  }

  // Split a large polygon into smaller ones
  private splitPolygon(polygon: Point[], landmass: Landmass): Point[][] {
    if (polygon.length < 4) return [polygon];

    const centroid = this.calculatePolygonCentroid(polygon);
    const bounds = this.getBoundingBox(polygon);
    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;

    // Create two polygons by splitting along the longer axis
    const splitPoint1: Point = { x: midX, y: bounds.minY };
    const splitPoint2: Point = { x: midX, y: bounds.maxY };

    // Simple split: create two halves
    const leftHalf: Point[] = [];
    const rightHalf: Point[] = [];

    for (const point of polygon) {
      if (point.x <= midX) {
        leftHalf.push(point);
      } else {
        rightHalf.push(point);
      }
    }

    // Add split points
    if (leftHalf.length > 0 && rightHalf.length > 0) {
      leftHalf.push(splitPoint1, splitPoint2);
      rightHalf.push(splitPoint2, splitPoint1);
    }

    const result: Point[][] = [];
    if (leftHalf.length >= 3) {
      const fixed = this.fixPolygonOrder(leftHalf);
      if (this.isValidPolygon(fixed)) {
        result.push(fixed);
      }
    }
    if (rightHalf.length >= 3) {
      const fixed = this.fixPolygonOrder(rightHalf);
      if (this.isValidPolygon(fixed)) {
        result.push(fixed);
      }
    }

    return result.length > 0 ? result : [polygon];
  }

  // Fill gaps in landmass coverage
  private fillGapsInLandmass(
    polygons: Point[][],
    landmass: Landmass,
    seedPoints: Point[]
  ): Point[][] {
    const filled = [...polygons];
    const bounds = this.getBoundingBox(landmass.vertices);

    // Sample points across the landmass to find uncovered areas
    const sampleSize = 50;
    const stepX = (bounds.maxX - bounds.minX) / sampleSize;
    const stepY = (bounds.maxY - bounds.minY) / sampleSize;

    const uncoveredAreas: Point[] = [];

    for (let i = 0; i < sampleSize; i++) {
      for (let j = 0; j < sampleSize; j++) {
        const testPoint: Point = {
          x: bounds.minX + i * stepX,
          y: bounds.minY + j * stepY,
        };

        // Check if point is in landmass
        if (!this.isPointInPolygon(testPoint, landmass.vertices)) {
          continue;
        }

        // Check if point is covered by any existing polygon
        let isCovered = false;
        for (const polygon of filled) {
          if (this.isPointInPolygon(testPoint, polygon)) {
            isCovered = true;
            break;
          }
        }

        if (!isCovered) {
          uncoveredAreas.push(testPoint);
        }
      }
    }

    // If there are significant uncovered areas, create additional polygons
    if (uncoveredAreas.length > sampleSize * 0.1) {
      // Group uncovered points and create polygons for them
      const groups = this.groupNearbyPoints(uncoveredAreas, stepX * 2);
      for (const group of groups) {
        if (group.length >= 3) {
          // Create a polygon from the group
          const hull = this.computeConvexHullForPolygon(group);
          const clipped = this.clipPolygonToLandmassAccurate(hull, landmass);
          if (clipped.length >= 3 && this.isValidPolygon(clipped)) {
            filled.push(clipped);
          }
        }
      }
    }

    return filled;
  }

  // Group nearby points together
  private groupNearbyPoints(points: Point[], maxDistance: number): Point[][] {
    const groups: Point[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;

      const group: Point[] = [points[i]];
      used.add(i);

      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue;

        const dist = this.distance(points[i], points[j]);
        if (dist <= maxDistance) {
          group.push(points[j]);
          used.add(j);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  // Ensure complete coverage of landmass
  private ensureCompleteCoverage(
    polygons: Point[][],
    landmass: Landmass
  ): Point[][] {
    // Don't modify polygons here - just return them as is
    // The coverage should be handled by proper Voronoi diagram generation
    return polygons;
  }

  // Add curve vertices for smoother borders
  private addCurveVertices(polygon: Point[]): Point[] {
    if (polygon.length < 3) return polygon;

    const curved: Point[] = [polygon[0]];

    for (let i = 0; i < polygon.length; i++) {
      const current = polygon[i];
      const next = polygon[(i + 1) % polygon.length];
      const afterNext = polygon[(i + 2) % polygon.length];

      const dist = this.distance(current, next);

      // Add intermediate points for curves if distance is significant
      if (dist > 5) {
        const numPoints = Math.min(Math.ceil(dist / 3), 5);

        for (let j = 1; j < numPoints; j++) {
          const t = j / numPoints;
          // Use quadratic Bezier interpolation for smooth curves
          const mt = 1 - t;
          const curvedPoint: Point = {
            x: Math.round(
              mt * mt * current.x + 2 * mt * t * next.x + t * t * afterNext.x
            ),
            y: Math.round(
              mt * mt * current.y + 2 * mt * t * next.y + t * t * afterNext.y
            ),
          };
          curved.push(curvedPoint);
        }
      }

      curved.push(next);
    }

    // Remove duplicate last point
    if (
      curved.length > 1 &&
      curved[0].x === curved[curved.length - 1].x &&
      curved[0].y === curved[curved.length - 1].y
    ) {
      curved.pop();
    }

    return curved.length >= 3 ? curved : polygon;
  }

  private generateOptimizedPointsInLandmass(
    landmass: Landmass,
    numPoints: number
  ): Point[] {
    const points: Point[] = [];
    const bounds = this.getBoundingBox(landmass.vertices);

    // 使用泊松圆盘采样生成均匀分布的点
    const cellSize =
      Math.sqrt(
        ((bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)) / numPoints
      ) * 0.8;

    // 初始点 - 使用大陆的中心区域
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // 生成第一个点在中心附近
    const firstPoint = this.findValidPointInLandmass(
      landmass,
      centerX,
      centerY,
      cellSize
    );
    if (firstPoint) points.push(firstPoint);
    else return [];
    const activeList: Point[] = [firstPoint!];
    // const grid = new Map<string, Point>();

    // // 初始化网格
    // const cols = Math.ceil((bounds.maxX - bounds.minX) / cellSize);
    // const rows = Math.ceil((bounds.maxY - bounds.minY) / cellSize);

    while (activeList.length > 0 && points.length < numPoints) {
      const randomIndex = Math.floor(Math.random() * activeList.length);
      const point = activeList[randomIndex];
      let found = false;

      // 在周围生成候选点
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = cellSize + Math.random() * cellSize;

        const candidate: Point = {
          x: point.x + distance * Math.cos(angle),
          y: point.y + distance * Math.sin(angle),
        };

        if (
          this.isPointInPolygon(candidate, landmass.vertices) &&
          this.isPointFarEnough(candidate, points, cellSize * 0.8)
        ) {
          points.push(candidate);
          activeList.push(candidate);
          found = true;
          break;
        }
      }

      if (!found) {
        activeList.splice(randomIndex, 1);
      }
    }

    // 如果点数不足，补充随机点
    while (points.length < numPoints) {
      const point = this.generateRandomPointInBounds(bounds);
      if (
        this.isPointInPolygon(point, landmass.vertices) &&
        this.isPointFarEnough(point, points, cellSize * 0.5)
      ) {
        points.push(point);
      }
    }

    return points;
  }

  private findValidPointInLandmass(
    landmass: Landmass,
    x: number,
    y: number,
    radius: number
  ): Point | null {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;

      const point: Point = {
        x: x + distance * Math.cos(angle),
        y: y + distance * Math.sin(angle),
      };

      if (this.isPointInPolygon(point, landmass.vertices)) {
        return point;
      }
    }
    return null;
  }

  private isPointFarEnough(
    point: Point,
    points: Point[],
    minDistance: number
  ): boolean {
    return !points.some((p) => this.distance(point, p) < minDistance);
  }

  private generateRandomPointInBounds(bounds: Bounds): Point {
    return {
      x: randomInt(bounds.minX, bounds.maxX),
      y: randomInt(bounds.minY, bounds.maxY),
    };
  }

  private createVoronoiDiagram(landmass: Landmass, points: Point[]): Point[][] {
    if (points.length === 0) return [];

    const bounds = this.getBoundingBox(landmass.vertices);
    const extendedBounds = [
      bounds.minX - 100,
      bounds.minY - 100,
      bounds.maxX + 100,
      bounds.maxY + 100,
    ];

    // Convert points to array format for d3-delaunay
    const delaunayPoints: [number, number][] = points.map((p) => [p.x, p.y]);
    const delaunay = Delaunay.from(delaunayPoints);
    const voronoi = delaunay.voronoi(
      extendedBounds as [number, number, number, number]
    );

    const polygons: Point[][] = [];

    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.renderCell(i);
      if (!cell) {
        // Fallback: create a simple triangle around the point
        const radius = 50;
        polygons.push([
          { x: points[i].x + radius, y: points[i].y },
          { x: points[i].x - radius * 0.5, y: points[i].y + radius * 0.866 },
          { x: points[i].x - radius * 0.5, y: points[i].y - radius * 0.866 },
        ]);
        continue;
      }

      // Parse SVG path data to extract points
      const cellPoints: Point[] = [];
      const coords = cell.match(/[\d.-]+/g);
      if (coords && coords.length >= 2) {
        for (let j = 0; j < coords.length; j += 2) {
          cellPoints.push({
            x: parseFloat(coords[j]),
            y: parseFloat(coords[j + 1]),
          });
        }
      }

      // Remove duplicate points
      const cleanedCell: Point[] = [];
      for (const point of cellPoints) {
        const isDuplicate = cleanedCell.some(
          (p) => Math.abs(p.x - point.x) < 0.5 && Math.abs(p.y - point.y) < 0.5
        );
        if (!isDuplicate) {
          cleanedCell.push(point);
        }
      }

      if (cleanedCell.length >= 3) {
        polygons.push(cleanedCell);
      } else if (cellPoints.length >= 3) {
        polygons.push(cellPoints);
      } else {
        // Fallback: create a simple triangle
        const radius = 50;
        polygons.push([
          { x: points[i].x + radius, y: points[i].y },
          { x: points[i].x - radius * 0.5, y: points[i].y + radius * 0.866 },
          { x: points[i].x - radius * 0.5, y: points[i].y - radius * 0.866 },
        ]);
      }
    }

    return polygons;
  }

  private cleanAndOptimizePolygons(
    polygons: Point[][],
    landmass: Landmass
  ): Point[][] {
    const cleaned: Point[][] = [];
    const landmassArea = this.calculateArea(landmass.vertices);
    const minArea = landmassArea / 1000; // Minimum area based on landmass size

    polygons.forEach((polygon) => {
      if (polygon.length < 3) return;

      // 1. 裁剪到大陆边界
      let clipped = this.clipPolygonToLandmassAccurate(polygon, landmass);

      if (clipped.length < 3) return;

      // 2. 确保多边形顶点正确排序（防止自相交）
      clipped = this.fixPolygonOrder(clipped);

      // 3. 简化多边形（去除太近的点，限制最大顶点数）
      clipped = this.simplifyPolygon(clipped, 2);

      // 4. 限制顶点数量（最多50个顶点）
      if (clipped.length > 50) {
        clipped = this.reducePolygonVertices(clipped, 50);
      }

      // 5. 确保多边形是有效的，使用动态最小面积
      const area = this.calculateArea(clipped);
      if (this.isValidPolygon(clipped) && area > minArea) {
        cleaned.push(clipped);
      }
    });

    return cleaned;
  }

  // Fix polygon vertex order to prevent self-intersections
  private fixPolygonOrder(polygon: Point[]): Point[] {
    if (polygon.length < 3) return polygon;

    // Calculate centroid
    const centroid = this.calculatePolygonCentroid(polygon);

    // Sort vertices by angle from centroid to ensure proper order
    const sorted = [...polygon].sort((a, b) => {
      const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
      const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
      return angleA - angleB;
    });

    // Check if polygon is self-intersecting and fix if needed
    if (this.hasSelfIntersections(sorted)) {
      // Use convex hull as fallback
      return this.computeConvexHullForPolygon(polygon);
    }

    return sorted;
  }

  // Check if polygon has self-intersections
  private hasSelfIntersections(polygon: Point[]): boolean {
    if (polygon.length < 4) return false;

    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];

      for (let j = i + 2; j < polygon.length; j++) {
        if (j === polygon.length - 1 && i === 0) continue; // Skip adjacent edges

        const p3 = polygon[j];
        const p4 = polygon[(j + 1) % polygon.length];

        if (this.doLineSegmentsIntersect(p1, p2, p3, p4)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check if two line segments intersect
  private doLineSegmentsIntersect(
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
  ): boolean {
    const d1 = this.orientation(p3, p4, p1);
    const d2 = this.orientation(p3, p4, p2);
    const d3 = this.orientation(p1, p2, p3);
    const d4 = this.orientation(p1, p2, p4);

    if (
      ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
    ) {
      return true;
    }

    return false;
  }

  // Calculate orientation of three points
  private orientation(p: Point, q: Point, r: Point): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  // Compute concave hull for a polygon using turf.js
  private computeConvexHullForPolygon(points: Point[]): Point[] {
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
    const maxEdge = diagonal * 0.1; // 10% of diagonal as max edge length

    // Compute concave hull
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
    const hullPoints: Point[] = coordinates.map((coord) => {
      const [x, y] = coord as [number, number];
      return { x, y };
    });

    // Remove duplicate last point if it matches the first (closed polygon)
    if (
      hullPoints.length > 1 &&
      hullPoints[0].x === hullPoints[hullPoints.length - 1].x &&
      hullPoints[0].y === hullPoints[hullPoints.length - 1].y
    ) {
      hullPoints.pop();
    }

    return hullPoints.length >= 3 ? hullPoints : points;
  }

  // Reduce polygon vertices to a maximum number
  private reducePolygonVertices(
    polygon: Point[],
    maxVertices: number
  ): Point[] {
    if (polygon.length <= maxVertices) return polygon;

    // Use Douglas-Peucker-like algorithm to reduce vertices
    const step = Math.ceil(polygon.length / maxVertices);
    const reduced: Point[] = [];

    for (let i = 0; i < polygon.length; i += step) {
      reduced.push(polygon[i]);
    }

    // Ensure we have the last point
    if (reduced[reduced.length - 1] !== polygon[polygon.length - 1]) {
      reduced.push(polygon[polygon.length - 1]);
    }

    // Ensure we have at least 3 points
    if (reduced.length < 3) {
      return [
        polygon[0],
        polygon[Math.floor(polygon.length / 2)],
        polygon[polygon.length - 1],
      ];
    }

    return reduced;
  }

  private clipPolygonToLandmassAccurate(
    polygon: Point[],
    landmass: Landmass
  ): Point[] {
    const landmassPoly = landmass.vertices;

    // Convert to format expected by martinez-polygon-clipping
    const subject = [polygon.map((p) => [p.x, p.y])] as any;
    const clip = [landmassPoly.map((p) => [p.x, p.y])] as any;

    try {
      const result = martinez.intersection(subject, clip) as any;
      if (result && result.length > 0 && result[0] && result[0].length > 0) {
        // Convert back to Point format
        const clipped = result[0].map((p: number[]) => ({ x: p[0], y: p[1] }));
        if (clipped.length >= 3) {
          return this.fixPolygonOrder(clipped);
        }
      }
    } catch (e) {
      // Fallback to manual method if library fails
    }

    // Fallback: Find all points of the polygon that are inside the landmass
    const containedPoints = polygon.filter((point) =>
      pointInPolygon(
        [point.x, point.y],
        landmassPoly.map((p) => [p.x, p.y])
      )
    );

    if (containedPoints.length >= 3) {
      return this.computeConvexHullForPolygon(containedPoints);
    }

    // Last resort: return a portion of the landmass
    return this.findLargestContainedPolygon(polygon, landmass);
  }

  private findLargestContainedPolygon(
    polygon: Point[],
    landmass: Landmass
  ): Point[] {
    // 如果裁剪失败，返回原始多边形中在大陆内的部分
    const containedPoints = polygon.filter((point) =>
      this.isPointInPolygon(point, landmass.vertices)
    );

    if (containedPoints.length >= 3) {
      return containedPoints;
    }

    // 如果还是不够，返回大陆的一个子区域
    return [landmass.vertices[0], landmass.vertices[1], landmass.vertices[2]];
  }

  private simplifyPolygon(polygon: Point[], tolerance: number): Point[] {
    if (polygon.length < 3) return polygon;

    // Convert to format expected by simplify-js
    const points = polygon.map((p) => ({ x: p.x, y: p.y }));
    const simplified = simplify(points, tolerance);

    // Convert back to Point format
    const result = simplified.map((p) => ({ x: p.x, y: p.y }));

    return result.length >= 3 ? result : polygon;
  }

  private isValidPolygon(polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    // 检查面积是否为正
    const area = this.calculateArea(polygon);
    if (area <= 0) return false;

    // 检查是否有重复点
    for (let i = 0; i < polygon.length; i++) {
      for (let j = i + 1; j < polygon.length; j++) {
        if (this.distance(polygon[i], polygon[j]) < 0.1) {
          return false;
        }
      }
    }

    return true;
  }

  private calculatePolygonCentroid(polygon: Point[]): Point {
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      area += cross;
      centroidX += (polygon[i].x + polygon[j].x) * cross;
      centroidY += (polygon[i].y + polygon[j].y) * cross;
    }

    area *= 0.5;
    const factor = 1 / (6 * area);

    return {
      x: centroidX * factor,
      y: centroidY * factor,
    };
  }

  //
  private assignNeighbors(): void {
    const countryArray = Array.from(this.countries.values());

    countryArray.forEach((country, i) => {
      countryArray.forEach((other, j) => {
        if (i !== j && this.areCountriesNeighbors(country, other)) {
          if (!country.neighbors.includes(other.name)) {
            country.neighbors.push(other.name);
          }
          if (!other.neighbors.includes(country.name)) {
            other.neighbors.push(country.name);
          }
        }
      });
    });
  }

  private areCountriesNeighbors(country1: Country, country2: Country): boolean {
    // 检查两个国家是否共享边界点
    return country1.vertices.some((p1) =>
      country2.vertices.some((p2) => this.distance(p1, p2) < 10)
    );
  }

  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    return pointInPolygon(
      [point.x, point.y],
      polygon.map((p) => [p.x, p.y])
    );
  }

  private getBoundingBox(vertices: Point[]): Bounds {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    vertices.forEach((vertex) => {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    });

    return { minX, maxX, minY, maxY };
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }
}
interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
