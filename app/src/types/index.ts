// 座標点
export interface Point {
  x: number;
  y: number;
}

// 地区区分
export type ChikaKubun =
  | 'ビル街地区'
  | '高度商業地区'
  | '繁華街地区'
  | '普通商業・併用住宅地区'
  | '普通住宅地区'
  | '中小工場地区'
  | '大工場地区';

// 借地権割合
export type ShakuchikenWariai = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

// 路線種別
export type RoadType = '正面' | '側方１' | '側方２' | '二方';

// 土地種類
export type AreaType = '宅地' | '田' | '畑' | '山林' | 'その他';

// 路線情報
export interface Road {
  id: string;
  type: RoadType;
  points: [Point, Point];
  vertexIndices?: [number, number]; // 頂点インデックス（始点、終点）
  rosenka: number; // 千円/㎡
  shakuchiken: ShakuchikenWariai;
  isKadochi: boolean;
}

// 利用単位
export interface UsageUnit {
  id: string;
  name: string;
  vertices: Point[]; // 構成する頂点座標
  color: string; // 表示色
}

// 評価対象地
export interface Land {
  id: string;
  name: string;
  vertices: Point[];
  roads: Road[];
  areaType: AreaType;
  chikaKubun: ChikaKubun;
  actualArea?: number; // 実際の地積（㎡）- ユーザー入力
  usageUnits?: UsageUnit[]; // 利用単位
  frontageIndices?: [number, number]; // 間口を構成する頂点インデックス
  passageArea?: number; // 通路の面積（㎡）
  // 無道路地関連
  isRoadlessLand?: boolean; // 無道路地フラグ
  frontRoadLine?: {
    points: [Point, Point]; // 正面路線の座標
    rosenka: number; // 路線価（千円/㎡）
  };
  distanceToFrontRoad?: number; // 正面路線までの距離（m）
  passageWidth?: number; // 通路幅（m）
}

// 基準尺
export interface Scale {
  points: [Point, Point];
  realDistanceMeters: number;
  pixelsPerMeter: number;
}

// 画像情報
export interface ImageInfo {
  fileName: string;
  dataUrl: string;
  width: number;
  height: number;
}

// プロジェクト設定
export interface ProjectSettings {
  displayPrecision: number;
  areaUnit: '㎡' | '坪';
}

// プロジェクト
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  image: ImageInfo | null;
  scale: Scale | null;
  lands: Land[];
  drawingLines: DrawingLine[];
  settings: ProjectSettings;
}

// ツールモード
export type ToolMode =
  | 'select'
  | 'scale'
  | 'land'
  | 'road'
  | 'pan'
  | 'line'
  | 'perpendicular'
  | 'extension'
  | 'parallel'
  | 'usageUnit'
  | 'roadlessFrontRoad'; // 無道路地の正面路線設定

// 描画線種別
export type DrawingLineType = '直線' | '垂線' | '延線' | '平行';

// 描画線
export interface DrawingLine {
  id: string;
  type: DrawingLineType;
  points: [Point, Point];
  color: string;
  referenceEdge?: {
    landId: string;
    startIndex: number;
    endIndex: number;
  };
}

// 想定整形地
export interface SoteiSeikeiChi {
  vertices: Point[];
  area: number;
  width: number;
  height: number;
}

// 計算結果
export interface CalculationResult {
  landId: string;

  // 基本測定値
  landArea: number;           // 評価対象地面積（㎡）
  soteiSeikeichiArea: number; // 想定整形地面積（㎡）
  frontage: number;           // 間口距離（m）
  depth: number;              // 奥行距離（m）
  calculatedDepth: number;    // 計算上の奥行距離（m）
  kagechWariai: number;       // かげ地割合（%）

  // 補正率
  okuyukiHoseiritsu: number;      // 奥行価格補正率
  fuseikeichiHoseiritsu: number;  // 不整形地補正率
  maguchikoshoHoseiritsu: number; // 間口狭小補正率
  okuyukichodaiHoseiritsu: number;// 奥行長大補正率

  // 4つの評価方法の結果
  evaluationMethods: {
    method: '区分整形地' | '計算上の奥行距離' | '近似整形地' | '差引計算';
    applicableRate: number;
    evaluatedValue: number;
    isOptimal: boolean;
  }[];

  // 最終評価額
  finalEvaluatedValue: number;
  optimalMethod: string;
}

// 地積区分
export type ChisekiKubun = 'A' | 'B' | 'C';
