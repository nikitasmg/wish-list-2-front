module.exports = {
  siteUrl: 'https://prosto-namekni.ru',
  generateRobotsTxt: false,
  sitemapSize: 7000,
  exclude: ['/oauth', '/wishlist', '/wishlist/*', '/s/*', '/login', '/registration'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/s/', '/wishlist/', '/oauth/', '/login/', '/registration/'],
      },
    ],
    additionalSitemaps: [],
  },
  transform: async (config, path) => {
    let priority = 0.7
    let changefreq = 'monthly'

    if (path === '/') {
      priority = 1.0
      changefreq = 'weekly'
    } else if (path.startsWith('/wishlist-for/')) {
      priority = 0.9
      changefreq = 'monthly'
    } else if (path.startsWith('/blog/')) {
      priority = 0.8
      changefreq = 'monthly'
    } else if (path === '/how-it-works') {
      priority = 0.7
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
