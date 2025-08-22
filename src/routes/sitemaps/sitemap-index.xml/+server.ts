// src/routes/sitemap-index.xml/+server.ts
import { supabase } from '$lib/supabaseClient';

const SITE_URL = 'https://nhentai.pics';
const URLS_PER_SITEMAP = 50000; // Max URLs per sitemap file

export async function GET() {
  try {
    // Count total manga for gallery sitemaps
    const { count: mangaCount } = await supabase
      .from('slug_map')
      .select('slug', { count: 'exact' })
      .not('slug', 'is', null)
      .neq('slug', '');

    // Count total pages for reading page sitemaps
    const { count: pageCount } = await supabase
      .from('pages')
      .select('id', { count: 'exact' })
      .not('manga_id', 'is', null);

    // Calculate number of sitemap files needed
    const mangaSitemapCount = Math.ceil((mangaCount || 0) / URLS_PER_SITEMAP);
    const pageSitemapCount = Math.ceil((pageCount || 0) / URLS_PER_SITEMAP);

    // Define static sitemaps
    const sitemaps = [
      {
        loc: `${SITE_URL}/sitemaps/sitemap-static.xml`,
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        loc: `${SITE_URL}/sitemaps/sitemap-browse.xml`,
        lastmod: new Date().toISOString().split('T')[0]
      }
    ];

    // Add manga gallery sitemaps
    for (let i = 0; i < mangaSitemapCount; i++) {
      sitemaps.push({
        loc: `${SITE_URL}/sitemaps/sitemap-manga-galleries-${i}.xml`,
        lastmod: new Date().toISOString().split('T')[0]
      });
    }

    // Add manga page sitemaps
    for (let i = 0; i < pageSitemapCount; i++) {
      sitemaps.push({
        loc: `${SITE_URL}/sitemaps/sitemap-manga-pages-${i}.xml`,
        lastmod: new Date().toISOString().split('T')[0]
      });
    }

    // Generate sitemap index XML
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
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Sitemap index generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}