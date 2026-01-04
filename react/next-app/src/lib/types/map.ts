export interface Country extends Land {
  name: string;
  terrain: string;
  population: number;
  area: number;
  neighbors: string[];
  color: string;
  position: { x: number; y: number };
  vertices: { x: number; y: number }[];
}

export interface WorldMap {
  countries: Map<string, Country>;
  landmasses?: Landmass[]; // 大陆信息（可选，用于调试）
  elevationMap?: number[][]; // 高度图（用于像素级高度显示）
  elevationThreshold?: number; // 海拔阈值
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}

export interface Land {
  vertices: Point[];
  area: number;
}

export interface Landmass extends Land {
  center: { x: number; y: number };
  terrain: string;
  countries: string[];
  avgElevation?: number; // 平均海拔高度
  elevationMap?: number[][]; // 高度图（可选，用于显示高度分布）
  elevationThreshold?: number; // 海拔阈值
  boundaryPoints?: Point[][]; // 边界点环（GeoJSON规范：第一个是外圈，其余是内圈）
}

export interface BorderPoint {
  x: number;
  y: number;
  connections: BorderPoint[];
}
