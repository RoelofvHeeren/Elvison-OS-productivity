import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getCoachDb() {
  if (!_supabase) {
    const url = process.env.ELVISON_SUPABASE_URL;
    const key = process.env.ELVISON_SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('ELVISON_SUPABASE_URL / ELVISON_SUPABASE_SERVICE_KEY not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}
