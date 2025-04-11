import { ExchangeSettings, NotificationSettings } from '@/types/funding';
import { Switch } from '@headlessui/react';
import toast from 'react-hot-toast';

interface SettingsProps {
  exchangeSettings: ExchangeSettings;
  notificationSettings: NotificationSettings;
  onExchangeSettingsChange: (settings: ExchangeSettings) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
}

export default function Settings({
  exchangeSettings,
  notificationSettings,
  onExchangeSettingsChange,
  onNotificationSettingsChange,
}: SettingsProps) {
  const notificationTimes = [5, 15, 30, 60, 120, 240, 480]; // в минутах
  const minRates = [0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0,-0.1, -0.2, -0.5, -1.0, -1.5, -2.0, -2.5, -3.0]; // в процентах

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
    <div className="bg-gray-900 rounded-lg shadow-lg p-6">
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
              <h4 className="text-sm font-medium text-gray-300 mb-2">Время до фандинга</h4>
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
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Минимальный процент</h4>
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
  );
} 