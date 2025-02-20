module.exports = {
  apps: [
    {
      name: "front", // Имя вашего приложения
      script: "yarn", // Используем yarn для запуска команд
      args: "start", // Аргумент для yarn (yarn start)
      cwd: "/wish-list-2-front", // Путь к вашему проекту
      autorestart: true, // Автоматически перезапускать приложение при сбоях
      watch: false, // Отключить отслеживание изменений в файлах
      max_memory_restart: "2G", // Перезапускать приложение, если оно использует больше 1 ГБ памяти
      env: {
        NODE_ENV: "production", // Установите окружение в production
      },
      // Хуки для выполнения команд перед запуском
      exec_mode: "fork", // Режим выполнения (fork или cluster)
      instances: 1, // Количество инстансов
      post_update: [ // Команды, которые выполняются после git pull
        "git pull", // Обновить код из репозитория
        "yarn install", // Установить зависимости
        "yarn build", // Собрать проект
      ],
    },
  ],
};