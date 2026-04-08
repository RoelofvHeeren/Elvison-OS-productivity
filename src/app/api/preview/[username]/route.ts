import { NextRequest, NextResponse } from 'next/server';
import { getCoachDb } from '@/lib/coach-outreach/supabase';
import { getTransformationsForAudience } from '@/lib/coach-outreach/transformations';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

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

      // Ensure images object exists
      if (!preview.images) preview.images = {};
      if (!preview.images.transformations) {
        preview.images.transformations = getTransformationsForAudience(
          preview.profile?.targetAudience
        );
      }

      return NextResponse.json(preview);
    }

    // No cached data — return 404 for now
    // (preview generation runs from the outreach pipeline, not on-demand here)
    return NextResponse.json(
      { error: 'Preview not found for this username' },
      { status: 404 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[preview API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
