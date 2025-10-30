import React, { useMemo } from 'react';
import type { OrderItem } from '../types';

interface Props {
  data: OrderItem[];
  sheet: string[][];
  title: string;
}

const OrderList: React.FC<Props> = ({ data, sheet, title }) => {
  // 除外対象 = 商品コードと商品SKUの両方がシートのQ列に存在しないアイテム
  const excludedItems = data.filter(item => {
    const itemCode = item['商品コード'];
    const itemSku = item['商品SKU']; // 商品SKUを取得

    // an item is "found" if either its itemCode or itemSku exists in column Q.
    const isFound =
      (itemCode && sheet.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase())) ||
      (itemSku && sheet.some(row => row[16]?.toLowerCase() === itemSku.toLowerCase()));

    // It's excluded if it's NOT found.
    return !isFound;
  });

  const excludedItemsCount = excludedItems.length;

  // GoQ管理番号を基準にユニークな注文件数を計算する
  const uniqueOrderCount = useMemo(() => {
    // 1. data配列からGoQ管理番号だけを抜き出す
    // 2. Setに入れて重複を排除する
    // 3. Setのsizeプロパティでユニークな件数を取得する
    const goQNumbers = new Set(
      data
        .map(item => item['GoQ管理番号'])
        // GoQ管理番号が空やnullのものはカウントから除外する
        .filter(goQ => goQ && goQ.trim() !== '') 
    );
    return goQNumbers.size;
  }, [data]);

  return (
    <div className="list-wrapper">
      {/* 1. 固定したいヘッダー部分 (スクロールするコンテナの外に出す) */}
      <div className="list-header">
        <h2>{title}</h2>
        <span>総注文件数: {uniqueOrderCount}件 (全{data.length}行)</span>
        {excludedItemsCount > 0 && (
          <span className="warning-text">
            ※うち{excludedItemsCount}件はピッキング対象外(商品SKUが存在しない)
          </span>
        )}
      </div>

      {/* 2. このコンテナだけがスクロールする */}
      <div className="list-scroller">
        <table>
          <thead>
            <tr className="orderList-container">
              <th>注文日時</th>
              <th style={{ width: "2%" }}>配送方法</th>
              <th style={{ width: "3%" }}>GoQ管理番号</th>
              <th>受注番号</th>
              <th style={{ width: "4%" }}>送付先氏名</th>
              <th style={{ width: "15%" }}>商品名</th>
              <th style={{ width: "2%" }}>個数</th>
              <th style={{ width: "4%" }}>JANコード</th>
              <th>商品コード</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const itemCode = item['商品コード'];
              const itemSku = item['商品SKU'];

              const isFound =
                (itemCode && sheet.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase())) ||
                (itemSku && sheet.some(row => row[16]?.toLowerCase() === itemSku.toLowerCase()));

              const isExcluded = !isFound;

              return (
                <tr key={`${item.受注番号}-${index}`} className={isExcluded ? 'excluded-row' : ''}>
                  <td>{item['注文日時']}</td>
                  <td>{item['配送方法(複数配送先)']}</td>
                  <td>{item['GoQ管理番号']}</td>
                  <td>{item['受注番号']}</td>
                  <td>{item['送付先氏名']}</td>
                  <td className="itemName">{item['商品名']}</td>
                  <td style={{ textAlign: "center" }}>{item['個数']}</td>
                  <td>{item['JANコード']}</td>
                  <td>{item['商品コード']}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;