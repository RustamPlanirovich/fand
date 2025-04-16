'use client';

import { useState, useEffect } from 'react';
import { Funding } from '@/types/funding';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ClipboardDocumentIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { BitgetCard } from './BitgetCard';
import { WatchlistButton } from './WatchlistButton';

interface FundingListProps {
  fundings: Funding[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function FundingList({ fundings, isLoading, onRefresh }: FundingListProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLastUpdate(new Date());
    }
  }, [isLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Тикер скопирован');
  };

  const openExchange = (url: string) => {
    window.open(url, '_blank');
  };

  const formatTime = (time: string) => {
    const fundingTime = new Date(time);
    const timeUntilFunding = formatDistanceToNow(fundingTime, { 
      locale: ru,
      addSuffix: true 
    });
    
    const localTime = fundingTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${localTime} (${timeUntilFunding})`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Предстоящие фандинги</h2>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-400">
              Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {fundings.map((funding, index) => {
            if (funding.exchange.toLowerCase() === 'bitget' && funding.additionalData) {
              return (
                <BitgetCard
                  key={`${funding.exchange}-${funding.symbol}-${index}`}
                  data={{
                    ...funding,
                    additionalData: funding.additionalData
                  }}
                />
              );
            }

            return (
              <div
                key={`${funding.exchange}-${funding.symbol}-${index}`}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="text-lg font-semibold text-white truncate">{funding.symbol}</h3>
                    <p className="text-sm text-gray-400">{funding.exchange}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold whitespace-nowrap ${funding.rate < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(funding.rate * 100).toFixed(4)}%
                    </span>
                    <WatchlistButton item={{ symbol: funding.symbol, exchange: funding.exchange }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 truncate">
                    {formatTime(funding.time)}
                  </span>
                  <a
                    href={funding.exchangeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm ml-2 whitespace-nowrap"
                  >
                    Открыть
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 