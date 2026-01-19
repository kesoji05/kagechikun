import type { Point, Scale, Land, SoteiSeikeiChi, Road } from '../types';

/**
 * 多角形の面積を計算（Shoelace formula / ガウスの面積公式）
 * @param vertices 頂点座標の配列（ピクセル単位）
 * @returns 面積（ピクセル^2）
 */
export function calculatePolygonAreaPixels(vertices: Point[]): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * ピクセル面積を平方メートルに変換
 */
export function pixelAreaToSquareMeters(pixelArea: number, scale: Scale): number {
  return pixelArea / (scale.pixelsPerMeter * scale.pixelsPerMeter);
}

/**
 * ピクセル距離をメートルに変換
 */
export function pixelDistanceToMeters(pixelDistance: number, scale: Scale): number {
  return pixelDistance / scale.pixelsPerMeter;
}

/**
 * 2点間の距離（ピクセル）
 */
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * 地積（実面積）からピクセルあたりのメートル数を計算
 * @param actualArea 実際の面積（㎡）
 * @param vertices 頂点座標の配列（ピクセル単位）
 * @returns 1ピクセルあたりのメートル数（メートル/ピクセル）
 */
export function calculateScaleFromArea(actualArea: number, vertices: Point[]): number {
  const pixelArea = calculatePolygonAreaPixels(vertices);
  if (pixelArea === 0 || actualArea <= 0) return 0;

  // 面積比からスケールを逆算: actualArea = pixelArea / (pixelsPerMeter^2)
  // よって pixelsPerMeter = sqrt(pixelArea / actualArea)
  // metersPerPixel = 1 / pixelsPerMeter = sqrt(actualArea / pixelArea)
  return Math.sqrt(actualArea / pixelArea);
}

/**
 * 各辺の長さを計算（地積ベースのスケール使用）
 * @param vertices 頂点座標の配列
 * @param actualArea 実際の面積（㎡）
 * @returns 各辺の長さの配列（メートル単位）。インデックスiは頂点iと頂点(i+1)間の距離
 */
export function calculateEdgeLengthsFromArea(vertices: Point[], actualArea: number): number[] {
  if (vertices.length < 2 || actualArea <= 0) return [];

  const metersPerPixel = calculateScaleFromArea(actualArea, vertices);
  if (metersPerPixel === 0) return [];

  const edgeLengths: number[] = [];
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pixelDistance = distanceBetweenPoints(vertices[i], vertices[j]);
    const meterDistance = pixelDistance * metersPerPixel;
    edgeLengths.push(meterDistance);
  }

  return edgeLengths;
}

/**
 * 辺の情報を取得（始点番号、終点番号、長さ）
 */
export interface EdgeInfo {
  startIndex: number;  // 始点の頂点番号（0-indexed）
  endIndex: number;    // 終点の頂点番号（0-indexed）
  length: number;      // 長さ（メートル）
}

/**
 * 各辺の詳細情報を計算
 */
export function calculateEdgeInfos(vertices: Point[], actualArea: number): EdgeInfo[] {
  const lengths = calculateEdgeLengthsFromArea(vertices, actualArea);
  const n = vertices.length;

  return lengths.map((length, i) => ({
    startIndex: i,
    endIndex: (i + 1) % n,
    length,
  }));
}

/**
 * 多角形の重心を計算
 */
export function calculateCentroid(vertices: Point[]): Point {
  if (vertices.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;

  for (const v of vertices) {
    sumX += v.x;
    sumY += v.y;
  }

  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length,
  };
}

/**
 * 路線の方向ベクトルを取得（正規化済み）
 */
export function getRoadDirection(road: Road): Point {
  const [p1, p2] = road.points;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return { x: 1, y: 0 };

  return {
    x: dx / length,
    y: dy / length,
  };
}

/**
 * 路線に垂直な方向ベクトルを取得
 */
export function getPerpendicularDirection(road: Road): Point {
  const dir = getRoadDirection(road);
  return {
    x: -dir.y,
    y: dir.x,
  };
}

/**
 * 点を直線上に投影した座標を取得
 */
export function projectPointOntoLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return lineStart;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq
    )
  );

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * 点から直線への距離
 */
export function pointToLineDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const projected = projectPointOntoLine(point, lineStart, lineEnd);
  return distanceBetweenPoints(point, projected);
}

/**
 * 想定整形地（最小外接矩形）を計算
 * 正面路線に平行な辺を持つ矩形
 */
export function calculateSoteiSeikeiChi(
  landVertices: Point[],
  frontRoad: Road,
  scale: Scale
): SoteiSeikeiChi {
  if (landVertices.length < 3) {
    return { vertices: [], area: 0, width: 0, height: 0 };
  }

  // 路線の方向ベクトルと垂直ベクトル
  const roadDir = getRoadDirection(frontRoad);
  const perpDir = getPerpendicularDirection(frontRoad);

  // 各頂点を路線方向と垂直方向に投影
  let minAlongRoad = Infinity;
  let maxAlongRoad = -Infinity;
  let minPerpendicular = Infinity;
  let maxPerpendicular = -Infinity;

  // 路線上の基準点
  const roadOrigin = frontRoad.points[0];

  for (const vertex of landVertices) {
    // 頂点から路線原点への相対ベクトル
    const relX = vertex.x - roadOrigin.x;
    const relY = vertex.y - roadOrigin.y;

    // 路線方向への投影
    const alongRoad = relX * roadDir.x + relY * roadDir.y;
    // 垂直方向への投影
    const perpendicular = relX * perpDir.x + relY * perpDir.y;

    minAlongRoad = Math.min(minAlongRoad, alongRoad);
    maxAlongRoad = Math.max(maxAlongRoad, alongRoad);
    minPerpendicular = Math.min(minPerpendicular, perpendicular);
    maxPerpendicular = Math.max(maxPerpendicular, perpendicular);
  }

  // 矩形の幅（路線方向）と高さ（奥行方向）
  const widthPixels = maxAlongRoad - minAlongRoad;
  const heightPixels = maxPerpendicular - minPerpendicular;

  // 4つの頂点を計算
  const corners: Point[] = [
    {
      x: roadOrigin.x + minAlongRoad * roadDir.x + minPerpendicular * perpDir.x,
      y: roadOrigin.y + minAlongRoad * roadDir.y + minPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + maxAlongRoad * roadDir.x + minPerpendicular * perpDir.x,
      y: roadOrigin.y + maxAlongRoad * roadDir.y + minPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + maxAlongRoad * roadDir.x + maxPerpendicular * perpDir.x,
      y: roadOrigin.y + maxAlongRoad * roadDir.y + maxPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + minAlongRoad * roadDir.x + maxPerpendicular * perpDir.x,
      y: roadOrigin.y + minAlongRoad * roadDir.y + maxPerpendicular * perpDir.y,
    },
  ];

  // メートルに変換
  const widthMeters = pixelDistanceToMeters(widthPixels, scale);
  const heightMeters = pixelDistanceToMeters(heightPixels, scale);
  const areaMeters = widthMeters * heightMeters;

  return {
    vertices: corners,
    area: areaMeters,
    width: widthMeters,
    height: heightMeters,
  };
}

/**
 * 間口距離を計算（土地と路線の接する長さ）
 */
export function calculateFrontage(
  landVertices: Point[],
  frontRoad: Road,
  scale: Scale
): number {
  const roadDir = getRoadDirection(frontRoad);
  const roadOrigin = frontRoad.points[0];

  // 土地の各頂点を路線方向に投影
  let minProj = Infinity;
  let maxProj = -Infinity;

  for (const vertex of landVertices) {
    const relX = vertex.x - roadOrigin.x;
    const relY = vertex.y - roadOrigin.y;
    const proj = relX * roadDir.x + relY * roadDir.y;

    minProj = Math.min(minProj, proj);
    maxProj = Math.max(maxProj, proj);
  }

  const frontagePixels = maxProj - minProj;
  return pixelDistanceToMeters(frontagePixels, scale);
}

/**
 * 奥行距離を計算
 */
export function calculateDepth(
  landVertices: Point[],
  frontRoad: Road,
  scale: Scale
): number {
  const perpDir = getPerpendicularDirection(frontRoad);
  const roadOrigin = frontRoad.points[0];

  let minProj = Infinity;
  let maxProj = -Infinity;

  for (const vertex of landVertices) {
    const relX = vertex.x - roadOrigin.x;
    const relY = vertex.y - roadOrigin.y;
    const proj = relX * perpDir.x + relY * perpDir.y;

    minProj = Math.min(minProj, proj);
    maxProj = Math.max(maxProj, proj);
  }

  const depthPixels = maxProj - minProj;
  return pixelDistanceToMeters(depthPixels, scale);
}

/**
 * かげ地割合を計算
 */
export function calculateKagechiWariai(
  landArea: number,
  soteiSeikeichiArea: number
): number {
  if (soteiSeikeichiArea === 0) return 0;
  return ((soteiSeikeichiArea - landArea) / soteiSeikeichiArea) * 100;
}

/**
 * 計算上の奥行距離を計算
 */
export function calculateCalculatedDepth(landArea: number, frontage: number): number {
  if (frontage === 0) return 0;
  return landArea / frontage;
}

/**
 * 土地評価の基本計算を実行（従来のScale使用版）
 */
export function calculateLandBasics(
  land: Land,
  scale: Scale
): {
  landArea: number;
  frontage: number;
  depth: number;
  calculatedDepth: number;
  soteiSeikeiChi: SoteiSeikeiChi | null;
  kagechWariai: number;
} | null {
  if (land.vertices.length < 3 || !scale) {
    return null;
  }

  const frontRoad = land.roads.find((r) => r.type === '正面');
  if (!frontRoad) {
    // 路線がない場合は面積のみ計算
    const areaPixels = calculatePolygonAreaPixels(land.vertices);
    const landArea = pixelAreaToSquareMeters(areaPixels, scale);

    return {
      landArea,
      frontage: 0,
      depth: 0,
      calculatedDepth: 0,
      soteiSeikeiChi: null,
      kagechWariai: 0,
    };
  }

  // 面積計算
  const areaPixels = calculatePolygonAreaPixels(land.vertices);
  const landArea = pixelAreaToSquareMeters(areaPixels, scale);

  // 間口・奥行計算
  const frontage = calculateFrontage(land.vertices, frontRoad, scale);
  const depth = calculateDepth(land.vertices, frontRoad, scale);
  const calculatedDepth = calculateCalculatedDepth(landArea, frontage);

  // 想定整形地計算
  const soteiSeikeiChi = calculateSoteiSeikeiChi(land.vertices, frontRoad, scale);

  // かげ地割合計算
  const kagechWariai = calculateKagechiWariai(landArea, soteiSeikeiChi.area);

  return {
    landArea,
    frontage,
    depth,
    calculatedDepth,
    soteiSeikeiChi,
    kagechWariai,
  };
}

/**
 * 想定整形地を計算（地積ベース版）
 * 正面路線に平行な辺を持つ矩形を地積から導出したスケールで計算
 */
export function calculateSoteiSeikeiChiFromArea(
  landVertices: Point[],
  frontRoad: Road,
  actualArea: number
): SoteiSeikeiChi {
  if (landVertices.length < 3 || actualArea <= 0) {
    return { vertices: [], area: 0, width: 0, height: 0 };
  }

  // 地積からスケール（メートル/ピクセル）を計算
  const metersPerPixel = calculateScaleFromArea(actualArea, landVertices);
  if (metersPerPixel === 0) {
    return { vertices: [], area: 0, width: 0, height: 0 };
  }

  // 路線の方向ベクトルと垂直ベクトル
  const roadDir = getRoadDirection(frontRoad);
  const perpDir = getPerpendicularDirection(frontRoad);

  // 各頂点を路線方向と垂直方向に投影
  let minAlongRoad = Infinity;
  let maxAlongRoad = -Infinity;
  let minPerpendicular = Infinity;
  let maxPerpendicular = -Infinity;

  // 路線上の基準点
  const roadOrigin = frontRoad.points[0];

  for (const vertex of landVertices) {
    const relX = vertex.x - roadOrigin.x;
    const relY = vertex.y - roadOrigin.y;

    const alongRoad = relX * roadDir.x + relY * roadDir.y;
    const perpendicular = relX * perpDir.x + relY * perpDir.y;

    minAlongRoad = Math.min(minAlongRoad, alongRoad);
    maxAlongRoad = Math.max(maxAlongRoad, alongRoad);
    minPerpendicular = Math.min(minPerpendicular, perpendicular);
    maxPerpendicular = Math.max(maxPerpendicular, perpendicular);
  }

  // 矩形の幅（路線方向）と高さ（奥行方向）- ピクセル単位
  const widthPixels = maxAlongRoad - minAlongRoad;
  const heightPixels = maxPerpendicular - minPerpendicular;

  // 4つの頂点を計算
  const corners: Point[] = [
    {
      x: roadOrigin.x + minAlongRoad * roadDir.x + minPerpendicular * perpDir.x,
      y: roadOrigin.y + minAlongRoad * roadDir.y + minPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + maxAlongRoad * roadDir.x + minPerpendicular * perpDir.x,
      y: roadOrigin.y + maxAlongRoad * roadDir.y + minPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + maxAlongRoad * roadDir.x + maxPerpendicular * perpDir.x,
      y: roadOrigin.y + maxAlongRoad * roadDir.y + maxPerpendicular * perpDir.y,
    },
    {
      x: roadOrigin.x + minAlongRoad * roadDir.x + maxPerpendicular * perpDir.x,
      y: roadOrigin.y + minAlongRoad * roadDir.y + maxPerpendicular * perpDir.y,
    },
  ];

  // メートルに変換
  const widthMeters = widthPixels * metersPerPixel;
  const heightMeters = heightPixels * metersPerPixel;
  const areaMeters = widthMeters * heightMeters;

  return {
    vertices: corners,
    area: areaMeters,
    width: widthMeters,
    height: heightMeters,
  };
}

/**
 * 土地評価の基本計算を実行（地積ベース版）
 * スケール設定不要、地積から自動計算
 */
export function calculateLandBasicsFromArea(
  land: Land
): {
  landArea: number;
  frontage: number;
  depth: number;
  calculatedDepth: number;
  soteiSeikeiChi: SoteiSeikeiChi | null;
  kagechWariai: number;
} | null {
  if (land.vertices.length < 3 || !land.actualArea || land.actualArea <= 0) {
    return null;
  }

  const actualArea = land.actualArea;
  const metersPerPixel = calculateScaleFromArea(actualArea, land.vertices);
  if (metersPerPixel === 0) {
    return null;
  }

  const frontRoad = land.roads.find((r) => r.type === '正面');
  if (!frontRoad) {
    // 路線がない場合は面積のみ
    return {
      landArea: actualArea,
      frontage: 0,
      depth: 0,
      calculatedDepth: 0,
      soteiSeikeiChi: null,
      kagechWariai: 0,
    };
  }

  // 間口・奥行計算（ピクセル → メートル）
  const roadDir = getRoadDirection(frontRoad);
  const perpDir = getPerpendicularDirection(frontRoad);
  const roadOrigin = frontRoad.points[0];

  let minAlongRoad = Infinity;
  let maxAlongRoad = -Infinity;
  let minPerpendicular = Infinity;
  let maxPerpendicular = -Infinity;

  for (const vertex of land.vertices) {
    const relX = vertex.x - roadOrigin.x;
    const relY = vertex.y - roadOrigin.y;

    const alongRoad = relX * roadDir.x + relY * roadDir.y;
    const perpendicular = relX * perpDir.x + relY * perpDir.y;

    minAlongRoad = Math.min(minAlongRoad, alongRoad);
    maxAlongRoad = Math.max(maxAlongRoad, alongRoad);
    minPerpendicular = Math.min(minPerpendicular, perpendicular);
    maxPerpendicular = Math.max(maxPerpendicular, perpendicular);
  }

  const frontagePixels = maxAlongRoad - minAlongRoad;
  const depthPixels = maxPerpendicular - minPerpendicular;

  const frontage = frontagePixels * metersPerPixel;
  const depth = depthPixels * metersPerPixel;
  const calculatedDepth = calculateCalculatedDepth(actualArea, frontage);

  // 想定整形地計算
  const soteiSeikeiChi = calculateSoteiSeikeiChiFromArea(land.vertices, frontRoad, actualArea);

  // かげ地割合計算
  const kagechWariai = calculateKagechiWariai(actualArea, soteiSeikeiChi.area);

  return {
    landArea: actualArea,
    frontage,
    depth,
    calculatedDepth,
    soteiSeikeiChi,
    kagechWariai,
  };
}
