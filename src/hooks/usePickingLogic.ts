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
  
  const { rawPickingList, totalSingleUnits } = useMemo(() => {
    console.log("=============== usePickingLogic 再計算開始 ===============");
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const productNameForItem = item['商品名'];
      const count = parseInt(item["個数"], 10) || 0;

      // === CONSOLE GROUP START: 各商品の処理をグループ化して見やすくする ===
      console.group(`--- 処理開始: "${productNameForItem}" (注文数: ${count}) ---`);

      if (count === 0) {
        console.log("注文数が0のためスキップします。");
        console.groupEnd();
        return;
      }

      let jan = "";
      let parentJan: string | undefined = undefined;
      let lotUnit = 1; // ① 初期ロット入数
      let productName = productNameForItem;
      let parentQuantity: number | undefined = undefined;


      // --- STEP 1: SKUによるロット入数の上書きを先にチェック ---
      let lotUnitOverride: number | undefined = undefined;
      const skuFromCsv = item['SKU管理番号'];
      if (skuFromCsv && SKU_LOT_UNIT_MAP[skuFromCsv]) {
        lotUnitOverride = SKU_LOT_UNIT_MAP[skuFromCsv];
      }
      
      // --- STEP 2: スプレッドシートから正しい行を特定 ---
      const itemCode = item["商品コード"];
      const itemSku = item["商品SKU"];
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

      // --- STEP 3: 最終的な商品情報とロット入数を決定 ---
      if (targetRow) {
        jan = targetRow[5] || "";
        productName = targetRow[17] || item["商品名"];
        
        const parentAsin = targetRow[7]; // H列

        if (parentAsin && parentAsin.trim() !== '') {
          parentJan = targetRow[8] || undefined;
          const parentLotUnit = parseInt(targetRow[9] || "1", 10);
          parentQuantity = parentLotUnit * count;
          const childLotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
          lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : childLotUnitFromSheet;

        } else {
          const lotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
          lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : lotUnitFromSheet;
        }

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
        const newEntry = {
          商品名: productName,
          JANコード: jan,
          親JANコード: parentJan,
          個数: count,
          単品換算数: singleUnits,
          親数量: parentQuantity,
        };
        map.set(mapKey, newEntry);
      }
    });

    const list = Array.from(map.values());
    const totalSingles = list.reduce((sum, item) => sum + item.単品換算数, 0);

    return { rawPickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  // 計算結果を返す
  return { rawPickingList, totalSingleUnits };
}