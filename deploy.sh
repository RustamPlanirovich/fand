#!/bin/bash

# Проверка наличия PM2
if ! command -v pm2 &> /dev/null; then
    echo "PM2 не установлен. Устанавливаем..."
    sudo npm install -g pm2
fi

# Остановка предыдущих процессов
echo "Stopping previous processes..."
pm2 stop fand-backend || true
pm2 stop fand-frontend || true

# Обновление кода
echo "Updating code..."
git pull

# Установка зависимостей и сборка бэкенда
echo "Building backend..."
cd fand-backend
npm install
npm run build

# Установка зависимостей и сборка фронтенда
echo "Building frontend..."
cd ../fand-frontend
npm install
npm run build

# Запуск приложений через PM2
echo "Starting applications..."
cd ../fand-backend
pm2 start dist/main.js --name fand-backend

cd ../fand-frontend
PORT=3010 pm2 start npm --name fand-frontend -- start

# Сохранение конфигурации PM2
pm2 save

echo "Deployment completed!" 