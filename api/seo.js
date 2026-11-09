// Pre-renders meta tags + readable content for profile and city pages so Google can index them.
const { SITE, COUNTIES, slugify, cityFromSlug, esc, getJSON, getShell, inject } = require('./_lib')

module.exports = async (req, res) => {
  const { type, id } = req.query
  let shell
  try { shell = await getShell(req) } catch { return res.status(502).send('Shell unavailable') }

  let page = null
  try {
    if (type === 'escort') {
      const e = await getJSON(`/profile/${encodeURIComponent(id)}`)
      const where = e.city || e.county || 'Kenya'
      const bio = String(e.bio || '').replace(/\s+/g, ' ').trim()
      const photos = Array.isArray(e.photos) ? e.photos : []
      page = {
        title: `${e.name || 'Escort'} in ${where} | KenyanEscorts`,
        description: (bio || `View ${e.name || 'this'} profile on KenyanEscorts.`).slice(0, 155),
        path: `/escort/${id}`,
        image: photos[0]?.url,
        jsonLd: { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: e.name, address: where, image: photos[0]?.url } },
        body: `<main><h1>${esc(e.name || 'Escort')} — ${esc(where)}</h1><p>${esc(bio.slice(0, 400))}</p><p><a href="/escorts">Browse all escorts</a></p></main>`
      }
    } else if (type === 'city') {
      const city = cityFromSlug(id)
      if (!city) return res.status(404).send(shell)
      const list = await getJSON(`/search?county=${encodeURIComponent(city)}&limit=24`)
      const items = (Array.isArray(list) ? list : []).map(e => `<li><a href="/escort/${esc(e.uuid)}">${esc(e.name)}${e.city ? ' — ' + esc(e.city) : ''}</a></li>`).join('')
      page = {
        title: `Escorts in ${city} | KenyanEscorts`,
        description: `Browse verified escort profiles in ${city}, Kenya. See photos, rates and availability, and chat directly.`,
        path: `/escorts-in/${slugify(city)}`,
        jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Escorts in ${city}`, url: `${SITE}/escorts-in/${slugify(city)}` },
        body: `<main><h1>Escorts in ${esc(city)}</h1><ul>${items}</ul><nav>${COUNTIES.map(c => `<a href="/escorts-in/${slugify(c)}">${esc(c)}</a>`).join(' ')}</nav></main>`
      }
    }
  } catch (err) {
    // API down or profile missing → fall back to the normal SPA shell (never break the page)
    return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(shell)
  }

  if (!page) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(shell)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(inject(shell, page))
}
