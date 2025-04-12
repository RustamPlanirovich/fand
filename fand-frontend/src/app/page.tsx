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
      
      const fetchData = async () => {
        if (!isMounted) return;
        await fetchFundings();
      };

      // Первоначальная загрузка
      fetchData();
      
      // Обновляем каждые 5 минут
      const interval = setInterval(fetchData, 60 * 60 * 1000);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [isInitialized]);

  const fetchFundings = async () => {
    try {
      setIsLoading(true);
      const settings = {
        binance: exchangeSettings.binance || false,
        bybit: exchangeSettings.bybit || false,
        bitget: exchangeSettings.bitget || false,
        mexc: exchangeSettings.mexc || false,
        okx: exchangeSettings.okx || false
      };
      console.log('Fetching fundings with settings:', settings);
      const response = await fetch(`/api/fundings?exchanges=${JSON.stringify(settings)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFundings(data);
    } catch (error) {
      console.error('Error fetching fundings:', error);
      setError('Failed to fetch funding data');
    } finally {
      setIsLoading(false);
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

  const handleExchangeSettingsChange = (newSettings: ExchangeSettings) => {
    setExchangeSettings(newSettings);
  };

  const handleNotificationSettingsChange = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
  };

  return (
    <main className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Crypto Funding Tracker</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FundingList 
              fundings={filteredFundings} 
              isLoading={isLoading} 
              onRefresh={fetchFundings} 
            />
          </div>
          <div>
            {isInitialized && (
              <Settings
                exchangeSettings={exchangeSettings}
                notificationSettings={notificationSettings}
                onExchangeSettingsChange={handleExchangeSettingsChange}
                onNotificationSettingsChange={handleNotificationSettingsChange}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
