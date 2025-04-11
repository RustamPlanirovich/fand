export interface Funding {
  symbol: string;
  rate: number;
  time: string;
  exchange: string;
  exchangeUrl: string;
}

export interface ExchangeSettings {
  binance: boolean;
  bybit: boolean;
  bitget: boolean;
  okx: boolean;
}

export interface NotificationSettings {
  timeBeforeFunding: number[]; // в минутах
  minRate: number; // Минимальный процент для отображения (отрицательное значение)
} 