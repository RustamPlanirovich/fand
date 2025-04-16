export interface Bitget {
  symbol: string;
  exchange: string;
  time: string;
  rate: number;
  exchangeUrl: string;
  additionalData: {
    [key: string]: string;
  };
} 