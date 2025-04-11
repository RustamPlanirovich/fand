import { useEffect, useRef } from 'react';
import { Funding } from '@/types/funding';
import toast from 'react-hot-toast';

export const useNotifications = (
  fundings: Funding[],
  notificationTimes: number[]
) => {
  const notifiedFundings = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkFundings = () => {
      const now = new Date().getTime();

      fundings.forEach((funding) => {
        const fundingTime = new Date(funding.time).getTime();
        const timeUntilFunding = fundingTime - now;
        const minutesUntilFunding = Math.floor(timeUntilFunding / (1000 * 60));

        // Проверяем, нужно ли отправить уведомление
        notificationTimes.forEach((notificationTime) => {
          const notificationKey = `${funding.symbol}-${funding.exchange}-${notificationTime}`;
          
          if (
            minutesUntilFunding <= notificationTime &&
            minutesUntilFunding > notificationTime - 1 &&
            !notifiedFundings.current.has(notificationKey)
          ) {
            // Отправляем уведомление
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">
                          {funding.symbol}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          Фандинг через {notificationTime} минут
                        </p>
                        <p className="mt-1 text-sm text-green-400">
                          Ставка: {(funding.rate * 100).toFixed(4)}%
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          {funding.exchange}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-700">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(funding.symbol);
                        toast.success('Тикер скопирован');
                      }}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-white focus:outline-none"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              ),
              {
                duration: 5000,
                position: 'top-right',
              }
            );

            // Отмечаем, что уведомление было отправлено
            notifiedFundings.current.add(notificationKey);
          }
        });
      });
    };

    // Проверяем каждую минуту
    const interval = setInterval(checkFundings, 60000);
    checkFundings(); // Проверяем сразу при монтировании

    return () => clearInterval(interval);
  }, [fundings, notificationTimes]);
}; 