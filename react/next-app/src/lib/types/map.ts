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
}

export interface BorderPoint {
  x: number;
  y: number;
  connections: BorderPoint[];
}
