'use client';

import { useState, useEffect } from 'react';
import { WatchlistItem } from '@/types/watchlist';

const WATCHLIST_STORAGE_KEY = 'fand_watchlist';

// Глобальное хранилище за пределами React
let globalWatchlist: WatchlistItem[] = [];

// Функция загрузки из localStorage
const loadFromLocalStorage = (): WatchlistItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedData = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (savedData) {
      const items = JSON.parse(savedData);
      if (Array.isArray(items)) {
        return items;
      }
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
  }
  return [];
};

// Функция сохранения в localStorage
const saveToLocalStorage = (items: WatchlistItem[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving watchlist:', error);
  }
};

// Инициализация глобального хранилища
if (typeof window !== 'undefined') {
  globalWatchlist = loadFromLocalStorage();
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(globalWatchlist);
  
  // Загрузка из глобального хранилища при монтировании
  useEffect(() => {
    setWatchlist([...globalWatchlist]);
  }, []);
  
  const addToWatchlist = (item: WatchlistItem) => {
    // Проверяем, есть ли уже этот элемент
    if (!globalWatchlist.some(i => i.symbol === item.symbol && i.exchange === item.exchange)) {
      // Добавляем новый элемент
      globalWatchlist = [...globalWatchlist, item];
      // Сохраняем в localStorage
      saveToLocalStorage(globalWatchlist);
      // Обновляем состояние компонента
      setWatchlist([...globalWatchlist]);
    }
  };
  
  const removeFromWatchlist = (symbol: string, exchange: string) => {
    globalWatchlist = globalWatchlist.filter(
      item => !(item.symbol === symbol && item.exchange === exchange)
    );
    saveToLocalStorage(globalWatchlist);
    setWatchlist([...globalWatchlist]);
  };
  
  const isInWatchlist = (symbol: string, exchange: string) => {
    return globalWatchlist.some(item => item.symbol === symbol && item.exchange === exchange);
  };
  
  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };
}; 