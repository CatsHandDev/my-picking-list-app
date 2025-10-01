import React, { useEffect, useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import { log } from "console";

interface Props {
  data: OrderItem[];
  shippingMethod: string;
  loadedAt: string;
  /** Google Sheets の2次元配列（E列=ASIN, F列=JAN, G列=ロット入数, P列=商品コード, Q列=商品コード, R列=商品名） */
  sheet: string[][];
  excludedItemsCount: number;
  onDataCalculated: (list: PickingItemRow[], total: number) => void;
}

/**
 * ASIN変換ルールを管理するマップ。
 * 今後、新しい変換ルールはここに追加するだけで対応できます。
 * キー：変換元のASIN（必ず小文字で記述）
 * 値：変換先のASIN
 */
const ASIN_TRANSFORMATION_MAP: { [key: string]: string } = {
  // 例：'another-old-asin': 'another-new-asin',
  'B0CCDGB44G': 'B0D11J69YH',
};

const PickingList: React.FC<Props> = ({ data, shippingMethod, loadedAt, sheet, excludedItemsCount, onDataCalculated }) => {
  const { pickingList, totalSingleUnits } = useMemo(() => {
    const map = new Map<string, PickingItemRow>();

    data.forEach((item) => {
      const itemCode = item["商品コード"];
      const count = parseInt(item["個数"], 10) || 0;
      if (count === 0) return; // 個数が0の商品はスキップ

      // 各商品のデフォルト値をCSVの値で初期化
      // let jan = item["JANコード"];
      let jan = "";
      let lotUnit = 1;
      let productName = item['商品名'];

      // 商品コードがCSVに存在する場合のみ、スプレッドシートを検索
      const row = itemCode ? sheet.find((r) => r[16]?.toLowerCase() === itemCode.toLowerCase()) : undefined;

      if (row) {
        // --- スプレッドシートに商品コードが見つかった場合の処理 ---
        // 1. 最初に一致した行からASINを取得 (E列: index 4)
        const originalAsin = row[4] || "";
        const asin = ASIN_TRANSFORMATION_MAP[originalAsin] || originalAsin;
 
        // 2. 「ASIN(E列)」と「商品コード(P列)」の両方が一致する行を再検索
        const lotRow = (asin && itemCode)
          ? sheet.find(r =>
              r[4]?.toLowerCase() === asin.toLowerCase() &&     // E列(index 4)がASINと一致
              r[15]?.toLowerCase() === itemCode.toLowerCase()  // P列(index 15)が商品コードと一致
            )
          : undefined;

        // 3. lotRowが見つかれば、その行のロット入数(G列: index 6)を採用。見つからなければデフォルトの1のまま。
        if (lotRow) {
          lotUnit = parseInt(lotRow[6] || "1", 10);
        }

        const foundJan = lotRow?.[5] || ""; // F列がJANコード

        if (foundJan) {
          jan = foundJan;
          // R列(index 17)から商品名を取得
          productName = lotRow?.[17] || item["商品名"];
        }
      }
      // --- スプレッドシートにない場合は、デフォルト値がそのまま使われる ---

      const singleUnits = lotUnit * count;

      // 集計用のキーを決定。JANコードがあればJANを、なければ商品名を使用する
      const mapKey = jan || productName;

      // キーを元にデータを集計
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

    // 商品名でリストを昇順にソートする
    list.sort((a, b) => a.商品名.localeCompare(b.商品名, 'ja'));

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
              <strong>注意：</strong>ピッキング対象外の注文が {excludedItemsCount} 件あります。詳細を確認してください。
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span><strong>配送方法:</strong> {shippingMethod}</span>
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
