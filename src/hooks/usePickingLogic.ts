// hooks/usePickingLogic.ts

import { useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";

// NOTE: 以前使用していたSKU_LOT_UNIT_MAPは、新しい正規表現ロジックでは不要です。

/**
 * CSVデータとスプレッドシートデータを元に、ピッキングリストの集計と計算を行うカスタムフック
 * @param data - ピッキング対象のフィルタリング済みCSV注文データ
 * @param sheet - スプレッドシートの全データ
 * @returns { rawPickingList, totalSingleUnits } - ソートされていない生の集計リストと合計数量
 */
export function usePickingLogic(data: OrderItem[], sheet: string[][]) {
  
  const { rawPickingList, totalSingleUnits } = useMemo(() => {
    console.log("=============== usePickingLogic 再計算開始 ===============");
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const productNameForItem = item['商品名'];
      const skuFromCsv = item['SKU管理番号'];
      const count = parseInt(item["個数"], 10) || 0;

      // === CONSOLE GROUP START: 各商品の処理をグループ化して見やすくする ===
      console.group(`--- 処理開始: "${productNameForItem}" (注文数: ${count}, SKU: "${skuFromCsv || '空'}") ---`);

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

      console.log(`① [初期値] lotUnit を 1 に設定`);

      // --- STEP 1: SKUからロット入数を動的に取得するロジック (新ロジック) ---
      let lotUnitOverride: number | undefined = undefined;
      console.log(`[SKU PARSING] CSVのSKU管理番号: "${skuFromCsv || '空'}"`);

      if (skuFromCsv) {
        // 正規表現を使って "-m-n" のパターンにマッチさせる
        // ^: 文字列の先頭, -: ハイフン, (\d+): 1桁以上の数字(グループ1, m), -: ハイフン, (\d+): 1桁以上の数字(グループ2, n), $: 文字列の末尾
        const match = skuFromCsv.match(/^-(\d+)-(\d+)$/);
        
        if (match) {
          // マッチした場合: matchは ["-m-n", "m", "n"] という配列になる
          const m = parseInt(match[1], 10);
          const n = parseInt(match[2], 10);
          console.log(` -> [SUCCESS] "-m-n"パターンに一致。 m=${m}, n=${n}`);
          lotUnitOverride = n; // nをロット入数として採用
          console.log(`   -> lotUnitOverride を ${lotUnitOverride} に設定`);
        } else {
          // "-m-n"ではないが、"-n"のパターンもチェック
          const simpleMatch = skuFromCsv.match(/^-(\d+)$/);
          if(simpleMatch) {
            // マッチした場合: simpleMatchは ["-n", "n"] という配列になる
            const n = parseInt(simpleMatch[1], 10);
            console.log(` -> [SUCCESS] "-n"パターンに一致。 n=${n}`);
            lotUnitOverride = n;
            console.log(`   -> lotUnitOverride を ${lotUnitOverride} に設定`);
          } else {
            console.log(` -> [FAIL] どの特殊SKUパターンにも一致しませんでした。`);
          }
        }
      }
      
      // --- STEP 2: スプレッドシートからJANコードの元になる行を特定する ---
      let targetRow: string[] | undefined = undefined;
      const itemCode = item["商品コード"];
      const itemSku = item["商品SKU"];
      
      console.log(`[SHEET SEARCH] itemCode: "${itemCode || '空'}", itemSku: "${itemSku || '空'}" を使って検索します。`);

      // フォールバック用の関数を定義 (itemSkuでQ列を検索)
      const findRowBySkuInQ = () => {
        console.log("   -> [FALLBACK] itemSkuでQ列を検索します...");
        const row = itemSku ? sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase()) : undefined;
        console.log("      -> フォールバック結果:", row);
        return row;
      };

      const qRow = 
        (itemCode && sheet.find(r => r[16]?.toLowerCase() === itemCode.toLowerCase())) ||
        findRowBySkuInQ();

      if (qRow) {
        console.log(" -> Q列で基準行(qRow)を発見:", qRow);
        // P列の検索キーは`itemCode`を使い続ける
        const pRows = sheet.filter(r => r[15]?.toLowerCase() === itemCode?.toLowerCase());
        console.log(` -> P列をitemCodeで検索した結果: ${pRows.length}件ヒット`);

        if (pRows.length === 0) {
          targetRow = qRow;
          console.log("   -> [ルール適用] P列ヒット0件のため、qRowを採用");
        } else if (pRows.length === 1) {
          if (pRows[0] === qRow) {
            targetRow = pRows[0];
            console.log("   -> [ルール適用] P列ヒット1件、かつqRowと同一行のため、その行を採用");
          } else {
            console.log("   -> [ルール適用] P列ヒット1件だがqRowと異なるため、フォールバックを実行します");
            targetRow = findRowBySkuInQ();
          }
        } else if (pRows.length >= 2) {
          targetRow = pRows.find(pRow => pRow !== qRow);
          console.log("   -> [ルール適用] P列ヒット2件以上のため、qRowと異なる行を探す -> 結果:", targetRow);
        }
      } else {
        console.log(" -> Q列でitemCode/itemSkuに一致する行が見つかりませんでした。 (JANが取得できない原因の可能性)");
      }

      // --- STEP 3: 最終的な商品情報とロット入数を決定 ---
      if (targetRow) {
        console.log("③ [最終行決定] targetRowが確定:", targetRow);
        jan = targetRow[5] || "";
        productName = targetRow[17] || item["商品名"];
        
        const parentAsin = targetRow[7]; // H列 (親ASIN)

        if (parentAsin && parentAsin.trim() !== '') {
          console.log("  -> [DECISION PATH] セット商品と判断 (H列に親ASINあり)");
          parentJan = targetRow[8] || undefined;
          const parentLotUnit = parseInt(targetRow[9] || "1", 10); // 親ロットはJ列(9)
          parentQuantity = parentLotUnit * count;
          console.log(`    -> 親ロット入数(J列): ${parentLotUnit}, 親数量: ${parentQuantity}`);
          
          const childLotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
          console.log(`    -> 子ロット入数(G列): ${childLotUnitFromSheet}`);
          lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : childLotUnitFromSheet;

        } else {
          console.log("  -> [DECISION PATH] 通常商品と判断 (H列に親ASINなし)");
          const lotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
          console.log(`    -> ロット入数(G列): ${lotUnitFromSheet}`);
          lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : lotUnitFromSheet;
        }

      } else {
        console.log("③ [最終行決定] targetRowが見つかりませんでした。JANは空になります。");
        lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : 1;
      }
      
      console.log(`④ 【最終ロット入数】: ${lotUnit} (SKU上書き: ${lotUnitOverride !== undefined})`);
      const singleUnits = lotUnit * count;
      console.log(`⑤ 【最終単品換算数】: ${singleUnits} (計算式: ${lotUnit} * ${count})`);
      
      const mapKey = jan || productName;

      // --- ⑥ 集計プロセス ---
      if (map.has(mapKey)) {
        console.log(`⑥ [集計] mapKey "${mapKey}" は既存です。数量を加算します。`);
        const ex = map.get(mapKey)!;
        console.log(`   -> 加算前のデータ:`, JSON.parse(JSON.stringify(ex)));
        
        ex.個数 += count;
        ex.単品換算数 += singleUnits;
        ex.親数量 = (ex.親数量 || 0) + (parentQuantity || 0);

        console.log(`   -> 加算後のデータ:`, ex);
      } else {
        console.log(`⑥ [集計] mapKey "${mapKey}" は新規です。新しいエントリを作成します。`);
        const newEntry: PickingItemRow = { // 型を明記
          商品名: productName,
          JANコード: jan,
          親JANコード: parentJan,
          個数: count,
          単品換算数: singleUnits,
          親数量: parentQuantity,
        };
        map.set(mapKey, newEntry);
        console.log(`   -> 作成後のデータ:`, newEntry);
      }
      
      // === CONSOLE GROUP END ===
      console.groupEnd();

    });
    
    const list = Array.from(map.values());

    // --- ⑦ 集計完了後 ---
    console.log("⑦ 【集計完了後】 mapから生成された最終リスト:", JSON.parse(JSON.stringify(list)));

    const totalSingles = list.reduce((sum, item) => {
      const isSetProduct = item.親JANコード && item.親JANコード.trim() !== '';
      if (isSetProduct) {
        return sum + item.個数;
      } else {
        return sum + item.単品換算数;
      }
    }, 0);
    
    console.log("=============== usePickingLogic 再計算完了 ===============");
    return { rawPickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  return { rawPickingList, totalSingleUnits };
}