import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getCoachDb() {
  if (!_supabase) {
    const url = process.env.COACH_SUPABASE_URL;
    const key = process.env.COACH_SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('COACH_SUPABASE_URL / COACH_SUPABASE_SERVICE_KEY not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}
