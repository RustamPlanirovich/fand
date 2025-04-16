'use client';

import React, { useId } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { WatchlistItem } from '@/types/watchlist';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface WatchlistButtonProps {
  item: WatchlistItem;
}

export function WatchlistButton({ item }: WatchlistButtonProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const isWatched = isInWatchlist(item.symbol, item.exchange);
  const uniqueId = useId(); // Для уникального ключа
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('WatchlistButton clicked', item, isWatched);
    
    if (isWatched) {
      console.log('Removing from watchlist', item.symbol, item.exchange);
      removeFromWatchlist(item.symbol, item.exchange);
    } else {
      console.log('Adding to watchlist', item);
      addToWatchlist(item);
    }
    
    // Выводим текущее состояние после выполнения операции
    setTimeout(() => {
      const data = localStorage.getItem('fand_watchlist');
      console.log('Current localStorage:', data);
    }, 100);
  };

  return (
    <button
      onClick={handleClick}
      data-id={uniqueId}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      aria-label={isWatched ? 'Удалить из списка наблюдения' : 'Добавить в список наблюдения'}
    >
      {isWatched ? (
        <StarSolidIcon className="h-5 w-5 text-yellow-400" />
      ) : (
        <StarOutlineIcon className="h-5 w-5 text-gray-400" />
      )}
    </button>
  );
} 