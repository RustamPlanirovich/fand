'use client';

import { useState, useEffect } from 'react';
import { Funding } from '@/types/funding';

export const useFundingData = () => {
  const [data, setData] = useState<Funding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/funding');
        if (!response.ok) {
          throw new Error('Failed to fetch funding data');
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