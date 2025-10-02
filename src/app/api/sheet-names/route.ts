import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const spreadsheetId = process.env.SPREAD_SHEET_ID as string;

    // 認証ロジックは既存のAPIルートと同じ
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

    // ▼▼▼ ここが核心部分 ▼▼▼
    // スプレッドシート全体のメタデータを取得する
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // 取得したメタデータから、各シートの情報(sheets)を取り出し、
    // さらにその中からシート名(title)だけを抽出して配列にする
    const sheetNames = response.data.sheets?.map(sheet => sheet.properties?.title || '') || [];
    // ▲▲▲ ▲▲▲ ▲▲▲

    return NextResponse.json({ sheetNames });

  } catch (err) {
    const error = err as Error;
    console.error('Google Sheets API Error (Sheet Names):', error.message);
    return NextResponse.json(
      { error: `シート名の取得に失敗しました: ${error.message}` },
      { status: 500 }
    );
  }
}