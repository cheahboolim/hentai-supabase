<script>
	// Keep your existing imports
	import { browser } from '$app/environment'; // Make sure 'browser' is imported
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { seo } from '$lib/seo.ts';
	// We no longer need this, as the logic is now directly in this file
	// import { trackPageView } from '$lib/gtm.js'; 

	import MainNav from '$lib/components/MainNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import BannerAd from '$lib/components/adsterra/BannerAd.svelte';
	import BlueBallsAd from '$lib/components/ownads/BlueBallsAd.svelte';
	import AppInstallBanner from '$lib/components/AppInstallBanner.svelte';
	import AAdsBanner from '$lib/components/AAdsBanner.svelte';
	import ExoClickSlider from '$lib/components/ExoClickSlider.svelte';
	import ExoOutstreamAd from '$lib/components/ExoOutstreamAd.svelte';
	import Coinpoll from '$lib/components/ownads/coinpoll.svelte';

	// 1. Get GTM ID from environment variables
	const GTM_ID = import.meta.env.VITE_GTM_ID;

	onMount(() => {
		// Future setup: theme, auth, etc.
	});

	// 2. Updated to push a 'page_view' event to the dataLayer on navigation
	afterNavigate(() => {
		if (browser) {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push({
				event: 'page_view',
				page: {
					path: $page.url.pathname,
					title: document.title // Use the actual document title
				}
			});
		}
	});
</script>

<svelte:head>
	<meta name="theme-color" content="#000000" />
	<meta name="msapplication-TileColor" content="#000000" />
	<link rel="manifest" href="/manifest.webmanifest" />

	<link
		rel="icon"
		type="image/png"
		sizes="16x16"
		href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/favicon-16x16.png"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="32x32"
		href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/favicon-32x32.png"
	/>
	<link rel="icon" href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/favicon.ico" sizes="any" />
	<link
		rel="apple-touch-icon"
		href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/apple-touch-icon.png"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="192x192"
		href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/android-chrome-192x192.png"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="512x512"
		href="{import.meta.env.PUBLIC_CDN_BASE_URL}/favicon/android-chrome-512x512.png"
	/>

	{#if GTM_ID && browser}
		<script>
			(function (w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
				var f = d.getElementsByTagName(s)[0],
					j = d.createElement(s),
					dl = l != 'dataLayer' ? '&l=' + l : '';
				j.async = true;
				j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
				f.parentNode.insertBefore(j, f);
			})(window, document, 'script', 'dataLayer', GTM_ID);
		</script>
		{/if}
</svelte:head>

<div class="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
	{#if GTM_ID}
		<noscript
			><iframe
				src="https://www.googletagmanager.com/ns.html?id={GTM_ID}"
				height="0"
				width="0"
				style="display:none;visibility:hidden"
			></iframe></noscript
		>
	{/if}

	<MainNav />

	<div class="container mx-auto px-4 py-2">
		<AAdsBanner />
	</div>

	<main class="flex-1">
		<slot />
	</main>

	<div class="container mx-auto px-4 py-2">
		<AppInstallBanner />
	</div>

	<Footer />

	</div>