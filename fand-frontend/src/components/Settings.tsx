import { useState, useEffect } from 'react';
import { ExchangeSettings, NotificationSettings } from '@/types/funding';
import { Switch } from '@headlessui/react';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface SettingsProps {
  exchangeSettings: ExchangeSettings;
  notificationSettings: NotificationSettings;
  onExchangeSettingsChange: (settings: ExchangeSettings) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
}

const SETTINGS_KEY = 'fand_settings';

export default function Settings({
  exchangeSettings,
  notificationSettings,
  onExchangeSettingsChange,
  onNotificationSettingsChange,
}: SettingsProps) {
  const [isTimeCollapsed, setIsTimeCollapsed] = useState(false);
  const [isRateCollapsed, setIsRateCollapsed] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const notificationTimes = [5, 15, 30, 60, 120, 240, 480]; // в минутах
  const minRates = [0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0,-0.1, -0.2, -0.5, -1.0, -1.5, -2.0, -2.5, -3.0]; // в процентах

  // Загрузка сохраненных настроек сворачивания
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.collapseSettings) {
          setIsTimeCollapsed(parsed.collapseSettings.isTimeCollapsed || false);
          setIsRateCollapsed(parsed.collapseSettings.isRateCollapsed || false);
        }
      } catch (error) {
        console.error('Error parsing saved collapse settings:', error);
      }
    }
  }, []);

  // Сохранение настроек сворачивания
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    let settings = {};
    
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }

    settings = {
      ...settings,
      collapseSettings: {
        isTimeCollapsed,
        isRateCollapsed,
      },
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [isTimeCollapsed, isRateCollapsed]);

  const toggleExchange = (exchange: keyof ExchangeSettings) => {
    onExchangeSettingsChange({
      ...exchangeSettings,
      [exchange]: !exchangeSettings[exchange],
    });
  };

  const toggleNotificationTime = (time: number) => {
    const newTimes = notificationSettings.timeBeforeFunding.includes(time)
      ? notificationSettings.timeBeforeFunding.filter((t) => t !== time)
      : [...notificationSettings.timeBeforeFunding, time].sort((a, b) => a - b);

    onNotificationSettingsChange({
      ...notificationSettings,
      timeBeforeFunding: newTimes,
    });
  };

  const setMinRate = (rate: number) => {
    onNotificationSettingsChange({
      ...notificationSettings,
      minRate: rate,
    });
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showTestNotifications();
          }
        });
      } else if (Notification.permission === 'granted') {
        showTestNotifications();
      } else {
        toast.error('Уведомления заблокированы в браузере. Пожалуйста, разрешите уведомления в настройках браузера.');
      }
    }
  };

  const showTestNotifications = () => {
    // Создаем тестовый фандинг через 5 минут
    const testTime = new Date(Date.now() + 5 * 60 * 1000);
    
    // Проверяем каждое выбранное время для уведомления
    notificationSettings.timeBeforeFunding.forEach(minutes => {
      const notificationTitle = `Тестовый фандинг через ${minutes} минут`;
      const notificationBody = `BTC/USDT\nСтавка: -0.5%\nБиржа: Binance\nВремя: ${testTime.toLocaleTimeString()}`;

      // Системное уведомление
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon.ico',
        tag: `test-funding-${minutes}`,
        requireInteraction: true,
        silent: false
      });

      // Добавляем обработчик клика
      notification.onclick = () => {
        window.focus();
      };

      // Toast как дополнительное напоминание
      toast.success(notificationBody, {
        duration: 10000,
        position: 'top-right'
      });
    });
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100]">
      <div className={`flex transition-transform duration-300 ${
        isSettingsCollapsed ? 'translate-x-[calc(100%-40px)]' : 'translate-x-0'
      }`}>
        <button
          onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
          className="bg-gray-800 p-3 rounded-l-lg text-white hover:bg-gray-700 transition-colors shadow-lg flex items-center justify-center relative"
          style={{ width: '56px', height: '40px', marginRight: '-40px' }}
        >
          {isSettingsCollapsed ? (
            <ChevronLeftIcon className="h-6 w-6" />
          ) : (
            <ChevronRightIcon className="h-6 w-6" />
          )}
        </button>
        <div className="bg-gray-900 rounded-l-lg shadow-lg p-6 w-80">
          <h2 className="text-xl font-semibold text-white mb-6">Настройки</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Биржи</h3>
              <div className="space-y-4">
                {Object.entries(exchangeSettings).map(([exchange, enabled]) => (
                  <div key={exchange} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{exchange}</span>
                    <Switch
                      checked={enabled}
                      onChange={() => toggleExchange(exchange as keyof ExchangeSettings)}
                      className={`${
                        enabled ? 'bg-blue-600' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">Уведомления</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Время до фандинга</h4>
                    <button
                      onClick={() => setIsTimeCollapsed(!isTimeCollapsed)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isTimeCollapsed ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronUpIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {!isTimeCollapsed && (
                    <div className="grid grid-cols-2 gap-4">
                      {notificationTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => toggleNotificationTime(time)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            notificationSettings.timeBeforeFunding.includes(time)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {time < 60
                            ? `${time} мин`
                            : time === 60
                            ? '1 час'
                            : `${time / 60} часа`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Минимальный процент</h4>
                    <button
                      onClick={() => setIsRateCollapsed(!isRateCollapsed)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isRateCollapsed ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronUpIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {!isRateCollapsed && (
                    <div className="grid grid-cols-2 gap-4">
                      {minRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setMinRate(rate)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            notificationSettings.minRate === rate
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={testNotification}
                    className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Проверить уведомления
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 