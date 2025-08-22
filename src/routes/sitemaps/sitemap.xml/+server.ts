// src/routes/sitemap.xml/+server.ts
import { supabase } from '$lib/supabaseClient';

const SITE_URL = 'https://nhentai.pics';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export async function GET() {
  const urls: SitemapUrl[] = [];

  try {
    // 1. Static pages (highest priority)
    urls.push(
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
      }
    );

    // 2. Browse category pages
    const browseTypes = ['tags', 'artists', 'categories', 'parodies', 'characters', 'languages', 'groups'];
    for (const type of browseTypes) {
      urls.push({
        loc: `${SITE_URL}/p/${type}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      });
    }

    // 3. Individual browse pages for each category
    // Tags
    const { data: tags } = await supabase
      .from('tags')
      .select('slug')
      .not('slug', 'is', null)
      .limit(1000); // Limit to prevent sitemap from being too large

    if (tags) {
      for (const tag of tags) {
        urls.push({
          loc: `${SITE_URL}/browse/tags/${tag.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Artists
    const { data: artists } = await supabase
      .from('artists')
      .select('slug')
      .not('slug', 'is', null)
      .limit(1000);

    if (artists) {
      for (const artist of artists) {
        urls.push({
          loc: `${SITE_URL}/browse/artists/${artist.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')
      .not('slug', 'is', null);

    if (categories) {
      for (const category of categories) {
        urls.push({
          loc: `${SITE_URL}/browse/categories/${category.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Parodies
    const { data: parodies } = await supabase
      .from('parodies')
      .select('slug')
      .not('slug', 'is', null)
      .limit(1000);

    if (parodies) {
      for (const parody of parodies) {
        urls.push({
          loc: `${SITE_URL}/browse/parodies/${parody.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Characters
    const { data: characters } = await supabase
      .from('characters')
      .select('slug')
      .not('slug', 'is', null)
      .limit(1000);

    if (characters) {
      for (const character of characters) {
        urls.push({
          loc: `${SITE_URL}/browse/characters/${character.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Languages
    const { data: languages } = await supabase
      .from('languages')
      .select('slug')
      .not('slug', 'is', null);

    if (languages) {
      for (const language of languages) {
        urls.push({
          loc: `${SITE_URL}/browse/languages/${language.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // Groups
    const { data: groups } = await supabase
      .from('groups')
      .select('slug')
      .not('slug', 'is', null)
      .limit(1000);

    if (groups) {
      for (const group of groups) {
        urls.push({
          loc: `${SITE_URL}/browse/groups/${group.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.6'
        });
      }
    }

    // 4. Individual manga pages (hentai/[slug])
    const { data: manga } = await supabase
      .from('slug_map')
      .select('slug, manga_id')
      .limit(10000); // Limit to most recent/popular

    if (manga) {
      for (const item of manga) {
        urls.push({
          loc: `${SITE_URL}/hentai/${item.slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.5'
        });
      }
    }

    // 5. Reading pages for top manga (first page only for each)
    if (manga) {
      for (const item of manga.slice(0, 1000)) { // Only top 1000 manga
        urls.push({
          loc: `${SITE_URL}/hentai/${item.slug}/1`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.4'
        });
      }
    }

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a minimal sitemap with just the homepage if there's an error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300' // Shorter cache for error cases
      }
    });
  }
}

// Alternative: Sitemap Index for very large sites
// src/routes/sitemap-index.xml/+server.ts
export async function generateSitemapIndex() {
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

  return sitemapIndex;
}

// src/routes/sitemap-static.xml/+server.ts - Static pages sitemap
export async function getStaticSitemap() {
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

  return generateSitemapXML(urls);
}

// src/routes/sitemap-browse.xml/+server.ts - Browse pages sitemap
export async function getBrowseSitemap() {
  const urls: SitemapUrl[] = [];

  try {
    // Fetch all browse categories with proper slug validation
    const browseQueries = [
      { table: 'tags', type: 'tags' },
      { table: 'artists', type: 'artists' },
      { table: 'categories', type: 'categories' },
      { table: 'parodies', type: 'parodies' },
      { table: 'characters', type: 'characters' },
      { table: 'languages', type: 'languages' },
      { table: 'groups', type: 'groups' }
    ];

    for (const query of browseQueries) {
      const { data } = await supabase
        .from(query.table)
        .select('slug')
        .not('slug', 'is', null)
        .neq('slug', '')
        .limit(5000); // Reasonable limit per category

      if (data) {
        for (const item of data) {
          urls.push({
            loc: `${SITE_URL}/browse/${query.type}/${item.slug}`,
            changefreq: 'weekly',
            priority: '0.6'
          });
        }
      }
    }

    return generateSitemapXML(urls);
  } catch (error) {
    console.error('Browse sitemap error:', error);
    return generateSitemapXML([]);
  }
}

// src/routes/sitemap-manga.xml/+server.ts - Manga pages sitemap
export async function getMangaSitemap() {
  const urls: SitemapUrl[] = [];

  try {
    // Get manga with their creation dates for better lastmod
    const { data: mangaData } = await supabase
      .from('slug_map')
      .select(`
        slug,
        manga_id,
        manga!inner(created_at)
      `)
      .limit(50000); // Large but manageable limit

    if (mangaData) {
      for (const item of mangaData) {
        const manga = item.manga as any;
        const lastmod = manga?.created_at 
          ? new Date(manga.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Gallery page
        urls.push({
          loc: `${SITE_URL}/hentai/${item.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.5'
        });

        // First reading page
        urls.push({
          loc: `${SITE_URL}/hentai/${item.slug}/1`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.4'
        });
      }
    }

    return generateSitemapXML(urls);
  } catch (error) {
    console.error('Manga sitemap error:', error);
    return generateSitemapXML([]);
  }
}

// Helper function to generate XML
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