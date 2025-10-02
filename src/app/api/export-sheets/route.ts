import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as XLSX from 'xlsx'; // インポート

// エクスポート対象のシート名を定義
const SHEET_NAMES = [
  "GoQ全データ",
  "出品管理",
  "在庫表",
  "ユニーク用",
  "G-セット"
];

export async function GET() {
  try {
    const spreadsheetId = process.env.SPREAD_SHEET_ID as string;

    // 認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({
      version: 'v4',
      auth: auth,
    });

    // 1. 複数のシートデータを一括で取得 (batchGet)
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: SHEET_NAMES, // シート名の配列を渡すだけ
    });

    const sheetData = response.data.valueRanges || [];

    // 2. XLSXワークブックを生成
    const workbook = XLSX.utils.book_new();

    sheetData.forEach((sheet, index) => {
      const sheetName = SHEET_NAMES[index];
      const data = sheet.values || [];
      // 2D配列のデータからワークシートを作成
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      // ワークブックにシートを追加
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 3. ワークブックをバイナリデータ(Buffer)として書き出す
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 4. ファイルとしてレスポンスを返す
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        // このヘッダーが、ブラウザに「これはダウンロードするファイルです」と伝える
        'Content-Disposition': `attachment; filename="exported_sheets_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        // XLSXファイルの正しいMIMEタイプ
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (err) {
    const error = err as Error;
    console.error('Export Error:', error.message);
    return NextResponse.json(
      { error: `ファイルのエクスポートに失敗しました: ${error.message}` },
      { status: 500 }
    );
  }
}