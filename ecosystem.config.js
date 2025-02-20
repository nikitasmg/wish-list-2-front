module.exports = {
  apps: [
    {
      name: "front", // Имя вашего приложения
      script: "pnpm", // Используем yarn для запуска команд
      args: "start", // Аргумент для yarn (yarn start)
      cwd: "/wish-list-2-front", // Путь к вашему проекту
      autorestart: true, // Автоматически перезапускать приложение при сбоях
      watch: false, // Отключить отслеживание изменений в файлах
      max_memory_restart: "2G", // Перезапускать приложение, если оно использует больше 2 ГБ памяти
      env: {
        NODE_ENV: "production", // Установите окружение в production
      },
      exec_mode: "fork", // Режим выполнения (fork или cluster)
      instances: 1, // Количество инстансов
      post_update: [ // Команды, которые выполняются после git pull
        "git pull", // Обновить код из репозитория
        "pnpm install", // Установить зависимости
        "pnpm run build", // Собрать проект
      ],
    },
  ],
};
