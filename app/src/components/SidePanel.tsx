import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import type { ChikaKubun, Land, Point, RoadType } from '../types';
import { calculateLandBasicsFromArea, calculateScaleFromArea } from '../utils/calculations';
import {
  getOkuyukiHoseiritsu,
  getFuseikeichiHoseiritsu,
  getMaguchikoshoHoseiritsu,
  getOkuyukichodaiHoseiritsu,
} from '../data/correctionTables';

// 路線種別ごとの入力コンポーネント
const RoadTypeInput: React.FC<{
  roadType: RoadType;
  label: string;
  color: 'red' | 'orange' | 'purple';
  land: Land;
  onSave: (startIdx: number, endIdx: number, rosenka: number) => void;
  onDelete: () => void;
}> = ({ roadType, label, color, land, onSave, onDelete }) => {
  const existingRoad = land.roads.find(r => r.type === roadType);

  const [startIdx, setStartIdx] = useState<number>(existingRoad?.vertexIndices?.[0] ?? 0);
  const [endIdx, setEndIdx] = useState<number>(existingRoad?.vertexIndices?.[1] ?? 1);
  const [rosenka, setRosenka] = useState<string>(existingRoad?.rosenka?.toString() ?? '');
  const [isExpanded, setIsExpanded] = useState<boolean>(!!existingRoad);

  // existingRoadが変わったらステートを同期
  useEffect(() => {
    if (existingRoad) {
      if (existingRoad.vertexIndices) {
        setStartIdx(existingRoad.vertexIndices[0]);
        setEndIdx(existingRoad.vertexIndices[1]);
      }
      setRosenka(existingRoad.rosenka?.toString() ?? '');
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [existingRoad?.id, existingRoad?.vertexIndices, existingRoad?.rosenka]);

  const colorClasses = {
    red: 'bg-red-100 border-red-300 text-red-800',
    orange: 'bg-orange-100 border-orange-300 text-orange-800',
    purple: 'bg-purple-100 border-purple-300 text-purple-800',
  };

  const handleSave = () => {
    const rosenkaNum = parseFloat(rosenka);
    if (isNaN(rosenkaNum) || rosenkaNum <= 0) {
      alert('正しい路線価を入力してください');
      return;
    }
    if (startIdx === endIdx) {
      alert('始点と終点は異なる点を選択してください');
      return;
    }
    onSave(startIdx, endIdx, rosenkaNum);
  };

  if (!isExpanded && !existingRoad) {
    return (
      <div className="mb-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>+</span>
          <span>{label}を追加</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`mb-3 p-2 rounded border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {existingRoad && (
          <button
            onClick={() => {
              if (confirm(`${label}を削除しますか？`)) {
                onDelete();
              }
            }}
            className="text-xs text-red-600 hover:text-red-800"
          >
            削除
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 w-8">区間:</label>
          <select
            value={startIdx}
            onChange={(e) => setStartIdx(Number(e.target.value))}
            className="flex-1 border rounded px-2 py-1 text-xs"
          >
            {land.vertices.map((_, i) => (
              <option key={i} value={i}>点 {i}</option>
            ))}
          </select>
          <span className="text-gray-400">→</span>
          <select
            value={endIdx}
            onChange={(e) => setEndIdx(Number(e.target.value))}
            className="flex-1 border rounded px-2 py-1 text-xs"
          >
            {land.vertices.map((_, i) => (
              <option key={i} value={i}>点 {i}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 w-8">路線価:</label>
          <input
            type="number"
            value={rosenka}
            onChange={(e) => setRosenka(e.target.value)}
            placeholder="例: 300"
            className="flex-1 border rounded px-2 py-1 text-xs"
          />
          <span className="text-xs text-gray-500">千円/㎡</span>
        </div>

        <div className="flex justify-end gap-2">
          {!existingRoad && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          )}
          <button
            onClick={handleSave}
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {existingRoad ? '更新' : '設定'}
          </button>
        </div>
      </div>
    </div>
  );
};

const chikaKubunOptions: ChikaKubun[] = [
  '普通住宅地区',
  '普通商業・併用住宅地区',
  '繁華街地区',
  '高度商業地区',
  'ビル街地区',
  '中小工場地区',
  '大工場地区',
];

export const SidePanel: React.FC = () => {
  const {
    project,
    selectedLandId,
    selectLand,
    deleteLand,
    setSoteiSeikeiChi,
    updateLandActualArea,
    setLandFrontageIndices,
    setLandPassageArea,
    deleteUsageUnit,
    soteiSeikeiChi,
    createRoadFromVertices,
    deleteRoad,
    // 無道路地関連
    setLandRoadlessFlag,
    startRoadlessFrontRoadDrawing,
    calculateDistanceToFrontRoad,
    setLandPassageWidth,
    clearLandFrontRoadLine,
    isDrawingRoadlessFrontRoad,
  } = useStore();

  const selectedLand = project.lands.find((l) => l.id === selectedLandId);

  // 地積入力用のローカルステート
  const [actualAreaInput, setActualAreaInput] = useState<string>('');
  // 通路面積入力用のローカルステート
  const [passageAreaInput, setPassageAreaInput] = useState<string>('');
  // 間口選択用のローカルステート
  const [frontageStart, setFrontageStart] = useState<number>(0);
  const [frontageEnd, setFrontageEnd] = useState<number>(1);
  // 無道路地：通路幅入力用のローカルステート
  const [passageWidthInput, setPassageWidthInput] = useState<string>('');

  // 計算結果
  const [calculationResult, setCalculationResult] = useState<{
    landArea: number;
    frontage: number;
    depth: number;
    calculatedDepth: number;
    kagechArea: number;
    soteiSeikeichiArea: number;
    kagechWariai: number;
    okuyukiHoseiritsu: number;
    fuseikeichiHoseiritsu: number;
    maguchikoshoHoseiritsu: number;
    okuyukichodaiHoseiritsu: number;
    evaluatedValue: number;
    pricePerSqm: number;
  } | null>(null);

  // selectedLandが変わったらローカルステートを同期
  useEffect(() => {
    if (selectedLand?.actualArea !== undefined) {
      setActualAreaInput(selectedLand.actualArea.toString());
    } else {
      setActualAreaInput('');
    }

    if (selectedLand?.passageArea !== undefined) {
      setPassageAreaInput(selectedLand.passageArea.toString());
    } else {
      setPassageAreaInput('');
    }

    if (selectedLand?.frontageIndices) {
      setFrontageStart(selectedLand.frontageIndices[0]);
      setFrontageEnd(selectedLand.frontageIndices[1]);
    } else if (selectedLand && selectedLand.vertices.length >= 2) {
      setFrontageStart(0);
      setFrontageEnd(1);
    }

    // 無道路地：通路幅を同期
    if (selectedLand?.passageWidth !== undefined) {
      setPassageWidthInput(selectedLand.passageWidth.toString());
    } else {
      setPassageWidthInput('');
    }
  }, [selectedLand?.id, selectedLand?.actualArea, selectedLand?.passageArea, selectedLand?.frontageIndices, selectedLand?.passageWidth]);

  // 間口距離を計算（ユーザー指定の頂点間）
  const calculateFrontageDistance = (): number => {
    if (!selectedLand?.actualArea || !selectedLand.frontageIndices) return 0;
    const [startIdx, endIdx] = selectedLand.frontageIndices;
    const v1 = selectedLand.vertices[startIdx];
    const v2 = selectedLand.vertices[endIdx];
    if (!v1 || !v2) return 0;

    // ピクセル距離
    const pixelDistance = Math.sqrt(
      Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
    );

    // 実際の距離に変換
    const metersPerPixel = calculateScaleFromArea(selectedLand.actualArea, selectedLand.vertices);
    return pixelDistance * metersPerPixel;
  };

  useEffect(() => {
    // 地積ベースの計算（スケール設定不要）
    if (!selectedLand || !selectedLand.actualArea) {
      setCalculationResult(null);
      setSoteiSeikeiChi(null);
      return;
    }

    const basics = calculateLandBasicsFromArea(selectedLand);
    if (!basics) {
      setCalculationResult(null);
      setSoteiSeikeiChi(null);
      return;
    }

    // 想定整形地を設定
    setSoteiSeikeiChi(basics.soteiSeikeiChi);

    // 正面路線の路線価を取得
    const frontRoad = selectedLand.roads.find((r) => r.type === '正面');
    const rosenka = frontRoad?.rosenka || 0;

    // ユーザー指定の間口距離を使用（設定されていなければ計算値）
    const userFrontage = selectedLand.frontageIndices ? calculateFrontageDistance() : basics.frontage;
    const frontageToUse = userFrontage > 0 ? userFrontage : basics.frontage;

    // 計算上の奥行距離 = 面積 / 間口距離
    const calculatedDepth = frontageToUse > 0 ? selectedLand.actualArea / frontageToUse : 0;

    // 補正率を計算
    const okuyukiHoseiritsu = getOkuyukiHoseiritsu(
      selectedLand.chikaKubun,
      calculatedDepth
    );
    const fuseikeichiHoseiritsu = getFuseikeichiHoseiritsu(
      selectedLand.chikaKubun,
      basics.landArea,
      basics.kagechWariai
    );
    const maguchikoshoHoseiritsu = getMaguchikoshoHoseiritsu(
      selectedLand.chikaKubun,
      frontageToUse
    );
    const okuyukichodaiHoseiritsu = getOkuyukichodaiHoseiritsu(
      selectedLand.chikaKubun,
      basics.depth,
      frontageToUse
    );

    // 不整形地補正率と間口狭小・奥行長大補正率の比較
    // どちらか低い方を適用（不整形地の場合）
    const irregularRate = Math.min(
      fuseikeichiHoseiritsu,
      maguchikoshoHoseiritsu * okuyukichodaiHoseiritsu
    );

    // 1㎡当たりの価額
    const pricePerSqm = rosenka * 1000 * okuyukiHoseiritsu * irregularRate;

    // 評価額計算
    const evaluatedValue = pricePerSqm * basics.landArea;

    // かげ地面積 = 想定整形地面積 - 評価対象地面積
    const soteiSeikeichiArea = basics.soteiSeikeiChi?.area || 0;
    const kagechArea = soteiSeikeichiArea - basics.landArea;

    setCalculationResult({
      landArea: basics.landArea,
      frontage: frontageToUse,
      depth: basics.depth,
      calculatedDepth,
      kagechArea,
      soteiSeikeichiArea,
      kagechWariai: basics.kagechWariai,
      okuyukiHoseiritsu,
      fuseikeichiHoseiritsu,
      maguchikoshoHoseiritsu,
      okuyukichodaiHoseiritsu,
      evaluatedValue,
      pricePerSqm,
    });
  }, [selectedLand, setSoteiSeikeiChi]);

  const handleChikaKubunChange = (land: Land, value: ChikaKubun) => {
    useStore.getState().setProject({
      ...project,
      lands: project.lands.map((l) =>
        l.id === land.id ? { ...l, chikaKubun: value } : l
      ),
    });
  };


  const handleActualAreaChange = (value: string) => {
    setActualAreaInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && selectedLand) {
      updateLandActualArea(selectedLand.id, numValue);
    } else if (value === '' && selectedLand) {
      updateLandActualArea(selectedLand.id, undefined);
    }
  };

  const handlePassageAreaChange = (value: string) => {
    setPassageAreaInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && selectedLand) {
      setLandPassageArea(selectedLand.id, numValue);
    } else if (value === '' && selectedLand) {
      setLandPassageArea(selectedLand.id, undefined);
    }
  };

  // 無道路地：通路幅の変更ハンドラ
  const handlePassageWidthChange = (value: string) => {
    setPassageWidthInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && selectedLand) {
      setLandPassageWidth(selectedLand.id, numValue);
      // 通路面積を自動計算（通路幅 × 正面路線までの距離）
      if (selectedLand.distanceToFrontRoad) {
        const passageArea = numValue * selectedLand.distanceToFrontRoad;
        setLandPassageArea(selectedLand.id, passageArea);
        setPassageAreaInput(passageArea.toFixed(2));
      }
    } else if (value === '' && selectedLand) {
      setLandPassageWidth(selectedLand.id, undefined);
    }
  };

  const handleFrontageChange = (startIdx: number, endIdx: number) => {
    setFrontageStart(startIdx);
    setFrontageEnd(endIdx);
    if (selectedLand) {
      setLandFrontageIndices(selectedLand.id, [startIdx, endIdx]);
    }
  };

  return (
    <div className="w-80 bg-white border-l overflow-y-auto flex flex-col">
      {/* 土地一覧 */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-gray-800 mb-2">評価対象地一覧</h2>
        {project.lands.length === 0 ? (
          <p className="text-sm text-gray-500">
            土地がありません。ツールバーの「対象地」で作成してください。
          </p>
        ) : (
          <ul className="space-y-1">
            {project.lands.map((land) => (
              <li
                key={land.id}
                onClick={() => selectLand(land.id)}
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  selectedLandId === land.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-sm">{land.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('この土地を削除しますか？')) {
                      deleteLand(land.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 選択中の土地の詳細 */}
      {selectedLand && (
        <>
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800 mb-2">基本情報</h2>

            {/* 地積入力 */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">地積（登記簿面積）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={actualAreaInput}
                  onChange={(e) => handleActualAreaChange(e.target.value)}
                  placeholder="例: 150.25"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  step="0.01"
                />
                <span className="text-sm text-gray-500">㎡</span>
              </div>
            </div>

            {/* 間口の選択 */}
            {selectedLand.vertices.length >= 2 && selectedLand.actualArea && (
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">間口（頂点を選択）</label>
                <div className="flex items-center gap-2">
                  <select
                    value={frontageStart}
                    onChange={(e) => handleFrontageChange(Number(e.target.value), frontageEnd)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  >
                    {selectedLand.vertices.map((_, i) => (
                      <option key={i} value={i}>点 {i}</option>
                    ))}
                  </select>
                  <span className="text-gray-400">→</span>
                  <select
                    value={frontageEnd}
                    onChange={(e) => handleFrontageChange(frontageStart, Number(e.target.value))}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  >
                    {selectedLand.vertices.map((_, i) => (
                      <option key={i} value={i}>点 {i}</option>
                    ))}
                  </select>
                </div>
                {selectedLand.frontageIndices && (
                  <p className="text-xs text-blue-600 mt-1">
                    間口距離: {calculateFrontageDistance().toFixed(2)} m
                  </p>
                )}
              </div>
            )}

            {/* 通路の面積 */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">通路の面積</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={passageAreaInput}
                  onChange={(e) => handlePassageAreaChange(e.target.value)}
                  placeholder="0"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  step="0.01"
                />
                <span className="text-sm text-gray-500">㎡</span>
              </div>
            </div>

            {/* 地区区分 */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">地区区分</label>
              <select
                value={selectedLand.chikaKubun}
                onChange={(e) =>
                  handleChikaKubunChange(selectedLand, e.target.value as ChikaKubun)
                }
                className="w-full border rounded px-2 py-1 text-sm"
              >
                {chikaKubunOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* 無道路地チェックボックス */}
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLand.isRoadlessLand || false}
                  onChange={(e) => setLandRoadlessFlag(selectedLand.id, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">無道路地</span>
              </label>
              {selectedLand.isRoadlessLand && (
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  土地が直接道路に接していない場合にチェック
                </p>
              )}
            </div>

          </div>

          {/* 無道路地設定 */}
          {selectedLand.isRoadlessLand && selectedLand.vertices.length >= 2 && selectedLand.actualArea && (
            <div className="p-4 border-b bg-amber-50">
              <h2 className="font-bold text-amber-800 mb-2">無道路地設定</h2>

              {/* 正面路線の設定 */}
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">正面路線（土地外）</label>
                {selectedLand.frontRoadLine ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 flex-1">
                      路線価: {selectedLand.frontRoadLine.rosenka} 千円/㎡
                    </span>
                    <button
                      onClick={() => clearLandFrontRoadLine(selectedLand.id)}
                      className="text-xs px-2 py-1 text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startRoadlessFrontRoadDrawing(selectedLand.id)}
                    disabled={isDrawingRoadlessFrontRoad}
                    className={`w-full text-sm px-3 py-2 rounded ${
                      isDrawingRoadlessFrontRoad
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-200 hover:bg-amber-300 text-amber-800'
                    }`}
                  >
                    {isDrawingRoadlessFrontRoad ? '路線を描画中...' : '正面路線を設定'}
                  </button>
                )}
              </div>

              {/* 正面路線までの距離 */}
              {selectedLand.frontRoadLine && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">正面路線までの距離</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => calculateDistanceToFrontRoad(selectedLand.id)}
                      className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      距離を計算
                    </button>
                    {selectedLand.distanceToFrontRoad !== undefined && (
                      <span className="text-sm font-medium text-blue-600">
                        {selectedLand.distanceToFrontRoad.toFixed(2)} m
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 通路幅 */}
              {selectedLand.distanceToFrontRoad !== undefined && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">通路幅</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={passageWidthInput}
                      onChange={(e) => handlePassageWidthChange(e.target.value)}
                      placeholder="例: 2.0"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-sm text-gray-500">m</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    接道義務を満たす場合は通常2m以上
                  </p>
                </div>
              )}

              {/* 通路面積（自動計算） */}
              {selectedLand.passageWidth && selectedLand.distanceToFrontRoad && (
                <div className="mb-3 p-2 bg-amber-100 rounded">
                  <label className="block text-sm text-gray-600 mb-1">通路面積（参考）</label>
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {selectedLand.passageWidth.toFixed(2)} m × {selectedLand.distanceToFrontRoad.toFixed(2)} m =
                    </span>
                    <span className="font-bold text-amber-700 ml-1">
                      {(selectedLand.passageWidth * selectedLand.distanceToFrontRoad).toFixed(2)} ㎡
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 路線設定（通常の土地用） */}
          {!selectedLand.isRoadlessLand && selectedLand.vertices.length >= 2 && selectedLand.actualArea && (
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800 mb-2">路線設定</h2>
              <RoadTypeInput
                roadType="正面"
                label="正面路線"
                color="red"
                land={selectedLand}
                onSave={(startIdx, endIdx, rosenka) =>
                  createRoadFromVertices(selectedLand.id, startIdx, endIdx, rosenka, '正面')
                }
                onDelete={() => {
                  const road = selectedLand.roads.find(r => r.type === '正面');
                  if (road) deleteRoad(selectedLand.id, road.id);
                }}
              />
              <RoadTypeInput
                roadType="側方１"
                label="側方路線１"
                color="orange"
                land={selectedLand}
                onSave={(startIdx, endIdx, rosenka) =>
                  createRoadFromVertices(selectedLand.id, startIdx, endIdx, rosenka, '側方１')
                }
                onDelete={() => {
                  const road = selectedLand.roads.find(r => r.type === '側方１');
                  if (road) deleteRoad(selectedLand.id, road.id);
                }}
              />
              <RoadTypeInput
                roadType="側方２"
                label="側方路線２"
                color="orange"
                land={selectedLand}
                onSave={(startIdx, endIdx, rosenka) =>
                  createRoadFromVertices(selectedLand.id, startIdx, endIdx, rosenka, '側方２')
                }
                onDelete={() => {
                  const road = selectedLand.roads.find(r => r.type === '側方２');
                  if (road) deleteRoad(selectedLand.id, road.id);
                }}
              />
              <RoadTypeInput
                roadType="二方"
                label="二方路線"
                color="purple"
                land={selectedLand}
                onSave={(startIdx, endIdx, rosenka) =>
                  createRoadFromVertices(selectedLand.id, startIdx, endIdx, rosenka, '二方')
                }
                onDelete={() => {
                  const road = selectedLand.roads.find(r => r.type === '二方');
                  if (road) deleteRoad(selectedLand.id, road.id);
                }}
              />
            </div>
          )}

          {/* 利用単位 */}
          {selectedLand.usageUnits && selectedLand.usageUnits.length > 0 && (
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800 mb-2">利用単位</h2>
              {(() => {
                // 利用単位の面積を計算
                const calculateUnitArea = (unitVertices: Point[]) => {
                  if (!selectedLand.actualArea || unitVertices.length < 3) return 0;

                  // Shoelace formula for pixel area
                  let pixelArea = 0;
                  const n = unitVertices.length;
                  for (let i = 0; i < n; i++) {
                    const j = (i + 1) % n;
                    pixelArea += unitVertices[i].x * unitVertices[j].y;
                    pixelArea -= unitVertices[j].x * unitVertices[i].y;
                  }
                  pixelArea = Math.abs(pixelArea) / 2;

                  // Convert to actual area using scale
                  const metersPerPixel = calculateScaleFromArea(selectedLand.actualArea, selectedLand.vertices);
                  return pixelArea * metersPerPixel * metersPerPixel;
                };

                const usageUnitsWithArea = selectedLand.usageUnits.map(unit => ({
                  ...unit,
                  calculatedArea: calculateUnitArea(unit.vertices),
                }));

                const totalUsageUnitArea = usageUnitsWithArea.reduce((sum, u) => sum + u.calculatedArea, 0);
                const remainingArea = (selectedLand.actualArea || 0) - totalUsageUnitArea;

                return (
                  <div className="space-y-2">
                    {usageUnitsWithArea.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ backgroundColor: `${unit.color}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: unit.color }}
                          />
                          <span className="text-sm font-medium">{unit.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {unit.calculatedArea.toFixed(2)} ㎡
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('この利用単位を削除しますか？')) {
                                deleteUsageUnit(selectedLand.id, unit.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 残面積 */}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">利用単位合計</span>
                        <span className="font-medium">{totalUsageUnitArea.toFixed(2)} ㎡</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600 font-medium">残面積</span>
                        <span className={`font-bold ${remainingArea < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {remainingArea.toFixed(2)} ㎡
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 評価対象地の測定結果 */}
          {calculationResult && (
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800 mb-2">評価対象地の測定結果</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">面積</span>
                  <span className="font-medium">{calculationResult.landArea.toFixed(2)} ㎡</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">間口距離</span>
                  <span className="font-medium">{calculationResult.frontage.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">計算上の間口距離</span>
                  <span className="font-medium">{soteiSeikeiChi?.width.toFixed(2) || '-'} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">計算上の奥行距離</span>
                  <span className="font-medium">{calculationResult.calculatedDepth.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">通路の面積</span>
                  <span className="font-medium">{selectedLand.passageArea?.toFixed(2) || '0.00'} ㎡</span>
                </div>
                {calculationResult.pricePerSqm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">1㎡当たりの価額</span>
                    <span className="font-medium text-blue-600">
                      {Math.round(calculationResult.pricePerSqm).toLocaleString()} 円
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 想定整形地の測定結果 */}
          {soteiSeikeiChi && (
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800 mb-2">想定整形地の測定結果</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">面積</span>
                  <span className="font-medium">{soteiSeikeiChi.area.toFixed(2)} ㎡</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">間口距離</span>
                  <span className="font-medium">{soteiSeikeiChi.width.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">奥行距離</span>
                  <span className="font-medium">{soteiSeikeiChi.height.toFixed(2)} m</span>
                </div>
              </div>
            </div>
          )}

          {/* 補正率・評価額 */}
          {calculationResult && (
            <div className="p-4 flex-1">
              <h2 className="font-bold text-gray-800 mb-2">補正率</h2>
              <div className="space-y-1 text-sm">
                {/* かげ地割合の計算過程 */}
                <div className="bg-orange-50 rounded p-2 mb-2">
                  <div className="text-gray-700 font-medium mb-1">かげ地割合</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>= かげ地面積 / 想定整形地面積</div>
                    <div>= {calculationResult.kagechArea.toFixed(2)} ㎡ / {calculationResult.soteiSeikeichiArea.toFixed(2)} ㎡</div>
                  </div>
                  <div className="text-right font-bold text-orange-600 mt-1">
                    = {calculationResult.kagechWariai.toFixed(1)} %
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">奥行価格補正率</span>
                  <span>{calculationResult.okuyukiHoseiritsu.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">不整形地補正率</span>
                  <span>{calculationResult.fuseikeichiHoseiritsu.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">間口狭小補正率</span>
                  <span>{calculationResult.maguchikoshoHoseiritsu.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">奥行長大補正率</span>
                  <span>{calculationResult.okuyukichodaiHoseiritsu.toFixed(2)}</span>
                </div>
              </div>

              {calculationResult.evaluatedValue > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-bold">評価額</span>
                    <span className="font-bold text-lg text-blue-600">
                      {Math.round(calculationResult.evaluatedValue).toLocaleString()} 円
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
