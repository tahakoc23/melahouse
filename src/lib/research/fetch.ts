/**
 * Kaynak sayfalarını çeker.
 * 1) Doğrudan (Vercel fra1) dener.
 * 2) 403/418/429 alırsa Supabase Edge Function "market-fetch" üzerinden tekrar dener
 *    (farklı çıkış IP'si; sadece izinli alan adları, service role ile korunur).
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

export const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.6,en;q=0.5',
  'Cache-Control': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
}

const TIMEOUT_MS = 15000
const BLOCKED = new Set([401, 403, 418, 429, 503])

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
  }
}

async function direct(url: string, headers?: Record<string, string>): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers: { ...BROWSER_HEADERS, ...headers }, signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new FetchError(`HTTP ${res.status}`, res.status)
    return await res.text()
  } catch (err) {
    if (err instanceof FetchError) throw err
    if (err instanceof Error && err.name === 'AbortError') throw new FetchError('zaman aşımı')
    throw new FetchError(err instanceof Error ? err.message : 'bağlantı hatası')
  } finally {
    clearTimeout(timer)
  }
}

async function viaEdge(url: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new FetchError('yedek bağlantı yapılandırılmamış')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS + 5000)
  try {
    const res = await fetch(`${base}/functions/v1/market-fetch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) throw new FetchError(`yedek bağlantı HTTP ${res.status}`, res.status)
    const data = (await res.json()) as { status?: number; body?: string; error?: string }
    if (data.error) throw new FetchError(data.error, data.status)
    if (!data.status || data.status >= 400) throw new FetchError(`HTTP ${data.status}`, data.status)
    return data.body || ''
  } catch (err) {
    if (err instanceof FetchError) throw err
    if (err instanceof Error && err.name === 'AbortError') throw new FetchError('zaman aşımı')
    throw new FetchError(err instanceof Error ? err.message : 'yedek bağlantı hatası')
  } finally {
    clearTimeout(timer)
  }
}

/** Önce doğrudan, engellenirse Edge üzerinden. */
export async function fetchPage(url: string, opts: { edgeFallback?: boolean; headers?: Record<string, string> } = {}): Promise<string> {
  try {
    return await direct(url, opts.headers)
  } catch (err) {
    const blocked = err instanceof FetchError && err.status !== undefined && BLOCKED.has(err.status)
    if (opts.edgeFallback !== false && blocked) {
      try {
        return await viaEdge(url)
      } catch (edgeErr) {
        const status = edgeErr instanceof FetchError ? edgeErr.status : undefined
        throw new FetchError(status && BLOCKED.has(status) ? 'site erişimi engelliyor' : 'erişilemedi', status)
      }
    }
    if (err instanceof FetchError && err.status && BLOCKED.has(err.status)) {
      throw new FetchError('site erişimi engelliyor', err.status)
    }
    throw err
  }
}

/** HTML içine gömülü JSON'da `key` geçen konumu saran nesneyi çıkarır. */
export function extractEnclosingObject(text: string, index: number): Record<string, unknown> | null {
  let depth = 0
  let start = index
  for (; start > 0; start--) {
    const c = text[start]
    if (c === '}') depth++
    else if (c === '{') {
      if (depth === 0) break
      depth--
    }
  }
  let end = start
  let d = 0
  let inStr = false
  for (; end < text.length; end++) {
    const c = text[end]
    if (inStr) {
      if (c === '\\') end++
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') d++
    else if (c === '}') {
      d--
      if (d === 0) break
    }
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

export function findJsonObjects(text: string, key: string, limit = 150): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const seen = new Set<number>()
  let idx = text.indexOf(key)
  while (idx !== -1 && out.length < limit) {
    const obj = extractEnclosingObject(text, idx)
    if (obj) {
      const sig = JSON.stringify(obj).length * 31 + idx
      if (!seen.has(sig)) {
        seen.add(sig)
        out.push(obj)
      }
    }
    idx = text.indexOf(key, idx + key.length)
  }
  return out
}

/** "1.299,90 TL" -> 1299.9 ; "₺1,599.99" (İngilizce biçim) -> 1599.99 ; sayı ise olduğu gibi */
export function parsePrice(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const s = String(val ?? '').replace(/\s/g, '')
  const m = s.match(/\d[\d.,]*/)
  if (!m) return 0
  let tok = m[0].replace(/[.,]$/, '')
  const lastComma = tok.lastIndexOf(',')
  const lastDot = tok.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // Hangisi sondaysa ondalık ayracıdır
    tok = lastComma > lastDot ? tok.replace(/\./g, '').replace(',', '.') : tok.replace(/,/g, '')
  } else if (lastComma > -1) {
    // "1,599" binlik mi "599,90" ondalık mı? Virgülden sonra 2 hane = ondalık
    tok = /,\d{1,2}$/.test(tok) ? tok.replace(',', '.') : tok.replace(/,/g, '')
  } else if (lastDot > -1) {
    tok = /\.\d{1,2}$/.test(tok) && !/^\d{1,3}(\.\d{3})+$/.test(tok) ? tok : tok.replace(/\./g, '')
  }
  const n = parseFloat(tok)
  return Number.isFinite(n) ? n : 0
}

export function absoluteUrl(href: string | undefined | null, base: string): string {
  if (!href) return ''
  try {
    return new URL(href, base).toString()
  } catch {
    return ''
  }
}
