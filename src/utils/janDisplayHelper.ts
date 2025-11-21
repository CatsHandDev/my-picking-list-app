// utils/janDisplayHelper.ts

/**
 * JANコードの例外表示ルールを管理するマップ。
 * 今後、新しい例外ルールはこのオブジェクトに追加するだけで対応できます。
 * キー：例外対象のJANコード
 * 値：表示したい文字列
 */
const JAN_EXCEPTION_MAP: { [key: string]: string } = {
  '000000000A003': 'なし', // B000000006 パンテーン トリートメント エクストラダメージケア 310g
  '4580063253194': 'X000VPDQIR', // B08HPS1SQK オルナ オーガニック フェイスパック 無添加 ノーマル・レチノール 30枚入
  '000000000A020': 'X000L5CX4F', // B073CGGGPX オルナ オーガニック ボディクリーム ボディミルク 無添加 200g
  '2100000023295': 'なし', // B0CW193TL1 オルナ オーガニック 化粧水 乳液 美容液(金) 200/150/47ml 3点セット スキンケア しっとり x0016mj6e7 /(a1120-070521-jj6e7-s1)
  '000000000A018': 'X0016MJ2RN', // B0CW17YQHY オルナ オーガニック 化粧水 乳液 美容液(白) 200/150/47ml 3点セット スキンケア さっぱり
  '000000000A021': 'X000IYJ5LN', // B01N0ARFGP オルナ オーガニック 美容液 4種配合 原料にこだわった 47ml
  '4589587181037': 'なし', // B01N0BSYTW オルナ オーガニック 泥 洗顔フォーム 泡洗顔 130g
  // 例: 'ANOTHER_SPECIAL_CODE': '要確認',
};

/**
 * JANコードを受け取り、例外ルールに基づいて整形された表示用文字列を返す関数
 * @param janCode - 整形したいJANコード
 * @returns 表示用の文字列
 */
export function formatJanDisplay(janCode?: string): string {
  // JANコードが存在しない場合は空文字列を返す
  if (!janCode) {
    return '';
  }

  // JANコードが例外マップに存在するかチェック
  if (JAN_EXCEPTION_MAP[janCode]) {
    // 存在すれば、マップに定義された文字列を返す
    return JAN_EXCEPTION_MAP[janCode];
  }

  // どの例外にも当てはまらない場合は、通常通り末尾4桁を返す
  return janCode.slice(-4);
}