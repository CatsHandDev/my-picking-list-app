import React from 'react';
import type { OrderItem } from '../types';

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
  multiItemOrders: OrderItem[];
  shippingNotes: string[];
}

// forwardRef を使って親から ref を受け取れるようにする
const PrintablePickingList = React.forwardRef<HTMLDivElement, PrintableProps>(
  ({ pickingList, shippingMethod, loadedAt, totalSingleUnits, multiItemOrders, shippingNotes }, ref) => {
    return (
      // ref はこの一番外側の div に設定する
      <div ref={ref} className="printable-container">
        <div className="picking-header">
          <h2>ピッキングリスト</h2>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span><strong>配送方法:</strong> {shippingMethod}</span>
            {shippingNotes.length > 0 && (
              <span className="shipping-notes">
                {' - '}{shippingNotes.join(', ')}{' - '}
              </span>
            )}
            <span><strong>ファイル読み込み日時:</strong> {loadedAt}</span>
          </div>
        </div>

        {/* 1. ヘッダーだけのテーブル */}
        <table className="print-table">
          <thead>
            <tr>
              <th className="check" style={{ width: '3%' }}></th>
              <th className="itemName" style={{ flex: 1 }}>商品名</th>
              <th className="jan" style={{ width: '7%' }}>JAN</th>
              <th className="count" style={{ width: '5%' }}>数量</th>
              <th className="case" style={{ width: '5%' }}>ケース</th>
              <th className="box" style={{ width: '5%' }}>箱</th>
              <th className="other" style={{ width: '5%' }}>その他</th>
            </tr>
          </thead>
        </table>

        {/* 2. ボディだけのテーブル（これが複数ページにまたがる） */}
        <table className="print-table">
          <tbody>
            {pickingList.map((item, index) => (
              <tr key={`${item.JANコード}-${item.商品名}-${index}`}>
                <td className="check" style={{ width: '3%' }}></td>
                <td className="itemName" style={{ flex: 1 }}>{item.商品名}</td>
                <td className="jan" style={{ width: '7%' }}>{item.JANコード ? item.JANコード.slice(-4) : ''}</td>
                <td className="count" style={{ width: '5%' }}>{item.単品換算数}</td>
                <td className="case" style={{ width: '5%' }}></td>
                <td className="box" style={{ width: '5%' }}></td>
                <td className="other" style={{ width: '5%' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <table className="print-table">
          <tbody>
            <tr>
              <td className="check" style={{ width: '3%' }}>&nbsp;</td>
              <td className="itemName" style={{ flex: 1 }}>&nbsp;</td>
              <td className="jan" style={{ width: '7%' }}>&nbsp;</td>
              <td className="count" style={{ width: '5%' }}>&nbsp;</td>
              <td className="case" style={{ width: '5%' }}>&nbsp;</td>
              <td className="box" style={{ width: '5%' }}>&nbsp;</td>
              <td className="other" style={{ width: '5%' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* 3. フッターだけのテーブル */}
        <table className="print-table footer-table">
          <tfoot>
            <tr className="footer-row">
              <td className="check" style={{ width: '3%' }}>合計</td>
              <td className="itemName" style={{ flex: 1 }}></td>
              <td className="jan" style={{ width: '7%' }}></td>
              <td className="count" style={{ width: '5%', textAlign: "center" }}>{totalSingleUnits}</td>
              <td className="case" style={{ width: '5%' }}></td>
              <td className="box" style={{ width: '5%' }}></td>
              <td className="other" style={{ width: '5%' }}></td>
            </tr>
          </tfoot>
        </table>

        {/* 複数個注文が1件以上ある場合のみ、このセクションを描画 */}
        {multiItemOrders.length > 0 && (
          <div className="multi-order-list-container">
            <h2>複数個注文リスト</h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>GoQ管理番号</th>
                  <th style={{ width: '15%' }}>受注番号</th>
                  <th style={{ width: '15%' }}>注文者氏名</th>
                  <th style={{ width: '40%' }}>商品名</th>
                  <th style={{ width: '5%' }}>個数</th>
                  <th style={{ width: '15%' }}>JANコード</th>
                </tr>
              </thead>
              <tbody>
                {multiItemOrders.map((item, index) => (
                  <tr key={`${item.受注番号}-${index}`}>
                    <td>{item['GoQ管理番号']}</td>
                    <td>{item['受注番号']}</td>
                    <td>{item['送付先氏名']}</td>
                    <td>{item['商品名']}</td>
                    <td style={{ textAlign: 'center' }}>{item['個数']}</td>
                    <td>{item['JANコード']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
);

// displayName を設定（デバッグ時に役立つ）
PrintablePickingList.displayName = 'PrintablePickingList';

export default PrintablePickingList;