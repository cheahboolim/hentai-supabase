// src/routes/sitemaps/sitemap-manga-pages-[index]/+server.ts
import { supabase } from '$lib/supabaseClient';

const SITE_URL = 'https://nhentai.pics';
const URLS_PER_SITEMAP = 25000;
const MAX_PAGES_PER_MANGA = 100; // Reasonable limit

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
    const urls: SitemapUrl[] = [];
    
    // Calculate how many manga we need to skip to get to this chunk
    const estimatedPagesPerManga = 20; // Average estimate
    const mangaPerChunk = Math.floor(URLS_PER_SITEMAP / estimatedPagesPerManga);
    const mangaOffset = index * mangaPerChunk;

    // Get batch of manga
    const { data: mangaBatch } = await supabase
      .from('slug_map')
      .select(`
        slug,
        manga_id,
        manga!inner(created_at)
      `)
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('manga_id')
      .range(mangaOffset, mangaOffset + mangaPerChunk - 1);

    if (mangaBatch && mangaBatch.length > 0) {
      const mangaIds = mangaBatch.map(m => m.manga_id);
      
      // Get all pages for these manga
      const { data: allPages } = await supabase
        .from('pages')
        .select('manga_id, page_number')
        .in('manga_id', mangaIds)
        .order('manga_id')
        .order('page_number');

      // Group pages by manga_id for efficient processing
      const pagesByManga = new Map<string, number[]>();
      allPages?.forEach(page => {
        if (!pagesByManga.has(page.manga_id)) {
          pagesByManga.set(page.manga_id, []);
        }
        pagesByManga.get(page.manga_id)!.push(page.page_number);
      });

      // Generate URLs
      let urlCount = 0;
      for (const manga of mangaBatch) {
        if (urlCount >= URLS_PER_SITEMAP) break;

        const pages = pagesByManga.get(manga.manga_id) || [];
        const maxPage = Math.min(
          Math.max(...pages, 1),
          MAX_PAGES_PER_MANGA
        );
        
        const lastmod = (manga as any).manga?.created_at
          ? new Date((manga as any).manga.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Add pages for this manga
        for (let pageNum = 1; pageNum <= maxPage && urlCount < URLS_PER_SITEMAP; pageNum++) {
          urls.push({
            loc: `${SITE_URL}/hentai/${manga.slug}/${pageNum}`,
            lastmod,
            changefreq: 'monthly',
            priority: pageNum === 1 ? '0.6' : '0.4'
          });
          urlCount++;
        }
      }
    }

    const sitemap = generateSitemapXML(urls);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=86400'
      }
    });
  } catch (error) {
    console.error(`Manga pages sitemap ${index} error:`, error);
    return new Response(generateSitemapXML([]), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600'
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