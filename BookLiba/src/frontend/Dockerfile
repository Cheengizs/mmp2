# --- Этап 1: Сборка статики через Vite ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Этап 2: Production веб-сервер ---
FROM nginx:alpine

# Копируем скомпилированные файлы из этапа сборки в каталог Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг Nginx для корректной работы SPA-маршрутов
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]