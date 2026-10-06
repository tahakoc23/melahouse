/** E-posta pazarlama şablonları ve HTML üretici (e-posta istemcileri için satır içi stiller). */

import { SITE_URL } from '@/lib/constants'

export interface EmailDraft {
  subject: string
  heading: string
  body: string
  buttonText: string
  buttonLink: string
}

export interface EmailTemplate {
  id: string
  name: string
  description: string
  draft: EmailDraft
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'kampanya',
    name: 'Kampanya duyurusu',
    description: 'İndirim ya da özel fırsat',
    draft: {
      subject: 'Seçili parçalarda indirim başladı',
      heading: 'Seçili parçalarda indirim',
      body: 'Sevdiğiniz parçalar şimdi daha avantajlı.\n\nKampanya stoklarla sınırlıdır.',
      buttonText: 'İndirimli ürünler',
      buttonLink: `${SITE_URL}/urunler`,
    },
  },
  {
    id: 'yeni-koleksiyon',
    name: 'Yeni koleksiyon',
    description: 'Yeni gelen ürünleri tanıtın',
    draft: {
      subject: 'Yeni sezon parçaları geldi',
      heading: 'Yeni sezon geldi',
      body: 'Yeni koleksiyonumuz sitede.\n\nBeden seçenekleri sınırlı; erken göz atmanızı öneririz.',
      buttonText: 'Koleksiyonu gör',
      buttonLink: `${SITE_URL}/urunler`,
    },
  },
  {
    id: 'bilgilendirme',
    name: 'Bilgilendirme',
    description: 'Duyuru, tatil, kargo bilgisi',
    draft: {
      subject: 'MELA HOUSE bilgilendirme',
      heading: 'Merhaba',
      body: 'Size kısa bir bilgi vermek istedik.\n\nSorularınız için bu e-postayı yanıtlayabilirsiniz.',
      buttonText: '',
      buttonLink: '',
    },
  },
  {
    id: 'bos',
    name: 'Boş',
    description: 'Kendiniz yazın',
    draft: { subject: '', heading: '', body: '', buttonText: '', buttonLink: '' },
  },
]

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function isSafeLink(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Taslaktan e-posta HTML'i üretir. Metin kaçışlanır; boş satırlar paragraf olur. */
export function buildEmailHtml(d: EmailDraft): string {
  const paragraphs = d.body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(
      p =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4A4346;">${esc(p).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')
  const button =
    d.buttonText.trim() && isSafeLink(d.buttonLink)
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;"><tr><td style="background:#171214;">` +
        `<a href="${esc(d.buttonLink.trim())}" style="display:inline-block;padding:14px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">${esc(d.buttonText.trim())}</a>` +
        `</td></tr></table>`
      : ''
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.subject)}</title></head>
<body style="margin:0;padding:0;background:#F7F6F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F4;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E7E3DE;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #EFEBE6;text-align:center;">
<span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:6px;color:#171214;">MELA HOUSE</span>
</td></tr>
<tr><td style="padding:32px;">
${d.heading.trim() ? `<h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;line-height:1.25;color:#171214;">${esc(d.heading.trim())}</h1>` : ''}
${paragraphs}
${button}
</td></tr>
<tr><td style="padding:20px 32px;background:#3A1D2A;text-align:center;font-size:11px;line-height:1.6;color:#E9DFE3;">
MELA HOUSE · <a href="${SITE_URL}" style="color:#E9DFE3;">${SITE_URL.replace(/^https?:\/\//, '')}</a><br>
Bu e-postayı MELA HOUSE müşterisi olduğunuz için aldınız. Almak istemiyorsanız bu e-postayı yanıtlayarak bildirin.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
