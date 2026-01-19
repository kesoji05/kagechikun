import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Image as FabricImage, Polygon, Line, Circle, Text, FabricObject } from 'fabric';
import { useStore } from '../store/useStore';
import type { Point } from '../types';
import { calculateEdgeInfos } from '../utils/calculations';

// 頂点のカスタムプロパティ用
interface VertexData {
  landId: string;
  vertexIndex: number;
  type: 'land' | 'road' | 'scale';
  roadId?: string;
  pointIndex?: number;
}

export const MainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const isDraggingVertex = useRef(false);

  // ホバー中の頂点インデックス
  const [hoveredDrawingVertexIndex, setHoveredDrawingVertexIndex] = useState<number | null>(null);
  const [hoveredLandVertexInfo, setHoveredLandVertexInfo] = useState<{landId: string, index: number} | null>(null);

  // 拡大鏡用のマウス位置
  const [magnifierPos, setMagnifierPos] = useState<Point | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    project,
    currentTool,
    isDrawingLand,
    isDrawingRoad,
    isDrawingLine,
    isDrawingUsageUnit,
    currentLandVertices,
    currentRoadPoints,
    currentLinePoints,
    currentLineType,
    currentUsageUnitVertices,
    selectedEdge,
    addLandVertex,
    addRoadPoint,
    addLinePoint,
    addUsageUnitVertex,
    finishLandDrawing,
    finishRoadDrawing,
    finishLineDrawing,
    finishUsageUnitDrawing,
    selectedLandId,
    soteiSeikeiChi,
    zoom,
    setZoom,
    canvasRotation,
    updateLandVertex,
    selectLand,
    setSelectedEdge,
  } = useStore();

  // Canvas初期化
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const canvas = new Canvas(canvasRef.current, {
      width: rect.width,
      height: rect.height,
      backgroundColor: '#e5e5e5',
      selection: false,
    });

    fabricRef.current = canvas;

    // オブジェクト移動イベント（頂点ドラッグ）
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      const vertexData = (obj as FabricObject & { vertexData?: VertexData }).vertexData;
      if (vertexData && vertexData.type === 'land') {
        isDraggingVertex.current = true;
        const newX = obj.left || 0;
        const newY = obj.top || 0;
        updateLandVertex(vertexData.landId, vertexData.vertexIndex, { x: newX, y: newY });
      }
    });

    canvas.on('object:modified', () => {
      isDraggingVertex.current = false;
    });

    // リサイズハンドラ
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      canvas.setDimensions({
        width: newRect.width,
        height: newRect.height,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [updateLandVertex]);

  // キャンバス回転の適用
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // キャンバスの中心を基準に回転
    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;

    // 回転の適用
    canvas.setViewportTransform([
      Math.cos((canvasRotation * Math.PI) / 180),
      Math.sin((canvasRotation * Math.PI) / 180),
      -Math.sin((canvasRotation * Math.PI) / 180),
      Math.cos((canvasRotation * Math.PI) / 180),
      centerX - centerX * Math.cos((canvasRotation * Math.PI) / 180) + centerY * Math.sin((canvasRotation * Math.PI) / 180),
      centerY - centerX * Math.sin((canvasRotation * Math.PI) / 180) - centerY * Math.cos((canvasRotation * Math.PI) / 180),
    ]);

    canvas.renderAll();
  }, [canvasRotation]);

  // 画像読み込み
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !project.image) return;

    // 既存の画像を削除
    if (imageRef.current) {
      canvas.remove(imageRef.current);
      imageRef.current = null;
    }

    // 画像を読み込み
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    imgElement.src = project.image.dataUrl;

    imgElement.onload = () => {
      const fabricImage = new FabricImage(imgElement, {
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
      });

      // キャンバスサイズに合わせてスケール
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = imgElement.naturalWidth || imgElement.width;
      const imgHeight = imgElement.naturalHeight || imgElement.height;

      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY) * 0.95;

      fabricImage.scale(scale);

      // 中央に配置
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      fabricImage.set({
        left: (canvasWidth - scaledWidth) / 2,
        top: (canvasHeight - scaledHeight) / 2,
      });

      imageRef.current = fabricImage;
      canvas.add(fabricImage);
      canvas.sendObjectToBack(fabricImage);
      canvas.renderAll();
    };
  }, [project.image]);

  // 描画更新
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // 図形をクリア（画像以外）
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if (obj !== imageRef.current) {
        canvas.remove(obj);
      }
    });

    const isSelectMode = currentTool === 'select';

    // 土地を描画
    project.lands.forEach((land) => {
      if (land.vertices.length < 3) return;

      const isSelected = land.id === selectedLandId;
      const points = land.vertices.map((v) => ({ x: v.x, y: v.y }));

      const polygon = new Polygon(points, {
        fill: isSelected ? 'rgba(0, 102, 204, 0.3)' : 'rgba(0, 102, 204, 0.2)',
        stroke: '#0066CC',
        strokeWidth: isSelected ? 3 : 2,
        selectable: false,
        evented: false,
      });
      canvas.add(polygon);

      // 頂点を描画（番号付き、選択モードでドラッグ可能）
      land.vertices.forEach((v, i) => {
        // ホバー状態をチェック
        const isHoveredVertex = hoveredLandVertexInfo?.landId === land.id && hoveredLandVertexInfo?.index === i;

        // 色の決定：ホバー > 選択中 > 通常
        let fillColor = isSelected ? '#0066CC' : '#4499DD';
        let strokeColor = '#fff';
        let radius = 10;
        if (isHoveredVertex) {
          fillColor = '#3399FF';
          strokeColor = '#FFD700';
          radius = 12;
        }

        const circle = new Circle({
          left: v.x,
          top: v.y,
          radius: radius,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: isHoveredVertex ? 3 : 2,
          selectable: isSelectMode && isSelected,
          evented: isSelectMode && isSelected,
          hasControls: false,
          hasBorders: false,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          hoverCursor: isSelectMode && isSelected ? 'move' : 'default',
          originX: 'center',
          originY: 'center',
        }) as Circle & { vertexData?: VertexData };

        // 頂点データを付加
        circle.vertexData = {
          landId: land.id,
          vertexIndex: i,
          type: 'land',
        };

        canvas.add(circle);

        // 番号ラベル（黒文字、白背景）
        const labelBg = new Circle({
          left: v.x + 12,
          top: v.y - 12,
          radius: 9,
          fill: '#fff',
          stroke: '#333',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(labelBg);

        const label = new Text(`${i}`, {
          left: v.x + 12,
          top: v.y - 12,
          fontSize: 11,
          fill: '#333',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(label);
      });

      // 地積が設定されている場合、各辺の長さを表示
      if (land.actualArea && land.actualArea > 0) {
        const edgeInfos = calculateEdgeInfos(land.vertices, land.actualArea);
        edgeInfos.forEach((edge) => {
          const v1 = land.vertices[edge.startIndex];
          const v2 = land.vertices[edge.endIndex];

          // 辺の中点
          const midX = (v1.x + v2.x) / 2;
          const midY = (v1.y + v2.y) / 2;

          // 辺の角度を計算（ラベルを辺に沿って配置するため）
          const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);

          // 辺に垂直な方向にオフセット（ラベルが辺と重ならないように）
          const offsetDistance = 18;
          const offsetX = Math.sin(angle) * offsetDistance;
          const offsetY = -Math.cos(angle) * offsetDistance;

          // この辺に対応する路線があるかチェック
          const matchingRoad = land.roads.find((road) => {
            if (!road.vertexIndices) return false;
            const [ri1, ri2] = road.vertexIndices;
            // 順方向または逆方向で一致するかチェック
            return (ri1 === edge.startIndex && ri2 === edge.endIndex) ||
                   (ri1 === edge.endIndex && ri2 === edge.startIndex);
          });

          // 路線タイプのラベル名
          const getRoadTypeLabel = (type: string) => {
            switch (type) {
              case '正面': return '正面路線';
              case '側方１': return '側方路線１';
              case '側方２': return '側方路線２';
              case '二方': return '二方路線';
              default: return type;
            }
          };

          // ラベルテキスト（路線がある場合は路線名を付ける）
          const lengthText = `${edge.length.toFixed(2)}m`;
          const labelText = matchingRoad
            ? `${getRoadTypeLabel(matchingRoad.type)}\n${lengthText}`
            : lengthText;

          // 路線がある場合は色を変える
          const textColor = matchingRoad ? '#E60000' : '#222';

          // 背景ボックス（白い角丸四角形風にテキストで表現）
          const lengthBg = new Text(labelText, {
            left: midX + offsetX,
            top: midY + offsetY,
            fontSize: 14,
            fill: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            stroke: '#fff',
            strokeWidth: 6,
            textAlign: 'center',
          });
          canvas.add(lengthBg);

          // 長さラベル
          const lengthLabel = new Text(labelText, {
            left: midX + offsetX,
            top: midY + offsetY,
            fontSize: 14,
            fill: textColor,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
          });
          canvas.add(lengthLabel);
        });
      }

      // 路線を描画
      land.roads.forEach((road) => {
        const [p1, p2] = road.points;
        // 路線タイプごとの色
        const getRoadColor = (type: string) => {
          switch (type) {
            case '正面': return '#E60000';
            case '側方１': return '#FF8C00';
            case '側方２': return '#FFA500';
            case '二方': return '#9900CC';
            default: return '#666666';
          }
        };
        const color = getRoadColor(road.type);

        const roadLine = new Line([p1.x, p1.y, p2.x, p2.y], {
          stroke: color,
          strokeWidth: 4,
          selectable: false,
          evented: false,
        });
        canvas.add(roadLine);
      });

      // 利用単位を描画
      if (land.usageUnits && land.usageUnits.length > 0) {
        land.usageUnits.forEach((unit) => {
          if (unit.vertices.length < 3) return;

          const unitPoints = unit.vertices.map((v) => ({ x: v.x, y: v.y }));

          // 利用単位のポリゴンを描画
          const unitPolygon = new Polygon(unitPoints, {
            fill: `${unit.color}40`, // 透明度を付加
            stroke: unit.color,
            strokeWidth: 2,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(unitPolygon);

          // 利用単位のラベル（中心に表示）
          const centerX = unit.vertices.reduce((sum, v) => sum + v.x, 0) / unit.vertices.length;
          const centerY = unit.vertices.reduce((sum, v) => sum + v.y, 0) / unit.vertices.length;

          // 背景
          const labelBg = new Text(unit.name, {
            left: centerX,
            top: centerY,
            fontSize: 12,
            fill: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
            stroke: '#fff',
            strokeWidth: 4,
          });
          canvas.add(labelBg);

          // ラベル
          const label = new Text(unit.name, {
            left: centerX,
            top: centerY,
            fontSize: 12,
            fill: unit.color,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
          });
          canvas.add(label);
        });
      }
    });

    // 想定整形地を描画
    if (soteiSeikeiChi && soteiSeikeiChi.vertices.length === 4) {
      const points = soteiSeikeiChi.vertices.map((v) => ({ x: v.x, y: v.y }));
      const soteiPolygon = new Polygon(points, {
        fill: 'rgba(255, 215, 0, 0.2)',
        stroke: '#FFD700',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(soteiPolygon);

      // 矢印付き寸法を描画（辺に沿って配置）
      const [v0, v1, v2, v3] = soteiSeikeiChi.vertices;

      // 寸法線のオフセット距離と矢印サイズ
      const offsetDistance = 25;
      const arrowSize = 8;

      // ヘルパー関数：2点間の方向ベクトル（正規化）
      const getDirection = (p1: Point, p2: Point) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        return len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
      };

      // ヘルパー関数：垂直方向ベクトル
      const getPerpendicular = (dir: { x: number; y: number }) => ({
        x: -dir.y,
        y: dir.x,
      });

      // ヘルパー関数：寸法線を描画
      const drawDimensionLine = (
        p1: Point,
        p2: Point,
        label: string,
        offsetDir: { x: number; y: number }
      ) => {
        // オフセット位置
        const offset1 = {
          x: p1.x + offsetDir.x * offsetDistance,
          y: p1.y + offsetDir.y * offsetDistance,
        };
        const offset2 = {
          x: p2.x + offsetDir.x * offsetDistance,
          y: p2.y + offsetDir.y * offsetDistance,
        };

        // 辺の方向
        const edgeDir = getDirection(p1, p2);

        // 寸法線（主線）
        const dimLine = new Line([offset1.x, offset1.y, offset2.x, offset2.y], {
          stroke: '#CC9900',
          strokeWidth: 1.5,
          selectable: false,
          evented: false,
        });
        canvas.add(dimLine);

        // 引き出し線（端点からオフセット位置へ）
        const extLine1 = new Line([p1.x, p1.y, offset1.x, offset1.y], {
          stroke: '#CC9900',
          strokeWidth: 1,
          strokeDashArray: [3, 3],
          selectable: false,
          evented: false,
        });
        const extLine2 = new Line([p2.x, p2.y, offset2.x, offset2.y], {
          stroke: '#CC9900',
          strokeWidth: 1,
          strokeDashArray: [3, 3],
          selectable: false,
          evented: false,
        });
        canvas.add(extLine1);
        canvas.add(extLine2);

        // 矢印（始点側）←
        const arrow1a = new Line([
          offset1.x,
          offset1.y,
          offset1.x + edgeDir.x * arrowSize - offsetDir.x * arrowSize * 0.5,
          offset1.y + edgeDir.y * arrowSize - offsetDir.y * arrowSize * 0.5,
        ], {
          stroke: '#CC9900',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        const arrow1b = new Line([
          offset1.x,
          offset1.y,
          offset1.x + edgeDir.x * arrowSize + offsetDir.x * arrowSize * 0.5,
          offset1.y + edgeDir.y * arrowSize + offsetDir.y * arrowSize * 0.5,
        ], {
          stroke: '#CC9900',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        canvas.add(arrow1a);
        canvas.add(arrow1b);

        // 矢印（終点側）→
        const arrow2a = new Line([
          offset2.x,
          offset2.y,
          offset2.x - edgeDir.x * arrowSize - offsetDir.x * arrowSize * 0.5,
          offset2.y - edgeDir.y * arrowSize - offsetDir.y * arrowSize * 0.5,
        ], {
          stroke: '#CC9900',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        const arrow2b = new Line([
          offset2.x,
          offset2.y,
          offset2.x - edgeDir.x * arrowSize + offsetDir.x * arrowSize * 0.5,
          offset2.y - edgeDir.y * arrowSize + offsetDir.y * arrowSize * 0.5,
        ], {
          stroke: '#CC9900',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        canvas.add(arrow2a);
        canvas.add(arrow2b);

        // ラベル（中点）
        const midX = (offset1.x + offset2.x) / 2;
        const midY = (offset1.y + offset2.y) / 2;
        const labelOffset = 12;

        // 背景
        const labelBg = new Text(label, {
          left: midX + offsetDir.x * labelOffset,
          top: midY + offsetDir.y * labelOffset,
          fontSize: 12,
          fill: '#fff',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          stroke: '#fff',
          strokeWidth: 4,
        });
        canvas.add(labelBg);

        // ラベル本体
        const labelText = new Text(label, {
          left: midX + offsetDir.x * labelOffset,
          top: midY + offsetDir.y * labelOffset,
          fontSize: 12,
          fill: '#CC9900',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(labelText);
      };

      // 間口方向（v0-v1）の寸法線
      // v0-v1 の垂直方向（外側）にオフセット
      const widthDir = getDirection(v0, v1);
      const widthPerpDir = getPerpendicular(widthDir);
      // 外側方向を決定（中心から離れる方向）
      const center = {
        x: (v0.x + v1.x + v2.x + v3.x) / 4,
        y: (v0.y + v1.y + v2.y + v3.y) / 4,
      };
      const widthMid = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
      const toCenter = { x: center.x - widthMid.x, y: center.y - widthMid.y };
      const widthOutward = (toCenter.x * widthPerpDir.x + toCenter.y * widthPerpDir.y) < 0
        ? widthPerpDir
        : { x: -widthPerpDir.x, y: -widthPerpDir.y };

      drawDimensionLine(v0, v1, `${soteiSeikeiChi.width.toFixed(2)}m`, widthOutward);

      // 奥行方向（v1-v2）の寸法線
      const heightDir = getDirection(v1, v2);
      const heightPerpDir = getPerpendicular(heightDir);
      const heightMid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
      const toCenter2 = { x: center.x - heightMid.x, y: center.y - heightMid.y };
      const heightOutward = (toCenter2.x * heightPerpDir.x + toCenter2.y * heightPerpDir.y) < 0
        ? heightPerpDir
        : { x: -heightPerpDir.x, y: -heightPerpDir.y };

      drawDimensionLine(v1, v2, `${soteiSeikeiChi.height.toFixed(2)}m`, heightOutward);
    }

    // 作図中の頂点を描画（番号付き）
    currentLandVertices.forEach((v, i) => {
      // 最初の点は特別なスタイル（閉じるポイント）
      const isFirstPoint = i === 0 && currentLandVertices.length >= 3;
      const isHovered = hoveredDrawingVertexIndex === i;

      // ホバー時は明るい色に、最初の点はオレンジ系
      let fillColor = '#0066CC';
      if (isFirstPoint) {
        fillColor = isHovered ? '#FF9933' : '#FF6600';
      } else if (isHovered) {
        fillColor = '#3399FF';
      }

      const circle = new Circle({
        left: v.x,
        top: v.y,
        radius: isFirstPoint ? 14 : (isHovered ? 12 : 10),
        fill: fillColor,
        stroke: isHovered ? '#FFD700' : '#fff',
        strokeWidth: isFirstPoint ? 3 : (isHovered ? 3 : 2),
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(circle);

      // 番号ラベル（黒文字、白背景）
      const labelBg = new Circle({
        left: v.x + 12,
        top: v.y - 12,
        radius: 9,
        fill: '#fff',
        stroke: '#333',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(labelBg);

      const label = new Text(`${i}`, {
        left: v.x + 12,
        top: v.y - 12,
        fontSize: 11,
        fill: '#333',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(label);

      // 線を描画
      if (i > 0) {
        const prev = currentLandVertices[i - 1];
        const line = new Line([prev.x, prev.y, v.x, v.y], {
          stroke: '#0066CC',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    });

    // 作図中の利用単位頂点を描画
    currentUsageUnitVertices.forEach((v, i) => {
      // 最初の点は特別なスタイル（閉じるポイント）
      const isFirstPoint = i === 0 && currentUsageUnitVertices.length >= 3;

      const fillColor = isFirstPoint ? '#9900CC' : '#9900CC';

      const circle = new Circle({
        left: v.x,
        top: v.y,
        radius: isFirstPoint ? 14 : 10,
        fill: fillColor,
        stroke: '#fff',
        strokeWidth: isFirstPoint ? 3 : 2,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(circle);

      // 番号ラベル
      const labelBg = new Circle({
        left: v.x + 12,
        top: v.y - 12,
        radius: 9,
        fill: '#fff',
        stroke: '#9900CC',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(labelBg);

      const label = new Text(`${i}`, {
        left: v.x + 12,
        top: v.y - 12,
        fontSize: 11,
        fill: '#9900CC',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(label);

      // 線を描画
      if (i > 0) {
        const prev = currentUsageUnitVertices[i - 1];
        const line = new Line([prev.x, prev.y, v.x, v.y], {
          stroke: '#9900CC',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    });

    // 作図中の路線点を描画
    currentRoadPoints.forEach((p) => {
      const circle = new Circle({
        left: p.x - 5,
        top: p.y - 5,
        radius: 5,
        fill: '#E60000',
        selectable: false,
        evented: false,
      });
      canvas.add(circle);
    });

    // 既存の描画線を描画
    project.drawingLines.forEach((drawingLine) => {
      const [p1, p2] = drawingLine.points;
      const line = new Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: drawingLine.color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      canvas.add(line);

      // 両端に小さな円を描画
      [p1, p2].forEach((p) => {
        const endCircle = new Circle({
          left: p.x,
          top: p.y,
          radius: 4,
          fill: drawingLine.color,
          stroke: '#fff',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(endCircle);
      });
    });

    // 作図中の線の点を描画
    currentLinePoints.forEach((p, i) => {
      const colorMap: Record<string, string> = {
        '直線': '#333333',
        '垂線': '#9900CC',
        '延線': '#009900',
        '平行': '#0066CC',
      };
      const color = currentLineType ? colorMap[currentLineType] : '#333';

      const circle = new Circle({
        left: p.x,
        top: p.y,
        radius: 6,
        fill: color,
        stroke: '#fff',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(circle);

      // 2点目がある場合は線を引く
      if (i === 1) {
        const p1 = currentLinePoints[0];
        const line = new Line([p1.x, p1.y, p.x, p.y], {
          stroke: color,
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    });

    // 選択中の辺をハイライト
    if (selectedEdge && isDrawingLine) {
      const land = project.lands.find((l) => l.id === selectedEdge.landId);
      if (land) {
        const v1 = land.vertices[selectedEdge.startIndex];
        const v2 = land.vertices[selectedEdge.endIndex];
        if (v1 && v2) {
          const highlightLine = new Line([v1.x, v1.y, v2.x, v2.y], {
            stroke: '#FFD700',
            strokeWidth: 6,
            selectable: false,
            evented: false,
          });
          canvas.add(highlightLine);
        }
      }
    }

    canvas.renderAll();
  }, [
    project.lands,
    project.drawingLines,
    currentLandVertices,
    currentRoadPoints,
    currentLinePoints,
    currentLineType,
    currentUsageUnitVertices,
    selectedEdge,
    isDrawingLine,
    selectedLandId,
    soteiSeikeiChi,
    currentTool,
    hoveredDrawingVertexIndex,
    hoveredLandVertexInfo,
  ]);

  // 拡大鏡の描画
  useEffect(() => {
    const showMagnifier = isDrawingLand || isDrawingUsageUnit;
    if (!showMagnifier || !magnifierPos || !magnifierCanvasRef.current || !canvasRef.current) {
      return;
    }

    const magnifierCanvas = magnifierCanvasRef.current;
    const sourceCanvas = canvasRef.current;
    const ctx = magnifierCanvas.getContext('2d');
    if (!ctx) return;

    const magnifierSize = 180; // 拡大鏡のサイズ
    const zoomLevel = 3; // 拡大率
    const sourceSize = magnifierSize / zoomLevel;

    // 拡大鏡キャンバスのサイズ設定
    magnifierCanvas.width = magnifierSize;
    magnifierCanvas.height = magnifierSize;

    // ソースキャンバスから拡大して描画
    const sx = magnifierPos.x - sourceSize / 2;
    const sy = magnifierPos.y - sourceSize / 2;

    ctx.clearRect(0, 0, magnifierSize, magnifierSize);

    // 背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, magnifierSize, magnifierSize);

    // ソースから拡大描画
    ctx.drawImage(
      sourceCanvas,
      sx,
      sy,
      sourceSize,
      sourceSize,
      0,
      0,
      magnifierSize,
      magnifierSize
    );

    // 十字線（クロスヘア）を描画 - より目立つように
    const center = magnifierSize / 2;

    // 白い縁取り
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, center);
    ctx.lineTo(center - 8, center);
    ctx.moveTo(center + 8, center);
    ctx.lineTo(magnifierSize, center);
    ctx.moveTo(center, 0);
    ctx.lineTo(center, center - 8);
    ctx.moveTo(center, center + 8);
    ctx.lineTo(center, magnifierSize);
    ctx.stroke();

    // 赤い十字線
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, center);
    ctx.lineTo(center - 8, center);
    ctx.moveTo(center + 8, center);
    ctx.lineTo(magnifierSize, center);
    ctx.moveTo(center, 0);
    ctx.lineTo(center, center - 8);
    ctx.moveTo(center, center + 8);
    ctx.lineTo(center, magnifierSize);
    ctx.stroke();

    // 中心の小さな円（クリック位置）
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(center, center, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [isDrawingLand, isDrawingUsageUnit, magnifierPos]);

  // 頂点のクリック検出
  const findClickedVertex = useCallback((x: number, y: number): { landId: string, vertexIndex: number, point: Point } | null => {
    for (const land of project.lands) {
      for (let i = 0; i < land.vertices.length; i++) {
        const v = land.vertices[i];
        const dist = Math.sqrt(Math.pow(x - v.x, 2) + Math.pow(y - v.y, 2));
        if (dist <= 15) {
          return { landId: land.id, vertexIndex: i, point: v };
        }
      }
    }
    return null;
  }, [project.lands]);

  // 作図中の頂点をクリック検出（最初の点に戻る用）
  const findClickedDrawingVertex = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < currentLandVertices.length; i++) {
      const v = currentLandVertices[i];
      const dist = Math.sqrt(Math.pow(x - v.x, 2) + Math.pow(y - v.y, 2));
      if (dist <= 18) {
        return i;
      }
    }
    return null;
  }, [currentLandVertices]);

  // 辺のクリック検出（線描画用）
  const findClickedEdge = useCallback((x: number, y: number): { landId: string; startIndex: number; endIndex: number } | null => {
    const threshold = 10; // クリック許容距離

    for (const land of project.lands) {
      const vertices = land.vertices;
      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        // 点と線分の距離を計算
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) continue;

        // 線分上の最近点のパラメータ t (0-1)
        let t = ((x - v1.x) * dx + (y - v1.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        // 最近点
        const nearestX = v1.x + t * dx;
        const nearestY = v1.y + t * dy;

        // 距離
        const dist = Math.sqrt(Math.pow(x - nearestX, 2) + Math.pow(y - nearestY, 2));

        if (dist <= threshold) {
          return {
            landId: land.id,
            startIndex: i,
            endIndex: (i + 1) % vertices.length,
          };
        }
      }
    }
    return null;
  }, [project.lands]);

  // マウス移動ハンドラ（ホバー検出）
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 対象地作図中は描画中の頂点をチェック + 拡大鏡表示
      if (isDrawingLand) {
        const hoveredIndex = findClickedDrawingVertex(x, y);
        setHoveredDrawingVertexIndex(hoveredIndex);
        setHoveredLandVertexInfo(null);
        // 拡大鏡位置を更新
        setMagnifierPos({ x, y });
        return;
      }

      // 利用単位作図中も拡大鏡を表示
      if (isDrawingUsageUnit) {
        setHoveredDrawingVertexIndex(null);
        setHoveredLandVertexInfo(null);
        // 拡大鏡位置を更新
        setMagnifierPos({ x, y });
        return;
      }

      // 対象地・利用単位作図中でなければ拡大鏡を非表示
      setMagnifierPos(null);

      // 選択モードでは既存土地の頂点をチェック
      if (currentTool === 'select') {
        const clicked = findClickedVertex(x, y);
        if (clicked) {
          setHoveredLandVertexInfo({ landId: clicked.landId, index: clicked.vertexIndex });
        } else {
          setHoveredLandVertexInfo(null);
        }
        setHoveredDrawingVertexIndex(null);
        return;
      }

      // その他のモードではホバー状態をクリア
      setHoveredDrawingVertexIndex(null);
      setHoveredLandVertexInfo(null);
    },
    [isDrawingLand, isDrawingUsageUnit, currentTool, findClickedDrawingVertex, findClickedVertex]
  );

  // クリックハンドラ
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 頂点ドラッグ中はクリックを無視
      if (isDraggingVertex.current) {
        isDraggingVertex.current = false;
        return;
      }

      const canvas = fabricRef.current;
      if (!canvas) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const point: Point = { x, y };

      // 対象地作図モード
      if (isDrawingLand) {
        // 既存の頂点をクリックしたか確認
        const clickedIndex = findClickedDrawingVertex(x, y);

        // 最初の点（インデックス0）をクリックした場合、多角形を閉じる
        if (clickedIndex === 0 && currentLandVertices.length >= 3) {
          const name = prompt('土地の名前を入力してください:', `土地${project.lands.length + 1}`);
          if (name) {
            finishLandDrawing(name, '普通住宅地区');
          }
          return;
        }

        // 他の既存点をクリックした場合は無視（重複防止）
        if (clickedIndex !== null) {
          return;
        }

        // 新しい点を追加
        addLandVertex(point);
        return;
      }

      // 利用単位作図モード
      if (isDrawingUsageUnit) {
        // 新しい点を追加
        addUsageUnitVertex(point);
        return;
      }

      if (isDrawingRoad) {
        addRoadPoint(point);
        if (currentRoadPoints.length === 1) {
          setTimeout(() => {
            const rosenka = prompt('路線価を入力してください（千円/㎡）:');
            if (rosenka) {
              const num = parseFloat(rosenka);
              if (!isNaN(num) && num > 0) {
                finishRoadDrawing(num);
              }
            }
          }, 10);
        }
      } else if (isDrawingLine && currentLineType) {
        // 線描画モード
        if (currentLineType === '直線') {
          // 直線: 2点をクリックして線を引く
          addLinePoint(point);
          if (currentLinePoints.length === 1) {
            finishLineDrawing();
          }
        } else if (currentLineType === '垂線') {
          // 垂線: まず基準辺を選択、次に終点をクリック
          if (!selectedEdge) {
            const edge = findClickedEdge(x, y);
            if (edge) {
              setSelectedEdge(edge);
              // 基準辺の中点から開始
              const land = project.lands.find((l) => l.id === edge.landId);
              if (land) {
                const v1 = land.vertices[edge.startIndex];
                const v2 = land.vertices[edge.endIndex];
                const midPoint = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                addLinePoint(midPoint);
              }
            }
          } else {
            // 垂線の終点を計算（基準辺に垂直）
            const land = project.lands.find((l) => l.id === selectedEdge.landId);
            if (land) {
              const v1 = land.vertices[selectedEdge.startIndex];
              const v2 = land.vertices[selectedEdge.endIndex];
              const dx = v2.x - v1.x;
              const dy = v2.y - v1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              // 垂直方向
              const perpX = -dy / len;
              const perpY = dx / len;
              // 始点からクリック点への垂直投影
              const p1 = currentLinePoints[0];
              const clickDx = x - p1.x;
              const clickDy = y - p1.y;
              const projLength = clickDx * perpX + clickDy * perpY;
              const endPoint = {
                x: p1.x + perpX * projLength,
                y: p1.y + perpY * projLength,
              };
              addLinePoint(endPoint);
              finishLineDrawing();
            }
          }
        } else if (currentLineType === '延線') {
          // 延線: まず延長する辺を選択、次に延長先をクリック
          if (!selectedEdge) {
            const edge = findClickedEdge(x, y);
            if (edge) {
              setSelectedEdge(edge);
              // 辺の終点から開始
              const land = project.lands.find((l) => l.id === edge.landId);
              if (land) {
                const v2 = land.vertices[edge.endIndex];
                addLinePoint(v2);
              }
            }
          } else {
            // 辺の方向に沿って延長
            const land = project.lands.find((l) => l.id === selectedEdge.landId);
            if (land) {
              const v1 = land.vertices[selectedEdge.startIndex];
              const v2 = land.vertices[selectedEdge.endIndex];
              const dx = v2.x - v1.x;
              const dy = v2.y - v1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const dirX = dx / len;
              const dirY = dy / len;
              // 始点からクリック点への方向投影
              const p1 = currentLinePoints[0];
              const clickDx = x - p1.x;
              const clickDy = y - p1.y;
              const projLength = clickDx * dirX + clickDy * dirY;
              const endPoint = {
                x: p1.x + dirX * projLength,
                y: p1.y + dirY * projLength,
              };
              addLinePoint(endPoint);
              finishLineDrawing();
            }
          }
        } else if (currentLineType === '平行') {
          // 平行: まず基準辺を選択、次に2点をクリック
          if (!selectedEdge) {
            const edge = findClickedEdge(x, y);
            if (edge) {
              setSelectedEdge(edge);
            }
          } else if (currentLinePoints.length === 0) {
            // 平行線の始点
            addLinePoint(point);
          } else {
            // 平行線の終点（基準辺と平行になるように調整）
            const land = project.lands.find((l) => l.id === selectedEdge.landId);
            if (land) {
              const v1 = land.vertices[selectedEdge.startIndex];
              const v2 = land.vertices[selectedEdge.endIndex];
              const dx = v2.x - v1.x;
              const dy = v2.y - v1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const dirX = dx / len;
              const dirY = dy / len;
              // 始点からクリック点への方向投影
              const p1 = currentLinePoints[0];
              const clickDx = x - p1.x;
              const clickDy = y - p1.y;
              const projLength = clickDx * dirX + clickDy * dirY;
              const endPoint = {
                x: p1.x + dirX * projLength,
                y: p1.y + dirY * projLength,
              };
              addLinePoint(endPoint);
              finishLineDrawing();
            }
          }
        }
      } else if (currentTool === 'select') {
        // 選択モードで土地をクリックして選択
        const clicked = findClickedVertex(x, y);
        if (clicked) {
          selectLand(clicked.landId);
        }
      }
    },
    [
      isDrawingLand,
      isDrawingRoad,
      isDrawingLine,
      currentRoadPoints,
      currentLandVertices,
      currentLinePoints,
      currentLineType,
      selectedEdge,
      addLandVertex,
      addRoadPoint,
      addLinePoint,
      addUsageUnitVertex,
      finishLandDrawing,
      finishRoadDrawing,
      finishLineDrawing,
      findClickedVertex,
      findClickedDrawingVertex,
      findClickedEdge,
      setSelectedEdge,
      currentTool,
      selectLand,
      project.lands.length,
      isDrawingUsageUnit,
    ]
  );

  // ダブルクリックハンドラ（土地・利用単位作図完了）
  const handleDoubleClick = useCallback(
    () => {
      if (isDrawingLand && currentLandVertices.length >= 3) {
        const name = prompt('土地の名前を入力してください:', `土地${project.lands.length + 1}`);
        if (name) {
          finishLandDrawing(name, '普通住宅地区');
        }
      }
      if (isDrawingUsageUnit && currentUsageUnitVertices.length >= 3) {
        const name = prompt('利用単位の名前を入力してください:', '利用単位1');
        if (name) {
          finishUsageUnitDrawing(name);
        }
      }
    },
    [isDrawingLand, isDrawingUsageUnit, currentLandVertices, currentUsageUnitVertices, project.lands.length, finishLandDrawing, finishUsageUnitDrawing]
  );

  // ホイールでズーム
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
      setZoom(newZoom);
    },
    [zoom, setZoom]
  );

  // カーソルスタイルの決定
  const getCursorStyle = () => {
    // ホバー中は指マーク
    if (hoveredDrawingVertexIndex !== null || hoveredLandVertexInfo !== null) {
      return 'pointer';
    }
    // 利用単位作図モードは十字
    if (isDrawingUsageUnit) {
      return 'crosshair';
    }
    // 選択モードはデフォルト
    if (currentTool === 'select') {
      return 'default';
    }
    // 作図モードは十字
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gray-300"
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      style={{ cursor: getCursorStyle() }}
    >
      <canvas ref={canvasRef} />

      {/* 拡大鏡（右下固定） */}
      {(isDrawingLand || isDrawingUsageUnit) && magnifierPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            right: 20,
            bottom: 20,
            zIndex: 100,
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-2">
            <div className="text-center text-xs text-gray-600 mb-1 font-medium">
              カーソル位置 3x 拡大
            </div>
            <canvas
              ref={magnifierCanvasRef}
              width={180}
              height={180}
              style={{
                border: '2px solid #333',
                borderRadius: '4px',
                backgroundColor: '#f0f0f0',
              }}
            />
            <div className="text-center text-xs text-gray-500 mt-1">
              赤い十字 = クリック位置
            </div>
          </div>
        </div>
      )}

      {/* ガイドメッセージ */}
      {!project.image && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 text-lg">
              「画像読込」ボタンをクリックして
              <br />
              公図または測量図を読み込んでください
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
