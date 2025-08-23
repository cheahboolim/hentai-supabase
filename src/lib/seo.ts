// src/lib/seo.ts
import { writable } from 'svelte/store';

export const seo = writable({
	title: 'NHentai - Read Hentai, Doujinshi, and Manga Free',
	description: 'nhentai.pics - Share Your Dreams, Live Your Fantasy',
	canonical: '`https://${import.meta.env.PUBLIC_WEBSITE_BASE_DOMAIN}`'
});
