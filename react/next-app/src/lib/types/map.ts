export interface Country {
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
