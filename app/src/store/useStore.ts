import { create } from 'zustand';
import type {
  Project,
  ToolMode,
  Point,
  Scale,
  Land,
  Road,
  RoadType,
  ChikaKubun,
  ImageInfo,
  CalculationResult,
  SoteiSeikeiChi,
  UsageUnit,
  DrawingLine,
  DrawingLineType,
} from '../types';

interface AppState {
  // プロジェクト
  project: Project;

  // UIステート
  currentTool: ToolMode;
  selectedLandId: string | null;
  selectedRoadId: string | null;
  isDrawingLand: boolean;
  isDrawingRoad: boolean;
  isDrawingLine: boolean;
  isDrawingUsageUnit: boolean;
  isSettingScale: boolean;
  scalePoints: Point[];
  currentLandVertices: Point[];
  currentRoadPoints: Point[];
  currentLinePoints: Point[];
  currentLineType: DrawingLineType | null;
  selectedEdge: { landId: string; startIndex: number; endIndex: number } | null;
  currentUsageUnitVertices: Point[];
  currentUsageUnitLandId: string | null;

  // キャンバス状態
  zoom: number;
  panOffset: Point;
  canvasRotation: number; // 回転角度（度）

  // 計算結果
  calculationResults: Map<string, CalculationResult>;
  soteiSeikeiChi: SoteiSeikeiChi | null;

  // アクション
  setProject: (project: Project) => void;
  setImage: (image: ImageInfo) => void;
  setScale: (scale: Scale) => void;
  setCurrentTool: (tool: ToolMode) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point) => void;
  setCanvasRotation: (rotation: number) => void;
  alignRoadToTop: (roadType: RoadType) => void;

  // 基準尺設定
  startScaleSetting: () => void;
  addScalePoint: (point: Point) => void;
  finishScaleSetting: (realDistance: number) => void;
  cancelScaleSetting: () => void;

  // 土地作図
  startLandDrawing: () => void;
  addLandVertex: (point: Point) => void;
  finishLandDrawing: (name: string, chikaKubun: ChikaKubun) => void;
  cancelLandDrawing: () => void;
  updateLandVertex: (landId: string, vertexIndex: number, point: Point) => void;
  deleteLand: (landId: string) => void;
  selectLand: (landId: string | null) => void;
  updateLandActualArea: (landId: string, actualArea: number | undefined) => void;
  setLandFrontageIndices: (landId: string, frontageIndices: [number, number] | undefined) => void;
  setLandPassageArea: (landId: string, passageArea: number | undefined) => void;

  // 路線設定
  startRoadDrawing: (landId: string) => void;
  addRoadPoint: (point: Point) => void;
  finishRoadDrawing: (rosenka: number) => void;
  cancelRoadDrawing: () => void;
  deleteRoad: (landId: string, roadId: string) => void;
  selectRoad: (roadId: string | null) => void;
  createRoadFromVertices: (landId: string, startVertexIndex: number, endVertexIndex: number, rosenka: number, roadType: RoadType) => void;

  // 計算
  setCalculationResult: (landId: string, result: CalculationResult) => void;
  setSoteiSeikeiChi: (sotei: SoteiSeikeiChi | null) => void;

  // 利用単位
  startUsageUnitDrawing: (landId: string) => void;
  addUsageUnitVertex: (point: Point) => void;
  finishUsageUnitDrawing: (name: string) => void;
  cancelUsageUnitDrawing: () => void;
  deleteUsageUnit: (landId: string, unitId: string) => void;

  // 描画線
  startLineDrawing: (lineType: DrawingLineType) => void;
  addLinePoint: (point: Point) => void;
  finishLineDrawing: () => void;
  cancelLineDrawing: () => void;
  deleteDrawingLine: (lineId: string) => void;
  setSelectedEdge: (edge: { landId: string; startIndex: number; endIndex: number } | null) => void;

  // リセット
  resetProject: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialProject: Project = {
  id: generateId(),
  name: '新規プロジェクト',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  image: null,
  scale: null,
  lands: [],
  drawingLines: [],
  settings: {
    displayPrecision: 2,
    areaUnit: '㎡',
  },
};

export const useStore = create<AppState>((set) => ({
  // 初期状態
  project: initialProject,
  currentTool: 'select',
  selectedLandId: null,
  selectedRoadId: null,
  isDrawingLand: false,
  isDrawingRoad: false,
  isDrawingLine: false,
  isDrawingUsageUnit: false,
  isSettingScale: false,
  scalePoints: [],
  currentLandVertices: [],
  currentRoadPoints: [],
  currentLinePoints: [],
  currentLineType: null,
  selectedEdge: null,
  currentUsageUnitVertices: [],
  currentUsageUnitLandId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  canvasRotation: 0,
  calculationResults: new Map(),
  soteiSeikeiChi: null,

  // アクション実装
  setProject: (project) => set({ project }),

  setImage: (image) =>
    set((state) => ({
      project: { ...state.project, image, updatedAt: new Date().toISOString() },
    })),

  setScale: (scale) =>
    set((state) => ({
      project: { ...state.project, scale, updatedAt: new Date().toISOString() },
    })),

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setCanvasRotation: (rotation) => set({ canvasRotation: rotation }),

  alignRoadToTop: (roadType) =>
    set((state) => {
      // 選択中または最初の土地を取得
      const land = state.selectedLandId
        ? state.project.lands.find((l) => l.id === state.selectedLandId)
        : state.project.lands[0];

      if (!land) return {};

      // 指定された路線を取得
      const road = land.roads.find((r) => r.type === roadType);
      if (!road || !road.vertexIndices) return {};

      // 路線の2点を取得
      const [startIdx, endIdx] = road.vertexIndices;
      const p1 = land.vertices[startIdx];
      const p2 = land.vertices[endIdx];

      if (!p1 || !p2) return {};

      // 路線の角度を計算（水平方向からの角度）
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = angleRad * (180 / Math.PI);

      // 路線を上（-90度）に向けるための回転角度
      // 路線を水平（上向き）にするには、現在の角度から90度を引く
      const rotationToApply = -angleDeg - 90;

      return { canvasRotation: rotationToApply };
    }),

  // 基準尺設定
  startScaleSetting: () =>
    set({ isSettingScale: true, scalePoints: [], currentTool: 'scale' }),

  addScalePoint: (point) =>
    set((state) => ({
      scalePoints: [...state.scalePoints, point],
    })),

  finishScaleSetting: (realDistance) =>
    set((state) => {
      if (state.scalePoints.length !== 2) return state;

      const [p1, p2] = state.scalePoints;
      const pixelDistance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      const pixelsPerMeter = pixelDistance / realDistance;

      const scale: Scale = {
        points: [p1, p2],
        realDistanceMeters: realDistance,
        pixelsPerMeter,
      };

      return {
        project: { ...state.project, scale, updatedAt: new Date().toISOString() },
        isSettingScale: false,
        scalePoints: [],
        currentTool: 'select',
      };
    }),

  cancelScaleSetting: () =>
    set({ isSettingScale: false, scalePoints: [], currentTool: 'select' }),

  // 土地作図
  startLandDrawing: () =>
    set({ isDrawingLand: true, currentLandVertices: [], currentTool: 'land' }),

  addLandVertex: (point) =>
    set((state) => ({
      currentLandVertices: [...state.currentLandVertices, point],
    })),

  finishLandDrawing: (name, chikaKubun) =>
    set((state) => {
      if (state.currentLandVertices.length < 3) return state;

      const newLand: Land = {
        id: generateId(),
        name,
        vertices: state.currentLandVertices,
        roads: [],
        areaType: '宅地',
        chikaKubun,
      };

      return {
        project: {
          ...state.project,
          lands: [...state.project.lands, newLand],
          updatedAt: new Date().toISOString(),
        },
        isDrawingLand: false,
        currentLandVertices: [],
        currentTool: 'select',
        selectedLandId: newLand.id,
      };
    }),

  cancelLandDrawing: () =>
    set({ isDrawingLand: false, currentLandVertices: [], currentTool: 'select' }),

  updateLandVertex: (landId, vertexIndex, point) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? {
                ...land,
                vertices: land.vertices.map((v, i) =>
                  i === vertexIndex ? point : v
                ),
              }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  deleteLand: (landId) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.filter((land) => land.id !== landId),
        updatedAt: new Date().toISOString(),
      },
      selectedLandId: state.selectedLandId === landId ? null : state.selectedLandId,
    })),

  selectLand: (landId) => set({ selectedLandId: landId }),

  updateLandActualArea: (landId, actualArea) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? { ...land, actualArea }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  setLandFrontageIndices: (landId, frontageIndices) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? { ...land, frontageIndices }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  setLandPassageArea: (landId, passageArea) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? { ...land, passageArea }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  // 路線設定
  startRoadDrawing: (landId) =>
    set({
      isDrawingRoad: true,
      currentRoadPoints: [],
      currentTool: 'road',
      selectedLandId: landId,
    }),

  addRoadPoint: (point) =>
    set((state) => ({
      currentRoadPoints: [...state.currentRoadPoints, point],
    })),

  finishRoadDrawing: (rosenka) =>
    set((state) => {
      if (state.currentRoadPoints.length !== 2 || !state.selectedLandId) return state;

      const [p1, p2] = state.currentRoadPoints;
      const selectedLand = state.project.lands.find(
        (l) => l.id === state.selectedLandId
      );

      // 正面路線が未設定なら正面、それ以外は側方１
      const roadType = selectedLand?.roads.some((r) => r.type === '正面')
        ? '側方１'
        : '正面';

      const newRoad: Road = {
        id: generateId(),
        type: roadType,
        points: [p1, p2],
        rosenka,
        shakuchiken: 'D',
        isKadochi: false,
      };

      return {
        project: {
          ...state.project,
          lands: state.project.lands.map((land) =>
            land.id === state.selectedLandId
              ? { ...land, roads: [...land.roads, newRoad] }
              : land
          ),
          updatedAt: new Date().toISOString(),
        },
        isDrawingRoad: false,
        currentRoadPoints: [],
        currentTool: 'select',
      };
    }),

  cancelRoadDrawing: () =>
    set({ isDrawingRoad: false, currentRoadPoints: [], currentTool: 'select' }),

  deleteRoad: (landId, roadId) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? { ...land, roads: land.roads.filter((r) => r.id !== roadId) }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  selectRoad: (roadId) => set({ selectedRoadId: roadId }),

  createRoadFromVertices: (landId, startVertexIndex, endVertexIndex, rosenka, roadType) =>
    set((state) => {
      const land = state.project.lands.find((l) => l.id === landId);
      if (!land) return state;

      const p1 = land.vertices[startVertexIndex];
      const p2 = land.vertices[endVertexIndex];
      if (!p1 || !p2) return state;

      // 同じ種別の路線が既に存在するかチェック
      const existingRoadIndex = land.roads.findIndex((r) => r.type === roadType);

      if (existingRoadIndex >= 0) {
        // 既存の路線を更新
        const updatedRoads = [...land.roads];
        updatedRoads[existingRoadIndex] = {
          ...updatedRoads[existingRoadIndex],
          points: [p1, p2],
          vertexIndices: [startVertexIndex, endVertexIndex],
          rosenka,
        };

        return {
          project: {
            ...state.project,
            lands: state.project.lands.map((l) =>
              l.id === landId
                ? { ...l, roads: updatedRoads }
                : l
            ),
            updatedAt: new Date().toISOString(),
          },
        };
      } else {
        // 新規路線を作成
        const newRoad: Road = {
          id: generateId(),
          type: roadType,
          points: [p1, p2],
          vertexIndices: [startVertexIndex, endVertexIndex],
          rosenka,
          shakuchiken: 'D',
          isKadochi: false,
        };

        return {
          project: {
            ...state.project,
            lands: state.project.lands.map((l) =>
              l.id === landId
                ? { ...l, roads: [...l.roads, newRoad] }
                : l
            ),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }),

  // 計算
  setCalculationResult: (landId, result) =>
    set((state) => {
      const newResults = new Map(state.calculationResults);
      newResults.set(landId, result);
      return { calculationResults: newResults };
    }),

  setSoteiSeikeiChi: (sotei) => set({ soteiSeikeiChi: sotei }),

  // 利用単位
  startUsageUnitDrawing: (landId) =>
    set({
      isDrawingUsageUnit: true,
      currentUsageUnitVertices: [],
      currentUsageUnitLandId: landId,
      currentTool: 'usageUnit',
    }),

  addUsageUnitVertex: (point) =>
    set((state) => ({
      currentUsageUnitVertices: [...state.currentUsageUnitVertices, point],
    })),

  finishUsageUnitDrawing: (name) =>
    set((state) => {
      if (state.currentUsageUnitVertices.length < 3 || !state.currentUsageUnitLandId) {
        return state;
      }

      // 利用単位の色パレット
      const unitColors = [
        '#3B82F6', // blue
        '#10B981', // green
        '#F59E0B', // amber
        '#EF4444', // red
        '#8B5CF6', // violet
        '#EC4899', // pink
      ];

      const targetLand = state.project.lands.find((l) => l.id === state.currentUsageUnitLandId);
      const existingUnitsCount = targetLand?.usageUnits?.length || 0;
      const color = unitColors[existingUnitsCount % unitColors.length];

      const newUnit: UsageUnit = {
        id: generateId(),
        name,
        vertices: state.currentUsageUnitVertices,
        color,
      };

      return {
        project: {
          ...state.project,
          lands: state.project.lands.map((land) =>
            land.id === state.currentUsageUnitLandId
              ? {
                  ...land,
                  usageUnits: [...(land.usageUnits || []), newUnit],
                }
              : land
          ),
          updatedAt: new Date().toISOString(),
        },
        isDrawingUsageUnit: false,
        currentUsageUnitVertices: [],
        currentUsageUnitLandId: null,
        currentTool: 'select',
      };
    }),

  cancelUsageUnitDrawing: () =>
    set({
      isDrawingUsageUnit: false,
      currentUsageUnitVertices: [],
      currentUsageUnitLandId: null,
      currentTool: 'select',
    }),

  deleteUsageUnit: (landId, unitId) =>
    set((state) => ({
      project: {
        ...state.project,
        lands: state.project.lands.map((land) =>
          land.id === landId
            ? {
                ...land,
                usageUnits: (land.usageUnits || []).filter((u) => u.id !== unitId),
              }
            : land
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  // 描画線
  startLineDrawing: (lineType) => {
    const toolMap: Record<DrawingLineType, ToolMode> = {
      '直線': 'line',
      '垂線': 'perpendicular',
      '延線': 'extension',
      '平行': 'parallel',
    };
    return set({
      isDrawingLine: true,
      currentLinePoints: [],
      currentLineType: lineType,
      currentTool: toolMap[lineType],
      selectedEdge: null,
    });
  },

  addLinePoint: (point) =>
    set((state) => ({
      currentLinePoints: [...state.currentLinePoints, point],
    })),

  finishLineDrawing: () =>
    set((state) => {
      if (state.currentLinePoints.length !== 2 || !state.currentLineType) return state;

      const [p1, p2] = state.currentLinePoints;
      const colorMap: Record<DrawingLineType, string> = {
        '直線': '#333333',
        '垂線': '#9900CC',
        '延線': '#009900',
        '平行': '#0066CC',
      };

      const newLine: DrawingLine = {
        id: generateId(),
        type: state.currentLineType,
        points: [p1, p2],
        color: colorMap[state.currentLineType],
        referenceEdge: state.selectedEdge || undefined,
      };

      return {
        project: {
          ...state.project,
          drawingLines: [...state.project.drawingLines, newLine],
          updatedAt: new Date().toISOString(),
        },
        isDrawingLine: false,
        currentLinePoints: [],
        currentLineType: null,
        selectedEdge: null,
        currentTool: 'select',
      };
    }),

  cancelLineDrawing: () =>
    set({
      isDrawingLine: false,
      currentLinePoints: [],
      currentLineType: null,
      selectedEdge: null,
      currentTool: 'select',
    }),

  deleteDrawingLine: (lineId) =>
    set((state) => ({
      project: {
        ...state.project,
        drawingLines: state.project.drawingLines.filter((l) => l.id !== lineId),
        updatedAt: new Date().toISOString(),
      },
    })),

  setSelectedEdge: (edge) => set({ selectedEdge: edge }),

  // リセット
  resetProject: () =>
    set({
      project: { ...initialProject, id: generateId(), createdAt: new Date().toISOString() },
      selectedLandId: null,
      selectedRoadId: null,
      calculationResults: new Map(),
      soteiSeikeiChi: null,
    }),
}));
