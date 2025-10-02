"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import OrderList from '../components/OrderList';
import PickingList from '../components/PickingList';
import PrintablePickingList from '../components/PrintablePickingList';
import type { OrderItem, PickingItemRow } from '../types';
import { useReactToPrint } from 'react-to-print';
import { useSheetData } from '../hooks/useSheetData';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSheetNames } from '../hooks/useSheetNames';
import './page.css';

function Home() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [view, setView] = useState<'order' | 'picking'>('order');
  const [fileName, setFileName] = useState<string>('');
  const [loadedAt, setLoadedAt] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const { sheetData, loading, error } = useSheetData();
  const { sheetNames } = useSheetNames();

  useEffect(() => {
    // sheetNamesが空でなく、中身がある場合のみログを出力
    if (sheetNames.length > 0) {
      console.log("取得したシート名一覧:", sheetNames);
    }
  }, [sheetNames]); // sheetNamesが変更されたときに実行

  const printRef = useRef<HTMLDivElement>(null);
  const [pickingData, setPickingData] = useState<{ list: PickingItemRow[], total: number }>({ list: [], total: 0 });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'picking-list',
  });

  const validDataForPicking = useMemo(() => {
    // sheetDataがまだ読み込まれていない場合は空配列を返す
    if (!sheetData || sheetData.length === 0) {
      return [];
    }
    return data.filter(item => {
      const itemCode = item['商品コード'];
      // 商品コードがない注文は対象外
      if (!itemCode || itemCode.trim() === '') {
        return false;
      }
      // シートのQ列(index 16)に商品コードが存在するかどうかをチェック
      const isFoundInSheet = sheetData.some(row => row[16]?.toLowerCase() === itemCode.toLowerCase());

      return isFoundInSheet; // 存在すれば true (ピッキング対象)
    });
  }, [data, sheetData]);

  // 除外されたアイテムの数を計算
  const excludedItemsCount = useMemo(() => {
    return data.length - validDataForPicking.length;
  }, [data, validDataForPicking]);

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

  const onDataCalculated = useCallback((list: PickingItemRow[], total: number) => {
    setPickingData({ list, total });
  }, []);

  if (loading) {
    return (
      <div className="cube-container">
        <div className="cube-loader-preview">
          <div className="cube">
            <div className="cube-face front"></div>
            <div className="cube-face back"></div>
            <div className="cube-face right"></div>
            <div className="cube-face left"></div>
            <div className="cube-face top"></div>
            <div className="cube-face bottom"></div>
          </div>
        </div>
      </div>
    )
  };

  if (error) return <div>スプレッドシート取得エラー: {error.message}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="header-title">SR！３秒ピッキング</h1>
        <div className="controls">
          <span>{fileName}</span>
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
            <div className="nav-tabs">
              <button onClick={() => setView('order')} disabled={view === 'order'}>注文リスト</button>
              <button onClick={() => setView('picking')} disabled={view === 'picking'}>ピッキングリスト</button>
            </div>

            {view === 'picking' && (
              <button onClick={handlePrint} className="print-button">
                印刷する
              </button>
            )}
          </div>

          <div className="content">
            {view === 'order' ? (
              <OrderList data={data} sheet={sheetData} />
            ) : (
              <>
                {/* 1. 画面表示用のコンポーネント */}
                <PickingList
                  excludedItemsCount={excludedItemsCount}
                  data={validDataForPicking}
                  shippingMethod={shippingMethod}
                  loadedAt={loadedAt}
                  sheet={sheetData}
                  onDataCalculated={onDataCalculated}
                />

                {/* 2. 印刷専用の非表示コンポーネント */}
                <div style={{ display: 'none' }}>
                  <PrintablePickingList
                    ref={printRef}
                    pickingList={pickingData.list}
                    totalSingleUnits={pickingData.total}
                    shippingMethod={shippingMethod}
                    loadedAt={loadedAt}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default Home;