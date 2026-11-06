import { Helmet } from 'react-helmet-async'

const SITE = 'https://kenyaescorts.vercel.app'

export default function Seo({ title, description, path = '', image, jsonLd, noindex = false }) {
  const url = SITE + path
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="KenyanEscorts" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || `${SITE}/logo.jpg`} />
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
