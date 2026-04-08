'use strict';
/**
 * image_classifier.js
 * Uses Gemini Vision to classify scraped Instagram images before use.
 *
 * For each image, returns:
 *   type          — what kind of content it is
 *   has_text      — burned-in captions/watermarks (reject for landing pages)
 *   face_visible  — person's face is clearly visible
 *   crop_focus    — where the main subject is in the frame
 *   quality       — lighting/composition quality
 *   suitable_for  — array of valid use cases
 *   reject        — hard no for landing page use
 */

const GEMINI_KEY = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;

const CLASSIFICATION_PROMPT = `You are a content director filtering Instagram fitness coach photos for use on a professional landing page.

Analyze this image and return ONLY valid JSON (no markdown, no explanation):
{
  "type": "transformation|talking_head|workout_action|workout_static|lifestyle|client_result|promotional|text_graphic|other",
  "has_text": <boolean>,
  "face_visible": <boolean>,
  "face_prominent": <boolean>,
  "crop_focus": "face|upper_body|full_body|legs_below_waist|gym_equipment|landscape|group|other",
  "quality": "high|medium|low",
  "suitable_for": ["hero_bg", "about_section", "gallery"],
  "reject": <boolean>,
  "reject_reason": "<string or null>"
}

Type definitions:
- transformation: physique before/after, progress shots
- talking_head: person looking at camera, face is main subject — great for hero/about
- workout_action: mid-exercise, lifting, moving
- workout_static: posed in gym, equipment visible
- lifestyle: food, travel, candid daily life
- client_result: showing a client's result/transformation
- promotional: ads, product shots, sponsored content
- text_graphic: quote cards, infographics, motivational text on image

Reject (set reject=true) if ANY of these are true:
- has_text is true (burned-in captions, watermarks, quote overlays, Instagram handles as graphics)
- quality is "low" (blurry, dark, grainy)
- crop_focus is "legs_below_waist" (awkward partial body shot, inappropriate cropping)
- type is "text_graphic" or "promotional"
- image contains multiple people with no clear subject (group shot)

suitable_for rules:
- "hero_bg": high quality, no text, ideally talking_head or lifestyle or workout_action, face NOT prominent (we overlay our own content)
- "about_section": face_visible=true, face_prominent=true, no text, high or medium quality
- "gallery": no text, medium or high quality, any type except promotional/text_graphic`;

/**
 * Fetch an image URL and return base64 + mimeType for Gemini inline data.
 */
async function fetchImageAsBase64(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; preview-bot/1.0)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  const buf = await res.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  return { mimeType, b64 };
}

/**
 * Classify a single image URL using Gemini Vision.
 */
async function classifyImage(url) {
  if (!GEMINI_KEY) {
    // No key — return a permissive default so nothing breaks
    return { url, type: 'unknown', has_text: false, face_visible: false, face_prominent: false,
      crop_focus: 'other', quality: 'medium', suitable_for: ['gallery'], reject: false, reject_reason: null };
  }

  try {
    const { mimeType, b64 } = await fetchImageAsBase64(url);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: b64 } },
              { text: CLASSIFICATION_PROMPT },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
        }),
      }
    );

    const json = await res.json();
    // Gemini 2.5 Pro may block image content — fall back to permissive default
    const finishReason = json.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
      return { url, type: 'unknown', has_text: false, face_visible: false, face_prominent: false,
        crop_focus: 'other', quality: 'medium', suitable_for: ['gallery'], reject: false, reject_reason: `gemini_${finishReason.toLowerCase()}` };
    }
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      const errMsg = json.error?.message || finishReason || 'empty_response';
      throw new Error(errMsg);
    }

    // Strip any accidental markdown fences
    const clean = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const classification = JSON.parse(clean);
    return { url, ...classification };
  } catch (e) {
    console.warn(`[classifier] failed for ${url.slice(-40)}: ${e.message}`);
    // On error, allow the image but don't recommend for hero/about
    return { url, type: 'unknown', has_text: false, face_visible: false, face_prominent: false,
      crop_focus: 'other', quality: 'medium', suitable_for: ['gallery'], reject: false, reject_reason: 'classification_failed' };
  }
}

/**
 * Classify an array of image URLs in parallel (capped at 4 concurrent).
 * Returns classified images, filtered by use case.
 */
async function classifyImages(urls) {
  if (!urls || !urls.length) return { all: [], hero: [], about: [], gallery: [], reelBgs: [] };

  console.log(`[classifier] Classifying ${urls.length} images…`);

  // Process in batches of 4 to avoid rate limits
  const results = [];
  for (let i = 0; i < urls.length; i += 4) {
    const batch = urls.slice(i, i + 4);
    const classified = await Promise.all(batch.map(classifyImage));
    results.push(...classified);
  }

  const usable = results.filter(r => !r.reject);

  const hero = usable
    .filter(r => r.suitable_for?.includes('hero_bg'))
    .sort((a, b) => qualityScore(b) - qualityScore(a));

  const about = usable
    .filter(r => r.suitable_for?.includes('about_section'))
    .sort((a, b) => qualityScore(b) - qualityScore(a));

  // For reel backgrounds: no face prominent (we overlay text), high quality
  const reelBgs = usable
    .filter(r => !r.face_prominent && r.quality !== 'low' && !r.has_text)
    .sort((a, b) => qualityScore(b) - qualityScore(a));

  const gallery = usable
    .filter(r => r.suitable_for?.includes('gallery'))
    .sort((a, b) => qualityScore(b) - qualityScore(a));

  const rejected = results.filter(r => r.reject);
  console.log(`[classifier] ${usable.length} usable, ${rejected.length} rejected (text overlay / quality / cropping)`);
  if (rejected.length) {
    rejected.forEach(r => console.log(`  ✕ ${r.reject_reason} — ${r.url?.slice(-50)}`));
  }

  return { all: results, usable, hero, about, reelBgs, gallery };
}

function qualityScore(r) {
  let s = 0;
  if (r.quality === 'high') s += 3;
  if (r.quality === 'medium') s += 1;
  if (r.face_visible) s += 1;
  if (['talking_head', 'lifestyle', 'transformation'].includes(r.type)) s += 1;
  return s;
}

module.exports = { classifyImages, classifyImage };
