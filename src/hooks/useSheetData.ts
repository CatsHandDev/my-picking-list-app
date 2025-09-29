import { useEffect, useState } from 'react';

export function useSheetData() {
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sheet-data');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'APIリクエストに失敗しました');
        }
        const json = await res.json();
        setSheetData(json.values || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { sheetData, loading, error };
}