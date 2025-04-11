import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Funding } from '../types/funding.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExchangeService {
  constructor(private readonly httpService: HttpService) {}

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('Empty response from API');
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timeout:', url);
          throw new Error('Request timeout');
        }
        console.error('Fetch error:', error.message);
        throw error;
      }
      throw new Error('Unknown error occurred');
    } finally {
      clearTimeout(timeout);
    }
  }

  async getBinanceFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching Binance fundings...');
      const response = await this.fetchWithTimeout('https://fapi.binance.com/fapi/v1/premiumIndex');
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format from Binance API:', response.data);
        return [];
      }

      return response.data
        .filter((item: any) => {
          try {
            const rate = parseFloat(item.lastFundingRate);
            const isValid = !isNaN(rate) && rate !== 0;
            if (!isValid) {
              console.log('Filtered out Binance item with invalid rate:', item);
            }
            return isValid;
          } catch (error) {
            console.error('Error parsing Binance funding rate:', error);
            return false;
          }
        })
        .map((item: any) => {
          try {
            const nextFundingTime = new Date(item.nextFundingTime);
            console.log('Binance funding time:', {
              symbol: item.symbol,
              rawTime: item.nextFundingTime,
              parsedTime: nextFundingTime.toISOString(),
              localTime: nextFundingTime.toLocaleString('ru-RU')
            });

            return {
              symbol: item.symbol,
              rate: parseFloat(item.lastFundingRate),
              time: nextFundingTime.toISOString(),
              exchange: 'Binance',
              exchangeUrl: `https://www.binance.com/en/futures/${item.symbol}`,
            };
          } catch (error) {
            console.error('Error processing Binance funding item:', error);
            return null;
          }
        })
        .filter((item): item is Funding => item !== null);
    } catch (error) {
      console.error('Error fetching Binance fundings:', error);
      return [];
    }
  }

  async getBybitFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching Bybit fundings...');
      const response = await this.fetchWithTimeout('https://api.bybit.com/v5/market/tickers?category=linear');
      
      if (!response.data?.result?.list) {
        console.error('Invalid response format from Bybit API:', response.data);
        return [];
      }

      return response.data.result.list
        .filter((item: any) => {
          // Skip futures contracts
          if (item.symbol.includes('-')) {
            console.log('Filtered out Bybit futures contract:', item.symbol);
            return false;
          }
          
          const rate = parseFloat(item.fundingRate);
          const isValid = !isNaN(rate) && rate !== 0;
          if (!isValid) {
            console.log('Filtered out Bybit item with invalid rate:', item);
          }
          return isValid;
        })
        .map((item: any) => {
          try {
            const nextFundingTime = parseInt(item.nextFundingTime);
            if (isNaN(nextFundingTime) || nextFundingTime <= 0) {
              console.log('Invalid Bybit funding time:', item);
              return null;
            }

            const fundingTime = new Date(nextFundingTime);
            console.log('Bybit funding time:', {
              symbol: item.symbol,
              rawTime: item.nextFundingTime,
              parsedTime: fundingTime.toISOString(),
              localTime: fundingTime.toLocaleString('ru-RU')
            });

            return {
              symbol: item.symbol,
              rate: parseFloat(item.fundingRate),
              time: fundingTime.toISOString(),
              exchange: 'Bybit',
              exchangeUrl: `https://www.bybit.com/trade/spot/${item.symbol}`,
            };
          } catch (error) {
            console.error('Error processing Bybit funding item:', error);
            return null;
          }
        })
        .filter((item): item is Funding => item !== null);
    } catch (error) {
      console.error('Error fetching Bybit fundings:', error);
      return [];
    }
  }

  async getBitgetFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching Bitget fundings...');
      const response = await this.fetchWithTimeout('https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl');
      
      if (!response.data?.data) {
        console.error('Invalid response format from Bitget API:', response.data);
        return [];
      }

      // Сначала обрабатываем все монеты локально
      const coinsWithHighRate = response.data.data
        .map((item: any) => ({
          symbol: item.symbol,
          rate: parseFloat(item.fundingRate),
          rawRate: item.fundingRate
        }))
        .filter(item => !isNaN(item.rate) && item.rate !== 0)
        .sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate))
        .slice(0, 10); // Берем только топ-10 монет по абсолютному значению ставки

      console.log(`Found ${coinsWithHighRate.length} coins with highest funding rates`);

      // Теперь делаем запросы только для отобранных монет
      const results = [];
      for (const coin of coinsWithHighRate) {
        try {
          const fundingTimeResponse = await this.fetchWithTimeout(
            `https://api.bitget.com/api/mix/v1/market/funding-time?symbol=${coin.symbol}`
          );

          if (!fundingTimeResponse.data?.data?.fundingTime) {
            console.error('Invalid funding time response for symbol:', coin.symbol);
            continue;
          }

          const fundingTime = new Date(parseInt(fundingTimeResponse.data.data.fundingTime));

          results.push({
            symbol: coin.symbol.replace('_UMCBL', ''),
            rate: coin.rate,
            time: fundingTime.toISOString(),
            exchange: 'Bitget',
            exchangeUrl: `https://www.bitget.com/ru/futures/usdt/${coin.symbol.replace('_UMCBL', '')}`
          });
        } catch (error) {
          console.error(`Error fetching funding time for ${coin.symbol}:`, error);
        }
      }

      console.log(`Successfully processed ${results.length} Bitget fundings`);
      return results;
    } catch (error) {
      console.error('Error fetching Bitget fundings:', error);
      return [];
    }
  }

  private async getOkxFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching OKX fundings...');
      const response = await this.fetchWithTimeout('https://www.okx.com/api/v5/public/funding-rate');
      
      if (!response.data?.data) {
        console.error('Invalid response format from OKX API:', response.data);
        return [];
      }

      return response.data.data
        .filter((item: any) => {
          const rate = parseFloat(item.fundingRate);
          const isValid = !isNaN(rate) && rate !== 0;
          if (!isValid) {
            console.log('Filtered out OKX item with invalid rate:', item);
          }
          return isValid;
        })
        .map((item: any) => {
          try {
            const nextFundingTime = new Date(parseInt(item.nextFundingTime));
            if (isNaN(nextFundingTime.getTime())) {
              console.log('Invalid OKX funding time:', item);
              return null;
            }

            console.log('OKX funding time:', {
              symbol: item.instId,
              rawTime: item.nextFundingTime,
              parsedTime: nextFundingTime.toISOString(),
              localTime: nextFundingTime.toLocaleString('ru-RU')
            });

            return {
              symbol: item.instId.replace('-SWAP', ''),
              rate: parseFloat(item.fundingRate),
              time: nextFundingTime.toISOString(),
              exchange: 'OKX',
              exchangeUrl: `https://www.okx.com/trade-swap/${item.instId.toLowerCase()}`
            };
          } catch (error) {
            console.error('Error processing OKX funding item:', error);
            return null;
          }
        })
        .filter((item): item is Funding => item !== null);
    } catch (error) {
      console.error('Error fetching OKX fundings:', error);
      return [];
    }
  }

  async getAllFundings(exchangeSettings: { [key: string]: boolean }): Promise<Funding[]> {
    try {
      console.log('Starting to fetch fundings from enabled exchanges...');
      console.log('Exchange settings:', exchangeSettings);
      
      // Проверяем, есть ли хотя бы одна выбранная биржа
      const enabledExchanges = Object.entries(exchangeSettings)
        .filter(([_, enabled]) => enabled)
        .map(([exchange]) => exchange);

      if (enabledExchanges.length === 0) {
        console.log('No exchanges selected for fetching');
        return [];
      }

      console.log('Fetching fundings from:', enabledExchanges.join(', '));
      
      const exchangePromises = [];

      if (exchangeSettings.binance) {
        exchangePromises.push(
          this.getBinanceFundings().catch(error => {
            console.error('Failed to fetch Binance fundings:', error);
            return [];
          })
        );
      }

      if (exchangeSettings.bybit) {
        exchangePromises.push(
          this.getBybitFundings().catch(error => {
            console.error('Failed to fetch Bybit fundings:', error);
            return [];
          })
        );
      }

      if (exchangeSettings.bitget) {
        exchangePromises.push(
          this.getBitgetFundings().catch(error => {
            console.error('Failed to fetch Bitget fundings:', error);
            return [];
          })
        );
      }

      if (exchangeSettings.okx) {
        exchangePromises.push(
          this.getOkxFundings().catch(error => {
            console.error('Failed to fetch OKX fundings:', error);
            return [];
          })
        );
      }

      const results = await Promise.all(exchangePromises);
      const allFundings = results.flat();

      console.log('Raw funding data from exchanges:');
      console.log('Total fundings:', allFundings.length);

      const validFundings = allFundings
        .filter(funding => {
          const fundingTime = new Date(funding.time);
          const isValid = !isNaN(fundingTime.getTime());
          if (!isValid) {
            console.warn('Invalid funding time found:', funding);
          }
          return isValid;
        })
        .sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return b.rate - a.rate;
        });

      console.log('Final processed fundings:', JSON.stringify(validFundings, null, 2));
      console.log(`Total number of valid fundings: ${validFundings.length}`);

      return validFundings;
    } catch (error) {
      console.error('Error in getAllFundings:', error);
      throw error;
    }
  }
} 