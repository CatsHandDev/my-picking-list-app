import React, { useMemo } from "react";
import type { OrderItem } from "../types";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";

interface Props {
  data: OrderItem[];
  shippingMethod: string;
  loadedAt: string;
  /** Google Sheets の2次元配列（F列=JAN, G列=ロット入数, Q列=商品コード） */
  sheet: string[][];
}

type RowData = {
  商品名: string;
  JANコード: string;
  個数: number;        // CSVの個数合計
  単品換算数: number;  // ロット入数×個数 合計
};

const PickingList: React.FC<Props> = ({ data, shippingMethod, loadedAt, sheet }) => {
  const { pickingList, totalSingleUnits } = useMemo(() => {
    const map = new Map<string, RowData>();
    /**
     * map のキーは JANコード。
     *  -> 商品コードごとにJANとロット入数をスプレッドシートから取得
     *  -> JANが同じなら単品換算数を合算
     */
    data.forEach((item) => {
      const itemCode = item["商品コード"];
      const count = parseInt(item["個数"], 10) || 0;
      if (!itemCode) return;

      // スプレッドシートから該当行を商品コード(Q列: index16)で検索
      const row = sheet.find((r) => r[16] === itemCode);
      const jan = row?.[5] || "";                     // F列がJANコード
      const lotUnit = parseInt(row?.[6] || "1", 10);   // G列がロット入数(無ければ1)

      if (!jan) return;

      const singleUnits = lotUnit * count;

      // JANコードとG列=1の行を検索して商品名取得
      const nameRow = sheet.find((r) => r[5] === jan && r[6] === "1");
      const productName = nameRow?.[3] || item["商品名"]; // D列

      if (map.has(jan)) {
        const ex = map.get(jan)!;
        ex.個数 += count;                // ケース単位合計
        ex.単品換算数 += singleUnits;    // 単品換算合計
      } else {
        map.set(jan, {
          商品名: productName,
          JANコード: jan,
          個数: count,
          単品換算数: singleUnits,
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => a.商品名.localeCompare(b.商品名, 'ja'));
    const total = list.reduce((sum, item) => sum + item.個数, 0);
    const totalSingles = list.reduce((sum, item) => sum + item.単品換算数, 0);

    return { pickingList: list, totalCount: total, totalSingleUnits: totalSingles };
  }, [data, sheet]);

  return (
    <div className="list-container">
      <div className="picking-header">
        <h2>ピッキングリスト</h2>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span><strong>配送方法:</strong> {shippingMethod}</span>
          <span><strong>ファイル読み込み日時:</strong> {loadedAt}</span>
        </div>
      </div>

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
  );
};

export default PickingList;
