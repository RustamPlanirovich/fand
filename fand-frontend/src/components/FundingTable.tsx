import React, { useEffect, useState } from 'react';

const FundingTable: React.FC = () => {
  const [fundings, setFundings] = useState<any[]>([]);
  const [exchangeSettings, setExchangeSettings] = useState<{ [key: string]: boolean }>(() => {
    // Пробуем получить настройки из localStorage
    const savedSettings = localStorage.getItem('exchangeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Убедимся, что все биржи присутствуют в настройках
        return {
          binance: parsed.binance || false,
          bybit: parsed.bybit || false,
          bitget: parsed.bitget || false,
          mexc: parsed.mexc || false,
          okx: parsed.okx || false
        };
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
    // Если нет сохраненных настроек, используем дефолтные
    return {
      binance: false,
      bybit: false,
      bitget: false,
      mexc: false,
      okx: false
    };
  });

  // Сохраняем настройки в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('exchangeSettings', JSON.stringify(exchangeSettings));
  }, [exchangeSettings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Создаем копию настроек, чтобы убедиться, что все биржи присутствуют
        const settingsToSend = {
          binance: exchangeSettings.binance || false,
          bybit: exchangeSettings.bybit || false,
          bitget: exchangeSettings.bitget || false,
          mexc: exchangeSettings.mexc || false,
          okx: exchangeSettings.okx || false
        };
        
        console.log('Fetching funding data with settings:', settingsToSend);
        const response = await fetch(`/api/fundings?exchanges=${JSON.stringify(settingsToSend)}`);
        const data = await response.json();
        console.log('Raw funding data received:', data);
        
        // Логируем данные по каждой бирже отдельно
        const exchangeData = data.reduce((acc: { [key: string]: any[] }, item: any) => {
          if (!acc[item.exchange]) {
            acc[item.exchange] = [];
          }
          acc[item.exchange].push(item);
          return acc;
        }, {});
        
        console.log('Funding data by exchange:', exchangeData);
        console.log('OKX data:', exchangeData['OKX'] || []);
        console.log('MEXC data:', exchangeData['MEXC'] || []);
        
        setFundings(data);
      } catch (error) {
        console.error('Error fetching funding data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [exchangeSettings]);

  return (
    <div>FundingTable component</div>
  );
};

export default FundingTable; 