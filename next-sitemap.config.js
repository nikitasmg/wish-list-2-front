module.exports = {
  siteUrl: 'https://get-my-wishlist.ru', // Замените на ваш домен
  generateRobotsTxt: true, // Генерация robots.txt
  sitemapSize: 7000, // Размер sitemap (по умолчанию 5000)
  exclude: [
    '/oauth',
    '/wishlist/*',
  ],
  changefreq: 'daily', // Частота обновления
  priority: 0.7, // Приоритет
  transform: async (config, path) => {
    return {
      loc: path, // URL страницы
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(), // Дата последнего изменения
    };
  },
};