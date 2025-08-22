// src/routes/sitemap-manga-pages-[index]/+server.ts
import { supabase } from '$lib/supabaseClient';

const SITE_URL = 'https://nhentai.pics';
const URLS_PER_SITEMAP = 50000;

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export async function GET({ params }) {
  const index = parseInt(params.index, 10);
  if (isNaN(index)) {
    return new Response('Invalid index', { status: 400 });
  }

  try {
    const { data: pageData } = await supabase
      .from('pages')
      .select(`
        page_number,
        manga_id,
        manga!inner(created_at, id),
        slug_map!inner(slug)
      `)
      .not('manga_id', 'is', null)
      .range(index * URLS_PER_SITEMAP, (index + 1) * URLS_PER_SITEMAP - 1);

    const urls: SitemapUrl[] = [];

    if (pageData) {
      for (const item of pageData) {
        const manga = item.manga as any;
        const slug = item.slug_map?.slug;
        if (!slug) continue;

        const lastmod = manga?.created_at
          ? new Date(manga.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        urls.push({
          loc: `${SITE_URL}/hentai/${slug}/${item.page_number}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.4'
        });
      }
    }

    const sitemap = generateSitemapXML(urls);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600'
      }
    });
  } catch (error) {
    console.error(`Manga pages sitemap ${index} error:`, error);
    return new Response(generateSitemapXML([]), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300'
      }
    });
  }
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