'use strict';
/**
 * preview_generator.js
 * Generates a full week of personalised content for a coach from their bio.
 * Output is cached in Supabase (coach_previews table) so repeat visits are instant.
 */

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
const APIFY_KEY = process.env.APIFY_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const { classifyImages } = require('./image_classifier');

async function imagen(prompt, aspectRatio = '16:9') {
  if (!GOOGLE_AI_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio, safetySetting: 'block_low_and_above' }
        })
      }
    );
    const json = await res.json();
    const b64 = json.predictions?.[0]?.bytesBase64Encoded;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch (e) {
    console.error('[imagen] failed:', e.message);
    return null;
  }
}

/**
 * Claude via Anthropic API — primary text generator for content + copy.
 * Falls back to Gemini if no Anthropic key is set.
 */
async function claude(prompt) {
  if (ANTHROPIC_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const json = await res.json();
    const text = json.content?.[0]?.text?.trim();
    if (!text) throw new Error(`Claude error: ${json.error?.message || 'empty response'}`);
    return text;
  }

  // Fallback: Gemini 2.5 Flash
  const GEMINI_KEY = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
      }),
    }
  );
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error(`Gemini error: ${JSON.stringify(json.error || json).slice(0,200)}`);
  return text;
}

/**
 * Robust JSON parser — strips markdown fences, handles trailing commas,
 * and falls back to extracting the largest valid JSON block.
 */
function stripMarkdown(obj) {
  if (typeof obj === 'string') return obj.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1');
  if (Array.isArray(obj)) return obj.map(stripMarkdown);
  if (obj && typeof obj === 'object') { const r = {}; for (const k of Object.keys(obj)) r[k] = stripMarkdown(obj[k]); return r; }
  return obj;
}

function parseJSON(text) {
  // Strip markdown fences
  let clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();

  // Try direct parse first
  try { return JSON.parse(clean); } catch {}

  // Try extracting first complete JSON array or object
  for (const pattern of [/(\[[\s\S]*\])/g, /(\{[\s\S]*\})/g]) {
    const matches = [...clean.matchAll(pattern)];
    for (const m of matches) {
      try { return JSON.parse(m[1]); } catch {}
    }
  }

  // Last resort: truncate at last clean boundary and close
  const lastBrace = Math.max(clean.lastIndexOf('},'), clean.lastIndexOf('}]'));
  if (lastBrace > 0) {
    try {
      const truncated = clean.slice(0, lastBrace + 1) + (clean.includes('[') ? ']' : '}');
      return JSON.parse(truncated);
    } catch {}
  }

  throw new Error(`Could not parse JSON from response (${clean.length} chars)`);
}

/**
 * Download an image URL and return a base64 data URL.
 * Instagram CDN URLs expire in hours — converting to base64 makes them permanent in cache.
 */
async function urlToDataUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; preview-bot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return url; // keep original on failure
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = await res.arrayBuffer();
    return `data:${contentType.split(';')[0]};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return url; // fallback to original URL
  }
}

async function scrapeInstagramProfile(username) {
  if (!APIFY_KEY) return { profilePic: null, posts: [] };
  try {
    const { ApifyClient } = require('apify-client');
    const client = new ApifyClient({ token: APIFY_KEY });

    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: 'details',
      resultsLimit: 6,
    }, { waitSecs: 60 });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const profile = items[0];
    if (!profile) return { profilePic: null, posts: [] };

    const rawPosts = (profile.latestPosts || profile.posts || [])
      .slice(0, 6)
      .map(p => p.displayUrl || p.imageUrl)
      .filter(Boolean);

    // Download all images immediately — converts expiring CDN URLs to permanent base64
    console.log(`[preview] Downloading ${rawPosts.length} images to prevent CDN expiry...`);
    const [profilePicData, ...postData] = await Promise.all([
      profile.profilePicUrlHD || profile.profilePicUrl
        ? urlToDataUrl(profile.profilePicUrlHD || profile.profilePicUrl)
        : Promise.resolve(null),
      ...rawPosts.map(urlToDataUrl),
    ]);

    return {
      profilePic: profilePicData || null,
      posts: postData,
      fullName: profile.fullName || null,
      followers: profile.followersCount || null,
    };
  } catch (e) {
    console.error('[scrapeProfile] failed:', e.message);
    return { profilePic: null, posts: [] };
  }
}

async function generatePreview(contact) {
  const bio = contact.bio || '';
  const username = contact.ig_username;
  const fullName = contact.full_name || username;
  const firstName = fullName.split(' ')[0];
  const followers = (contact.followers || 0).toLocaleString();
  const category = contact.business_category || 'fitness coach';

  // Step 1: Extract profile intelligence from bio
  const profileRaw = await claude(`
Analyse this Instagram fitness coach's bio and extract key information.

Bio: "${bio}"
Username: @${username}
Name: ${fullName}
Category: ${category}
Followers: ${followers}

Return JSON only:
{
  "firstName": "...",
  "niche": "one-line niche description e.g. 'online fat loss coaching for busy moms'",
  "targetAudience": "who they coach",
  "tone": "casual|professional|motivational|educational",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "transformation": "what result they help clients achieve",
  "uniqueAngle": "what makes them different based on bio",
  "colorVibe": "one word: bold|clean|warm|dark|minimal",
  "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4"]
}`);

  const profile = stripMarkdown(parseJSON(profileRaw));
  profile.firstName = profile.firstName || firstName;

  // Step 2: Generate 7-day content plan
  const planRaw = await claude(`
You are a content strategist for ${profile.firstName}, a ${profile.niche} coach.
Target audience: ${profile.targetAudience}
Content pillars: ${profile.contentPillars.join(', ')}
Transformation promise: ${profile.transformation}

Generate a 7-day Instagram content plan. Return JSON only:
[
  {
    "day": 1,
    "dayName": "Monday",
    "format": "reel",
    "hook": "compelling hook text (max 8 words)",
    "topic": "specific topic",
    "caption": "full 150-word caption with CTA",
    "script": "60-second video script with [PAUSE], [POINT TO CAMERA] stage directions",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
]
Formats to use across 7 days: reel, carousel, tweet_style, story_poll, reel, carousel, reel
Make each piece directly relevant to ${profile.targetAudience}.`);

  const contentPlan = stripMarkdown(parseJSON(planRaw));

  // Step 3: Generate carousel slides for the 2 carousel days
  const carouselDays = contentPlan.filter(d => d.format === 'carousel');
  for (const day of carouselDays) {
    const slidesRaw = await claude(`
Create a 6-slide Instagram carousel for ${profile.firstName}'s audience: ${profile.targetAudience}

Topic: ${day.topic}
Tone: ${profile.tone}

Return JSON only:
[
  { "slide": 1, "type": "hook", "headline": "...", "subtext": "..." },
  { "slide": 2, "type": "problem", "headline": "...", "subtext": "..." },
  { "slide": 3, "type": "insight", "headline": "...", "subtext": "..." },
  { "slide": 4, "type": "insight", "headline": "...", "subtext": "..." },
  { "slide": 5, "type": "insight", "headline": "...", "subtext": "..." },
  { "slide": 6, "type": "cta", "headline": "...", "subtext": "follow @${username} for more" }
]`);
    day.slides = stripMarkdown(parseJSON(slidesRaw));
  }

  // Step 4: Generate website copy
  const websiteRaw = await claude(`
Write landing page copy for ${profile.firstName}'s online coaching website.
Niche: ${profile.niche}
Target audience: ${profile.targetAudience}
Transformation: ${profile.transformation}
Unique angle: ${profile.uniqueAngle}

Return JSON only:
{
  "headline": "bold 6-8 word hero headline",
  "subheadline": "one sentence expanding the promise",
  "about": "2-sentence about section written in first person",
  "service1": { "name": "...", "description": "...", "price": "..." },
  "service2": { "name": "...", "description": "...", "price": "..." },
  "testimonial1": { "quote": "realistic client result quote", "name": "Sarah M.", "result": "lost 18lbs in 10 weeks" },
  "testimonial2": { "quote": "realistic client result quote", "name": "Jake T.", "result": "gained 12lbs muscle in 3 months" },
  "cta": "book a free call button text"
}`);

  const website = stripMarkdown(parseJSON(websiteRaw));

  // Step 5: Scrape their real Instagram photos + profile pic
  console.log(`[preview] Scraping @${username} profile photos...`);
  const igProfile = await scrapeInstagramProfile(username);

  // Update profile with fresher data if available
  if (igProfile.fullName) profile.firstName = igProfile.fullName.split(' ')[0];
  if (igProfile.followers) profile.followers = igProfile.followers.toLocaleString();

  // Step 6: Classify scraped images — filter out text overlays, bad crops, promotional
  let classified = { hero: [], about: [], reelBgs: [], gallery: [] };
  if (igProfile.posts.length) {
    classified = await classifyImages(igProfile.posts);
  }

  // Step 7: Generate Imagen images to fill gaps where we don't have usable real photos
  const heroStyle = { bold: 'dark dramatic cinematic', clean: 'bright airy minimal', warm: 'golden warm natural', dark: 'moody dark atmospheric', minimal: 'clean white studio' }[profile.colorVibe] || 'professional';
  const nicheKeywords = `${profile.niche}, ${profile.targetAudience}`;

  const needHero    = !classified.hero.length;
  const needReelBgs = Math.max(0, 3 - classified.reelBgs.length);

  console.log(`[preview] Generating hero and reel backgrounds with Imagen…`);
  const [heroImageGen, ...reelBgImagesGen] = await Promise.all([
    needHero ? imagen(`${heroStyle} fitness coaching lifestyle, ${nicheKeywords}, high quality photography. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WATERMARKS, NO CAPTIONS ANYWHERE IN THE IMAGE. The image must be completely clean with zero text of any kind.`, '16:9') : Promise.resolve(null),
    ...Array(needReelBgs).fill(null).map(() =>
      imagen(`${heroStyle} fitness motivation vertical background, ${profile.niche}, professional. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WATERMARKS, NO CAPTIONS ANYWHERE IN THE IMAGE.`, '9:16')
    ),
  ]);

  // Merge: classified real photos first, Imagen fills the rest
  const heroImg    = classified.hero[0]?.url    || heroImageGen;
  const aboutImg   = classified.about[0]?.url   || igProfile.profilePic;
  const reelBgs    = [
    ...classified.reelBgs.slice(0, 3).map(r => r.url),
    ...reelBgImagesGen,
  ].filter(Boolean);
  const gallery    = classified.gallery.map(r => r.url);

  const images = {
    hero:       heroImg,
    profilePic: igProfile.profilePic,
    aboutPhoto: aboutImg,
    reelBgs,
    gallery,
    posts:      igProfile.posts,
    classified: classified.all,
  };

  return { profile, contentPlan, website, images, generatedAt: new Date().toISOString() };
}

// In-memory cache: stores pre-serialized JSON strings to avoid re-serialization on every request
const _memCache = new Map(); // username → { json: string, slimJson: string, cachedAt: number }

function buildSlimJson(fullJson) {
  const full = JSON.parse(fullJson);
  return JSON.stringify({
    ...full,
    images: full.images ? {
      hero:       full.images.hero,
      profilePic: full.images.profilePic,
      aboutPhoto: full.images.aboutPhoto,
    } : full.images,
  });
}

async function getOrGeneratePreview(db, contact) {
  const username = contact.ig_username;
  const TTL = 7 * 24 * 3600 * 1000;

  // 1. In-memory cache — return pre-built slim JSON string (zero parse/serialize)
  const mem = _memCache.get(username);
  if (mem && (Date.now() - mem.cachedAt) < TTL) {
    return { __slimJson: mem.slimJson };
  }

  // 2. Supabase cache
  const { data: cached } = await db
    .from('coach_previews')
    .select('preview_data, generated_at')
    .eq('ig_username', username)
    .single();

  if (cached?.preview_data) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    if (age < TTL) {
      const slimJson = buildSlimJson(cached.preview_data);
      _memCache.set(username, { json: cached.preview_data, slimJson, cachedAt: Date.now() });
      return { __slimJson: slimJson };
    }
  }

  // 3. Generate fresh
  const preview = await generatePreview(contact);
  const json = JSON.stringify(preview);
  const slimJson = buildSlimJson(json);

  await db.from('coach_previews').upsert({
    ig_username: username,
    preview_data: json,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'ig_username' });

  _memCache.set(username, { json, slimJson, cachedAt: Date.now() });
  return { __slimJson: slimJson };
}

// Pre-warm in-memory cache from Supabase at server startup
async function warmPreviewCache(db) {
  try {
    const { data: rows } = await db
      .from('coach_previews')
      .select('ig_username, preview_data, generated_at')
      .neq('ig_username', '__transformation_images_v2__');
    if (!rows) return;
    const cutoff = 7 * 24 * 3600 * 1000;
    let count = 0;
    for (const row of rows) {
      if (!row.preview_data) continue;
      const age = Date.now() - new Date(row.generated_at).getTime();
      if (age < cutoff) {
        const slimJson = buildSlimJson(row.preview_data);
        _memCache.set(row.ig_username, { json: row.preview_data, slimJson, cachedAt: Date.now() });
        count++;
      }
    }
    if (count) console.log(`[preview-cache] Pre-warmed ${count} preview(s) into memory`);
  } catch (e) {
    console.warn('[preview-cache] Warm failed:', e.message);
  }
}

module.exports = { getOrGeneratePreview, warmPreviewCache, imagen };
