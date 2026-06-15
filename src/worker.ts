export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
}

const ALLOWED_ORIGINS = ['https://ozbloom.mihassan.com', 'https://ozbloom.mihassan.workers.dev']

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, status = 200, cors?: Record<string, string>): Response {
  const cacheControl = status < 400 ? 'public, max-age=60' : 'no-store'
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      ...cors,
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request.headers.get('Origin'))

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    if (url.pathname === '/api/flowers/random') {
      const limitParam = url.searchParams.get('limit')
      let limit: number
      if (limitParam === null) {
        limit = 8
      } else {
        limit = parseInt(limitParam, 10)
        if (isNaN(limit) || limit < 1) {
          return json({ error: 'Invalid limit parameter' }, 400, cors)
        }
      }
      limit = Math.min(limit, 50)

      if (!env.DB) return json({ error: 'Database unavailable' }, 503, cors)

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

        if (!result.success) return json({ error: 'Database query failed' }, 500, cors)
        return json({ flowers: result.results }, 200, cors)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Internal server error'
        return json({ error: message }, 500, cors)
      }
    }

    if (url.pathname === '/api/health') {
      return json({ status: 'ok' }, 200, cors)
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404, cors)
    }

    return new Response('Not found', { status: 404 })
  },
}
