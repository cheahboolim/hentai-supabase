// src/routes/api/migrate3/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import axios from 'axios';
import { load, type CheerioAPI } from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Metadata {
  title: string;
  featureImageSrc: string;
  totalPages: number;
  tags: string[];
  artists: string[];
  groups: string[];
  parodies: string[];
  languages: string[];
  categories: string[];
  characters: string[];
}

// Normalize title to create a URL-safe slug
function normalizeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
}

// Check if content contains blacklisted tags
function checkBlacklist(tags: string[], blacklistTags: string[]): string[] {
  const foundBlacklistTags: string[] = [];
  const lowerBlacklistTags = blacklistTags.map(tag => tag.toLowerCase());
  
  for (const tag of tags) {
    if (lowerBlacklistTags.includes(tag.toLowerCase())) {
      foundBlacklistTags.push(tag);
    }
  }
  
  return foundBlacklistTags;
}

// Scrape gallery metadata from nhentai
async function scrapeMetadata(id: number): Promise<Metadata> {
  const url = `https://nhentai.net/g/${id}/`;
  const { data: html } = await axios.get<string>(url, { 
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 30000
  });
  const $: CheerioAPI = load(html);

  const title = $("h1.title span.pretty, h2.title span.pretty").first().text().trim() || `nhentai #${id}`;
  const featureImageSrc = $("#cover img").attr("data-src") || $("#cover img").attr("src") || "";

  const tags: string[] = [];
  const artists: string[] = [];
  const groups: string[] = [];
  const parodies: string[] = [];
  const languages: string[] = [];
  const categories: string[] = [];
  const characters: string[] = [];

  $("#tags .tag-container").each((_, el) => {
    const $el = $(el);
    const category = $el.find(".tag.type").text().replace(":", "").trim().toLowerCase();
    const names = $el.find("a.tag .name").map((_, nameEl) => $(nameEl).text().trim()).get() as string[];
    
    switch (category) {
      case "tags": case "tag": tags.push(...names); break;
      case "artists": case "artist": artists.push(...names); break;
      case "groups": case "group": groups.push(...names); break;
      case "parodies": case "parody": parodies.push(...names); break;
      case "languages": case "language": languages.push(...names); break;
      case "categories": case "category": categories.push(...names); break;
      case "characters": case "character": characters.push(...names); break;
    }
  });

  const totalPages = $("#thumbnail-container .thumb-container").length;
  return { title, featureImageSrc, totalPages, tags, artists, groups, parodies, languages, categories, characters };
}

// Scrape page image URL
async function scrapePageImage(id: number, pageNum: number): Promise<string> {
  const { data: html } = await axios.get<string>(`https://nhentai.net/g/${id}/${pageNum}`, { 
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 30000
  });
  const $: CheerioAPI = load(html);
  return $("#img").attr("data-src") || $("#img").attr("src") || "";
}

// Get or create entity (artist, tag, etc.) and return its ID
async function getOrCreateEntity(tableName: string, name: string): Promise<number | string> {
  const slug = normalizeSlug(name);
  
  // First try to find existing entity
  const { data: existing } = await supabase
    .from(tableName)
    .select('id')
    .eq('name', name)
    .single();
    
  if (existing) {
    return existing.id;
  }
  
  // Create new entity
  const { data: newEntity, error } = await supabase
    .from(tableName)
    .insert({ name, slug: slug || name })
    .select('id')
    .single();
    
  if (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw error;
  }
  
  return newEntity.id;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, blacklistTags = [] } = await request.json() as { id: number; blacklistTags?: string[] };
    
    if (!id || isNaN(id)) {
      throw new Error('Invalid `id`.');
    }

    const meta = await scrapeMetadata(id);
    
    // Check if content contains blacklisted tags
    const foundBlacklistTags = checkBlacklist(meta.tags, blacklistTags);
    if (foundBlacklistTags.length > 0) {
      throw new Error(`Post contains blacklisted tag(s): ${foundBlacklistTags.join(', ')}`);
    }

    // Create normalized slug from title
    const slug = normalizeSlug(meta.title);
    if (!slug) {
      throw new Error('Could not generate valid slug from title');
    }

    // Check if manga already exists
    const { data: existingManga } = await supabase
      .from('manga')
      .select('id')
      .eq('manga_id', id.toString())
      .single();

    if (existingManga) {
      throw new Error(`Manga with ID ${id} already exists`);
    }

    // Scrape all page images
    const pages: { page_number: number; image_url: string }[] = [];
    for (let p = 1; p <= meta.totalPages; p++) {
      const src = await scrapePageImage(id, p);
      pages.push({ page_number: p, image_url: src });
    }

    // Insert manga
    const { data: newManga, error: mangaError } = await supabase
      .from('manga')
      .insert({ 
        manga_id: id.toString(),
        title: meta.title, 
        feature_image_url: meta.featureImageSrc 
      })
      .select('id')
      .single();

    if (mangaError) {
      throw mangaError;
    }

    const mangaUuid = newManga.id;

    // Insert slug mapping
    const { error: slugError } = await supabase
      .from('slug_map')
      .insert({ 
        manga_id: mangaUuid, 
        slug: slug 
      });

    if (slugError) {
      throw slugError;
    }
    
    // Insert pages
    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages.map(p => ({ 
        manga_id: mangaUuid, 
        page_number: p.page_number, 
        image_url: p.image_url 
      })));

    if (pagesError) {
      throw pagesError;
    }

    // Handle tags and relationships
    const entityMappings = [
      { tableName: 'tags', joinTable: 'manga_tags', items: meta.tags, foreignKey: 'tag_id' },
      { tableName: 'artists', joinTable: 'manga_artists', items: meta.artists, foreignKey: 'artist_id' },
      { tableName: 'groups', joinTable: 'manga_groups', items: meta.groups, foreignKey: 'group_id' },
      { tableName: 'parodies', joinTable: 'manga_parodies', items: meta.parodies, foreignKey: 'parody_id' },
      { tableName: 'languages', joinTable: 'manga_languages', items: meta.languages, foreignKey: 'language_id' },
      { tableName: 'categories', joinTable: 'manga_categories', items: meta.categories, foreignKey: 'category_id' },
      { tableName: 'characters', joinTable: 'manga_characters', items: meta.characters, foreignKey: 'character_id' }
    ];

    for (const mapping of entityMappings) {
      if (mapping.items.length > 0) {
        for (const itemName of mapping.items) {
          try {
            // Get or create the entity
            const entityId = await getOrCreateEntity(mapping.tableName, itemName);
            
            // Create the relationship
            await supabase
              .from(mapping.joinTable)
              .insert({
                manga_id: mangaUuid,
                [mapping.foreignKey]: entityId
              });
          } catch (err) {
            console.error(`Error processing ${mapping.tableName} "${itemName}":`, err);
            // Continue with other items even if one fails
          }
        }
      }
    }

    return json({ success: true, mangaId: mangaUuid, slug });
    
  } catch (e: any) {
    console.error('Migration error:', e);
    return json({ success: false, message: e.message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json() as { id: number | string };
    
    // Find the manga by manga_id
    const { data: manga, error: findError } = await supabase
      .from('manga')
      .select('id')
      .eq('manga_id', id.toString())
      .single();

    if (findError || !manga) {
      throw new Error(`Manga with ID ${id} not found`);
    }

    const mangaUuid = manga.id;

    // Delete all related records (foreign key constraints should handle this automatically)
    // But we'll be explicit for clarity
    const deleteOperations = [
      supabase.from('pages').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_tags').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_artists').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_groups').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_parodies').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_languages').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_categories').delete().eq('manga_id', mangaUuid),
      supabase.from('manga_characters').delete().eq('manga_id', mangaUuid),
      supabase.from('slug_map').delete().eq('manga_id', mangaUuid),
    ];

    // Execute all delete operations
    await Promise.all(deleteOperations);

    // Finally delete the manga itself
    const { error: mangaDeleteError } = await supabase
      .from('manga')
      .delete()
      .eq('id', mangaUuid);

    if (mangaDeleteError) {
      throw mangaDeleteError;
    }

    return json({ success: true });
    
  } catch (e: any) {
    console.error('Deletion error:', e);
    return json({ success: false, message: e.message }, { status: 500 });
  }
};