import { Injectable } from '@angular/core';

export interface UserSettings {
  notificationPercent: number;
  notificationTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'fand_settings';

  constructor() {}

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  getSettings(): UserSettings {
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    return {
      notificationPercent: 0.01,
      notificationTime: 30
    };
  }
} 