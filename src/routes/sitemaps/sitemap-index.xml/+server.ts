// src/routes/sitemap-index.xml/+server.ts
const SITE_URL = 'https://nhentai.pics';

export async function GET() {
  const sitemaps = [
    {
      loc: `${SITE_URL}/sitemap-static.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${SITE_URL}/sitemap-browse.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${SITE_URL}/sitemap-manga.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    }
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  });
}