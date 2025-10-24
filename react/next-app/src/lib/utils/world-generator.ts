import { Country, WorldMap } from '@/lib/types/map';
import { TERRAIN_COLORS } from '@/lib/constants/terrain';
import {
  generateArea,
  generateCountryName,
  generatePopulation,
  generateTerrain,
  randomChoice,
  randomInt,
} from './common-generator';

interface Landmass {
  vertices: { x: number; y: number }[];
  center: { x: number; y: number };
  terrain: string;
  countries: string[];
}

export class WorldGenerator {
  private countries: Map<string, Country> = new Map();
  private landmasses: Landmass[] = [];
  private width: number;
  private height: number;

  constructor(width: number = 800, height: number = 600) {
    this.width = width;
    this.height = height;
  }

  private generateLandmass(): Landmass {
    const landmassTypes = ['continent', 'subcontinent', 'large_island'];
    const type = randomChoice(landmassTypes);

    let size: number;
    let centerX: number, centerY: number;

    switch (type) {
      case 'continent':
        size = randomInt(200, 300);
        centerX = randomInt(150, this.width - 150);
        centerY = randomInt(150, this.height - 150);
        break;
      case 'subcontinent':
        size = randomInt(120, 200);
        centerX = randomInt(100, this.width - 100);
        centerY = randomInt(100, this.height - 100);
        break;
      case 'large_island':
      default:
        size = randomInt(80, 150);
        centerX = randomInt(80, this.width - 80);
        centerY = randomInt(80, this.height - 80);
        break;
    }

    const vertices = this.generateIrregularPolygon(
      centerX,
      centerY,
      size,
      12,
      16
    );
    const terrain = generateTerrain();

    return {
      vertices,
      center: { x: centerX, y: centerY },
      terrain,
      countries: [],
    };
  }

  private generateIrregularPolygon(
    centerX: number,
    centerY: number,
    size: number,
    minSides: number = 8,
    maxSides: number = 12
  ): { x: number; y: number }[] {
    const vertices: { x: number; y: number }[] = [];
    const sides = randomInt(minSides, maxSides);

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * 2 * Math.PI;
      const radiusVariance = 0.6 + Math.random() * 0.4; // More consistent shapes for landmasses
      const radius = size * radiusVariance;

      const angleNoise = (Math.random() - 0.5) * 0.2; // Less noise for smoother landmasses
      const noisyAngle = angle + angleNoise;

      const x = centerX + radius * Math.cos(noisyAngle);
      const y = centerY + radius * Math.sin(noisyAngle);
      vertices.push({ x, y });
    }

    return vertices;
  }

  private divideLandmassIntoCountries(
    landmass: Landmass,
    numCountries: number
  ): void {
    const centerX = landmass.center.x;
    const centerY = landmass.center.y;
    const landSize = Math.max(
      ...landmass.vertices.map((v) =>
        Math.sqrt((v.x - centerX) ** 2 + (v.y - centerY) ** 2)
      )
    );

    // Generate country positions within the landmass using Voronoi-like distribution
    const countryPositions: { x: number; y: number }[] = [];

    for (let i = 0; i < numCountries; i++) {
      let attempts = 0;
      let validPosition = false;
      let x: number = 0,
        y: number = 0;

      while (!validPosition && attempts < 50) {
        // Generate position within landmass bounds with some margin
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * (landSize * 0.7);
        x = centerX + distance * Math.cos(angle);
        y = centerY + distance * Math.sin(angle);

        // Check if position is within landmass polygon
        if (this.isPointInPolygon(x, y, landmass.vertices)) {
          // Check minimum distance from other countries
          validPosition = countryPositions.every((pos) => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            return Math.sqrt(dx * dx + dy * dy) > landSize * 0.15;
          });
        }

        attempts++;
      }

      if (validPosition) {
        countryPositions.push({ x, y });
      }
    }

    // Create countries at valid positions
    countryPositions.forEach((position) => {
      const name = generateCountryName();
      const population = generatePopulation();
      const area = generateArea();

      // Country size based on landmass size and country count
      const baseSize =
        (landSize * (0.2 + Math.random() * 0.3)) / Math.sqrt(numCountries);
      const size = baseSize * (0.8 + Math.random() * 0.4);

      const country: Country = {
        name,
        terrain: landmass.terrain, // Countries share landmass terrain
        population,
        area,
        neighbors: [],
        color: TERRAIN_COLORS[landmass.terrain],
        position,
        vertices: this.generateCountryPolygon(position.x, position.y, size),
      };

      this.countries.set(name, country);
      landmass.countries.push(name);
    });
  }

  private generateCountryPolygon(
    centerX: number,
    centerY: number,
    size: number
  ): { x: number; y: number }[] {
    const vertices: { x: number; y: number }[] = [];
    const sides = randomInt(6, 9); // Fewer sides for more natural country borders

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * 2 * Math.PI;
      const radiusVariance = 0.5 + Math.random() * 0.5; // More irregular for countries
      const radius = size * radiusVariance;

      const angleNoise = (Math.random() - 0.5) * 0.4; // More noise for natural borders
      const noisyAngle = angle + angleNoise;

      const x = centerX + radius * Math.cos(noisyAngle);
      const y = centerY + radius * Math.sin(noisyAngle);
      vertices.push({ x, y });
    }

    return vertices;
  }

  private isPointInPolygon(
    x: number,
    y: number,
    vertices: { x: number; y: number }[]
  ): boolean {
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
  }

  generateWorld(numCountries: number = 25): WorldMap {
    // Clear previous data
    this.countries.clear();
    this.landmasses = [];

    // Generate 1-3 large landmasses
    const numLandmasses = randomInt(1, 3);
    for (let i = 0; i < numLandmasses; i++) {
      const landmass = this.generateLandmass();
      this.landmasses.push(landmass);
    }

    // Distribute countries among landmasses
    const countriesPerLandmass = Math.ceil(
      numCountries / this.landmasses.length
    );

    this.landmasses.forEach((landmass) => {
      const actualCountries = Math.min(
        countriesPerLandmass,
        numCountries - this.countries.size
      );
      this.divideLandmassIntoCountries(landmass, actualCountries);
    });

    // Assign neighbors - countries on same landmass are more likely to be neighbors
    this.assignNeighbors();

    return {
      countries: this.countries,
      width: this.width,
      height: this.height,
    };
  }

  private assignNeighbors(): void {
    const countryNames = Array.from(this.countries.keys());
    console.log(countryNames);
    const countryArray = Array.from(this.countries.values());

    countryArray.forEach((country, index) => {
      const neighbors: { name: string; distance: number }[] = [];

      countryArray.forEach((otherCountry, otherIndex) => {
        if (index === otherIndex) return;

        // Calculate distance between country centers
        const dx = country.position.x - otherCountry.position.x;
        const dy = country.position.y - otherCountry.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if countries are close enough to be neighbors
        const countrySize = Math.max(
          ...country.vertices.map((v) =>
            Math.sqrt(
              (v.x - country.position.x) ** 2 + (v.y - country.position.y) ** 2
            )
          )
        );
        const otherSize = Math.max(
          ...otherCountry.vertices.map((v) =>
            Math.sqrt(
              (v.x - otherCountry.position.x) ** 2 +
                (v.y - otherCountry.position.y) ** 2
            )
          )
        );

        if (distance < (countrySize + otherSize) * 1.2) {
          neighbors.push({ name: otherCountry.name, distance });
        }
      });

      // Sort by distance and take closest 2-5 neighbors
      neighbors.sort((a, b) => a.distance - b.distance);
      country.neighbors = neighbors
        .slice(0, randomInt(2, 6))
        .map((n) => n.name);

      // Make relationships bidirectional
      country.neighbors.forEach((neighborName) => {
        const neighbor = this.countries.get(neighborName);
        if (neighbor && !neighbor.neighbors.includes(country.name)) {
          neighbor.neighbors.push(country.name);
        }
      });
    });
  }
}
