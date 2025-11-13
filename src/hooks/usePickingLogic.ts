// hooks/usePickingLogic.ts

import { useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";

export function usePickingLogic(data: OrderItem[], sheet: string[][]) {
  
  const { rawPickingList, totalSingleUnits } = useMemo(() => {
    console.log("=============== usePickingLogic 再計算開始 (確定ロジック) ===============");
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const productNameForItem = item['商品名'];
      const csvCount = parseInt(item["個数"], 10) || 0;

      console.group(`--- 処理開始: "${productNameForItem}" (注文数: ${csvCount}) ---`);

      if (csvCount === 0) {
        console.log("注文数が0のためスキップします。");
        console.groupEnd();
        return;
      }

      // 変数を初期化
      let jan = "";
      let parentJan: string | undefined = undefined;
      let setCount = 1;
      let productName = productNameForItem;
      let parentQuantity: number | undefined = undefined;

      // --- STEP 1: 新しいロジックでqRowを特定 (確定版) ---
      const itemSku = item["商品SKU"];
      const skuKanri = item["SKU管理番号"]; // '商品コード' ではなく 'SKU管理番号'

      console.log(`[qRow特定] 優先1(商品SKU): "${itemSku || '空'}", 優先2(SKU管理番号): "${skuKanri || '空'}" でQ列を検索`);

      const qRow = 
        (itemSku && sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase())) ||
        (skuKanri && sheet.find(r => r[16]?.toLowerCase() === skuKanri.toLowerCase()));

      // --- STEP 2: qRowが見つかった場合の処理 ---
      if (qRow) {
        console.log(" -> [SUCCESS] qRowを発見:", qRow);

        const parentAsin = qRow[7]; // H列 (親ASIN-2)

        if (parentAsin && parentAsin.trim() !== '') {
          // 【セット商品の場合】
          console.log(" -> [判定] セット商品として処理します。");
          
          parentJan = qRow[8]; // I列 (親JAN-2)
          const parentSetCount = parseInt(qRow[9] || '1', 10); // J列 (SET-2)
          parentQuantity = parentSetCount * csvCount;
          
          jan = qRow[5]; // F列 (JAN)
          setCount = parseInt(qRow[6] || '1', 10); // G列 (SET数)
          productName = qRow[17] || productNameForItem; // R列 (親)

          const childAsin = qRow[10]; // K列 (子ASIN)
          console.log(`   -> 親JAN: ${parentJan}, 親SET数: ${parentSetCount}, 親ASIN: ${parentAsin}`);
          console.log(`   -> 子JAN: ${jan}, 子SET数: ${setCount}, 子ASIN: ${childAsin}`);

        } else {
          // 【通常商品の場合】
          console.log(" -> [判定] 通常商品として処理します。");

          const asin = qRow[4]; // E列 (親ASIN)
          jan = qRow[5]; // F列 (JAN)
          setCount = parseInt(qRow[6] || '1', 10); // G列 (SET数)
          productName = qRow[17] || productNameForItem; // R列 (親)
          console.log(`   -> ASIN: ${asin}, JAN: ${jan}, SET数: ${setCount}`);
        }
        
      } else {
        console.log(" -> [FAIL] qRowが見つかりませんでした。CSVの値をデフォルトとして使用します。");
      }

      // --- STEP 4: 最終的な数量を計算 ---
      const singleUnits = setCount * csvCount;
      console.log(`【最終SET数】: ${setCount}`);
      console.log(`【最終数量】: ${singleUnits} (計算式: ${setCount} * ${csvCount})`);

      // --- 集計プロセス ---
      const mapKey = jan || productName;
      if (map.has(mapKey)) {
        const ex = map.get(mapKey)!;
        ex.個数 += csvCount;
        ex.単品換算数 += singleUnits;
        ex.親数量 = (ex.親数量 || 0) + (parentQuantity || 0);
      } else {
        map.set(mapKey, {
          商品名: productName,
          JANコード: jan,
          親JANコード: parentJan,
          個数: csvCount,
          単品換算数: singleUnits,
          親数量: parentQuantity,
        });
      }
      
      console.groupEnd();
    });
    
    const list = Array.from(map.values());
    const totalSingles = list.reduce((sum, item) => {
      const isSetProduct = item.親JANコード && item.親JANコード.trim() !== '';
      return isSetProduct ? sum + item.個数 : sum + item.単品換算数;
    }, 0);
    
    return { rawPickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  return { rawPickingList, totalSingleUnits };
}