import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ url, locals }) => {
  const supabase = locals.supabase;
  const query = url.searchParams.get('q')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (!query) {
    return {
      query,
      comics: [],
      page: 1,
      totalPages: 1,
      meta: {
        title: 'Search Hentai | NHentai',
        description: 'Search for hentai content on NHentai. Find your favorite titles, tags, artists, and more.',
        canonical: `https://nhentai.pics${url.pathname}`,
        keywords: 'hentai search, nhentai, hentai titles, hentai tags',
        ogTitle: 'Search Hentai | NHentai',
        ogDescription: 'Search for hentai content on NHentai. Find your favorite titles, tags, artists, and more.',
        ogImage: 'https://nhentai.pics/images/search-og.jpg',
        prev: null,
        next: null,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Hentai Search',
          description: 'Search for hentai content on NHentai',
          url: `https://nhentai.pics${url.pathname}`
        }
      }
    };
  }

  // Main query to search across manga titles, tags, categories, artists, characters, groups, languages, and parodies
  const { data: manga, error: mangaError, count } = await supabase
    .from('manga')
    .select(
      `
      id,
      title,
      feature_image_url,
      slug_map(slug),
      manga_artists(artists(name)),
      manga_tags(tags(name)),
      manga_categories(categories(name)),
      manga_characters(characters(name)),
      manga_groups(groups(name)),
      manga_languages(languages(name)),
      manga_parodies(parodies(name))
    `,
      { count: 'exact' }
    )
    .or(
      `
      title.ilike.%${query}%,
      manga_tags.tags.name.ilike.%${query}%,
      manga_categories.categories.name.ilike.%${query}%,
      manga_artists.artists.name.ilike.%${query}%,
      manga_characters.characters.name.ilike.%${query}%,
      manga_groups.groups.name.ilike.%${query}%,
      manga_languages.languages.name.ilike.%${query}%,
      manga_parodies.parodies.name.ilike.%${query}%
    `
    )
    .range(from, to);

  if (mangaError || !manga) {
    console.error('Search error:', mangaError);
    return {
      query,
      comics: [],
      page,
      totalPages: 1,
      meta: {
        title: `Search results for "${query}" | NHentai`,
        description: `No hentai results found for "${query}" on NHentai.`,
        canonical: `https://nhentai.pics${url.pathname}?q=${encodeURIComponent(query)}`,
        keywords: `hentai search, ${query}, nhentai`,
        ogTitle: `Search results for "${query}" | NHentai`,
        ogDescription: `No hentai results found for "${query}" on NHentai.`,
        ogImage: 'https://nhentai.pics/images/search-og.jpg',
        prev: null,
        next: null,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'SearchResultsPage',
          name: `Search results for "${query}"`,
          description: `No hentai results found for "${query}" on NHentai`,
          url: `https://nhentai.pics${url.pathname}?q=${encodeURIComponent(query)}`
        }
      }
    };
  }

  const comics = manga.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug_map?.[0]?.slug ?? '',
    featureImage: m.feature_image_url,
    author: m.manga_artists?.artists?.[0]?.name ? { name: m.manga_artists.artists[0].name } : { name: 'Unknown' },
    tags: m.manga_tags?.tags?.map(t => t.name) || [],
    categories: m.manga_categories?.categories?.map(c => c.name) || [],
    characters: m.manga_characters?.characters?.map(c => c.name) || [],
    groups: m.manga_groups?.groups?.map(g => g.name) || [],
    languages: m.manga_languages?.languages?.map(l => l.name) || [],
    parodies: m.manga_parodies?.parodies?.map(p => p.name) || []
  }));

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const meta = {
    title: page > 1
      ? `Search results for "${query}" – Page ${page} | NHentai`
      : `Search results for "${query}" | NHentai`,
    description: `Discover ${count || 0} hentai results for "${query}" on NHentai. Page ${page} of ${totalPages}.`,
    canonical: `https://nhentai.pics${url.pathname}?q=${encodeURIComponent(query)}`,
    keywords: `hentai search, ${query}, nhentai, hentai titles, hentai tags`,
    ogTitle: page > 1
      ? `Search results for "${query}" – Page ${page} | NHentai`
      : `Search results for "${query}" | NHentai`,
    ogDescription: `Discover ${count || 0} hentai results for "${query}" on NHentai. Page ${page} of ${totalPages}.`,
    ogImage: 'https://nhentai.pics/images/search-og.jpg',
    prev: page > 1 ? `/search?q=${encodeURIComponent(query)}&page=${page - 1}` : null,
    next: page < totalPages ? `/search?q=${encodeURIComponent(query)}&page=${page + 1}` : null,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: `Search results for "${query}"`,
      description: `Discover ${count || 0} hentai results for "${query}" on NHentai`,
      url: `https://nhentai.pics${url.pathname}?q=${encodeURIComponent(query)}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: count || 0,
        itemListElement: comics.map((comic, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: comic.title,
            url: `https://nhentai.pics/comic/${comic.slug}`,
            image: comic.featureImage,
            author: comic.author.name
          }
        }))
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://nhentai.pics'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Search',
            item: `https://nhentai.pics${url.pathname}?q=${encodeURIComponent(query)}`
          }
        ]
      }
    }
  };

  return {
    query,
    comics,
    page,
    totalPages,
    meta
  };
};