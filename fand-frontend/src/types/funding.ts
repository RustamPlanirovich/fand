export interface Funding {
  symbol: string;
  rate: number;
  time: string;
  exchange: string;
  exchangeUrl: string;
  additionalData?: {
    last: string;
    bestAsk: string;
    bestBid: string;
    bidSz: string;
    askSz: string;
    high24h: string;
    low24h: string;
    priceChangePercent: string;
    baseVolume: string;
    quoteVolume: string;
    usdtVolume: string;
    openUtc: string;
    chgUtc: string;
    indexPrice: string;
    holdingAmount: string;
  };
  isInWatchlist?: boolean;
}

export interface ExchangeSettings {
  binance: boolean;
  bybit: boolean;
  bitget: boolean;
  mexc: boolean;
  okx: boolean;
}

export interface NotificationSettings {
  timeBeforeFunding: number[]; // в минутах
  minRate: number; // Минимальный процент для отображения (отрицательное значение)
} 