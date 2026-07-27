// Proxies OpenStreetMap's Nominatim search API for address lookup — free,
// no API key, no billing account. Routed through an Edge Function (rather
// than called directly from the app) so we can set the User-Agent header
// Nominatim's usage policy requires, and so a slow/misbehaving client can't
// hammer their public instance directly.
// Deploy with:
//   supabase functions deploy places-autocomplete
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'Invalid session' }, 401);
    }

    const { query } = await req.json().catch(() => ({}));
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return json({ results: [] });
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('countrycodes', 'gh');
    url.searchParams.set('limit', '6');

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim's usage policy requires a real identifying User-Agent.
        'User-Agent': 'GoCarHub/1.0 (https://gocar-hub.vercel.app)',
      },
    });
    if (!res.ok) {
      return json({ error: `Location search failed (${res.status})` }, 502);
    }
    const data = await res.json();
    const results = (data ?? []).map((r: any) => ({
      address: r.display_name as string,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }));
    return json({ results });
  } catch (err) {
    console.error(err);
    return json({ error: 'Unexpected error searching for a location', debug: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
