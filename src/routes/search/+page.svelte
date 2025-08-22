<script lang="ts">
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import NativeAds from '$lib/components/adsterra/NativeAds.svelte';
  import TrafficStarsAd from '$lib/components/TrafficStarsAd.svelte';

  export let data: {
    query: string;
    comics: {
      id: string;
      title: string;
      slug: string;
      featureImage: string | null;
      author: { name: string };
      tags: string[];
      categories: string[];
      characters: string[];
      groups: string[];
      languages: string[];
      parodies: string[];
    }[];
    page: number;
    totalPages: number;
    meta: {
      title: string;
      description: string;
      canonical: string;
      keywords: string;
      ogTitle: string;
      ogDescription: string;
      ogImage: string;
      prev: string | null;
      next: string | null;
      structuredData: any;
    };
  };

  const searchQuery = writable(data.query);

  function handleSearch(event: Event) {
    event.preventDefault();
    const query = $searchQuery.trim();
    if (query) {
      goto(`/search?q=${encodeURIComponent(query)}`);
    }
  }
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
  <meta name="keywords" content={data.meta.keywords} />
  <link rel="canonical" href={data.meta.canonical} />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={data.meta.canonical} />
  <meta property="og:title" content={data.meta.ogTitle} />
  <meta property="og:description" content={data.meta.ogDescription} />
  <meta property="og:image" content={data.meta.ogImage} />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={data.meta.canonical} />
  <meta property="twitter:title" content={data.meta.ogTitle} />
  <meta property="twitter:description" content={data.meta.ogDescription} />
  <meta property="twitter:image" content={data.meta.ogImage} />
  
  <!-- Additional SEO -->
  <meta name="robots" content="index, follow" />
  <meta name="author" content="NHentai" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Pagination -->
  {#if data.meta.prev}
    <link rel="prev" href={data.meta.prev} />
  {/if}
  {#if data.meta.next}
    <link rel="next" href={data.meta.next} />
  {/if}
  
  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(data.meta.structuredData)}</script>`}
</svelte:head>

<main class="max-w-6xl mx-auto px-4 py-8">
  <!-- SEO-optimized header section -->
  <header class="mb-8">
    <h1 class="text-3xl font-bold mb-4">
      Search Hentai
      {#if data.query}
        <span class="text-pink-600 dark:text-pink-400">for "{data.query}"</span>
      {/if}
    </h1>
    <p class="text-gray-600 dark:text-gray-300 mb-4">
      {#if data.query}
        Found {data.comics.length} of {data.totalPages * 10} hentai results for "{data.query}".
      {:else}
        Search for hentai titles, tags, artists, characters, groups, languages, or parodies.
      {/if}
    </p>
  </header>

  <!-- Search section -->
  <section class="mb-6" aria-label="Search hentai">
    <form on:submit={handleSearch}>
      <label for="search" class="block text-sm font-medium mb-2">
        Search hentai content:
      </label>
      <input
        id="search"
        type="text"
        bind:value={$searchQuery}
        placeholder="Search titles, tags, artists, etc. (e.g., Yuri, Naruto, Tetsuya)"
        class="w-full p-3 border rounded-lg bg-white text-black dark:bg-black dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        aria-describedby="search-results-info"
      />
    </form>
    {#if data.query}
      <p id="search-results-info" class="text-sm text-gray-600 dark:text-gray-300 mt-2">
        Showing page {data.page} of {data.totalPages} for "{data.query}"
      </p>
    {/if}
  </section>

  <!-- Results section -->
  {#if data.comics.length === 0 && data.query}
    <div class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        No hentai found matching "{data.query}". Try a different search term.
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Popular searches: Yuri, Harem, Naruto, Asuka, Team Vanilla, English
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {#each data.comics as comic}
        <a
          href={`/comic/${comic.slug}`}
          class="block p-3 border rounded-lg hover:bg-pink-500 hover:text-white transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-pink-500 focus:outline-none group"
          aria-label="View hentai {comic.title}"
        >
          {#if comic.featureImage}
            <img
              src={comic.featureImage}
              alt={comic.title}
              class="w-full h-auto rounded shadow mb-2"
              loading="lazy"
            />
          {/if}
          <p class="font-medium text-sm group-hover:font-semibold text-center">
            {comic.title}
          </p>
          {#if comic.author.name !== 'Unknown'}
            <p class="text-xs text-gray-600 dark:text-gray-300 text-center">
              by {comic.author.name}
            </p>
          {/if}
        </a>
      {/each}
    </div>

    {#if data.totalPages > 1}
      <nav class="mt-10 flex flex-wrap gap-2 justify-center" aria-label="Pagination">
        {#each Array(Math.min(data.totalPages, 10)) as _, i}
          {#if data.query}
            <a
              href={`/search?q=${encodeURIComponent(data.query)}&page=${i + 1}`}
              class="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-pink-500 hover:text-white transition-all duration-200 {data.page === i + 1 ? 'bg-pink-500 text-white' : ''}"
              aria-current={data.page === i + 1 ? 'page' : undefined}
              aria-label="Go to page {i + 1}"
            >
              {i + 1}
            </a>
          {/if}
        {/each}
        {#if data.totalPages > 10}
          <span class="px-4 py-2 text-gray-600 dark:text-gray-300">...</span>
          <a
            href={`/search?q=${encodeURIComponent(data.query)}&page=${data.totalPages}`}
            class="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-pink-500 hover:text-white transition-all duration-200"
            aria-label="Go to last page"
          >
            {data.totalPages}
          </a>
        {/if}
      </nav>
    {/if}
  {/if}

  <!-- Ads -->
  <div class="mt-8">
    <NativeAds />
    <TrafficStarsAd />
  </div>

  <!-- SEO footer content -->
  <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
    <div class="prose dark:prose-invert max-w-none">
      <h2 class="text-xl font-semibold mb-4">About Hentai Search</h2>
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="font-semibold mb-2 text-pink-600 dark:text-pink-400">Search Hentai</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">
            Search across hentai titles, tags, categories, artists, characters, groups, languages, and parodies to find your favorite content.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-pink-600 dark:text-pink-400">Discover Content</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">
            Use our powerful search to explore a vast collection of hentai, with results tailored to your query.
          </p>
        </div>
      </div>
      <p class="text-gray-600 dark:text-gray-300">
        Our search engine is regularly updated to provide the most relevant and accurate results for your hentai preferences.
      </p>
    </div>
  </footer>
</main>

<style>
  .scroll-mt-20 {
    scroll-margin-top: 5rem;
  }
  
  :global(html) {
    scroll-behavior: smooth;
  }
  
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #ec4899;
    outline-offset: 2px;
  }

  .grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
</style>