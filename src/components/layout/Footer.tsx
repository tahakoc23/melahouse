import Link from 'next/link'

const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const COLUMNS = [
  {
    title: 'Alışveriş',
    links: [
      { href: '/urunler', label: 'Tüm ürünler' },
      { href: '/kategori/ust-giyim', label: 'Üst giyim' },
      { href: '/kategori/alt-giyim', label: 'Alt giyim' },
      { href: '/kategori/dis-giyim', label: 'Dış giyim' },
      { href: '/kategori/takimlar', label: 'Takımlar' },
      { href: '/kategori/ic-giyim', label: 'İç giyim' },
    ],
  },
  {
    title: 'Hesabım',
    links: [
      { href: '/hesabim', label: 'Hesap bilgileri' },
      { href: '/siparislerim', label: 'Siparişlerim ve iade' },
      { href: '/favorilerim', label: 'Favorilerim' },
      { href: '/sepet', label: 'Sepetim' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/blog', label: 'Stil rehberi' },
      { href: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli satış sözleşmesi' },
      { href: '/gizlilik-politikasi', label: 'Gizlilik politikası (KVKK)' },
      { href: '/kullanim-kosullari', label: 'Kullanım koşulları' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-16 md:pt-24">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-12 pb-16">
          <div className="col-span-2 md:col-span-4 space-y-6">
            <p className="font-display text-3xl text-white tracking-wide">MELA HOUSE</p>
            <p className="text-sm leading-relaxed text-white/60 max-w-xs font-light">
              Günlükten davete; kumaşı ve kalıbı özenle seçilmiş kadın koleksiyonları.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:info@melahouse.net" className="block hover:text-white transition-colors">
                info@melahouse.net
              </a>
              <a
                href="https://instagram.com/melahouse.official"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white transition-colors"
              >
                <InstagramIcon />
                @melahouse.official
              </a>
            </div>
          </div>

          {COLUMNS.map(col => (
            <nav key={col.title} aria-label={col.title} className="md:col-span-2 md:last:col-span-3 md:first-of-type:col-start-6">
              <h2 className="eyebrow text-gold-light mb-6">{col.title}</h2>
              <ul className="space-y-3 text-sm font-light">
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/45">
          <p>&copy; {new Date().getFullYear()} MELA HOUSE. Tüm hakları saklıdır.</p>
          <p>Visa, Mastercard ve Troy ile Shopier güvencesinde ödeme</p>
        </div>
      </div>

      {/* Alt bant: manşetin yankısı */}
      <div aria-hidden className="overflow-hidden select-none">
        <p className="font-display italic text-white/[0.06] leading-[0.75] whitespace-nowrap text-center text-[clamp(4rem,17vw,17rem)] -mb-[0.12em]">
          Mela House
        </p>
      </div>
    </footer>
  )
}
