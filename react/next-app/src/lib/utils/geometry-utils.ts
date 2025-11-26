import { Land, Point } from '../types/map';

// 判断两个多边形是否相交
export const doPolygonsIntersect = (poly1: Land, poly2: Land): boolean => {
  // 快速边界框检查
  if (!doBoundingBoxesIntersect(poly1, poly2)) {
    return false;
  }

  // 分离轴定理检查
  return (
    !isSeparatingAxis(poly1.vertices, poly2.vertices) &&
    !isSeparatingAxis(poly2.vertices, poly1.vertices)
  );
};

// 判断两个多边形是否重叠（有公共区域）
export const doPolygonsOverlap = (poly1: Land, poly2: Land): boolean => {
  return doPolygonsIntersect(poly1, poly2);
};

// 判断一个多边形是否完全包含另一个多边形
export const doesPolygonContain = (container: Land, target: Land): boolean => {
  // 检查目标多边形的所有顶点是否都在容器多边形内
  return target.vertices.every((vertex) =>
    isPointInPolygon(vertex, container.vertices)
  );
};

// 判断两个多边形是否相邻（共享边）
export const arePolygonsAdjacent = (
  poly1: Land,
  poly2: Land,
  tolerance: number = 2
): boolean => {
  for (let i = 0; i < poly1.vertices.length; i++) {
    const p1 = poly1.vertices[i];
    const p2 = poly1.vertices[(i + 1) % poly1.vertices.length];

    for (let j = 0; j < poly2.vertices.length; j++) {
      const q1 = poly2.vertices[j];
      const q2 = poly2.vertices[(j + 1) % poly2.vertices.length];

      // 检查两条线段是否相同（在容差范围内）
      if (
        (arePointsEqual(p1, q1, tolerance) &&
          arePointsEqual(p2, q2, tolerance)) ||
        (arePointsEqual(p1, q2, tolerance) && arePointsEqual(p2, q1, tolerance))
      ) {
        return true;
      }
    }
  }
  return false;
};

// 快速边界框检查
const doBoundingBoxesIntersect = (poly1: Land, poly2: Land): boolean => {
  const box1 = getBoundingBox(poly1.vertices);
  const box2 = getBoundingBox(poly2.vertices);

  return !(
    box1.right < box2.left ||
    box1.left > box2.right ||
    box1.bottom < box2.top ||
    box1.top > box2.bottom
  );
};

// 获取多边形的边界框
const getBoundingBox = (
  vertices: Point[]
): { left: number; right: number; top: number; bottom: number } => {
  let left = vertices[0].x;
  let right = vertices[0].x;
  let top = vertices[0].y;
  let bottom = vertices[0].y;

  for (let i = 1; i < vertices.length; i++) {
    const vertex = vertices[i];
    left = Math.min(left, vertex.x);
    right = Math.max(right, vertex.x);
    top = Math.min(top, vertex.y);
    bottom = Math.max(bottom, vertex.y);
  }

  return { left, right, top, bottom };
};

// 分离轴定理实现
const isSeparatingAxis = (verticesA: Point[], verticesB: Point[]): boolean => {
  const countA = verticesA.length;
  // const countB = verticesB.length;

  // 检查多边形A的每条边
  for (let i = 0; i < countA; i++) {
    const p1 = verticesA[i];
    const p2 = verticesA[(i + 1) % countA];

    // 计算边的法向量
    const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

    // 在多边形A上投影
    let minA = Number.MAX_VALUE;
    let maxA = -Number.MAX_VALUE;
    for (const vertex of verticesA) {
      const projection = normal.x * vertex.x + normal.y * vertex.y;
      minA = Math.min(minA, projection);
      maxA = Math.max(maxA, projection);
    }

    // 在多边形B上投影
    let minB = Number.MAX_VALUE;
    let maxB = -Number.MAX_VALUE;
    for (const vertex of verticesB) {
      const projection = normal.x * vertex.x + normal.y * vertex.y;
      minB = Math.min(minB, projection);
      maxB = Math.max(maxB, projection);
    }

    // 如果投影不重叠，则存在分离轴
    if (maxA < minB || maxB < minA) {
      return true;
    }
  }

  return false;
};

// 判断点是否在多边形内（射线法）
const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  const count = polygon.length;

  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

// 判断两个点是否相等（在容差范围内）
const arePointsEqual = (
  p1: Point,
  p2: Point,
  tolerance: number = 1
): boolean => {
  return (
    Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance
  );
};

// 计算两个多边形之间的最小距离
export const getMinDistanceBetweenPolygons = (
  poly1: Land,
  poly2: Land
): number => {
  let minDistance = Number.MAX_VALUE;

  // 检查所有边对之间的最小距离
  for (let i = 0; i < poly1.vertices.length; i++) {
    const p1 = poly1.vertices[i];
    const p2 = poly1.vertices[(i + 1) % poly1.vertices.length];

    for (let j = 0; j < poly2.vertices.length; j++) {
      const q1 = poly2.vertices[j];
      const q2 = poly2.vertices[(j + 1) % poly2.vertices.length];

      const distance = getMinDistanceBetweenSegments(p1, p2, q1, q2);
      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
};

// 计算两条线段之间的最小距离
const getMinDistanceBetweenSegments = (
  p1: Point,
  p2: Point,
  q1: Point,
  q2: Point
): number => {
  // 检查线段是否相交
  if (doSegmentsIntersect(p1, p2, q1, q2)) {
    return 0;
  }

  // 计算四个端点之间的最小距离
  const distances = [
    getPointToSegmentDistance(p1, q1, q2),
    getPointToSegmentDistance(p2, q1, q2),
    getPointToSegmentDistance(q1, p1, p2),
    getPointToSegmentDistance(q2, p1, p2),
  ];

  return Math.min(...distances);
};

// 判断两条线段是否相交
const doSegmentsIntersect = (
  p1: Point,
  p2: Point,
  q1: Point,
  q2: Point
): boolean => {
  const o1 = getOrientation(p1, p2, q1);
  const o2 = getOrientation(p1, p2, q2);
  const o3 = getOrientation(q1, q2, p1);
  const o4 = getOrientation(q1, q2, p2);

  // 一般情况
  if (o1 !== o2 && o3 !== o4) return true;

  // 特殊情况：共线点
  if (o1 === 0 && isOnSegment(p1, q1, p2)) return true;
  if (o2 === 0 && isOnSegment(p1, q2, p2)) return true;
  if (o3 === 0 && isOnSegment(q1, p1, q2)) return true;
  if (o4 === 0 && isOnSegment(q1, p2, q2)) return true;

  return false;
};

// 计算点到线段的距离
const getPointToSegmentDistance = (
  point: Point,
  seg1: Point,
  seg2: Point
): number => {
  const l2 = distanceSquared(seg1, seg2);
  if (l2 === 0) return distance(point, seg1);

  let t =
    ((point.x - seg1.x) * (seg2.x - seg1.x) +
      (point.y - seg1.y) * (seg2.y - seg1.y)) /
    l2;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: seg1.x + t * (seg2.x - seg1.x),
    y: seg1.y + t * (seg2.y - seg1.y),
  };

  return distance(point, projection);
};

// 计算两点之间的距离
const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

// 计算两点之间距离的平方
const distanceSquared = (p1: Point, p2: Point): number => {
  return (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
};

// 计算三点方向（顺时针、逆时针、共线）
const getOrientation = (p: Point, q: Point, r: Point): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0; // 共线
  return val > 0 ? 1 : 2; // 顺时针或逆时针
};

// 判断点r是否在线段pq上
const isOnSegment = (p: Point, r: Point, q: Point): boolean => {
  return (
    r.x <= Math.max(p.x, q.x) &&
    r.x >= Math.min(p.x, q.x) &&
    r.y <= Math.max(p.y, q.y) &&
    r.y >= Math.min(p.y, q.y)
  );
};

// 计算多边形的面积（用于判断多边形方向）
export const getPolygonArea = (vertices: Point[]): number => {
  let area = 0;
  const count = vertices.length;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  return Math.abs(area) / 2;
};

// 判断多边形顶点顺序（顺时针或逆时针）
export const isPolygonClockwise = (vertices: Point[]): boolean => {
  return getPolygonArea(vertices) < 0;
};
