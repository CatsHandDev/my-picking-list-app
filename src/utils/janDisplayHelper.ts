// utils/janDisplayHelper.ts

/**
 * JANコードの例外表示ルールを管理するマップ。
 * 今後、新しい例外ルールはこのオブジェクトに追加するだけで対応できます。
 * キー：例外対象のJANコード
 * 値：表示したい文字列
 */
const JAN_EXCEPTION_MAP: { [key: string]: string } = {
  '000000000A003': 'なし',
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