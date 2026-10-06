import { promises as dns } from 'node:dns'
import net from 'node:net'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const ALLOWED_PORTS = new Set(['', '80', '443'])

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0)
}

function inCidr4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],        // "this" network
  ['10.0.0.0', 8],       // private
  ['100.64.0.0', 10],    // CGNAT
  ['127.0.0.0', 8],      // loopback
  ['169.254.0.0', 16],   // link-local / cloud metadata (169.254.169.254)
  ['172.16.0.0', 12],    // private
  ['192.0.0.0', 24],     // IETF protocol assignments
  ['192.168.0.0', 16],   // private
  ['198.18.0.0', 15],    // benchmarking
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reserved + broadcast
]

function isBlockedIPv4(ip: string): boolean {
  return BLOCKED_V4.some(([base, bits]) => inCidr4(ip, base, bits))
}

function isBlockedIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().split('%')[0]

  if (addr === '::' || addr === '::1') return true

  // IPv4-mapped / IPv4-compatible (::ffff:a.b.c.d, ::a.b.c.d)
  const v4Tail = addr.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (v4Tail && net.isIPv4(v4Tail[1])) return isBlockedIPv4(v4Tail[1])
  const mappedHex = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16)
    const lo = parseInt(mappedHex[2], 16)
    const v4 = `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
    return isBlockedIPv4(v4)
  }

  const firstHextet = parseInt(addr.split(':')[0] || '0', 16)
  if ((firstHextet & 0xfe00) === 0xfc00) return true // fc00::/7 unique local
  if ((firstHextet & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((firstHextet & 0xff00) === 0xff00) return true // ff00::/8 multicast
  return false
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIPv4(ip)
  if (net.isIPv6(ip)) return isBlockedIPv6(ip)
  return true
}

/**
 * Kullanıcıdan gelen URL'nin herkese açık bir adrese işaret ettiğini doğrular (SSRF koruması).
 * Yalnızca http/https ve 80/443 portlarına izin verir; çözümlenen tüm IP adresleri
 * loopback/özel/link-local/CGNAT/metadata aralıklarında olmamalıdır.
 */
export async function assertSafePublicUrl(url: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(String(url).trim())
  } catch {
    throw new Error('Geçersiz URL.')
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error('Yalnızca http ve https bağlantılarına izin verilir.')
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new Error('Standart dışı port kullanımına izin verilmez.')
  }

  if (parsed.username || parsed.password) {
    throw new Error('Kimlik bilgisi içeren URL\'lere izin verilmez.')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')
  if (!hostname || hostname.toLowerCase() === 'localhost' || hostname.toLowerCase().endsWith('.localhost')) {
    throw new Error('Bu adrese erişime izin verilmez.')
  }

  let addresses: Array<{ address: string; family: number }>
  if (net.isIP(hostname)) {
    addresses = [{ address: hostname, family: net.isIP(hostname) }]
  } else {
    try {
      addresses = await dns.lookup(hostname, { all: true })
    } catch {
      throw new Error('Alan adı çözümlenemedi.')
    }
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new Error('Bu adrese erişime izin verilmez.')
  }

  return parsed
}
