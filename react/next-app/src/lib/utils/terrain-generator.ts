type Biome =
  | 'deep_ocean'
  | 'ocean'
  | 'beach'
  | 'plains'
  | 'forest'
  | 'mountains'
  | 'high_mountains';

class TerrainGenerator {
  private maxHeight: number;
  private minDepth: number;
  private seaLevel: number;
  private seed: number;
  private permutation: number[];
  private p: number[];

  constructor(seed?: number) {
    this.maxHeight = 10000;
    this.minDepth = -10000;
    this.seaLevel = 100;
    this.seed = seed || Math.floor(Math.random() * 1000000);

    // 初始化Perlin噪声排列表
    this.permutation = Array.from({ length: 256 }, (_, i) => i);
    this.shuffleArray(this.permutation);
    this.p = [...this.permutation, ...this.permutation];
  }

  private shuffleArray(array: number[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private perlinNoise(x: number, y: number, z: number = 0): number {
    // 找到单位立方体
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // 找到相对坐标
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // 计算渐变权重
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // 哈希立方体角点坐标
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // 混合结果
    return this.lerp(
      this.lerp(
        this.lerp(
          this.grad(this.p[AA], x, y, z),
          this.grad(this.p[BA], x - 1, y, z),
          u
        ),
        this.lerp(
          this.grad(this.p[AB], x, y - 1, z),
          this.grad(this.p[BB], x - 1, y - 1, z),
          u
        ),
        v
      ),
      this.lerp(
        this.lerp(
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1),
          u
        ),
        this.lerp(
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
          u
        ),
        v
      ),
      w
    );
  }

  private octaveNoise(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      // 将噪声从[-1,1]映射到[0,1]
      const noiseValue =
        (this.perlinNoise(x * frequency, y * frequency) + 1) / 2;
      total += noiseValue * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  private applyTerrainCurve(noiseValue: number): number {
    // 应用地形曲线，让低地更平坦，高地更陡峭
    if (noiseValue < 0.3) {
      // 低地：更平坦
      return noiseValue * 0.7;
    } else if (noiseValue < 0.7) {
      // 中等高度：线性
      return noiseValue;
    } else {
      // 高地：更陡峭
      return 0.7 + (noiseValue - 0.7) * 1.5;
    }
  }

  private applyCoastalSmoothing(height: number, seaLevel: number): number {
    // 对海平面附近的地形进行平滑处理
    if (height >= seaLevel - 500 && height < seaLevel) {
      // 浅海区域平滑过渡
      const depthRatio = (seaLevel - height) / 500;
      const smoothHeight = seaLevel - 500 * (1 - Math.pow(1 - depthRatio, 2));
      return smoothHeight;
    } else if (height < seaLevel - 500) {
      // 深海区域保持原样
      return height;
    } else {
      return height;
    }
  }

  public generateHeight(x: number, y: number): number {
    // 使用多层噪声生成基础高度
    const baseNoise = this.octaveNoise(x * 0.01, y * 0.01, 4, 0.5);

    // 添加细节噪声
    const detailNoise = this.octaveNoise(x * 0.05, y * 0.05, 2, 0.3) * 0.3;

    // 添加山脉噪声（更大尺度）
    const mountainNoise = this.octaveNoise(x * 0.002, y * 0.002, 3, 0.6) * 1.5;

    // 组合噪声
    const combinedNoise =
      baseNoise * 0.6 + detailNoise * 0.2 + mountainNoise * 0.2;

    // 应用曲线调整，让地形更自然
    const curvedNoise = this.applyTerrainCurve(combinedNoise);

    // 映射到目标高度范围
    let height = this.minDepth + curvedNoise * (this.maxHeight - this.minDepth);

    // 确保海平面以下的地形平滑
    if (height < this.seaLevel) {
      height = this.applyCoastalSmoothing(height, this.seaLevel);
    }

    return height;
  }

  public generateTerrainChunk(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): number[][] {
    const terrain: number[][] = [];
    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        const elevation = this.generateHeight(worldX, worldY);
        row.push(elevation);
      }
      terrain.push(row);
    }
    return terrain;
  }

  public getBiome(x: number, y: number): Biome {
    const elevation = this.generateHeight(x, y);

    if (elevation < this.seaLevel - 2000) {
      return 'deep_ocean';
    } else if (elevation < this.seaLevel) {
      return 'ocean';
    } else if (elevation < this.seaLevel + 100) {
      return 'beach';
    } else if (elevation < this.seaLevel + 500) {
      return 'plains';
    } else if (elevation < this.seaLevel + 2000) {
      return 'forest';
    } else if (elevation < this.seaLevel + 5000) {
      return 'mountains';
    } else {
      return 'high_mountains';
    }
  }

  // Getter方法
  public getMaxHeight(): number {
    return this.maxHeight;
  }

  public getMinDepth(): number {
    return this.minDepth;
  }

  public getSeaLevel(): number {
    return this.seaLevel;
  }

  public getSeed(): number {
    return this.seed;
  }

  // Setter方法
  public setMaxHeight(height: number): void {
    this.maxHeight = height;
  }

  public setMinDepth(depth: number): void {
    this.minDepth = depth;
  }

  public setSeaLevel(level: number): void {
    this.seaLevel = level;
  }
}

/* // 使用示例
function testTerrainGenerator(): void {
  // 创建地形生成器
  const generator = new TerrainGenerator(42);

  // 生成单个点的高度
  const height = generator.generateHeight(100, 200);
  console.log(`坐标(100,200)的高度: ${height.toFixed(2)}`);

  // 生成地形区块
  const terrainChunk = generator.generateTerrainChunk(0, 0, 5, 5);

  // 打印地形区块
  console.log('\n5x5地形区块:');
  terrainChunk.forEach((row) => {
    console.log(row.map((h) => h.toFixed(0).padStart(6)).join(' '));
  });

  // 获取生物群系
  const biome = generator.getBiome(100, 200);
  console.log(`\n坐标(100,200)的生物群系: ${biome}`);

  // 测试不同坐标
  console.log('\n不同坐标测试:');
  const testCoords = [
    [0, 0],
    [100, 100],
    [500, 500],
    [1000, 1000],
  ];

  testCoords.forEach(([x, y]) => {
    const h = generator.generateHeight(x, y);
    const b = generator.getBiome(x, y);
    console.log(`坐标(${x},${y}): 高度=${h.toFixed(0)}, 生物群系=${b}`);
  });
} */

// 运行测试
// testTerrainGenerator();

export { TerrainGenerator, type Biome };
