export const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi',
  'Nyeri','Machakos','Meru','Kilifi','Kitale','Garissa','Embu',
]
export const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const cityFromSlug = (slug) => COUNTIES.find(c => slugify(c) === slug) || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase()) : '')
export const cityPath = (c) => `/escorts-in/${slugify(c)}`
