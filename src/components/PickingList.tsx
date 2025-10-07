import React, { useEffect, useMemo } from "react";
import type { OrderItem, PickingItemRow } from "../types";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import { usePickingLogic } from "../hooks/usePickingLogic";

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

const PickingList: React.FC<Props> = ({ data, shippingMethod, loadedAt, sheet, excludedItemsCount, shippingNotes, onDataCalculated }) => {
  const { pickingList, totalSingleUnits } = usePickingLogic(data, sheet);
  
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
