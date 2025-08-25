<script lang="ts">
  export let data: {
    query: string;
    comics: {
      id: string;
      title: string;
      slug: string;
      featureImage: string;
      author: { name: string };
      tags?: string[];
      relevanceScore?: number;
    }[];
    page: number;
    totalPages: number;
    totalResults?: number;
    meta: {
      title: string;
      description: string;
      prev: string | null;
      next: string | null;
    };
  };
  
  import NativeAds from '$lib/components/adsterra/NativeAds.svelte'
  import TrafficStarsAd from '$lib/components/TrafficStarsAd.svelte';

  // Helper function to highlight matching terms
  function highlightMatch(text: string, query: string): string {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-pink-300 text-pink-900 px-1 rounded">$1</mark>');
  }

  // Helper to check if any tag matches the search query
  function getMatchingTags(tags: string[], query: string): string[] {
    if (!query.trim() || !tags) return [];
    const queryLower = query.toLowerCase();
    return tags.filter(tag => tag.toLowerCase().includes(queryLower));
  }
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
  {#if data.meta.prev}
    <link rel="prev" href={data.meta.prev} />
  {/if}
  {#if data.meta.next}
    <link rel="next" href={data.meta.next} />
  {/if}
</svelte:head>

<main class="container mx-auto px-4 py-12">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">
      Search results for: <span class="text-pink-500">{data.query}</span>
    </h1>
    {#if data.totalResults !== undefined}
      <p class="text-muted-foreground">
        Found {data.totalResults.toLocaleString()} result{data.totalResults !== 1 ? 's' : ''}
        {#if data.totalPages > 1}
          (Page {data.page} of {data.totalPages})
        {/if}
      </p>
    {/if}
  </div>

  {#if data.comics.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground mb-4">No comics found for "{data.query}"</p>
      <p class="text-sm text-muted-foreground">
        Try searching for:
      </p>
      <ul class="text-sm text-muted-foreground mt-2 space-y-1">
        <li>• Different keywords or tags</li>
        <li>• Artist names</li>
        <li>• Character names</li>
        <li>• Parody titles</li>
        <li>• Categories or genres</li>
      </ul>
    </div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each data.comics as comic}
        <div class="block hover:opacity-90">
          <a href={`/comic/${comic.slug}`}>
            <img
              src={comic.featureImage}
              alt={comic.title}
              class="w-full h-auto rounded shadow"
              loading="lazy"
            />
          </a>
          
          <div class="mt-2">
            <a href={`/comic/${comic.slug}`} class="block">
              <p class="text-sm font-medium text-white text-center hover:text-pink-400 transition-colors">
                {@html highlightMatch(comic.title, data.query)}
              </p>
            </a>
            
            {#if comic.author.name !== 'Unknown'}
              <p class="text-xs text-gray-400 text-center mt-1">
                by {@html highlightMatch(comic.author.name, data.query)}
              </p>
            {/if}
            
            <!-- Show matching tags if any -->
            {#if comic.tags && comic.tags.length > 0}
              {@const matchingTags = getMatchingTags(comic.tags, data.query)}
              {#if matchingTags.length > 0}
                <div class="flex flex-wrap gap-1 mt-2 justify-center">
                  {#each matchingTags.slice(0, 3) as tag}
                    <span class="text-xs bg-pink-600 text-white px-2 py-1 rounded">
                      {@html highlightMatch(tag, data.query)}
                    </span>
                  {/each}
                  {#if matchingTags.length > 3}
                    <span class="text-xs text-gray-400">
                      +{matchingTags.length - 3} more
                    </span>
                  {/if}
                </div>
              {/if}
            {/if}

            <!-- Debug: Show relevance score in development -->
            {#if comic.relevanceScore !== undefined && comic.relevanceScore > 0}
              <!-- <div class="text-xs text-gray-500 text-center mt-1">
                Score: {comic.relevanceScore}
              </div> -->
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
      <div class="mt-10">
        <!-- Previous/Next navigation for mobile -->
        <div class="flex justify-between items-center mb-4 md:hidden">
          {#if data.page > 1}
            <a
              href={`/search?q=${encodeURIComponent(data.query)}&page=${data.page - 1}`}
              class="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
            >
              ← Previous
            </a>
          {:else}
            <div></div>
          {/if}
          
          {#if data.page < data.totalPages}
            <a
              href={`/search?q=${encodeURIComponent(data.query)}&page=${data.page + 1}`}
              class="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
            >
              Next →
            </a>
          {:else}
            <div></div>
          {/if}
        </div>

        <!-- Full pagination for desktop -->
        <div class="hidden md:flex flex-wrap gap-2 justify-center">
          {#if data.page > 1}
            <a
              href={`/search?q=${encodeURIComponent(data.query)}&page=1`}
              class="px-3 py-2 rounded border border-white text-white hover:bg-white hover:text-black transition"
            >
              1
            </a>
            {#if data.page > 3}
              <span class="px-3 py-2 text-gray-400">...</span>
            {/if}
          {/if}

          <!-- Show pages around current page -->
          {#each Array(Math.min(5, data.totalPages)) as _, i}
            {@const pageNum = Math.max(1, Math.min(data.totalPages, data.page - 2 + i))}
            {#if pageNum >= 1 && pageNum <= data.totalPages && (data.page <= 3 || pageNum >= data.page - 2) && (data.page >= data.totalPages - 2 || pageNum <= data.page + 2)}
              <a
                href={`/search?q=${encodeURIComponent(data.query)}&page=${pageNum}`}
                class="px-3 py-2 rounded border border-white text-white hover:bg-white hover:text-black transition"
                class:selected={data.page === pageNum}
                class:bg-pink-600={data.page === pageNum}
                class:border-pink-600={data.page === pageNum}
              >
                {pageNum}
              </a>
            {/if}
          {/each}

          {#if data.page < data.totalPages}
            {#if data.page < data.totalPages - 2}
              <span class="px-3 py-2 text-gray-400">...</span>
            {/if}
            <a
              href={`/search?q=${encodeURIComponent(data.query)}&page=${data.totalPages}`}
              class="px-3 py-2 rounded border border-white text-white hover:bg-white hover:text-black transition"
            >
              {data.totalPages}
            </a>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
  
  <NativeAds />
</main>