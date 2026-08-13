import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const baseUrl = 'https://empleat.com.ar';

  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/ofertas', priority: 0.9, changefreq: 'hourly' },
    { url: '/pricing', priority: 0.8, changefreq: 'weekly' },
    { url: '/pricing-empresa', priority: 0.7, changefreq: 'weekly' },
    { url: '/terminos-legales', priority: 0.3, changefreq: 'monthly' },
    { url: '/terms-of-service', priority: 0.3, changefreq: 'monthly' },
  ];

  let dynamicJobPages = [];

  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: ofertas } = await supabase
        .from('ofertas')
        .select('id, updated_at, created_at')
        .eq('estado', 'activa')
        .limit(1000);

      if (ofertas && ofertas.length > 0) {
        dynamicJobPages = ofertas.map((of) => ({
          url: `/ofertas/${of.id}`,
          lastmod: of.updated_at || of.created_at,
          priority: 0.8,
          changefreq: 'daily',
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching dynamic sitemap jobs:', error);
  }

  const allPages = [...staticPages, ...dynamicJobPages];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod ? new Date(page.lastmod).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xmlContent);
}
