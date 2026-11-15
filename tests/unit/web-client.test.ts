import { describe, expect, it } from 'bun:test'
import { createApi } from '../../resources/functions/notes/api'
import { pagedUrl } from '../../resources/functions/notes/client'
import { webSession } from '../../resources/functions/notes/session'

describe('client', () => {
  it('asks the paginated index routes for everything', () => {
    expect(pagedUrl('/api/notes')).toBe('/api/notes?per_page=1000')
    expect(pagedUrl('/api/areas')).toBe('/api/areas?per_page=1000')
    expect(pagedUrl('/api/notes?per_page=5')).toBe('/api/notes?per_page=5')
    expect(pagedUrl('/api/notes/4')).toBe('/api/notes/4')
    expect(pagedUrl('/api/lists/today?today=2026-10-30')).toBe('/api/lists/today?today=2026-10-30')
  })

  it('keeps the token in memory when storage throws', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
    const session = webSession(broken)
    expect(session.token()).toBeNull()
    session.save('abc')
    expect(session.token()).toBe('abc')
    session.save(null)
    expect(session.token()).toBeNull()
  })

  it('persists the token through storage', () => {
    const data = new Map<string, string>()
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
    webSession(storage).save('tok')
    expect(webSession(storage).token()).toBe('tok')
    webSession(storage).save(null)
    expect(webSession(storage).token()).toBeNull()
  })

  it('asks for a fresh CSRF token once when a sign-in is refused', async () => {
    // The server's token changed after the client read one (it expired, or another window signed out).
    let minted = 0
    let current = ''
    const seen: string[] = []
    const http = (async (input: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>
      if (String(input).endsWith('/me')) {
        current = `${++minted}`.padStart(8, 'a')
        return new Response('{}', { status: 401, headers: { 'set-cookie': `X-CSRF-Token=${current}; Path=/` } })
      }
      seen.push(headers['x-csrf-token'] ?? '')
      // What the client read first is stale by the time it posts.
      if (seen.length === 1) { current = 'stale-on-the-server'; return new Response('{"error":"Forbidden"}', { status: 403 }) }
      return headers['x-csrf-token'] === current && headers.cookie === `X-CSRF-Token=${current}`
        ? new Response('{"token":"t","user":{"id":1}}', { status: 200 })
        : new Response('{"error":"Forbidden"}', { status: 403 })
    }) as unknown as typeof fetch
    let saved: string | null = null
    const api = createApi({ base: 'https://notes.test', fetch: http, session: { token: () => saved, save: (token) => { saved = token } } })
    await api.signIn('a@notes.test', 'password-1')
    expect(seen).toEqual(['aaaaaaa1', 'aaaaaaa2'])
    expect(saved).toBe('t')
  })

  it('reports a refusal that a fresh token does not cure', async () => {
    const http = (async (input: string) => String(input).endsWith('/me')
      ? new Response('{}', { status: 401, headers: { 'set-cookie': 'X-CSRF-Token=abcdef01; Path=/' } })
      : new Response('{"error":"Forbidden"}', { status: 403 })) as unknown as typeof fetch
    const api = createApi({ base: 'https://notes.test', fetch: http, session: { token: () => null, save: () => {} } })
    await expect(api.signIn('a@notes.test', 'password-1')).rejects.toThrow('Forbidden')
  })
})
