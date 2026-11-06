// Shared helpers for the SEO serverless functions (Vercel). Leading underscore = not exposed as a route.
const API_BASE = process.env.API_BASE || 'https://otf.makamesco-tech.co.ke/kescorts/api'
const SITE     = process.env.SITE_URL || 'https://kenyaescorts.vercel.app'

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Nyeri','Machakos','Meru','Kilifi','Kitale','Garissa','Embu']
const slugify = s => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const cityFromSlug = slug => COUNTIES.find(c => slugify(c) === slug) || null

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

async function getJSON(path) {
  const r = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`API ${r.status}`)
  return r.json()
}

// Fetch the built SPA shell (static file → served straight from the CDN, no rewrite loop)
async function getShell(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const r = await fetch(`${proto}://${req.headers.host}/index.html`)
  return r.text()
}

function inject(shell, { title, description, path, image, jsonLd, body }) {
  const url = SITE + path
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''
  ].join('\n    ')

  return shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta name="description"[^>]*>/i, '')
    .replace('</head>', `    ${head}\n  </head>`)
    // Crawler-readable content inside #root — React replaces it as soon as the app loads
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

module.exports = { API_BASE, SITE, COUNTIES, slugify, cityFromSlug, esc, getJSON, getShell, inject }
