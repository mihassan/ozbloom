// Minimal Worker stub — real API routes added in Phase 3
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not implemented yet' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Static assets served by Cloudflare via [assets] binding in wrangler.toml
    return new Response('Not found', { status: 404 })
  },
}
