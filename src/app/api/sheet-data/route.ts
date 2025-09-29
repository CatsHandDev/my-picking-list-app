import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sheetUrl = process.env.SPREAD_SHEET_URL as string;
    const apiKey = process.env.GOOGLE_API_KEY as string;
    const range = process.env.SPREAD_SHEET_RANGE as string;

    // URL からスプレッドシートIDを抽出
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)\//);
    if (!match) {
      return NextResponse.json(
        { error: 'スプレッドシートIDがURLから取得できません' },
        { status: 400 }
      );
    }

    const sheetId = match[1];
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    const res = await fetch(endpoint);
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: `Google Sheets API Error: ${errorData.error.message}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json({ values: json.values || [] });

  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}