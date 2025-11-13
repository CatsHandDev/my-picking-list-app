// utils/exceptionProducts.ts

/**
 * 【選べる】シリーズに該当する商品のリスト。
 * キー：CSVの「商品SKU」
 * 値：true
 * 新しい【選べる】シリーズ商品が追加された場合は、ここにその商品の「商品SKU」とコメントを追記する。
 */
export const SELECTABLE_SERIES_SKU_MAP: { [key: string]: boolean } = {
    // ワイドハイターEXパワー 衣料用漂白剤 詰替用2400ml【選べる個数】
    'A070308-J7102-1': true,
    '070305-809': true,
    'b0c57ygxrj-2': true,
    'st000384-B0C57YGXRJ-SET2': true,
    'b0c57ygxrj-4': true,
    'st000384-B0C57YGXRJ-SET4': true,
    'st000384-B0C57YGXRJ-SET6': true,
    'B0C57YGXRJ-6': true,
    'unknown-20240920-ukn-b0c57zprmz-3080': true,

    // 無印洗顔フォーム
    'B08DTXNL8X-500-4549337280724': true,
    'b00vgpkw10-3': true,
    'A1331-070716-j0724-S10': true,

    // ロコモプロ
    'maker-B0CB1BGSK9-952': true,

    // アサヒ スーパービール酵母Z 
    'st000433-B0CKTZRQ5L-SET1': true,
    '20240927－20156': true,
    'A0001-070403-J6666-S1': true,
    '20240927-3234': true,
    'st000433-B0CKTZRQ5L-SET3': true,
    '2024-0927-43125': true,
    '2024-0927-53905': true,

    // ケイト アイライナー スーパーシャ―プライナー EX3.0 【カラー】BK-1 BR-1 BR-2 【選べる】
    'B09TQSYWXV-v3867-1': true,
    'B09TQSYWXV-v3867-3': true,
    'B09TQSBC4R-v3874-1': true,
    'B09TQSBC4R-v3874-3': true,
    'B09TQRR9PZ-v3881-1': true,
    'B09TQRR9PZ-v3881-3': true,

    // JOOMO
    'maker-B0C1JXDG1F-1561': true,

    // 他の【選べる】シリーズ商品があれば、ここに追記
    // 'some-other-product-sku': true,
};