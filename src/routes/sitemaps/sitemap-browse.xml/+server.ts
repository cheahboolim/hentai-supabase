// src/routes/sitemap-browse.xml/+server.ts
import { supabase } from '$lib/supabaseClient';

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
  const urls: SitemapUrl[] = [];

  try {
    // Fetch all browse categories with proper slug validation
    const browseQueries = [
      { table: 'tags', type: 'tags', limit: 5000 },
      { table: 'artists', type: 'artists', limit: 2000 },
      { table: 'categories', type: 'categories', limit: 100 },
      { table: 'parodies', type: 'parodies', limit: 3000 },
      { table: 'characters', type: 'characters', limit: 3000 },
      { table: 'languages', type: 'languages', limit: 50 },
      { table: 'groups', type: 'groups', limit: 1000 }
    ];

    for (const query of browseQueries) {
      const { data, error } = await supabase
        .from(query.table)
        .select('slug')
        .not('slug', 'is', null)
        .neq('slug', '')
        .limit(query.limit);

      if (!error && data) {
        for (const item of data) {
          urls.push({
            loc: `${SITE_URL}/browse/${query.type}/${item.slug}`,
            changefreq: 'weekly',
            priority: '0.6'
          });

          // Add pagination for popular categories (first few pages only)
          if (['tags', 'artists', 'parodies'].includes(query.type)) {
            for (let page = 2; page <= 5; page++) {
              urls.push({
                loc: `${SITE_URL}/browse/${query.type}/${item.slug}?page=${page}`,
                changefreq: 'weekly',
                priority: '0.4'
              });
            }
          }
        }
      }
    }

    const sitemap = generateSitemapXML(urls);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=21600' // Cache for 6 hours
      }
    });

  } catch (error) {
    console.error('Browse sitemap error:', error);
    
    // Return empty sitemap on error
    const emptySitemap = generateSitemapXML([]);
    return new Response(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300' // Short cache for error cases
      }
    });
  }
}