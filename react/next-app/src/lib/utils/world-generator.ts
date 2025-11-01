import { Country, Landmass, Point, WorldMap } from '@/lib/types/map';
import { TERRAIN_COLORS } from '@/lib/constants/terrain';
import {
  generateCountryName,
  generatePopulation,
  randomInt,
} from './common-generator';
import { generateContinents } from './continents-generator';

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
    this.landmasses = generateContinents(this.width, this.height, 70);
    // this.landmasses = generateContinents(20, 20, 70);
    console.log('Landmass', this.landmasses);

    // 2. 在大陆上生成国家
    this.generateCountriesOnLandmasses(numCountries);

    // 3. 建立邻国关系
    this.assignNeighbors();

    return {
      countries: this.countries,
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
    if (numCountries <= 0) return;

    // 生成更好的种子点
    const points = this.generateOptimizedPointsInLandmass(
      landmass,
      numCountries
    );

    // 使用真正的沃罗诺伊分割
    const polygons = this.createVoronoiDiagram(landmass, points);

    // 清理和优化多边形
    let cleanedPolygons = this.cleanAndOptimizePolygons(polygons, landmass);
    if (cleanedPolygons.length === 0) {
      cleanedPolygons = [landmass.vertices];
    }
    cleanedPolygons.forEach((polygon) => {
      if (polygon.length < 3) return; // 跳过无效多边形

      const name = generateCountryName();
      const population = generatePopulation();
      const area = this.calculateArea(polygon);

      // 计算多边形质心
      const centroid = this.calculatePolygonCentroid(polygon);

      const country: Country = {
        name,
        terrain: landmass.terrain,
        population,
        area,
        neighbors: [],
        color: TERRAIN_COLORS[landmass.terrain],
        position: centroid,
        vertices: polygon,
      };

      this.countries.set(name, country);
      landmass.countries.push(name);
    });
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
    const polygons: Point[][] = [];
    const bounds = this.getBoundingBox(landmass.vertices);

    // 使用扩展边界来确保完整的沃罗诺伊图
    const extendedBounds = {
      minX: bounds.minX - 100,
      maxX: bounds.maxX + 100,
      minY: bounds.minY - 100,
      maxY: bounds.maxY + 100,
    };

    // 为每个点生成沃罗诺伊单元
    points.forEach((point, index) => {
      const cell: Point[] = [];

      // 使用扩展边界来限制搜索范围
      const searchRadius =
        Math.max(
          extendedBounds.maxX - extendedBounds.minX,
          extendedBounds.maxY - extendedBounds.minY
        ) / 2;

      // 在圆周上采样点来构建沃罗诺伊单元边界
      for (let i = 0; i < 360; i += 15) {
        // 减少采样点提高性能
        const angle = (i * Math.PI) / 180;

        // 使用二分查找来更高效地找到边界点
        let minDist = 0;
        let maxDist = searchRadius;
        let intersection: Point | null = null;

        // 二分查找边界点
        for (let iter = 0; iter < 10; iter++) {
          // 限制迭代次数
          const testDist = (minDist + maxDist) / 2;
          const testPoint: Point = {
            x: point.x + testDist * Math.cos(angle),
            y: point.y + testDist * Math.sin(angle),
          };

          // 检查是否在扩展边界内
          if (
            testPoint.x < extendedBounds.minX ||
            testPoint.x > extendedBounds.maxX ||
            testPoint.y < extendedBounds.minY ||
            testPoint.y > extendedBounds.maxY
          ) {
            maxDist = testDist;
            continue;
          }

          // 检查这个点是否属于当前沃罗诺伊单元
          let isInCell = true;
          for (let j = 0; j < points.length; j++) {
            if (j !== index) {
              const distToCurrent = this.distance(testPoint, point);
              const distToOther = this.distance(testPoint, points[j]);

              if (distToOther < distToCurrent - 0.001) {
                // 添加容差
                isInCell = false;
                break;
              }
            }
          }

          if (isInCell) {
            minDist = testDist;
            intersection = testPoint;
          } else {
            maxDist = testDist;
          }
        }

        if (intersection) {
          cell.push(intersection);
        }
      }

      if (cell.length >= 3) {
        // 按角度排序点以形成凸多边形
        cell.sort((a, b) => {
          const angleA = Math.atan2(a.y - point.y, a.x - point.x);
          const angleB = Math.atan2(b.y - point.y, b.x - point.x);
          return angleA - angleB;
        });

        polygons.push(cell);
      }
    });

    return polygons;
  }

  private cleanAndOptimizePolygons(
    polygons: Point[][],
    landmass: Landmass
  ): Point[][] {
    const cleaned: Point[][] = [];

    polygons.forEach((polygon) => {
      if (polygon.length < 3) return;

      // 1. 裁剪到大陆边界
      let clipped = this.clipPolygonToLandmassAccurate(polygon, landmass);

      // 2. 简化多边形（去除太近的点）
      clipped = this.simplifyPolygon(clipped, 2);

      // 3. 确保多边形是凸的或至少是有效的
      if (this.isValidPolygon(clipped) && this.calculateArea(clipped) > 100) {
        cleaned.push(clipped);
      }
    });

    return cleaned;
  }

  private clipPolygonToLandmassAccurate(
    polygon: Point[],
    landmass: Landmass
  ): Point[] {
    const landmassPoly = landmass.vertices;

    // Sutherland-Hodgman 多边形裁剪算法
    let inputList = polygon;

    for (let i = 0; i < landmassPoly.length; i++) {
      const outputList: Point[] = [];
      const a = landmassPoly[i];
      const b = landmassPoly[(i + 1) % landmassPoly.length];

      for (let j = 0; j < inputList.length; j++) {
        const p1 = inputList[j];
        const p2 = inputList[(j + 1) % inputList.length];

        const p1Inside = this.isPointInsideEdge(p1, a, b);
        const p2Inside = this.isPointInsideEdge(p2, a, b);

        if (p1Inside && p2Inside) {
          outputList.push(p2);
        } else if (p1Inside && !p2Inside) {
          const intersection = this.lineIntersection(a, b, p1, p2);
          if (intersection) outputList.push(intersection);
        } else if (!p1Inside && p2Inside) {
          const intersection = this.lineIntersection(a, b, p1, p2);
          if (intersection) outputList.push(intersection);
          outputList.push(p2);
        }
      }

      inputList = outputList;
    }

    return inputList.length > 0
      ? inputList
      : this.findLargestContainedPolygon(polygon, landmass);
  }

  private isPointInsideEdge(point: Point, a: Point, b: Point): boolean {
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= 0;
  }

  private lineIntersection(
    a: Point,
    b: Point,
    c: Point,
    d: Point
  ): Point | null {
    const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(denominator) < 0.0001) return null;

    const t =
      ((a.x - c.x) * (d.y - c.y) - (a.y - c.y) * (d.x - c.x)) / denominator;
    const u =
      -((a.x - c.x) * (b.y - a.y) - (a.y - c.y) * (b.x - a.x)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y),
      };
    }

    return null;
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

  private simplifyPolygon(polygon: Point[], minDistance: number): Point[] {
    const simplified: Point[] = [polygon[0]];

    for (let i = 1; i < polygon.length; i++) {
      const lastPoint = simplified[simplified.length - 1];
      if (this.distance(lastPoint, polygon[i]) >= minDistance) {
        simplified.push(polygon[i]);
      }
    }

    // 确保首尾点不重复
    if (
      simplified.length > 1 &&
      this.distance(simplified[0], simplified[simplified.length - 1]) <
        minDistance
    ) {
      simplified.pop();
    }

    return simplified.length >= 3 ? simplified : polygon;
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
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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
