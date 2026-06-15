export interface Env {
  DB: D1Database
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200): Response {
  const cacheControl = status < 400 ? 'public, max-age=60' : 'no-store'
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      ...CORS_HEADERS,
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    if (url.pathname === '/api/flowers/random') {
      const limitParam = url.searchParams.get('limit')
      const limit = Math.min(Math.max(parseInt(limitParam ?? '8', 10) || 8, 1), 50)

      if (!env.DB) return json({ error: 'Database unavailable' }, 503)

      try {
        const result = await env.DB.prepare(
          `SELECT id, common_name, scientific_name, region, bloom_season,
                  color, habitat, conservation_status, short_description,
                  description, image_url, image_alt
           FROM flowers
           ORDER BY RANDOM()
           LIMIT ?`,
        )
          .bind(limit)
          .all()

        if (!result.success) return json({ error: 'Database query failed' }, 500)
        return json({ flowers: result.results })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Internal server error'
        return json({ error: message }, 500)
      }
    }

    if (url.pathname === '/api/health') {
      return json({ status: 'ok' })
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404)
    }

    // Static assets served by Cloudflare via [assets] binding
    return new Response('Not found', { status: 404 })
  },
}
