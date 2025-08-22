// src/routes/sitemap-manga.xml/+server.ts
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
    // Get manga with their creation dates for better lastmod
    // Prioritize newer content and limit to reasonable size
    const { data: mangaData, error } = await supabase
      .from('manga')
      .select(`
        id,
        created_at,
        slug_map!inner(slug)
      `)
      .order('created_at', { ascending: false })
      .limit(25000); // Reasonable limit for sitemap size

    if (error) {
      throw error;
    }

    if (mangaData && mangaData.length > 0) {
      for (const item of mangaData) {
        const slugMap = item.slug_map as any;
        if (!slugMap?.slug) continue;

        const lastmod = item.created_at 
          ? new Date(item.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Gallery page (higher priority)
        urls.push({
          loc: `${SITE_URL}/hentai/${slugMap.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.5'
        });

        // First reading page (slightly lower priority)
        urls.push({
          loc: `${SITE_URL}/hentai/${slugMap.slug}/1`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.4'
        });
      }
    }

    // If no manga found, try alternative query
    if (urls.length === 0) {
      const { data: fallbackData } = await supabase
        .from('slug_map')
        .select('slug, manga_id')
        .limit(10000);

      if (fallbackData) {
        for (const item of fallbackData) {
          const today = new Date().toISOString().split('T')[0];
          
          urls.push({
            loc: `${SITE_URL}/hentai/${item.slug}`,
            lastmod: today,
            changefreq: 'monthly',
            priority: '0.5'
          });

          urls.push({
            loc: `${SITE_URL}/hentai/${item.slug}/1`,
            lastmod: today,
            changefreq: 'monthly',
            priority: '0.4'
          });
        }
      }
    }

    const sitemap = generateSitemapXML(urls);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=43200' // Cache for 12 hours
      }
    });

  } catch (error) {
    console.error('Manga sitemap error:', error);
    
    // Return minimal sitemap on error
    const fallbackUrls: SitemapUrl[] = [
      {
        loc: `${SITE_URL}/`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0'
      }
    ];

    const fallbackSitemap = generateSitemapXML(fallbackUrls);
    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300' // Short cache for error cases
      }
    });
  }
}