import { useEffect, useState } from 'react';

export function useSheetNames() {
  // シート名は文字列の配列なので、型を string[][] から string[] に変更
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 新しいAPIエンドポイントを呼び出す
        const res = await fetch('/api/sheet-names');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'APIリクエストに失敗しました');
        }
        const json = await res.json();
        // APIからのレスポンス(json.sheetNames)をstateにセット
        setSheetNames(json.sheetNames || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { sheetNames, loading, error };
}