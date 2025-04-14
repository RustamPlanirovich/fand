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
            // console.log('Binance funding time:', {
            //   symbol: item.symbol,
            //   rawTime: item.nextFundingTime,
            //   parsedTime: nextFundingTime.toISOString(),
            //   localTime: nextFundingTime.toLocaleString('ru-RU')
            // });

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
            //console.log('Filtered out Bybit item with invalid rate:', item);
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
            // console.log('Bybit funding time:', {
            //   symbol: item.symbol,
            //   rawTime: item.nextFundingTime,
            //   parsedTime: fundingTime.toISOString(),
            //   localTime: fundingTime.toLocaleString('ru-RU')
            // });

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
          rawRate: item.fundingRate,
          additionalData: {
            last: item.last,
            bestAsk: item.bestAsk,
            bestBid: item.bestBid,
            bidSz: item.bidSz,
            askSz: item.askSz,
            high24h: item.high24h,
            low24h: item.low24h,
            priceChangePercent: item.priceChangePercent,
            baseVolume: item.baseVolume,
            quoteVolume: item.quoteVolume,
            usdtVolume: item.usdtVolume,
            openUtc: item.openUtc,
            chgUtc: item.chgUtc,
            indexPrice: item.indexPrice,
            holdingAmount: item.holdingAmount
          }
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
            exchangeUrl: `https://www.bitget.com/ru/futures/usdt/${coin.symbol.replace('_UMCBL', '')}`,
            additionalData: coin.additionalData
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

  async getOkxFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching OKX fundings...');
      const response = await this.fetchWithTimeout('https://www.okx.com/api/v5/public/funding-rate?instId=ALL');
      
      console.log('OKX API response:', JSON.stringify(response.data, null, 2));
      
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

  async getMexcFundings(): Promise<Funding[]> {
    try {
      console.log('Fetching MEXC fundings...');
      const response = await this.fetchWithTimeout('https://contract.mexc.com/api/v1/contract/funding_rate');
      
      console.log('MEXC API response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data?.success || response.data?.code !== 0) {
        console.error('MEXC API returned unsuccessful response:', response.data);
        return [];
      }

      if (!response.data?.data) {
        console.error('Invalid response format from MEXC API:', response.data);
        return [];
      }

      // Сначала обрабатываем все монеты локально
      const coinsWithHighRate = response.data.data
        .map((item: any) => {
          const cleanSymbol = item.symbol.replace('_USDT', '').replace('_USD', '');
          console.log('Processing MEXC item:', {
            symbol: cleanSymbol,
            originalSymbol: item.symbol,
            rate: item.fundingRate,
            maxRate: item.maxFundingRate,
            minRate: item.minFundingRate,
            collectCycle: item.collectCycle,
            nextSettleTime: item.nextSettleTime,
            timestamp: new Date(item.timestamp).toISOString()
          });
          return {
            symbol: cleanSymbol,
            originalSymbol: item.symbol,
            rate: parseFloat(item.fundingRate),
            rawRate: item.fundingRate,
            maxRate: item.maxFundingRate,
            minRate: item.minFundingRate,
            nextSettleTime: item.nextSettleTime,
            collectCycle: item.collectCycle,
            timestamp: item.timestamp
          };
        })
        .filter(item => {
          const isValid = !isNaN(item.rate) && item.rate !== 0;
          if (!isValid) {
            console.log('Filtered out MEXC item with invalid rate:', item);
          }
          return isValid;
        })
        .sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate))
        .slice(0, 10); // Берем только топ-10 монет по абсолютному значению ставки

      console.log(`Found ${coinsWithHighRate.length} coins with highest funding rates:`, coinsWithHighRate);

      // Формируем результат
      const result = coinsWithHighRate.map((coin: any) => {
        try {
          const nextFundingTime = new Date(parseInt(coin.nextSettleTime));
          if (isNaN(nextFundingTime.getTime())) {
            console.log('Invalid MEXC funding time:', coin);
            return null;
          }

          console.log('MEXC funding time:', {
            symbol: coin.symbol,
            originalSymbol: coin.originalSymbol,
            rawTime: coin.nextSettleTime,
            parsedTime: nextFundingTime.toISOString(),
            localTime: nextFundingTime.toLocaleString('ru-RU'),
            collectCycle: coin.collectCycle,
            maxRate: coin.maxRate,
            minRate: coin.minRate,
            timestamp: new Date(coin.timestamp).toISOString()
          });

          return {
            symbol: coin.symbol,
            rate: coin.rate,
            rawRate: coin.rawRate,
            time: nextFundingTime.toISOString(),
            exchange: 'MEXC',
            exchangeUrl: `https://futures.mexc.com/exchange/${coin.originalSymbol}`,
            collectCycle: coin.collectCycle,
            maxRate: coin.maxRate,
            minRate: coin.minRate,
            timestamp: new Date(coin.timestamp).toISOString()
          };
        } catch (error) {
          console.error('Error processing MEXC funding item:', error);
          return null;
        }
      }).filter((item): item is Funding => item !== null);

      console.log('Final MEXC fundings:', result);
      return result;
    } catch (error) {
      console.error('Error fetching MEXC fundings:', error);
      return [];
    }
  }

  async getAllFundings(exchangeSettings: { [key: string]: boolean }, isPriority: boolean = false): Promise<Funding[]> {
    try {
      console.log('Starting to fetch fundings from enabled exchanges...');
      console.log('Exchange settings:', exchangeSettings);
      console.log('Is priority request:', isPriority);
      
      const exchangePromises = [];
      const enabledExchanges = Object.entries(exchangeSettings)
        .filter(([_, enabled]) => enabled)
        .map(([exchange]) => exchange);

      // Если это приоритетный запрос, обрабатываем только выбранные биржи
      if (isPriority) {
        console.log('Processing priority exchanges:', enabledExchanges);
        
        // Обрабатываем только выбранные биржи
        for (const exchange of enabledExchanges) {
          const promise = this.getExchangeFundings(exchange);
          exchangePromises.push(promise);
        }

        // Ждем завершения только приоритетных запросов
        const priorityResults = await Promise.all(exchangePromises);
        return priorityResults.flat();
      } else {
        // Если это фоновый запрос, обрабатываем все включенные биржи
        console.log('Processing background exchanges:', enabledExchanges);
        
        for (const exchange of enabledExchanges) {
          const promise = this.getExchangeFundings(exchange);
          exchangePromises.push(promise);
        }

        const results = await Promise.all(exchangePromises);
        return results.flat();
      }
    } catch (error) {
      console.error('Error in getAllFundings:', error);
      throw error;
    }
  }

  private async getExchangeFundings(exchange: string): Promise<Funding[]> {
    try {
      switch (exchange) {
        case 'binance':
          return this.getBinanceFundings();
        case 'bybit':
          return this.getBybitFundings();
        case 'bitget':
          return this.getBitgetFundings();
        case 'okx':
          return this.getOkxFundings();
        case 'mexc':
          return this.getMexcFundings();
        default:
          console.warn(`Unknown exchange: ${exchange}`);
          return [];
      }
    } catch (error) {
      console.error(`Error fetching data for ${exchange}:`, error);
      return [];
    }
  }
} 