import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SW_PATH = resolve(__dirname, '../../public/sw.js')
let swCode: string

beforeAll(() => {
  swCode = readFileSync(SW_PATH, 'utf-8')
})

function createTestEnv() {
  const listeners: Record<string, (...args: any[]) => void> = {}

  const store: Map<string, Map<string, any>> = new Map()
  store.set('ozbloom-v2', new Map())

  const getStore = (name: string) => {
    if (!store.has(name)) store.set(name, new Map())
    return store.get(name)!
  }

  const cacheObjects = new Map<string, any>()

  const getCache = (name: string) => {
    if (!cacheObjects.has(name)) {
      const s = getStore(name)
      cacheObjects.set(name, {
        addAll: vi.fn(async (urls: string[]) => {
          urls.forEach(u => s.set(u, {}))
        }),
        match: vi.fn(async (req: any) => {
          const url = typeof req === 'string' ? req : req?.url
          return s.get(url)
        }),
        put: vi.fn(async (req: any, res: any) => {
          const url = typeof req === 'string' ? req : req?.url
          s.set(url, res)
        }),
        keys: vi.fn(async () => Array.from(s.keys())),
      })
    }
    return cacheObjects.get(name)
  }

  const cachesMock = {
    open: vi.fn(async (name: string) => getCache(name)),
    match: vi.fn(async (req: any) => {
      const url = typeof req === 'string' ? req : req?.url
      for (const s of store.values()) {
        const found = s.get(url)
        if (found) return found
      }
      return undefined
    }),
    keys: vi.fn(async () => Array.from(store.keys())),
    delete: vi.fn(async (name: string) => store.delete(name)),
  }

  const selfMock = {
    addEventListener: vi.fn((event: string, handler: (...args: any[]) => void) => {
      listeners[event] = handler
    }),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  }

  const fetchMock = vi.fn()

  // Eval sw.js in a context where globals are our mocks
  ;(globalThis as any).self = selfMock
  ;(globalThis as any).caches = cachesMock
  ;(globalThis as any).fetch = fetchMock
  const fn = new Function('self', 'caches', swCode)
  fn(selfMock, cachesMock)

  return { listeners, selfMock, cachesMock, fetchMock, store }
}

describe('Service Worker', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  describe('install event', () => {
    it('caches STATIC assets excluding index.html', async () => {
      const p = new Promise<void>((resolve) => {
        env.listeners.install({
          waitUntil: (promise: Promise<any>) => promise.then(() => resolve()),
        })
      })
      await p

      const cache = await env.cachesMock.open('ozbloom-v2')
      expect(cache.addAll).toHaveBeenCalledWith([
        '/manifest.json',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
      ])
      expect(env.selfMock.skipWaiting).toHaveBeenCalled()
    })

    it('does not cache / (index.html)', async () => {
      const p = new Promise<void>((resolve) => {
        env.listeners.install({
          waitUntil: (promise: Promise<any>) => promise.then(() => resolve()),
        })
      })
      await p

      const cache = await env.cachesMock.open('ozbloom-v2')
      const addAllUrls = (cache.addAll as any).mock.calls[0][0]
      expect(addAllUrls).not.toContain('/')
    })
  })

  describe('activate event', () => {
    it('deletes old cache and claims clients', async () => {
      env.store.set('ozbloom-v1', new Map())

      const p = new Promise<void>((resolve) => {
        env.listeners.activate({
          waitUntil: (promise: Promise<any>) => promise.then(() => resolve()),
        })
      })
      await p

      expect(env.cachesMock.delete).toHaveBeenCalledWith('ozbloom-v1')
      expect(env.cachesMock.delete).not.toHaveBeenCalledWith('ozbloom-v2')
      expect(env.selfMock.clients.claim).toHaveBeenCalled()
    })
  })

  describe('fetch event — API routes', () => {
    it('forwards API requests to network without caching', async () => {
      const body = JSON.stringify({ flowers: [] })
      env.fetchMock.mockResolvedValue(new Response(body, {
        headers: { 'Content-Type': 'application/json' },
      }))

      const request = new Request('https://example.com/api/flowers/random?limit=8')
      let response: Response | undefined

      env.listeners.fetch({
        request,
        respondWith: vi.fn((r: Response | Promise<Response>) => {
          if (r instanceof Promise) {
            r.then(res => { response = res })
          } else {
            response = r
          }
        }),
      })

      await vi.waitFor(() => {
        expect(env.fetchMock).toHaveBeenCalledWith(request)
      })
    })
  })

  describe('fetch event — static assets', () => {
    it('caches non-HTML GET responses and returns them', async () => {
      const resBody = 'console.log("test")'
      env.fetchMock.mockResolvedValue(new Response(resBody, {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' },
      }))

      const request = new Request('https://example.com/assets/app.js')
      let response: Response | undefined

      env.listeners.fetch({
        request,
        respondWith: vi.fn((r: any) => {
          if (r instanceof Promise) r.then(res => { response = res })
          else response = r
        }),
      })

      await vi.waitFor(() => {
        expect(response).toBeDefined()
      })

      const text = await (response as Response).text()
      expect(text).toBe(resBody)
    })

    it('does not cache text/html responses', async () => {
      env.fetchMock.mockResolvedValue(new Response('<html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }))

      const request = new Request('https://example.com/')
      let response: Response | undefined

      env.listeners.fetch({
        request,
        respondWith: vi.fn((r: any) => {
          if (r instanceof Promise) r.then(res => { response = res })
          else response = r
        }),
      })

      await vi.waitFor(() => {
        expect(response).toBeDefined()
      })

      const cache = await env.cachesMock.open('ozbloom-v2')
      const cached = await cache.match(request)
      expect(cached).toBeUndefined()
    })

    it('handles failed API fetch gracefully', async () => {
      env.fetchMock.mockRejectedValue(new Error('Network error'))

      const request = new Request('https://example.com/api/flowers/random')
      let response: Response | undefined

      env.listeners.fetch({
        request,
        respondWith: vi.fn((r: any) => {
          if (r instanceof Promise) r.then(res => { response = res })
          else response = r
        }),
      })

      await vi.waitFor(() => {
        expect(response).toBeDefined()
      })

      const body = await (response as Response).json()
      expect(body).toEqual({ flowers: [] })
    })
  })
})
