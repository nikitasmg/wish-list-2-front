# Этап сборки
FROM node:20-alpine AS builder

# Устанавливаем конкретную версию pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

WORKDIR /app

# Сначала копируем файлы блокировки и конфигурации
COPY pnpm-lock.yaml .npmrc package.json ./

# Устанавливаем зависимости с проверкой целостности
RUN pnpm install

# Копируем остальные файлы
COPY . .

# NEXT_PUBLIC_* вшиваются в сборку, поэтому приходят аргументами сборки
# (в Dokploy — Build-time Arguments). Значения по умолчанию — боевые: APP_URL https://prosto-namekni.ru, SANTA_BASE пусто, SANTA_ORIGIN https://santa.prosto-namekni.ru. Без SANTA_ORIGIN поддомен не настроен.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL=https://prosto-namekni.ru
ARG NEXT_PUBLIC_SANTA_BASE=
ARG NEXT_PUBLIC_SANTA_ORIGIN=https://santa.prosto-namekni.ru
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SANTA_BASE=$NEXT_PUBLIC_SANTA_BASE
ENV NEXT_PUBLIC_SANTA_ORIGIN=$NEXT_PUBLIC_SANTA_ORIGIN

# Собираем приложение
RUN pnpm run build

# Этап запуска
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копируем сгенерированные файлы sitemap и robots.txt
COPY --from=builder /app/public/sitemap.xml ./public/sitemap.xml
COPY --from=builder /app/public/robots.txt ./public/robots.txt

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]