'use client';

import { useEffect, useState } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();
  const [mounted, setMounted] = useState(false);
  const [storageContent, setStorageContent] = useState('');
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    // Сначала сортируем по бирже
    const exchangeComparison = a.exchange.localeCompare(b.exchange);
    if (exchangeComparison !== 0) {
      return exchangeComparison;
    }
    // Затем по символу
    return a.symbol.localeCompare(b.symbol);
  });

  const checkLocalStorage = () => {
    const data = localStorage.getItem('fand_watchlist');
    setStorageContent(data || 'Пусто');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="text-white hover:text-blue-400 transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Список наблюдения</h1>
            <button
              onClick={checkLocalStorage}
              className="ml-auto px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Проверить localStorage
            </button>
          </div>

          {storageContent && (
            <div className="mb-4 p-4 bg-gray-800 rounded overflow-auto max-h-40">
              <pre className="text-xs text-white">{storageContent}</pre>
            </div>
          )}

          {sortedWatchlist.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedWatchlist.map((item) => (
                <div 
                  key={`${item.exchange}-${item.symbol}`}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{item.symbol}</h3>
                    <p className="text-sm text-gray-400">{item.exchange}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-white mb-4">Ваш список наблюдения пуст</p>
              <Link 
                href="/" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Вернуться к списку фандингов
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 