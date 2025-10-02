import React from 'react';
import type { OrderItem } from '../types';

interface Props {
  data: OrderItem[];
  sheet: string[][];
}

const OrderList: React.FC<Props> = ({ data, sheet }) => {
  // 商品コードがシートのQ列に存在しないアイテムをカウント
  const excludedItemsCount = data.filter(item => {
    const itemCode = item['商品コード'];
    // 商品コード自体がない場合は除外
    if (!itemCode || itemCode.trim() === '') {
      return true;
    }
    // シートのQ列(index 16)に商品コードが存在しないものを探す
    const isFoundInSheet = sheet.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase());
    return !isFoundInSheet; // 見つからなければ true (除外対象)
  }).length;

  return (
    <div className="list-wrapper">
      {/* 1. 固定したいヘッダー部分 (スクロールするコンテナの外に出す) */}
      <div className="list-header">
        <h2>注文リスト</h2>
        <span>総注文件数: {data.length}件</span>
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
              <th style={{ width: "4%" }}>注文者氏名</th>
              <th style={{ width: "15%" }}>商品名</th>
              <th style={{ width: "2%" }}>個数</th>
              <th style={{ width: "4%" }}>JANコード</th>
              <th>商品コード</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const itemCode = item['商品コード'];
              let isExcluded = false;
              if (!itemCode || itemCode.trim() === '') {
                isExcluded = true;
              } else {
                const isFoundInSheet = sheet.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase());
                isExcluded = !isFoundInSheet;
              }

              return (
                <tr key={`${item.受注番号}-${index}`} className={isExcluded ? 'excluded-row' : ''}>
                  <td>{item['注文日時']}</td>
                  <td>{item['配送方法(複数配送先)']}</td>
                  <td>{item['GoQ管理番号']}</td>
                  <td>{item['受注番号']}</td>
                  <td>{item['注文者氏名']}</td>
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