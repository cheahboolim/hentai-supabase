// src/routes/sitemap-static.xml/+server.ts
const SITE_URL = 'https://nhentai.pics';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

export async function GET() {
  const urls: SitemapUrl[] = [
    {
      loc: `${SITE_URL}/`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: `${SITE_URL}/browse`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '0.8'
    },
    {
      loc: `${SITE_URL}/p/tags`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/artists`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/categories`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/parodies`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/characters`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/languages`,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      loc: `${SITE_URL}/p/groups`,
      changefreq: 'weekly',
      priority: '0.7'
    }
  ];

  const sitemap = generateSitemapXML(urls);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=86400' // Cache for 24 hours
    }
  });
}