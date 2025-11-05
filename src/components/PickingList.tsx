import React, { useEffect, useMemo, useState } from "react";
import type { OrderItem, PickingItemRow } from "../types";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import { usePickingLogic } from "../hooks/usePickingLogic";
import { formatJanDisplay } from "../utils/janDisplayHelper";

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
  const [isSorted, setIsSorted] = useState<boolean>(true);

// 1. フックからソートされていない「生」のリストを受け取る
  const { rawPickingList, totalSingleUnits } = usePickingLogic(data, sheet);
  
  // 2. isSortedの状態に応じて、表示用のリストをuseMemoで生成する
  const pickingList = useMemo(() => {
    // isSortedがfalseの場合は、生のリストをそのまま返す
    if (!isSorted) {
      return rawPickingList;
    }
    // isSortedがtrueの場合は、配列のコピーを作成してからソートする
    // これにより、元のrawPickingListが変更されるのを防ぐ
    return [...rawPickingList].sort((a, b) => a.商品名.localeCompare(b.商品名, 'ja'));
  }, [rawPickingList, isSorted]); // 生リストか、ソート状態が変わったら再計算
  
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
          <div>
            <span>
              <strong>配送方法:</strong> {shippingMethod}
              {/* shippingNotesに中身がある場合のみ表示 */}
              {shippingNotes.length > 0 && (
                <span className="shipping-notes">
                  {' - '}{shippingNotes.join(', ')}{' - '}
                </span>
              )}
            </span>
            <br />
            <span><strong>ファイル読み込み日時:</strong> {loadedAt}</span>
          </div>
          <button 
            onClick={() => setIsSorted(!isSorted)} 
            // isSortedがtrueの場合に 'active' クラスを追加
            className={`sort-toggle-button ${isSorted ? 'active' : ''}`}
          >
            ソート
          </button>
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
              <tr key={`${item.商品名}-${item.JANコード}-${index}`}>
                <td></td>
                <td className="itemName">{item.商品名}</td>
                <td className="jan">
                  {/* 子JANの表示 */}
                  {formatJanDisplay(item.JANコード)}
                  {/* 親JANが存在する場合、改行して表示 */}
                  {item.親JANコード && (
                    <>
                      <br />
                      <span className="parent-jan">({formatJanDisplay(item.親JANコード)})</span>
                    </>
                  )}
                </td>
                <td className="count">
                  {item.単品換算数}
                  {(item.親数量 && item.親数量 > 0) ? (
                    <>
                      <br />
                      <span className="parent-quantity">({item.親数量})</span>
                    </>
                  ) : null
                  }
                </td>
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
