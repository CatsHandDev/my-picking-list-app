import type { OrderItem } from '../types';

/**
 * 注文アイテムとスプレッドシートデータから、SET数(ロット入数)を計算して返す
 * @param item - CSVから読み込んだ単一の注文アイテム
 * @param sheet - スプレッドシートの全データ
 * @returns 計算されたSET数 (数値)
 */
export function calculateSetCount(item: OrderItem, sheet: string[][]): number {
  const itemSku = item["商品SKU"];
  const skuKanri = item["SKU管理番号"];

  const qRow = 
    (itemSku && sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase())) ||
    (skuKanri && sheet.find(r => r[16]?.toLowerCase() === skuKanri.toLowerCase()));

  if (qRow) {
    // qRowが見つかった場合、G列(SET数)の値を返す
    return parseInt(qRow[6] || '1', 10);
  } else {
    // qRowが見つからなかった場合は、デフォルトの1を返す
    return 1;
  }
}

/**
 * 注文アイテムとシートデータから、最終的なJANコードを検索して返す
 * @param item - CSVから読み込んだ単一の注文アイテム
 * @param sheet - スプレッドシートの全データ
 * @returns 検索されたJANコード (見つからなければ空文字列)
 */
export function findJanCode(item: OrderItem, sheet: string[][]): string {
  const itemSku = item["商品SKU"];
  const skuKanri = item["SKU管理番号"];

  // qRowの特定ロジック (usePickingLogicと同じ)
  const qRow = 
    (itemSku && sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase())) ||
    (skuKanri && sheet.find(r => r[16]?.toLowerCase() === skuKanri.toLowerCase()));

  if (qRow) {
    // qRowが見つかった場合、F列(JAN)の値を返す
    return qRow[5] || '';
  } else {
    // qRowが見つからなかった場合は、空文字列を返す
    return '';
  }
}