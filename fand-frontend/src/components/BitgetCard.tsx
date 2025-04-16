'use client';

import React, { useState } from 'react';
import { Funding } from '@/types/funding';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { WatchlistButton } from './WatchlistButton';
import { Bitget } from '@/types/bitget';

interface BitgetCardProps {
  data: Bitget;
}

export function BitgetCard({ data }: BitgetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Функция для определения активности и ликвидности
  const getActivityScore = () => {
    const volume = parseFloat(data.additionalData.usdtVolume);
    const holdingAmount = parseFloat(data.additionalData.holdingAmount);
    const bidSize = parseFloat(data.additionalData.bidSz);
    const askSize = parseFloat(data.additionalData.askSz);
    const spread = Math.abs(parseFloat(data.additionalData.bestAsk) - parseFloat(data.additionalData.bestBid));
    const price = parseFloat(data.additionalData.last);

    // Нормализуем значения
    const normalizedVolume = Math.min(volume / 1000000, 1); // Нормализуем объем до 1M USDT
    const normalizedHolding = Math.min(holdingAmount / 1000, 1); // Нормализуем открытые позиции до 1000
    const normalizedSpread = Math.max(0, 1 - (spread / price)); // Чем меньше спред, тем лучше
    const normalizedLiquidity = Math.min((bidSize + askSize) / 100, 1); // Нормализуем ликвидность до 100

    // Взвешенная сумма всех факторов
    const score = (
      normalizedVolume * 0.3 +
      normalizedHolding * 0.2 +
      normalizedSpread * 0.3 +
      normalizedLiquidity * 0.2
    );

    return Math.max(0, Math.min(1, score));
  };

  const activityScore = getActivityScore();
  const gradientColor = activityScore > 0.5 
    ? `linear-gradient(to right, rgba(16, 185, 129, ${activityScore}), rgba(31, 41, 55, 1))`
    : `linear-gradient(to right, rgba(239, 68, 68, ${1 - activityScore}), rgba(31, 41, 55, 1))`;

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

  const tooltips = {
    last: 'Последняя цена сделки',
    bestAsk: 'Лучшая цена продажи',
    bestBid: 'Лучшая цена покупки',
    bidSz: 'Объем лучшей цены покупки',
    askSz: 'Объем лучшей цены продажи',
    high24h: 'Максимальная цена за 24 часа',
    low24h: 'Минимальная цена за 24 часа',
    priceChangePercent: 'Изменение цены в процентах',
    baseVolume: 'Объем базовой валюты',
    quoteVolume: 'Объем котируемой валюты',
    usdtVolume: 'Объем в USDT',
    openUtc: 'Цена открытия (UTC)',
    chgUtc: 'Изменение цены (UTC)',
    indexPrice: 'Индексная цена',
    holdingAmount: 'Объем открытых позиций'
  };

  return (
    <div 
      className="rounded-lg p-4 hover:bg-opacity-90 transition-colors"
      style={{
        background: gradientColor
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="text-lg font-semibold text-white truncate">{data.symbol}</h3>
          <p className="text-sm text-gray-400">{data.exchange}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold whitespace-nowrap ${data.rate < 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(data.rate * 100).toFixed(4)}%
          </span>
          <WatchlistButton item={data} />
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400 truncate">
          {formatTime(data.time)}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={data.exchangeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 text-sm">
          {Object.entries(data.additionalData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">{key}:</span>
                <div className="relative">
                  <QuestionMarkCircleIcon
                    className="h-4 w-4 text-gray-500 cursor-help"
                    onMouseEnter={() => setShowTooltip(key)}
                    onMouseLeave={() => setShowTooltip(null)}
                  />
                  {showTooltip === key && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10">
                      {tooltips[key as keyof typeof tooltips]}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-white">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 