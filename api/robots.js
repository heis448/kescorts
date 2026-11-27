const { SITE } = require('./_lib')

// robots.txt is generated so the Sitemap line always follows SITE_URL (set it once in Vercel → Environment Variables)
// instead of being hard-coded in a static file.
module.exports = (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /admin',
    'Disallow: /chat',
    'Disallow: /wallet',
    'Disallow: /membership',
    'Disallow: /sponsor-stats',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n')
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(body)
}
