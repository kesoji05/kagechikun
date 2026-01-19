import React, { useRef } from 'react';
import { useStore } from '../store/useStore';
import type { ToolMode, ImageInfo, DrawingLineType } from '../types';

export const Toolbar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentTool,
    setCurrentTool,
    setImage,
    startLandDrawing,
    selectedLandId,
    project,
    isDrawingLand,
    isDrawingRoad,
    isDrawingLine,
    isDrawingUsageUnit,
    currentLineType,
    cancelLandDrawing,
    cancelRoadDrawing,
    cancelLineDrawing,
    cancelUsageUnitDrawing,
    startLineDrawing,
    startUsageUnitDrawing,
    alignRoadToTop,
    canvasRotation,
    setCanvasRotation,
    // 無道路地関連
    isDrawingRoadlessFrontRoad,
    cancelRoadlessFrontRoadDrawing,
  } = useStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const imageInfo: ImageInfo = {
          fileName: file.name,
          dataUrl,
          width: img.width,
          height: img.height,
        };
        setImage(imageInfo);
        // 画像読み込み後、自動的に対象地描画モードを開始
        startLandDrawing();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleToolClick = (tool: ToolMode) => {
    // 現在のモードをキャンセル
    if (isDrawingLand) cancelLandDrawing();
    if (isDrawingRoad) cancelRoadDrawing();
    if (isDrawingLine) cancelLineDrawing();
    if (isDrawingUsageUnit) cancelUsageUnitDrawing();

    if (tool === 'land') {
      startLandDrawing();
    } else {
      setCurrentTool(tool);
    }
  };

  const handleLineToolClick = (lineType: DrawingLineType) => {
    // 現在のモードをキャンセル
    if (isDrawingLand) cancelLandDrawing();
    if (isDrawingRoad) cancelRoadDrawing();
    if (isDrawingLine) cancelLineDrawing();
    if (isDrawingUsageUnit) cancelUsageUnitDrawing();

    startLineDrawing(lineType);
  };

  const getButtonClass = (tool: ToolMode, disabled?: boolean) => {
    const isActive = currentTool === tool;
    if (disabled) {
      return 'px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    return `px-4 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
  };

  // 対象地が存在するか
  const hasLands = project.lands.length > 0;

  // 各路線が存在するか
  const targetLand = selectedLandId
    ? project.lands.find(l => l.id === selectedLandId)
    : project.lands[0];
  const hasFrontRoad = targetLand?.roads.some(r => r.type === '正面' && r.vertexIndices) || false;
  const hasSide1Road = targetLand?.roads.some(r => r.type === '側方１' && r.vertexIndices) || false;
  const hasSide2Road = targetLand?.roads.some(r => r.type === '側方２' && r.vertexIndices) || false;
  const hasRearRoad = targetLand?.roads.some(r => r.type === '二方' && r.vertexIndices) || false;

  return (
    <div className="h-14 bg-gray-100 border-b flex items-center px-4 gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
      >
        画像読込
      </button>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      <button
        onClick={() => handleToolClick('select')}
        className={getButtonClass('select')}
      >
        選択
      </button>

      {/* Step 1: 対象地作図 */}
      <button
        onClick={() => handleToolClick('land')}
        className={getButtonClass('land', !project.image)}
        disabled={!project.image}
        title={!project.image ? '画像を読み込んでください' : '対象地の頂点をクリックして作図'}
      >
        ①対象地
      </button>

      {/* Step 2: 利用単位の分割 (路線指定はサイドパネルに移動) */}
      <button
        onClick={() => {
          if (!hasLands) return;
          // 現在のモードをキャンセル
          if (isDrawingLand) cancelLandDrawing();
          if (isDrawingRoad) cancelRoadDrawing();
          if (isDrawingLine) cancelLineDrawing();
          if (isDrawingUsageUnit) cancelUsageUnitDrawing();
          // 描画モードを開始
          const targetLand = selectedLandId
            ? project.lands.find(l => l.id === selectedLandId)
            : project.lands[0];
          if (targetLand) {
            startUsageUnitDrawing(targetLand.id);
          }
        }}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          !hasLands
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isDrawingUsageUnit
            ? 'bg-purple-600 text-white'
            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
        }`}
        disabled={!hasLands}
        title={!hasLands ? '対象地を作成してください' : '利用単位の頂点をクリックして作図'}
      >
        ②利用単位
      </button>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      {/* 描画ツール */}
      <button
        onClick={() => handleLineToolClick('直線')}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          !project.image
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : currentTool === 'line'
            ? 'bg-gray-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        disabled={!project.image}
        title="直線を描画"
      >
        直線
      </button>

      <button
        onClick={() => handleLineToolClick('垂線')}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          !project.image
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : currentTool === 'perpendicular'
            ? 'bg-purple-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        disabled={!project.image}
        title="辺に垂直な線を描画（辺をクリックしてから点をクリック）"
      >
        垂線
      </button>

      <button
        onClick={() => handleLineToolClick('延線')}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          !project.image
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : currentTool === 'extension'
            ? 'bg-green-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        disabled={!project.image}
        title="辺を延長する線を描画（辺をクリックしてから終点をクリック）"
      >
        延線
      </button>

      <button
        onClick={() => handleLineToolClick('平行')}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          !project.image
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : currentTool === 'parallel'
            ? 'bg-blue-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        disabled={!project.image}
        title="辺に平行な線を描画（辺をクリックしてから2点をクリック）"
      >
        平行
      </button>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      {/* 回転ツール */}
      <button
        onClick={() => alignRoadToTop('正面')}
        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
          !hasFrontRoad
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-200 hover:bg-red-300 text-red-800'
        }`}
        disabled={!hasFrontRoad}
        title="正面路線を画面上部に向ける"
      >
        正面↑
      </button>

      <button
        onClick={() => alignRoadToTop('側方１')}
        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
          !hasSide1Road
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-200 hover:bg-orange-300 text-orange-800'
        }`}
        disabled={!hasSide1Road}
        title="側方路線１を画面上部に向ける"
      >
        側方１↑
      </button>

      <button
        onClick={() => alignRoadToTop('側方２')}
        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
          !hasSide2Road
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-200 hover:bg-orange-300 text-orange-800'
        }`}
        disabled={!hasSide2Road}
        title="側方路線２を画面上部に向ける"
      >
        側方２↑
      </button>

      <button
        onClick={() => alignRoadToTop('二方')}
        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
          !hasRearRoad
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
        }`}
        disabled={!hasRearRoad}
        title="二方路線を画面上部に向ける"
      >
        二方↑
      </button>

      <button
        onClick={() => setCanvasRotation(0)}
        className={`px-2 py-2 rounded text-xs font-medium transition-colors ${
          canvasRotation === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        disabled={canvasRotation === 0}
        title="回転をリセット"
      >
        解除
      </button>

      <div className="w-px h-8 bg-gray-300 mx-2" />

      {/* ステータス表示 */}
      <div className="text-sm text-gray-600 flex-1">
        {isDrawingLand && (
          <span className="text-blue-600 font-medium">
            対象地作図中: 頂点をクリック（番号表示）、ダブルクリックで完了
          </span>
        )}
        {isDrawingRoad && (
          <span className="text-red-600 font-medium">
            路線設定中: 路線の2点をクリックしてください
          </span>
        )}
        {isDrawingRoadlessFrontRoad && (
          <span className="text-amber-600 font-medium">
            無道路地: 正面路線の2点をクリックしてください
          </span>
        )}
        {isDrawingUsageUnit && (
          <span className="text-purple-600 font-medium">
            利用単位作図中: 頂点をクリック、ダブルクリックで完了
          </span>
        )}
        {isDrawingLine && currentLineType === '直線' && (
          <span className="text-gray-800 font-medium">
            直線描画中: 始点と終点をクリック
          </span>
        )}
        {isDrawingLine && currentLineType === '垂線' && (
          <span className="text-purple-600 font-medium">
            垂線描画中: 基準辺をクリック → 垂線の終点をクリック
          </span>
        )}
        {isDrawingLine && currentLineType === '延線' && (
          <span className="text-green-600 font-medium">
            延線描画中: 延長する辺をクリック → 延長の終点をクリック
          </span>
        )}
        {isDrawingLine && currentLineType === '平行' && (
          <span className="text-blue-600 font-medium">
            平行線描画中: 基準辺をクリック → 平行線の始点・終点をクリック
          </span>
        )}
        {!isDrawingLand && !isDrawingRoad && !isDrawingRoadlessFrontRoad && !isDrawingLine && !isDrawingUsageUnit && hasLands && (
          <span className="text-green-600">
            サイドパネルで地積を入力してください
          </span>
        )}
      </div>

      {/* キャンセルボタン */}
      {(isDrawingLand || isDrawingRoad || isDrawingRoadlessFrontRoad || isDrawingLine || isDrawingUsageUnit) && (
        <button
          onClick={() => {
            if (isDrawingLand) cancelLandDrawing();
            if (isDrawingRoad) cancelRoadDrawing();
            if (isDrawingRoadlessFrontRoad) cancelRoadlessFrontRoadDrawing();
            if (isDrawingLine) cancelLineDrawing();
            if (isDrawingUsageUnit) cancelUsageUnitDrawing();
          }}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
        >
          キャンセル
        </button>
      )}

    </div>
  );
};
