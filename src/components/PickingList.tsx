import React, { useEffect, useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";

interface Props {
  data: OrderItem[];
  shippingMethod: string;
  shippingNotes: string[];
  loadedAt: string;
  /** Google Sheets の2次元配列（E列=ASIN, F列=JAN, G列=ロット入数, P列=商品コード, Q列=商品コード, R列=商品名） */
  sheet: string[][];
  excludedItemsCount: number;
  onDataCalculated: (list: PickingItemRow[], total: number) => void;
}

/**
 * SKU管理番号からロット入数を取得するための許可リスト。
 * キー：許可するSKU管理番号の文字列
 * 値：対応するロット入数の数値
 * 今後、許可するSKUが増えた場合は、このオブジェクトに追記するだけでOKです。
 */
const SKU_LOT_UNIT_MAP: { [key: string]: number } = {
  "-2": 2,
  "-4": 4,
  "-6": 6,
  // 例: "-8": 8,
};

const PickingList: React.FC<Props> = ({ data, shippingMethod, loadedAt, sheet, excludedItemsCount, shippingNotes, onDataCalculated }) => {
  const { pickingList, totalSingleUnits } = useMemo(() => {
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const itemCode = item["商品コード"];
      const itemSku = item["商品SKU"];
      const count = parseInt(item["個数"], 10) || 0;
      if (count === 0) return;

      let jan = "";
      let lotUnit = 1;
      let productName = item['商品名'];

      let targetRow: string[] | undefined = undefined;

      // ▼▼▼ ここから仕様に合わせたロジックを再構築 ▼▼▼

      if (itemCode) {
        // --- Step 1: P列(index 15)で一次検索 ---
        const pRows = sheet.filter(r => r[15]?.toLowerCase() === itemCode.toLowerCase());

        // フォールバック用の関数を定義 (itemSkuでQ列を検索)
        const findRowBySkuInQ = () => itemSku ? sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase()) : undefined;

        // --- Step 2: P列のヒット数で分岐 ---
        if (pRows.length === 0) {
          // Case A: P列にヒットなし -> フォールバック
          targetRow = findRowBySkuInQ();

        } else if (pRows.length === 1) {
          // Case B: P列に1件ヒット
          const theOnePRow = pRows[0];
          if (theOnePRow[16]?.toLowerCase() === itemCode.toLowerCase()) {
            // Q列の値がitemCodeと一致 -> この行を採用
            targetRow = theOnePRow;
          } else {
            // Q列の値が不一致 -> フォールバック
            targetRow = findRowBySkuInQ();
          }

        } else if (pRows.length >= 2) {
          // Case C: P列に2件以上ヒット (新旧パッケージの可能性)
          const qRowBySku = findRowBySkuInQ(); // まずitemSkuでQ列を検索
          if (qRowBySku) {
            // const handoverText = qRowBySku[12] || qRowBySku[13] || "";
            // if (handoverText === 'ページ引継ぎ' || handoverText === 'カタログ引継ぎ') {
              // 引継ぎ情報があれば、この行(新パッケージ)を採用
              targetRow = qRowBySku;
            // }
          }
        }
      } else {
        // itemCode自体がCSVにない場合もフォールバックを試みる
        const findRowBySkuInQ = () => itemSku ? sheet.find(r => r[16]?.toLowerCase() === itemSku.toLowerCase()) : undefined;
        targetRow = findRowBySkuInQ();
      }

      // --- Step 3: 最終的なロット入数と商品情報を決定 ---
      // SKUによるロット入数の上書きロジック
      let lotUnitOverride: number | undefined = undefined;
      const skuFromCsv = item['SKU管理番号'];
      if (skuFromCsv && SKU_LOT_UNIT_MAP[skuFromCsv]) {
        lotUnitOverride = SKU_LOT_UNIT_MAP[skuFromCsv];
      }

      if (targetRow) {
        const lotUnitFromSheet = parseInt(targetRow[6] || "1", 10);
        jan = targetRow[5] || "";
        productName = targetRow[17] || item["商品名"];
        lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : lotUnitFromSheet;
      } else {
        lotUnit = lotUnitOverride !== undefined ? lotUnitOverride : 1;
      }

      // ▲▲▲ ここまで ▲▲▲

      const singleUnits = lotUnit * count;
      const mapKey = jan || productName;

      if (map.has(mapKey)) {
        const ex = map.get(mapKey)!;
        ex.個数 += count;
        ex.単品換算数 += singleUnits;
      } else {
        map.set(mapKey, {
          商品名: productName,
          JANコード: jan,
          個数: count,
          単品換算数: singleUnits,
        });
      }
    });

    const list = Array.from(map.values());
    const totalSingles = list.reduce((sum, item) => sum + item.単品換算数, 0);
    return { pickingList: list, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  useEffect(() => {
    onDataCalculated(pickingList, totalSingleUnits);
  }, [pickingList, totalSingleUnits, onDataCalculated]);

  return (
    <div className="list-wrapper">
      <div className="picking-header">
        <div style={{ display: "flex", flexDirection: "row", gap: 20, marginBottom: 10 }}>
          <h2>ピッキングリスト</h2>
          {excludedItemsCount > 0 && (
            <div className="warning-box">
              <strong>注意：</strong>リストアップ対象外の注文が {excludedItemsCount} 件あります。詳細を確認してください。
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            <strong>配送方法:</strong> {shippingMethod}
            {/* shippingNotesに中身がある場合のみ表示 */}
            {shippingNotes.length > 0 && (
              <span className="shipping-notes">
                {' - '}{shippingNotes.join(', ')}{' - '}
              </span>
            )}
          </span>
          <span><strong>ファイル読み込み日時:</strong> {loadedAt}</span>
        </div>
      </div>

      <div className="list-scroller">
        <table>
          <thead>
            <tr>
              <th className="check"><CheckBoxOutlinedIcon /></th>
              <th className="itemName">商品名</th>
              <th className="jan">JAN</th>
              <th className="count">数量</th>
              <th className="case">ケース</th>
              <th className="box">&emsp;箱&emsp;</th>
              <th className="other">その他</th>
            </tr>
          </thead>
          <tbody>
            {pickingList.map((item, index) => (
              <tr key={`${item.JANコード}-${index}`}>
                <td></td>
                <td className="itemName">{item.商品名}</td>
                {/* JANコードは末尾4桁のみ表示 */}
                <td className="jan">{item.JANコード.slice(-4)}</td>
                {/* ロット入数 × 個数の単品換算合計 */}
                <td className="count">{item.単品換算数}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr>
              <td>&emsp;</td>
              <td>&emsp;</td>
              <td>&emsp;</td>
              <td>&emsp;</td>
              <td>&emsp;</td>
              <td>&emsp;</td>
              <td>&emsp;</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="footer-row">
              <td colSpan={3}>合計</td>
              <td style={{ textAlign: "center" }}>{totalSingleUnits}</td>
              <td></td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PickingList;
