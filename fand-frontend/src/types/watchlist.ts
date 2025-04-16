export interface WatchlistItem {
  symbol: string;
  exchange: string;
  lastUpdated?: number;
}

export interface WatchlistState {
  items: WatchlistItem[];
  lastUpdateTime: number;
  nextUpdateIn: number;
} 