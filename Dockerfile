# Этап сборки
FROM node:18-alpine AS builder

# Устанавливаем конкретную версию pnpm
RUN corepack enable && corepack prepare pnpm@8.14.0 --activate

WORKDIR /app

# Сначала копируем файлы блокировки и конфигурации
COPY pnpm-lock.yaml .npmrc package.json ./

# Устанавливаем зависимости с проверкой целостности
RUN pnpm install --frozen-lockfile

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN pnpm run build

# Этап запуска
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]