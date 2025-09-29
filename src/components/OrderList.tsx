import React from 'react';
import type { OrderItem } from '../types';

interface Props {
  data: OrderItem[];
}

const OrderList: React.FC<Props> = ({ data }) => {
  return (
    <div className="list-container">
      <div style={{ display: "flex", alignItems: "center", gap: 20}}>
        <h2>注文リスト</h2>
        <span>総注文件数: {data.length}件</span>
      </div>
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
          {data.map((item, index) => (
            <tr key={`${item.受注番号}-${index}`}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;