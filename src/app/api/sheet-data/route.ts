import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const spreadsheetId = process.env.SPREAD_SHEET_ID as string;
    const range = process.env.SPREAD_SHEET_RANGE as string;

    // サービスアカウント認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        // private_key の \n を元に戻す
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly', // 読み取り専用スコープ
      ],
    });

    const sheets = google.sheets({
      version: 'v4',
      auth: auth,
    });

    // データを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];

    return NextResponse.json({ values });

  } catch (err) {
    const error = err as Error;
    console.error('Google Sheets API Error:', error.message);
    return NextResponse.json(
      { error: `スプレッドシートのデータ取得に失敗しました: ${error.message}` },
      { status: 500 }
    );
  }
}