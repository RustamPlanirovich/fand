import { useEffect, useRef } from 'react';
import { Funding } from '@/types/funding';
import toast from 'react-hot-toast';

export function useNotifications(fundings: Funding[], notificationTimes: number[]) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Запрашиваем разрешение на уведомления при первом рендере
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkFundings = () => {
      fundings.forEach(funding => {
        const fundingTime = new Date(funding.time);
        const now = new Date();
        const timeUntilFunding = Math.floor((fundingTime.getTime() - now.getTime()) / (1000 * 60));

        notificationTimes.forEach(minutes => {
          const notificationKey = `${funding.symbol}-${funding.exchange}-${minutes}-${fundingTime.getTime()}`;
          
          if (timeUntilFunding === minutes && !notifiedRef.current.has(notificationKey)) {
            const notificationTitle = `Фандинг через ${minutes} минут`;
            const notificationBody = `${funding.symbol}\nСтавка: ${(funding.rate * 100).toFixed(4)}%\nБиржа: ${funding.exchange}\nВремя: ${fundingTime.toLocaleTimeString()}`;

            // Системное уведомление
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico',
                tag: notificationKey,
                requireInteraction: true,
                silent: false
              });

              notification.onclick = () => {
                window.focus();
                window.open(funding.exchangeUrl, '_blank');
              };
            }

            // Toast уведомление
            toast.success(notificationBody, {
              duration: 10000,
              position: 'top-right'
            });

            notifiedRef.current.add(notificationKey);
          }
        });
      });
    };

    // Проверяем каждую минуту
    const interval = setInterval(checkFundings, 60 * 1000);
    checkFundings(); // Проверяем сразу при изменении фандингов или времени уведомлений

    return () => {
      clearInterval(interval);
    };
  }, [fundings, notificationTimes]);
} 