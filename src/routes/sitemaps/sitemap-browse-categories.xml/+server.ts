// src/routes/sitemaps/sitemap-browse-paginated.xml/+server.ts
import { supabase } from '$lib/supabaseClient';

const SITE_URL = 'https://nhentai.pics';
const PAGE_SIZE = 10; // Same as your browse page size
const MAX_PAGES_PER_CATEGORY = 100; // Limit to prevent huge sitemaps

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export async function GET() {
  const urls: SitemapUrl[] = [];

  try {
    const browseQueries = [
      { table: 'tags', type: 'tags', joinTable: 'manga_tags', idField: 'tag_id' },
      { table: 'artists', type: 'artists', joinTable: 'manga_artists', idField: 'artist_id' },
      { table: 'categories', type: 'categories', joinTable: 'manga_categories', idField: 'category_id' },
      { table: 'parodies', type: 'parodies', joinTable: 'manga_parodies', idField: 'parody_id' },
      { table: 'characters', type: 'characters', joinTable: 'manga_characters', idField: 'character_id' },
      { table: 'languages', type: 'languages', joinTable: 'manga_languages', idField: 'language_id' },
      { table: 'groups', type: 'groups', joinTable: 'manga_groups', idField: 'group_id' }
    ];

    for (const query of browseQueries) {
      // Get categories with limited scope
      const { data: categories } = await supabase
        .from(query.table)
        .select('id, slug')
        .not('slug', 'is', null)
        .neq('slug', '')
        .limit(1000); // Limit categories to process

      if (categories) {
        for (const category of categories) {
          // Count total manga for this category
          const { count: totalManga } = await supabase
            .from(query.joinTable)
            .select('manga_id', { count: 'exact', head: true })
            .eq(query.idField, category.id);

          if (totalManga && totalManga > PAGE_SIZE) {
            const totalPages = Math.min(
              Math.ceil(totalManga / PAGE_SIZE),
              MAX_PAGES_PER_CATEGORY
            );

            // Add paginated URLs (skip page 1 as it's in the main categories sitemap)
            for (let page = 2; page <= totalPages; page++) {
              urls.push({
                loc: `${SITE_URL}/browse/${query.type}/${category.slug}?page=${page}`,
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'weekly',
                priority: '0.5'
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
        'Cache-Control': 'max-age=86400'
      }
    });
  } catch (error) {
    console.error('Browse paginated sitemap error:', error);
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