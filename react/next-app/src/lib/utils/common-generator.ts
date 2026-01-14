import { TERRAIN_COLORS } from '../constants/terrain';

export function generateCountryName(): string {
  const prefixes = [
    'North',
    'South',
    'East',
    'West',
    'New',
    'Great',
    'Upper',
    'Lower',
    'Central',
  ];
  const roots = [
    'Albion',
    'Veridia',
    'Eldoria',
    'Nord',
    'Sylvania',
    'Karth',
    'Zephyr',
    'Mor',
    'Tal',
    'Vor',
  ];
  const suffixes = [
    'ia',
    'land',
    'ia',
    'stan',
    'burg',
    'dale',
    'wood',
    'mere',
    'fell',
  ];

  const nameType = randomChoice(['simple', 'compound', 'prefixed']);

  if (nameType === 'simple') {
    return randomChoice(roots) + randomChoice(suffixes);
  } else if (nameType === 'compound') {
    return (
      randomChoice(roots) +
      randomChoice(roots).slice(-3) +
      randomChoice(suffixes)
    );
  } else {
    return (
      randomChoice(prefixes) +
      ' ' +
      randomChoice(roots) +
      randomChoice(suffixes)
    );
  }
}

export function generateTerrain(): string {
  const terrains = Object.keys(TERRAIN_COLORS);
  return randomChoice(terrains);
}

export function generatePopulation(): number {
  const sizeType = randomChoice([
    'small',
    'medium',
    'large',
    'small',
    'small',
    'medium',
  ]);

  switch (sizeType) {
    case 'small':
      return randomInt(50000, 2000000);
    case 'medium':
      return randomInt(2000000, 15000000);
    case 'large':
      return randomInt(15000000, 100000000);
    default:
      return randomInt(50000, 5000000);
  }
}

export function generateArea(): number {
  const sizeType = randomChoice([
    'small',
    'medium',
    'large',
    'small',
    'small',
    'medium',
  ]);

  switch (sizeType) {
    case 'small':
      return randomInt(1000, 50000);
    case 'medium':
      return randomInt(50000, 300000);
    case 'large':
      return randomInt(300000, 1500000);
    default:
      return randomInt(10000, 100000);
  }
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
