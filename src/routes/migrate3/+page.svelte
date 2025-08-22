<!-- src/routes/migrate3/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let startId = '';
  let endId = '';
  let blacklist = '';
  let logs: string[] = [];
  let progress = 0;
  let isMigrating = false;
  let stopRequested = false;

  function log(msg: string) {
    logs = [msg, ...logs];
  }

  function handleStop() {
    stopRequested = true;
    log('🛑 Stop requested, finishing current post...');
  }

  async function runAction(method: 'POST' | 'DELETE') {
    const start = parseInt(startId, 10);
    const end = parseInt(endId, 10);
    
    if (isNaN(start) || isNaN(end) || start < end) {
      log('⚠️ Invalid ID range. Ensure Start ≥ End and both are numbers.');
      return;
    }

    // Reset state
    logs = [];
    progress = 0;
    stopRequested = false;
    isMigrating = true;

    // Parse blacklist tags (one per line, filter empty lines)
    const blacklistTags = blacklist
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const total = start - end + 1;
    let done = 0;

    for (let id = start; id >= end; id--) {
      log(
        `${method === 'POST' ? '🔄 Migrating' : '🗑️ Deleting'} post ${id}...`
      );
      
      try {
        const response = await fetch('/api/migrate3', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            blacklistTags,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          if (method === 'POST') {
            log(`✅ Post ${id} migrated successfully. Slug: ${data.slug || 'N/A'}`);
          } else {
            log(`✅ Post ${id} deleted successfully.`);
          }
        } else {
          // Enhanced error logging with specific blacklist tag information
          const message = data.message || 'Unknown reason';
          if (message.includes('blacklisted tag')) {
            log(`⚠️ Post ${id} skipped: ${message}`);
          } else if (message.includes('already exists')) {
            log(`⚠️ Post ${id} already exists, skipping.`);
          } else {
            log(`❌ Post ${id} failed: ${message}`);
          }
        }
      } catch (err: any) {
        log(`❌ Network error on ${id}: ${err.message}`);
      }

      done++;
      progress = Math.round((done / total) * 100);

      // If stop requested, break after finishing this iteration
      if (stopRequested) break;

      // Throttle to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    isMigrating = false;
    log(
      stopRequested
        ? '🛑 Migration stopped by user.'
        : method === 'POST'
          ? '🎉 Migration completed successfully.'
          : '🧹 Deletion completed successfully.'
    );
  }
</script>

<svelte:head>
  <title>Manga Migration V3</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-gray-900 min-h-screen">
  <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
    📥 Manga Migration V3
  </h1>
  
  <div class="text-sm text-gray-600 dark:text-gray-400">
    Images will be served directly from nhentai.net. Slugs will be generated from manga titles.
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block mb-1 text-sm font-medium" for="start-id">Start ID</label>
      <input
        id="start-id"
        type="number"
        bind:value={startId}
        placeholder="e.g., 400000"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
    </div>
    <div>
      <label class="block mb-1 text-sm font-medium" for="end-id">End ID</label>
      <input
        id="end-id"
        type="number"
        bind:value={endId}
        placeholder="e.g., 399900"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
    </div>
  </div>

  <div>
    <label class="block mb-1 text-sm font-medium" for="blacklist">
      Blacklist Tags (one per line)
    </label>
    <textarea
      id="blacklist"
      bind:value={blacklist}
      placeholder="loli&#10;shota&#10;gore&#10;scat"
      class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
    ></textarea>
    <div class="text-xs text-gray-500 mt-1">
      Posts containing any of these tags will be skipped during migration.
    </div>
  </div>

  <div class="flex flex-wrap gap-4">
    <button 
      on:click={() => runAction('POST')}
      disabled={isMigrating}
      class="min-w-[140px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isMigrating ? 'Migrating…' : 'Start Migration'}
    </button>
    
    <button
      on:click={() => runAction('DELETE')}
      disabled={isMigrating}
      class="min-w-[140px] px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isMigrating ? 'Deleting…' : 'Delete Migration'}
    </button>
    
    {#if isMigrating}
      <button
        on:click={handleStop}
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Stop Migration
      </button>
    {/if}
  </div>

  <div>
    <label class="block mb-2 text-sm font-medium">
      Progress: {progress}% ({isMigrating ? 'Running' : 'Idle'})
    </label>
    <div class="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
      <div
        class="h-full bg-green-500 transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <div>
    <label class="block mb-2 text-sm font-medium">
      Migration Logs ({logs.length} entries)
    </label>
    <div class="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 h-64 overflow-y-auto text-sm font-mono">
      {#if logs.length === 0}
        <div class="text-gray-500 dark:text-gray-400 italic">
          No logs yet. Start a migration to see progress here.
        </div>
      {:else}
        {#each logs as logEntry, i (i)}
          <div class="py-1">
            {logEntry}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  /* Add any custom styles here if needed */
</style>