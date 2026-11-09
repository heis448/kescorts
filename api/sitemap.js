const { SITE, COUNTIES, slugify, esc, getJSON } = require('./_lib')

module.exports = async (req, res) => {
  const urls = [
    { loc: '/', pr: '1.0' }, { loc: '/escorts', pr: '0.9' }, { loc: '/match', pr: '0.7' },
    { loc: '/classifieds', pr: '0.5' }, { loc: '/blog', pr: '0.5' },
    ...COUNTIES.map(c => ({ loc: `/escorts-in/${slugify(c)}`, pr: '0.8' }))
  ]
  try {
    for (let page = 1; page <= 10; page++) {
      const list = await getJSON(`/search?limit=100&page=${page}`)
      if (!Array.isArray(list) || !list.length) break
      list.forEach(e => urls.push({ loc: `/escort/${e.uuid}`, pr: '0.6' }))
      if (list.length < 100) break
    }
  } catch { /* serve what we have */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${esc(SITE + u.loc)}</loc><priority>${u.pr}</priority></url>`).join('\n') + `\n</urlset>`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
