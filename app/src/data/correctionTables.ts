import type { ChikaKubun, ChisekiKubun } from '../types';

/**
 * 奥行価格補正率表
 * 国税庁「財産評価基準書」に基づく
 */
export const okuyukiHoseiritsuTable: Record<ChikaKubun, { maxDepth: number; rate: number }[]> = {
  'ビル街地区': [
    { maxDepth: 4, rate: 0.80 },
    { maxDepth: 6, rate: 0.84 },
    { maxDepth: 8, rate: 0.88 },
    { maxDepth: 10, rate: 0.90 },
    { maxDepth: 12, rate: 0.91 },
    { maxDepth: 14, rate: 0.92 },
    { maxDepth: 16, rate: 0.93 },
    { maxDepth: 20, rate: 0.94 },
    { maxDepth: 24, rate: 0.95 },
    { maxDepth: 28, rate: 0.96 },
    { maxDepth: 32, rate: 0.97 },
    { maxDepth: 36, rate: 0.98 },
    { maxDepth: 40, rate: 0.99 },
    { maxDepth: 92, rate: 1.00 },
    { maxDepth: 100, rate: 0.99 },
    { maxDepth: Infinity, rate: 0.98 },
  ],
  '高度商業地区': [
    { maxDepth: 4, rate: 0.80 },
    { maxDepth: 6, rate: 0.84 },
    { maxDepth: 8, rate: 0.88 },
    { maxDepth: 10, rate: 0.90 },
    { maxDepth: 12, rate: 0.91 },
    { maxDepth: 14, rate: 0.92 },
    { maxDepth: 16, rate: 0.93 },
    { maxDepth: 20, rate: 0.94 },
    { maxDepth: 24, rate: 0.95 },
    { maxDepth: 28, rate: 0.96 },
    { maxDepth: 32, rate: 0.97 },
    { maxDepth: 36, rate: 0.98 },
    { maxDepth: 40, rate: 0.99 },
    { maxDepth: 64, rate: 1.00 },
    { maxDepth: 68, rate: 0.99 },
    { maxDepth: 76, rate: 0.98 },
    { maxDepth: 84, rate: 0.97 },
    { maxDepth: 92, rate: 0.96 },
    { maxDepth: 100, rate: 0.95 },
    { maxDepth: Infinity, rate: 0.94 },
  ],
  '繁華街地区': [
    { maxDepth: 4, rate: 0.80 },
    { maxDepth: 6, rate: 0.84 },
    { maxDepth: 8, rate: 0.88 },
    { maxDepth: 10, rate: 0.90 },
    { maxDepth: 12, rate: 0.91 },
    { maxDepth: 14, rate: 0.92 },
    { maxDepth: 16, rate: 0.93 },
    { maxDepth: 20, rate: 0.94 },
    { maxDepth: 24, rate: 0.95 },
    { maxDepth: 28, rate: 0.96 },
    { maxDepth: 32, rate: 0.97 },
    { maxDepth: 36, rate: 0.98 },
    { maxDepth: 40, rate: 0.99 },
    { maxDepth: 56, rate: 1.00 },
    { maxDepth: 60, rate: 0.99 },
    { maxDepth: 64, rate: 0.98 },
    { maxDepth: 68, rate: 0.97 },
    { maxDepth: 76, rate: 0.96 },
    { maxDepth: 84, rate: 0.95 },
    { maxDepth: 92, rate: 0.94 },
    { maxDepth: 100, rate: 0.93 },
    { maxDepth: Infinity, rate: 0.92 },
  ],
  '普通商業・併用住宅地区': [
    { maxDepth: 4, rate: 0.90 },
    { maxDepth: 6, rate: 0.92 },
    { maxDepth: 8, rate: 0.94 },
    { maxDepth: 10, rate: 0.96 },
    { maxDepth: 12, rate: 0.97 },
    { maxDepth: 14, rate: 0.98 },
    { maxDepth: 16, rate: 0.99 },
    { maxDepth: 32, rate: 1.00 },
    { maxDepth: 36, rate: 0.99 },
    { maxDepth: 40, rate: 0.98 },
    { maxDepth: 44, rate: 0.97 },
    { maxDepth: 48, rate: 0.96 },
    { maxDepth: 52, rate: 0.95 },
    { maxDepth: 60, rate: 0.94 },
    { maxDepth: 68, rate: 0.93 },
    { maxDepth: 76, rate: 0.92 },
    { maxDepth: 84, rate: 0.91 },
    { maxDepth: 92, rate: 0.90 },
    { maxDepth: 100, rate: 0.89 },
    { maxDepth: Infinity, rate: 0.88 },
  ],
  '普通住宅地区': [
    { maxDepth: 4, rate: 0.90 },
    { maxDepth: 6, rate: 0.92 },
    { maxDepth: 8, rate: 0.95 },
    { maxDepth: 10, rate: 0.97 },
    { maxDepth: 24, rate: 1.00 },
    { maxDepth: 28, rate: 0.99 },
    { maxDepth: 32, rate: 0.98 },
    { maxDepth: 36, rate: 0.96 },
    { maxDepth: 40, rate: 0.94 },
    { maxDepth: 44, rate: 0.92 },
    { maxDepth: 48, rate: 0.90 },
    { maxDepth: 52, rate: 0.88 },
    { maxDepth: 56, rate: 0.87 },
    { maxDepth: 60, rate: 0.86 },
    { maxDepth: 64, rate: 0.85 },
    { maxDepth: 68, rate: 0.84 },
    { maxDepth: 72, rate: 0.83 },
    { maxDepth: 76, rate: 0.82 },
    { maxDepth: 84, rate: 0.81 },
    { maxDepth: 92, rate: 0.80 },
    { maxDepth: Infinity, rate: 0.80 },
  ],
  '中小工場地区': [
    { maxDepth: 4, rate: 0.85 },
    { maxDepth: 6, rate: 0.88 },
    { maxDepth: 8, rate: 0.91 },
    { maxDepth: 10, rate: 0.94 },
    { maxDepth: 12, rate: 0.96 },
    { maxDepth: 14, rate: 0.97 },
    { maxDepth: 16, rate: 0.98 },
    { maxDepth: 20, rate: 0.99 },
    { maxDepth: 60, rate: 1.00 },
    { maxDepth: 68, rate: 0.99 },
    { maxDepth: 76, rate: 0.98 },
    { maxDepth: 84, rate: 0.97 },
    { maxDepth: 92, rate: 0.96 },
    { maxDepth: 100, rate: 0.95 },
    { maxDepth: Infinity, rate: 0.94 },
  ],
  '大工場地区': [
    { maxDepth: 4, rate: 0.85 },
    { maxDepth: 6, rate: 0.88 },
    { maxDepth: 8, rate: 0.91 },
    { maxDepth: 10, rate: 0.94 },
    { maxDepth: 12, rate: 0.96 },
    { maxDepth: 14, rate: 0.97 },
    { maxDepth: 16, rate: 0.98 },
    { maxDepth: 20, rate: 0.99 },
    { maxDepth: Infinity, rate: 1.00 },
  ],
};

/**
 * 地積区分表（地区区分別の面積基準）
 */
export const chisekiKubunTable: Record<ChikaKubun, { A: number; B: number }> = {
  'ビル街地区': { A: 1000, B: 1500 },
  '高度商業地区': { A: 1000, B: 1500 },
  '繁華街地区': { A: 650, B: 1000 },
  '普通商業・併用住宅地区': { A: 650, B: 1000 },
  '普通住宅地区': { A: 500, B: 750 },
  '中小工場地区': { A: 1000, B: 1500 },
  '大工場地区': { A: 3500, B: 5000 },
};

/**
 * 地積区分を取得
 */
export function getChisekiKubun(chikaKubun: ChikaKubun, area: number): ChisekiKubun {
  const thresholds = chisekiKubunTable[chikaKubun];
  if (area < thresholds.A) return 'A';
  if (area < thresholds.B) return 'B';
  return 'C';
}

/**
 * 不整形地補正率表
 * 地区区分 × 地積区分 × かげ地割合
 */
export const fuseikeichiHoseiritsuTable: Record<
  ChikaKubun,
  Record<ChisekiKubun, { maxKagechi: number; rate: number }[]>
> = {
  '普通住宅地区': {
    A: [
      { maxKagechi: 10, rate: 1.00 },
      { maxKagechi: 15, rate: 0.98 },
      { maxKagechi: 20, rate: 0.96 },
      { maxKagechi: 25, rate: 0.94 },
      { maxKagechi: 30, rate: 0.92 },
      { maxKagechi: 35, rate: 0.90 },
      { maxKagechi: 40, rate: 0.88 },
      { maxKagechi: 45, rate: 0.85 },
      { maxKagechi: 50, rate: 0.82 },
      { maxKagechi: 55, rate: 0.79 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.70 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.99 },
      { maxKagechi: 15, rate: 0.97 },
      { maxKagechi: 20, rate: 0.95 },
      { maxKagechi: 25, rate: 0.93 },
      { maxKagechi: 30, rate: 0.91 },
      { maxKagechi: 35, rate: 0.89 },
      { maxKagechi: 40, rate: 0.87 },
      { maxKagechi: 45, rate: 0.84 },
      { maxKagechi: 50, rate: 0.81 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.75 },
      { maxKagechi: 65, rate: 0.69 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.98 },
      { maxKagechi: 15, rate: 0.96 },
      { maxKagechi: 20, rate: 0.94 },
      { maxKagechi: 25, rate: 0.92 },
      { maxKagechi: 30, rate: 0.90 },
      { maxKagechi: 35, rate: 0.88 },
      { maxKagechi: 40, rate: 0.86 },
      { maxKagechi: 45, rate: 0.83 },
      { maxKagechi: 50, rate: 0.80 },
      { maxKagechi: 55, rate: 0.77 },
      { maxKagechi: 60, rate: 0.74 },
      { maxKagechi: 65, rate: 0.68 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
  },
  '普通商業・併用住宅地区': {
    A: [
      { maxKagechi: 10, rate: 0.99 },
      { maxKagechi: 15, rate: 0.97 },
      { maxKagechi: 20, rate: 0.95 },
      { maxKagechi: 25, rate: 0.93 },
      { maxKagechi: 30, rate: 0.91 },
      { maxKagechi: 35, rate: 0.89 },
      { maxKagechi: 40, rate: 0.87 },
      { maxKagechi: 45, rate: 0.85 },
      { maxKagechi: 50, rate: 0.83 },
      { maxKagechi: 55, rate: 0.80 },
      { maxKagechi: 60, rate: 0.78 },
      { maxKagechi: 65, rate: 0.75 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.98 },
      { maxKagechi: 15, rate: 0.96 },
      { maxKagechi: 20, rate: 0.94 },
      { maxKagechi: 25, rate: 0.92 },
      { maxKagechi: 30, rate: 0.90 },
      { maxKagechi: 35, rate: 0.88 },
      { maxKagechi: 40, rate: 0.86 },
      { maxKagechi: 45, rate: 0.84 },
      { maxKagechi: 50, rate: 0.81 },
      { maxKagechi: 55, rate: 0.79 },
      { maxKagechi: 60, rate: 0.77 },
      { maxKagechi: 65, rate: 0.74 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.97 },
      { maxKagechi: 15, rate: 0.95 },
      { maxKagechi: 20, rate: 0.93 },
      { maxKagechi: 25, rate: 0.91 },
      { maxKagechi: 30, rate: 0.89 },
      { maxKagechi: 35, rate: 0.87 },
      { maxKagechi: 40, rate: 0.85 },
      { maxKagechi: 45, rate: 0.83 },
      { maxKagechi: 50, rate: 0.80 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.73 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
  },
  '繁華街地区': {
    A: [
      { maxKagechi: 10, rate: 0.98 },
      { maxKagechi: 15, rate: 0.96 },
      { maxKagechi: 20, rate: 0.94 },
      { maxKagechi: 25, rate: 0.92 },
      { maxKagechi: 30, rate: 0.90 },
      { maxKagechi: 35, rate: 0.88 },
      { maxKagechi: 40, rate: 0.86 },
      { maxKagechi: 45, rate: 0.84 },
      { maxKagechi: 50, rate: 0.82 },
      { maxKagechi: 55, rate: 0.80 },
      { maxKagechi: 60, rate: 0.78 },
      { maxKagechi: 65, rate: 0.75 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.97 },
      { maxKagechi: 15, rate: 0.95 },
      { maxKagechi: 20, rate: 0.93 },
      { maxKagechi: 25, rate: 0.91 },
      { maxKagechi: 30, rate: 0.89 },
      { maxKagechi: 35, rate: 0.87 },
      { maxKagechi: 40, rate: 0.85 },
      { maxKagechi: 45, rate: 0.83 },
      { maxKagechi: 50, rate: 0.81 },
      { maxKagechi: 55, rate: 0.79 },
      { maxKagechi: 60, rate: 0.77 },
      { maxKagechi: 65, rate: 0.74 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.96 },
      { maxKagechi: 15, rate: 0.94 },
      { maxKagechi: 20, rate: 0.92 },
      { maxKagechi: 25, rate: 0.90 },
      { maxKagechi: 30, rate: 0.88 },
      { maxKagechi: 35, rate: 0.86 },
      { maxKagechi: 40, rate: 0.84 },
      { maxKagechi: 45, rate: 0.82 },
      { maxKagechi: 50, rate: 0.80 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.73 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
  },
  '高度商業地区': {
    A: [
      { maxKagechi: 10, rate: 0.97 },
      { maxKagechi: 15, rate: 0.95 },
      { maxKagechi: 20, rate: 0.93 },
      { maxKagechi: 25, rate: 0.91 },
      { maxKagechi: 30, rate: 0.89 },
      { maxKagechi: 35, rate: 0.87 },
      { maxKagechi: 40, rate: 0.85 },
      { maxKagechi: 45, rate: 0.83 },
      { maxKagechi: 50, rate: 0.80 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.74 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.96 },
      { maxKagechi: 15, rate: 0.94 },
      { maxKagechi: 20, rate: 0.92 },
      { maxKagechi: 25, rate: 0.90 },
      { maxKagechi: 30, rate: 0.88 },
      { maxKagechi: 35, rate: 0.86 },
      { maxKagechi: 40, rate: 0.84 },
      { maxKagechi: 45, rate: 0.82 },
      { maxKagechi: 50, rate: 0.79 },
      { maxKagechi: 55, rate: 0.77 },
      { maxKagechi: 60, rate: 0.75 },
      { maxKagechi: 65, rate: 0.73 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.95 },
      { maxKagechi: 15, rate: 0.93 },
      { maxKagechi: 20, rate: 0.91 },
      { maxKagechi: 25, rate: 0.89 },
      { maxKagechi: 30, rate: 0.87 },
      { maxKagechi: 35, rate: 0.85 },
      { maxKagechi: 40, rate: 0.83 },
      { maxKagechi: 45, rate: 0.81 },
      { maxKagechi: 50, rate: 0.78 },
      { maxKagechi: 55, rate: 0.76 },
      { maxKagechi: 60, rate: 0.74 },
      { maxKagechi: 65, rate: 0.72 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
  },
  'ビル街地区': {
    A: [
      { maxKagechi: 10, rate: 0.95 },
      { maxKagechi: 15, rate: 0.93 },
      { maxKagechi: 20, rate: 0.91 },
      { maxKagechi: 25, rate: 0.89 },
      { maxKagechi: 30, rate: 0.87 },
      { maxKagechi: 35, rate: 0.85 },
      { maxKagechi: 40, rate: 0.83 },
      { maxKagechi: 45, rate: 0.81 },
      { maxKagechi: 50, rate: 0.79 },
      { maxKagechi: 55, rate: 0.77 },
      { maxKagechi: 60, rate: 0.75 },
      { maxKagechi: 65, rate: 0.73 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.94 },
      { maxKagechi: 15, rate: 0.92 },
      { maxKagechi: 20, rate: 0.90 },
      { maxKagechi: 25, rate: 0.88 },
      { maxKagechi: 30, rate: 0.86 },
      { maxKagechi: 35, rate: 0.84 },
      { maxKagechi: 40, rate: 0.82 },
      { maxKagechi: 45, rate: 0.80 },
      { maxKagechi: 50, rate: 0.78 },
      { maxKagechi: 55, rate: 0.76 },
      { maxKagechi: 60, rate: 0.74 },
      { maxKagechi: 65, rate: 0.72 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.93 },
      { maxKagechi: 15, rate: 0.91 },
      { maxKagechi: 20, rate: 0.89 },
      { maxKagechi: 25, rate: 0.87 },
      { maxKagechi: 30, rate: 0.85 },
      { maxKagechi: 35, rate: 0.83 },
      { maxKagechi: 40, rate: 0.81 },
      { maxKagechi: 45, rate: 0.79 },
      { maxKagechi: 50, rate: 0.77 },
      { maxKagechi: 55, rate: 0.75 },
      { maxKagechi: 60, rate: 0.73 },
      { maxKagechi: 65, rate: 0.71 },
      { maxKagechi: Infinity, rate: 0.70 },
    ],
  },
  '中小工場地区': {
    A: [
      { maxKagechi: 10, rate: 1.00 },
      { maxKagechi: 15, rate: 0.98 },
      { maxKagechi: 20, rate: 0.96 },
      { maxKagechi: 25, rate: 0.94 },
      { maxKagechi: 30, rate: 0.92 },
      { maxKagechi: 35, rate: 0.90 },
      { maxKagechi: 40, rate: 0.88 },
      { maxKagechi: 45, rate: 0.85 },
      { maxKagechi: 50, rate: 0.82 },
      { maxKagechi: 55, rate: 0.79 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.70 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.99 },
      { maxKagechi: 15, rate: 0.97 },
      { maxKagechi: 20, rate: 0.95 },
      { maxKagechi: 25, rate: 0.93 },
      { maxKagechi: 30, rate: 0.91 },
      { maxKagechi: 35, rate: 0.89 },
      { maxKagechi: 40, rate: 0.87 },
      { maxKagechi: 45, rate: 0.84 },
      { maxKagechi: 50, rate: 0.81 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.75 },
      { maxKagechi: 65, rate: 0.69 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.98 },
      { maxKagechi: 15, rate: 0.96 },
      { maxKagechi: 20, rate: 0.94 },
      { maxKagechi: 25, rate: 0.92 },
      { maxKagechi: 30, rate: 0.90 },
      { maxKagechi: 35, rate: 0.88 },
      { maxKagechi: 40, rate: 0.86 },
      { maxKagechi: 45, rate: 0.83 },
      { maxKagechi: 50, rate: 0.80 },
      { maxKagechi: 55, rate: 0.77 },
      { maxKagechi: 60, rate: 0.74 },
      { maxKagechi: 65, rate: 0.68 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
  },
  '大工場地区': {
    A: [
      { maxKagechi: 10, rate: 1.00 },
      { maxKagechi: 15, rate: 0.98 },
      { maxKagechi: 20, rate: 0.96 },
      { maxKagechi: 25, rate: 0.94 },
      { maxKagechi: 30, rate: 0.92 },
      { maxKagechi: 35, rate: 0.90 },
      { maxKagechi: 40, rate: 0.88 },
      { maxKagechi: 45, rate: 0.86 },
      { maxKagechi: 50, rate: 0.83 },
      { maxKagechi: 55, rate: 0.80 },
      { maxKagechi: 60, rate: 0.77 },
      { maxKagechi: 65, rate: 0.71 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    B: [
      { maxKagechi: 10, rate: 0.99 },
      { maxKagechi: 15, rate: 0.97 },
      { maxKagechi: 20, rate: 0.95 },
      { maxKagechi: 25, rate: 0.93 },
      { maxKagechi: 30, rate: 0.91 },
      { maxKagechi: 35, rate: 0.89 },
      { maxKagechi: 40, rate: 0.87 },
      { maxKagechi: 45, rate: 0.85 },
      { maxKagechi: 50, rate: 0.82 },
      { maxKagechi: 55, rate: 0.79 },
      { maxKagechi: 60, rate: 0.76 },
      { maxKagechi: 65, rate: 0.70 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
    C: [
      { maxKagechi: 10, rate: 0.98 },
      { maxKagechi: 15, rate: 0.96 },
      { maxKagechi: 20, rate: 0.94 },
      { maxKagechi: 25, rate: 0.92 },
      { maxKagechi: 30, rate: 0.90 },
      { maxKagechi: 35, rate: 0.88 },
      { maxKagechi: 40, rate: 0.86 },
      { maxKagechi: 45, rate: 0.84 },
      { maxKagechi: 50, rate: 0.81 },
      { maxKagechi: 55, rate: 0.78 },
      { maxKagechi: 60, rate: 0.75 },
      { maxKagechi: 65, rate: 0.69 },
      { maxKagechi: Infinity, rate: 0.60 },
    ],
  },
};

/**
 * 間口狭小補正率表
 */
export const maguchikoshoHoseiritsuTable: Record<
  ChikaKubun,
  { maxFrontage: number; rate: number }[]
> = {
  'ビル街地区': [
    { maxFrontage: 4, rate: 0.85 },
    { maxFrontage: 6, rate: 0.94 },
    { maxFrontage: 8, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '高度商業地区': [
    { maxFrontage: 4, rate: 0.85 },
    { maxFrontage: 6, rate: 0.94 },
    { maxFrontage: 8, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '繁華街地区': [
    { maxFrontage: 4, rate: 0.90 },
    { maxFrontage: 6, rate: 0.97 },
    { maxFrontage: 8, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '普通商業・併用住宅地区': [
    { maxFrontage: 4, rate: 0.90 },
    { maxFrontage: 6, rate: 0.97 },
    { maxFrontage: 8, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '普通住宅地区': [
    { maxFrontage: 4, rate: 0.90 },
    { maxFrontage: 6, rate: 0.94 },
    { maxFrontage: 8, rate: 0.97 },
    { maxFrontage: 10, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '中小工場地区': [
    { maxFrontage: 4, rate: 0.90 },
    { maxFrontage: 6, rate: 0.94 },
    { maxFrontage: 8, rate: 0.97 },
    { maxFrontage: 10, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
  '大工場地区': [
    { maxFrontage: 8, rate: 0.90 },
    { maxFrontage: 10, rate: 0.95 },
    { maxFrontage: 16, rate: 1.00 },
    { maxFrontage: Infinity, rate: 1.00 },
  ],
};

/**
 * 奥行長大補正率表
 * 奥行距離÷間口距離の比率で判定
 */
export const okuyukichodaiHoseiritsuTable: Record<
  ChikaKubun,
  { maxRatio: number; rate: number }[]
> = {
  'ビル街地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '高度商業地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '繁華街地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '普通商業・併用住宅地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '普通住宅地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '中小工場地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.98 },
    { maxRatio: 4, rate: 0.96 },
    { maxRatio: 5, rate: 0.94 },
    { maxRatio: 6, rate: 0.92 },
    { maxRatio: 7, rate: 0.90 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
  '大工場地区': [
    { maxRatio: 2, rate: 1.00 },
    { maxRatio: 3, rate: 0.99 },
    { maxRatio: 4, rate: 0.98 },
    { maxRatio: 5, rate: 0.96 },
    { maxRatio: 6, rate: 0.94 },
    { maxRatio: 7, rate: 0.92 },
    { maxRatio: 8, rate: 0.90 },
    { maxRatio: Infinity, rate: 0.90 },
  ],
};

/**
 * 奥行価格補正率を取得
 */
export function getOkuyukiHoseiritsu(chikaKubun: ChikaKubun, depth: number): number {
  const table = okuyukiHoseiritsuTable[chikaKubun];
  for (const entry of table) {
    if (depth < entry.maxDepth) {
      return entry.rate;
    }
  }
  return table[table.length - 1].rate;
}

/**
 * 不整形地補正率を取得
 */
export function getFuseikeichiHoseiritsu(
  chikaKubun: ChikaKubun,
  area: number,
  kagechiWariai: number
): number {
  const chisekiKubun = getChisekiKubun(chikaKubun, area);
  const table = fuseikeichiHoseiritsuTable[chikaKubun][chisekiKubun];

  for (const entry of table) {
    if (kagechiWariai < entry.maxKagechi) {
      return entry.rate;
    }
  }
  return table[table.length - 1].rate;
}

/**
 * 間口狭小補正率を取得
 */
export function getMaguchikoshoHoseiritsu(
  chikaKubun: ChikaKubun,
  frontage: number
): number {
  const table = maguchikoshoHoseiritsuTable[chikaKubun];
  for (const entry of table) {
    if (frontage < entry.maxFrontage) {
      return entry.rate;
    }
  }
  return table[table.length - 1].rate;
}

/**
 * 奥行長大補正率を取得
 */
export function getOkuyukichodaiHoseiritsu(
  chikaKubun: ChikaKubun,
  depth: number,
  frontage: number
): number {
  if (frontage === 0) return 1.00;
  const ratio = depth / frontage;
  const table = okuyukichodaiHoseiritsuTable[chikaKubun];

  for (const entry of table) {
    if (ratio < entry.maxRatio) {
      return entry.rate;
    }
  }
  return table[table.length - 1].rate;
}
