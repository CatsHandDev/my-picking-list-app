import React from 'react';

// PickingListから型定義などを再利用
interface RowData {
  商品名: string;
  JANコード: string;
  単品換算数: number;
}

interface PrintableProps {
  pickingList: RowData[];
  shippingMethod: string;
  loadedAt: string;
  totalSingleUnits: number;
}

// forwardRef を使って親から ref を受け取れるようにする
const PrintablePickingList = React.forwardRef<HTMLDivElement, PrintableProps>(
  ({ pickingList, shippingMethod, loadedAt, totalSingleUnits }, ref) => {
    return (
      // ref はこの一番外側の div に設定する
      <div ref={ref} className="printable-container">
        <div className="picking-header">
          <h2>ピッキングリスト</h2>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong>配送方法:</strong> {shippingMethod}</span>
            <span><strong>ファイル読み込み日時:</strong> {loadedAt}</span>
          </div>
        </div>

        {/* 1. ヘッダーだけのテーブル */}
        <table className="print-table">
          <thead>
            <tr>
              <th className="check" style={{ width: '3%' }}></th>
              <th className="itemName" style={{ width: '40%' }}>商品名</th>
              <th className="jan" style={{ width: '7%' }}>JAN</th>
              <th className="count" style={{ width: '5%' }}>数量</th>
              <th className="case" style={{ width: '5%' }}>ケース</th>
              <th className="box" style={{ width: '5%' }}>&emsp;箱&emsp;</th>
              <th className="other">その他</th>
            </tr>
          </thead>
        </table>

        {/* 2. ボディだけのテーブル（これが複数ページにまたがる） */}
        <table className="print-table">
          <tbody>
            {pickingList.map((item, index) => (
              <tr key={`${item.JANコード}-${item.商品名}-${index}`}>
                <td className="check" style={{ width: '3%' }}></td>
                <td className="itemName" style={{ width: '40%' }}>{item.商品名}</td>
                <td className="jan" style={{ width: '7%' }}>{item.JANコード ? item.JANコード.slice(-4) : ''}</td>
                <td className="count" style={{ width: '5%' }}>{item.単品換算数}</td>
                <td className="case" style={{ width: '5%' }}></td>
                <td className="box" style={{ width: '5%' }}></td>
                <td className="other"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3. フッターだけのテーブル */}
        <table className="print-table footer-table">
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
  }
);

// displayName を設定（デバッグ時に役立つ）
PrintablePickingList.displayName = 'PrintablePickingList';

export default PrintablePickingList;