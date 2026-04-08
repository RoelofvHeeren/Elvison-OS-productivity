import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getCoachDb } from '@/lib/coach-outreach/supabase';
import { getTransformationsForAudience } from '@/lib/coach-outreach/transformations';

// Read the template once at startup
const TEMPLATE_PATH = join(process.cwd(), 'src/lib/coach-outreach/landing-template.html');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  let injectedData = null;

  try {
    const db = getCoachDb();
    const { data: cached } = await db
      .from('coach_previews')
      .select('preview_data')
      .eq('ig_username', username)
      .single();

    if (cached?.preview_data) {
      const preview = typeof cached.preview_data === 'string'
        ? JSON.parse(cached.preview_data)
        : cached.preview_data;

      if (!preview.images) preview.images = {};
      if (!preview.images.transformations) {
        preview.images.transformations = getTransformationsForAudience(
          preview.profile?.targetAudience
        );
      }
      injectedData = preview;
    }
  } catch {
    // DB not available or no cached data — serve template without injection
  }

  const script = injectedData
    ? `<script>window.__PREVIEW_DATA__ = ${JSON.stringify(injectedData)};</script>\n`
    : '';

  const calendlyLink = process.env.CALENDLY_LINK || '';

  let html = readFileSync(TEMPLATE_PATH, 'utf8')
    .replace(/%%CALENDLY_LINK%%/g, calendlyLink)
    .replace('</head>', `${script}</head>`);

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
