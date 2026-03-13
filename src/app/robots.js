export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://gasundo.live/sitemap.xml',
    host: 'gasundo.live',
  }
}
