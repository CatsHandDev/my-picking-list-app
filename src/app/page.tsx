"use client";

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import OrderList from '../components/OrderList';
import PickingList from '../components/PickingList';
import type { OrderItem } from '../types';
import { useReactToPrint } from 'react-to-print';
import { useSheetData } from '../hooks/useSheetData';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import './page.css';

function Home() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [view, setView] = useState<'order' | 'picking'>('order');
  const [, setFileName] = useState<string>('');
  const [loadedAt, setLoadedAt] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const { sheetData, loading, error } = useSheetData();

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'picking-list',
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse<OrderItem>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "Shift_JIS",
      complete: (results) => {
        const validHeaders = [
          '注文日時', '配送方法(複数配送先)', 'チェック項目', '販売店舗', 'GoQ管理番号', 'お荷物伝票番号',
          '送付先郵便番号', '送付先住所（全て）', '送付先氏名', '商品名', '個数', 'JANコード',
          '合計金額', '受注番号', '注文者氏名', '商品コード', 'SKU管理番号', '商品URL', '商品SKU'
        ];

        const processedData = results.data.map(row => {
          const newRow: Partial<OrderItem> = {};
          validHeaders.forEach(header => {
            newRow[header as keyof OrderItem] = row[header as keyof OrderItem];
          });
          return newRow as OrderItem;
        });

        setData(processedData);
        if (processedData.length > 0) {
          setShippingMethod(processedData[0]['配送方法(複数配送先)']);
        }
        setLoadedAt(new Date().toLocaleString('ja-JP'));
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('CSVファイルの読み込みに失敗しました。');
      }
    });
  };

  if (loading) return <div>スプレッドシートを読み込み中...</div>;
  if (error) return <div>スプレッドシート取得エラー: {error.message}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="header-title">ピッキングリスト</h1>
        <div className="controls">
          <label htmlFor="csv-upload" className="file-upload-label">
            <UploadFileIcon />
            <span>CSVファイルを選択</span>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }} // input自体は非表示にする
          />
        </div>
      </header>

      {data.length > 0 && (
        <main>
          <div className="navigation">
            <button onClick={() => setView('order')} disabled={view === 'order'}>注文リスト</button>
            <button onClick={() => setView('picking')} disabled={view === 'picking'}>ピッキングリスト</button>
            {view === 'picking' && (
              <button onClick={handlePrint} className="print-button">
                印刷する
              </button>
            )}
          </div>

          <div className="content">
            {view === 'order' ? (
              <OrderList data={data} />
            ) : (
              <div ref={printRef}>
                <PickingList
                  data={data}
                  shippingMethod={shippingMethod}
                  loadedAt={loadedAt}
                  sheet={sheetData}
                />
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default Home;