/**
 * Optional Supabase Cloud Database Adapter for GolfMatch Pro
 * 
 * To enable Cloud Database persistence & multi-device sync:
 * 1. Create a free project at https://supabase.com
 * 2. Create a table 'games' with columns: id (text PRIMARY KEY), data (jsonb), updated_at (timestamp)
 * 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below or pass via environment variables.
 */

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
};

/**
 * Fetch games from Cloud Supabase Database (if configured)
 */
export async function fetchGamesFromCloud(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/games?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      },
    });
    if (res.ok) {
      const rows = await res.json();
      return rows.map((r: any) => r.data || r);
    }
  } catch (e) {
    console.warn('Supabase fetch error:', e);
  }
  return null;
}

/**
 * Sync game to Cloud Supabase Database (if configured)
 */
export async function syncGameToCloud(game: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/games`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: game.id,
        data: game,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Supabase sync error:', e);
    return false;
  }
}
