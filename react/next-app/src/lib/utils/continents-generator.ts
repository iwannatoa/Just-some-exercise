import { Landmass, Point } from '../types/map';
import { TerrainGenerator } from './terrain-generator';

// LandPercent 0-100
export function generateContinents(
  width: number,
  height: number,
  landPercent: number,
  minIslandSize: number = 10 // 可选：最小岛屿大小阈值
): Landmass[] {
  // 1. 创建缩小后的二维数组存储海拔高度
  const scaledWidth = Math.floor(width / 2);
  const scaledHeight = Math.floor(height / 2);

  // 2. 使用噪声生成基础地形
  const terrainGenerator = new TerrainGenerator();
  const elevationMap = terrainGenerator.generateTerrainChunk(
    0,
    0,
    scaledWidth,
    scaledHeight
  );
  // generateBaseTerrain(elevationMap, scaledWidth, scaledHeight);

  // 3. 根据landPercent调整海拔阈值
  const elevationThreshold = calculateElevationThreshold(
    elevationMap,
    landPercent
  );

  // 4. 识别并分割大陆
  let continents = identifyContinents(
    elevationMap,
    elevationThreshold,
    scaledWidth,
    scaledHeight
  );
  // 5. 过滤掉小岛屿
  continents = continents.filter(
    (continent) => continent.area >= minIslandSize
  );

  // 6. 将坐标缩放回原始尺寸
  continents.forEach((continent) => {
    // 缩放顶点坐标
    continent.vertices = continent.vertices.map((vertex) => ({
      x: vertex.x * 2,
      y: vertex.y * 2,
    }));

    // 缩放中心点坐标
    continent.center = {
      x: continent.center.x * 2,
      y: continent.center.y * 2,
    };
  });

  return continents;
}

// 计算海拔阈值以达到指定的陆地百分比
function calculateElevationThreshold(
  elevationMap: number[][],
  landPercent: number
): number {
  const allElevations: number[] = [];
  for (const row of elevationMap) {
    allElevations.push(...row);
  }

  allElevations.sort((a, b) => a - b);
  const targetIndex = Math.floor(
    allElevations.length * (1 - landPercent / 100)
  );

  return allElevations[targetIndex];
}

// 识别并分割大陆
function identifyContinents(
  elevationMap: number[][],
  threshold: number,
  width: number,
  height: number
): Landmass[] {
  const continents: Landmass[] = [];
  const visited: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  // 方向数组：上、右、下、左
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 1, dy: 0 }, // 右
    { dx: 0, dy: 1 }, // 下
    { dx: -1, dy: 0 }, // 左
  ];

  // 洪水填充算法
  function floodFill(startX: number, startY: number): Point[] {
    const points: Point[] = [];
    const queue: Point[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const current = queue.shift()!;
      points.push(current);

      // 检查四个方向
      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        // 检查边界
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          // 检查是否未访问且高于海平面
          if (!visited[newY][newX] && elevationMap[newY][newX] > threshold) {
            visited[newY][newX] = true;
            queue.push({ x: newX, y: newY });
          }
        }
      }
    }

    return points;
  }

  // 计算大陆的中心点
  function calculateCenter(points: Point[]): { x: number; y: number } {
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    return {
      x: Math.round(sumX / points.length),
      y: Math.round(sumY / points.length),
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
    const avg = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
    const variance =
      elevations.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) /
      elevations.length;
    return Math.sqrt(variance);
  }

  // 计算海岸线比例（边界点中与海相邻的比例）
  function calculateCoastlineRatio(points: Point[]): number {
    const pointSet = new Set(points.map((p) => `${p.x},${p.y}`));
    let coastalPoints = 0;

    for (const point of points) {
      const { x, y } = point;

      // 检查四个方向的邻居
      const neighbors = [
        { x: x, y: y - 1 },
        { x: x + 1, y: y },
        { x: x, y: y + 1 },
        { x: x - 1, y: y },
      ];

      // 如果至少有一个邻居低于海平面，则该点是海岸点
      const isCoastal = neighbors.some((neighbor) => {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!pointSet.has(neighborKey)) {
          // 邻居不在大陆中，检查是否低于海平面
          if (
            neighbor.y >= 0 &&
            neighbor.y < height &&
            neighbor.x >= 0 &&
            neighbor.x < width
          ) {
            return elevationMap[neighbor.y][neighbor.x] <= threshold;
          }
        }
        return false;
      });

      if (isCoastal) {
        coastalPoints++;
      }
    }

    return coastalPoints / points.length;
  }

  // 更复杂的地形判断，考虑多个因素
  function determineTerrain(
    points: Point[],
    threshold: number,
    avgElevation: number
  ): string {
    const elevationVariance = calculateElevationVariance(points);
    const coastlineRatio = calculateCoastlineRatio(points);
    const continentSize = points.length;

    // 地形决策矩阵
    if (avgElevation > threshold + 2500) {
      return 'Mountainous';
    }

    if (avgElevation > threshold + 1500) {
      return elevationVariance > 600 ? 'Mountainous' : 'Highland';
    }

    if (avgElevation > threshold + 800) {
      if (elevationVariance > 400) return 'Plateau';
      return 'Highland';
    }

    if (avgElevation > threshold + 400) {
      if (elevationVariance > 250) return 'Canyon Lands';
      return elevationVariance > 150 ? 'Grassland' : 'Plains';
    }

    if (avgElevation > threshold + 150) {
      if (coastlineRatio > 0.4) return 'Coastal';
      if (elevationVariance > 180) return 'River Valley';
      if (continentSize > 2000) return 'Forest';
      return 'Grassland';
    }

    if (avgElevation > threshold + 50) {
      if (coastlineRatio > 0.6) return 'Archipelago';
      if (coastlineRatio > 0.3) return 'Coastal';
      if (elevationVariance < 40 && coastlineRatio > 0.1) return 'Swamp';
      if (continentSize < 800) return 'Island';
      return 'Plains';
    }

    // 非常接近海平面
    if (coastlineRatio > 0.7) return 'Archipelago';
    if (coastlineRatio > 0.4) return continentSize < 400 ? 'Island' : 'Coastal';
    if (elevationVariance < 25) return 'Swamp';

    return 'Plains';
  }
  function extractVertices(points: Point[]): Point[] {
    if (points.length < 3) return points;

    // 创建二维网格来标记哪些点属于大陆
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const gridWidth = maxX - minX + 3; // 加边框
    const gridHeight = maxY - minY + 3;

    // 创建网格并标记大陆点
    const grid: boolean[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(false));
    for (const point of points) {
      const gridX = point.x - minX + 1; // 偏移1以创建边框
      const gridY = point.y - minY + 1;
      if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
        grid[gridY][gridX] = true;
      }
    }

    // 找到起始边界点（最左上角的大陆点）
    let startPoint: Point | null = null;
    outerLoop: for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y][x]) {
          // 检查是否是边界点（至少有一个邻居是false）
          if (
            !grid[y - 1]?.[x] ||
            !grid[y + 1]?.[x] ||
            !grid[y][x - 1] ||
            !grid[y][x + 1]
          ) {
            startPoint = { x: x + minX - 1, y: y + minY - 1 };
            break outerLoop;
          }
        }
      }
    }

    if (!startPoint) return points; // 如果没有找到边界点，返回所有点

    const boundary: Point[] = [];
    const visitedEdges = new Set<string>();

    // 方向定义（顺时针顺序）
    const directions = [
      { dx: 0, dy: -1 }, // 上
      { dx: 1, dy: 0 }, // 右
      { dx: 0, dy: 1 }, // 下
      { dx: -1, dy: 0 }, // 左
    ];

    let currentPoint = startPoint;
    let currentDir = 0; // 起始方向：向右

    do {
      boundary.push(currentPoint);

      // 尝试从当前方向开始，顺时针寻找下一个边界点
      let foundNext = false;
      for (let i = 0; i < 4; i++) {
        const dirIndex = (currentDir + 3 + i) % 4; // 从左侧开始（逆时针检查）
        const dir = directions[dirIndex];

        const nextX = currentPoint.x + dir.dx;
        const nextY = currentPoint.y + dir.dy;

        const gridX = nextX - minX + 1;
        const gridY = nextY - minY + 1;

        // 检查是否在网格范围内且是大陆点
        if (
          gridY >= 0 &&
          gridY < gridHeight &&
          gridX >= 0 &&
          gridX < gridWidth &&
          grid[gridY][gridX]
        ) {
          const edgeKey = `${currentPoint.x},${currentPoint.y}-${nextX},${nextY}`;
          if (!visitedEdges.has(edgeKey)) {
            visitedEdges.add(edgeKey);
            currentPoint = { x: nextX, y: nextY };
            currentDir = dirIndex;
            foundNext = true;
            break;
          }
        }
      }

      if (!foundNext) {
        // 如果没有找到下一个点，尝试其他方向
        for (const dir of directions) {
          const nextX = currentPoint.x + dir.dx;
          const nextY = currentPoint.y + dir.dy;

          const gridX = nextX - minX + 1;
          const gridY = nextY - minY + 1;

          if (
            gridY >= 0 &&
            gridY < gridHeight &&
            gridX >= 0 &&
            gridX < gridWidth &&
            grid[gridY][gridX]
          ) {
            const edgeKey = `${currentPoint.x},${currentPoint.y}-${nextX},${nextY}`;
            if (!visitedEdges.has(edgeKey)) {
              visitedEdges.add(edgeKey);
              currentPoint = { x: nextX, y: nextY };
              foundNext = true;
              break;
            }
          }
        }
      }

      if (!foundNext) {
        break; // 无法找到下一个点，退出循环
      }
    } while (
      currentPoint.x !== startPoint.x ||
      currentPoint.y !== startPoint.y
    );

    // 简化边界点（去除共线点）
    return simplifyBoundary(boundary);
  }

  // 简化边界，去除不必要的点
  function simplifyBoundary(boundary: Point[], tolerance: number = 1): Point[] {
    if (boundary.length < 4) return boundary;

    const simplified: Point[] = [boundary[0]];

    for (let i = 1; i < boundary.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const current = boundary[i];
      const next = boundary[i + 1];

      // 检查三点是否近似共线
      const area = Math.abs(
        (prev.x * (current.y - next.y) +
          current.x * (next.y - prev.y) +
          next.x * (prev.y - current.y)) /
          2
      );

      // 如果面积大于容差，保留该点
      if (area > tolerance) {
        simplified.push(current);
      }
    }

    simplified.push(boundary[boundary.length - 1]);
    return simplified;
  }

  // 主循环：遍历所有点寻找大陆
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 如果该点高于海平面且未被访问，则发现新大陆
      if (!visited[y][x] && elevationMap[y][x] > threshold) {
        const continentPoints = floodFill(x, y);

        // 最小大陆大小阈值
        const vertices = extractVertices(continentPoints);
        const center = calculateCenter(continentPoints);
        const avgElevation =
          continentPoints.reduce(
            (sum, point) => sum + elevationMap[point.y][point.x],
            0
          ) / continentPoints.length;
        const terrain = determineTerrain(
          continentPoints,
          threshold,
          avgElevation
        );

        const continentArea = calculateContinentArea(continentPoints);

        const continent: Landmass = {
          vertices,
          area: continentArea, // 使用实际点数面积
          center,
          terrain,
          countries: [], // 国家信息需要额外数据
        };

        continents.push(continent);
      }
    }
  }

  return continents;
}
