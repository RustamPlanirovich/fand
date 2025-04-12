export interface UserSettings {
    notificationPercent: number;
    exchanges: string[];
  }
  
  export const defaultSettings: UserSettings = {
    notificationPercent: 0.1,
    exchanges: ['binance', 'bybit', 'okx', 'kucoin']
  };
  
  export const getSettings = (): UserSettings => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('userSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }
    return defaultSettings;
  };
  
  export const saveSettings = (settings: UserSettings) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  };