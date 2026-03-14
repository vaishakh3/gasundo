export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://www.gasundo.live/sitemap.xml',
    host: 'www.gasundo.live',
  }
}
