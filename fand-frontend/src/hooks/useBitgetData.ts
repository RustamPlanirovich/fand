'use client';

import { useState, useEffect } from 'react';
import { Bitget } from '@/types/bitget';

export const useBitgetData = () => {
  const [data, setData] = useState<Bitget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/bitget');
        if (!response.ok) {
          throw new Error('Failed to fetch Bitget data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Обновляем каждые 30 секунд

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}; 