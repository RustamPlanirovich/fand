import { Component, OnInit } from '@angular/core';
import { SettingsService, UserSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  timeOptions = [
    { label: '5 мин', value: 5 },
    { label: '15 мин', value: 15 },
    { label: '30 мин', value: 30 },
    { label: '1 час', value: 60 },
    { label: '2 часа', value: 120 },
    { label: '4 часа', value: 240 },
    { label: '8 часа', value: 480 }
  ];

  percentOptions = [
    { label: '-0.1%', value: -0.001 },
    { label: '-0.2%', value: -0.002 },
    { label: '-0.5%', value: -0.005 },
    { label: '-1%', value: -0.01 },
    { label: '-1.5%', value: -0.015 },
    { label: '-2%', value: -0.02 }
  ];

  selectedTime: number = 30;
  selectedPercent: number = -0.005;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    const settings = this.settingsService.getSettings();
    this.selectedTime = settings.notificationTime;
    this.selectedPercent = settings.notificationPercent;
  }

  selectTime(minutes: number): void {
    this.selectedTime = minutes;
    this.saveSettings();
  }

  selectPercent(percent: number): void {
    this.selectedPercent = percent;
    this.saveSettings();
  }

  private saveSettings(): void {
    const settings: UserSettings = {
      notificationTime: this.selectedTime,
      notificationPercent: this.selectedPercent
    };
    this.settingsService.saveSettings(settings);
  }

  isSelectedTime(minutes: number): boolean {
    return this.selectedTime === minutes;
  }

  isSelectedPercent(percent: number): boolean {
    return this.selectedPercent === percent;
  }
} 