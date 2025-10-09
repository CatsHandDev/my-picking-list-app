import { useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";

// PickingListで定義されていた定数も、ロジックと一括りにしてこちらに移動
const SKU_LOT_UNIT_MAP: { [key: string]: number } = {
  "-2": 2,
  "-4": 4,
  "-6": 6,
};

/**
 * CSVデータとスプレッドシートデータを元に、ピッキングリストの集計と計算を行うカスタムフック
 * @param data - ピッキング対象のフィルタリング済みCSV注文データ
 * @param sheet - スプレッドシートの全データ
 * @returns { pickingList, totalSingleUnits } - 計算済みのピッキングリストと合計数量
 */
export function usePickingLogic(data: OrderItem[], sheet: string[][]) {
  
  // PickingListにあったuseMemoを、そのままこのフックの本体として利用
  const { rawPickingList, totalSingleUnits } = useMemo(() => {
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const itemCode = item["商品コード"];
      const itemSku = item["商品SKU"];
      const count = parseInt(item["個数"], 10) || 0;
      if (count === 0) return;

      let jan = "";
      let parentJan: string | undefined = undefined;
      let lotUnit = 1;
      let productName = item['商品名'];
      let parentQuantity: number | undefined = undefined;

      // --- SKUによるロット入数の上書きロジック ---
      let lotUnitOverride: number | undefined = undefined;
      const skuFromCsv = item['SKU管理番号'];
      if (skuFromCsv && SKU_LOT_UNIT_MAP[skuFromCsv]) {
        lotUnitOverride = SKU_LOT_UNIT_MAP[skuFromCsv];
      }
      
      // --- スプレッドシートから正しい行を特定するロジック ---
      let targetRow: string[] | undefined = undefined;
      
      const qRow = 
        (itemCode && sheet.find(r => r[16]?.toLowerCase() === itemCode.toLowerCase())) ||
        (itemSku && sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase()));

      if (qRow) {
        const pRows = sheet.filter(r => r[15]?.toLowerCase() === itemCode?.toLowerCase());
        if (pRows.length === 0) {
          targetRow = qRow;
        } else if (pRows.length === 1) {
          if (pRows[0] === qRow) {
            targetRow = pRows[0];
          }
        } else if (pRows.length >= 2) {
          targetRow = pRows.find(pRow => pRow !== qRow);
        }
      }

      // --- 最終的なロット入数と商品情報を決定 ---
      if (targetRow) {
        const lotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
        jan = targetRow[5] || "";
        productName = targetRow[17] || item["商品名"];
        const parentAsin = targetRow[7]; // H列 (親ASIN)
        // H列に親ASINが存在する場合のみ、I列(親JAN)を取得する
        if (parentAsin && parentAsin.trim() !== '') {
          parentJan = targetRow[8] || undefined; // I列 (親JAN)
          // J列(index 9)から親ロット入数を取得。見つからなければ1とする
          const parentLotUnit = parseInt(targetRow[9] || "1", 10);
          parentQuantity = parentLotUnit * count;
        }
        lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : lotUnitFromSheet;
      } else {
        lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : 1;
      }
      
      const singleUnits = lotUnit * count;
      const mapKey = jan || productName;

      if (map.has(mapKey)) {
        const ex = map.get(mapKey)!;
        ex.個数 += count;
        ex.単品換算数 += singleUnits;
        ex.親数量 = (ex.親数量 || 0) + (parentQuantity || 0);
      } else {
        map.set(mapKey, {
          商品名: productName,
          JANコード: jan,
          親JANコード: parentJan,
          個数: count,
          単品換算数: singleUnits,
          親数量: parentQuantity,
        });
      }
    });

    const list = Array.from(map.values());
    
    const totalSingles = list.reduce((sum, item) => sum + item.単品換算数, 0);

    return { rawPickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  // 計算結果を返す
  return { rawPickingList, totalSingleUnits };
}