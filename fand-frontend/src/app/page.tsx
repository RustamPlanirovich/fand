'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FundingList from '@/components/FundingList';
import Settings from '@/components/Settings';
import { Funding, ExchangeSettings, NotificationSettings } from '@/types/funding';
import { useNotifications } from '@/hooks/useNotifications';

const SETTINGS_KEY = 'fand_settings';

const defaultExchangeSettings: ExchangeSettings = {
  binance: false,
  bybit: false,
  bitget: false,
  mexc: false,
  okx: false
};

const defaultNotificationSettings: NotificationSettings = {
  timeBeforeFunding: [5],
  minRate: -0.5,
};

export default function Home() {
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [filteredFundings, setFilteredFundings] = useState<Funding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeSettings, setExchangeSettings] = useState<ExchangeSettings>(defaultExchangeSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [loadingExchanges, setLoadingExchanges] = useState<Set<string>>(new Set());

  // Используем хук уведомлений
  useNotifications(filteredFundings, notificationSettings.timeBeforeFunding);

  // Загрузка сохраненных настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setExchangeSettings(parsed.exchangeSettings || defaultExchangeSettings);
        setNotificationSettings(parsed.notificationSettings || defaultNotificationSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Фильтрация фандингов на основе настроек
  useEffect(() => {
    if (isInitialized && fundings.length > 0) {
      console.log('Filtering fundings with settings:', { exchangeSettings, notificationSettings });
      console.log('Current fundings:', fundings);
      
      const filtered = fundings.filter(funding => {
        // Проверяем, что фандинг еще не прошел
        const fundingTime = new Date(funding.time);
        const now = new Date();
        if (fundingTime <= now) {
          console.log('Filtered out passed funding:', funding);
          return false;
        }

        // Проверяем настройки биржи
        const exchangeEnabled = exchangeSettings[funding.exchange.toLowerCase() as keyof ExchangeSettings];
        if (!exchangeEnabled) {
          console.log('Filtered out disabled exchange:', funding.exchange);
          return false;
        }

        // Проверяем ставку
        const minRate = notificationSettings.minRate;
        const rateInRange = minRate >= 0 
          ? funding.rate >= minRate / 100
          : funding.rate <= minRate / 100;
        
        if (!rateInRange) {
          console.log('Filtered out funding with rate:', funding.rate);
          return false;
        }

        return true;
      });

      console.log('Filtered fundings:', filtered);
      setFilteredFundings(filtered);
    }
  }, [fundings, exchangeSettings, notificationSettings.minRate, isInitialized]);

  // Автоматическое обновление данных
  useEffect(() => {
    if (isInitialized) {
      let isMounted = true;
      
      const fetchData = async (isPriority: boolean = false) => {
        if (!isMounted) return;
        
        // Проверяем, нужно ли обновлять данные
        const now = Date.now();
        const shouldUpdate = !lastUpdateTime || (now - lastUpdateTime) >= 60 * 60 * 1000; // 1 час
        
        if (shouldUpdate) {
          await fetchFundings(isPriority);
          setLastUpdateTime(now);
        }
      };

      // Первоначальная загрузка
      fetchData(true);
      
      // Проверяем необходимость обновления каждую минуту
      const interval = setInterval(() => {
        const now = Date.now();
        if (lastUpdateTime && (now - lastUpdateTime) >= 60 * 60 * 1000) {
          fetchData(false);
        }
      }, 60 * 1000); // Каждую минуту

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [isInitialized, lastUpdateTime]);

  const fetchFundings = async (isPriority: boolean = false) => {
    try {
      if (isPriority) {
        setIsLoading(true);
      }

      const settings = {
        binance: exchangeSettings.binance || false,
        bybit: exchangeSettings.bybit || false,
        bitget: exchangeSettings.bitget || false,
        mexc: exchangeSettings.mexc || false,
        okx: exchangeSettings.okx || false
      };

      console.log('Fetching fundings with settings:', settings, 'priority:', isPriority);
      const response = await fetch(`/api/fundings?exchanges=${JSON.stringify(settings)}&priority=${isPriority}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (isPriority) {
        setFundings(data);
      } else {
        // For background updates, merge with existing data
        setFundings(prevFundings => {
          const newFundings = [...prevFundings];
          data.forEach((newFunding: Funding) => {
            const existingIndex = newFundings.findIndex(
              f => f.symbol === newFunding.symbol && f.exchange === newFunding.exchange
            );
            if (existingIndex >= 0) {
              newFundings[existingIndex] = newFunding;
            } else {
              newFundings.push(newFunding);
            }
          });
          return newFundings;
        });
      }
    } catch (error) {
      console.error('Error fetching fundings:', error);
      if (isPriority) {
        setError('Failed to fetch funding data');
      }
    } finally {
      if (isPriority) {
        setIsLoading(false);
      }
    }
  };

  // Сохранение настроек
  useEffect(() => {
    if (isInitialized) {
      const settings = {
        exchangeSettings,
        notificationSettings,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [exchangeSettings, notificationSettings, isInitialized]);

  const handleExchangeSettingsChange = async (newSettings: ExchangeSettings) => {
    setExchangeSettings(newSettings);
    
    // Проверяем, какие биржи были выбраны
    const newlySelectedExchanges = Object.entries(newSettings)
      .filter(([exchange, enabled]) => enabled && !exchangeSettings[exchange as keyof ExchangeSettings])
      .map(([exchange]) => exchange);

    // Если есть новые выбранные биржи, проверяем наличие данных
    if (newlySelectedExchanges.length > 0) {
      const existingExchanges = new Set(fundings.map(f => f.exchange.toLowerCase()));
      const exchangesToLoad = newlySelectedExchanges.filter(exchange => !existingExchanges.has(exchange));

      if (exchangesToLoad.length > 0) {
        // Загружаем данные для новых бирж
        const settings = {
          binance: exchangesToLoad.includes('binance'),
          bybit: exchangesToLoad.includes('bybit'),
          bitget: exchangesToLoad.includes('bitget'),
          mexc: exchangesToLoad.includes('mexc'),
          okx: exchangesToLoad.includes('okx')
        };

        try {
          const response = await fetch(`/api/fundings?exchanges=${JSON.stringify(settings)}&priority=true`);
          if (response.ok) {
            const newData = await response.json();
            setFundings(prevFundings => {
              const updatedFundings = [...prevFundings];
              newData.forEach((newFunding: Funding) => {
                const existingIndex = updatedFundings.findIndex(
                  f => f.symbol === newFunding.symbol && f.exchange === newFunding.exchange
                );
                if (existingIndex >= 0) {
                  updatedFundings[existingIndex] = newFunding;
                } else {
                  updatedFundings.push(newFunding);
                }
              });
              return updatedFundings;
            });
          }
        } catch (error) {
          console.error('Error fetching data for newly selected exchanges:', error);
        }
      }
    }

    // Фильтруем данные по новым настройкам
    setFilteredFundings(prevFundings => 
      prevFundings.filter(funding => newSettings[funding.exchange.toLowerCase() as keyof ExchangeSettings])
    );
  };

  const handleNotificationSettingsChange = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
  };

  const handleRefresh = () => {
    fetchFundings(true);
    setLastUpdateTime(Date.now());
  };

  return (
    <main className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pr-[60px]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Crypto Funding Tracker</h1>
          <div className="w-full">
            <FundingList 
              fundings={filteredFundings} 
              isLoading={isLoading} 
              onRefresh={handleRefresh} 
            />
          </div>
        </div>
      </div>
      {isInitialized && (
        <Settings
          exchangeSettings={exchangeSettings}
          notificationSettings={notificationSettings}
          onExchangeSettingsChange={handleExchangeSettingsChange}
          onNotificationSettingsChange={handleNotificationSettingsChange}
        />
      )}
    </main>
  );
}
