import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'

const tl = new Intl.NumberFormat('tr-TR').format(FREE_SHIPPING_THRESHOLD)

const PROMISES = [
  { title: 'Ücretsiz kargo', text: `${tl} TL ve üzeri siparişlerde` },
  { title: '14 gün iade', text: 'Teslimattan itibaren cayma hakkı' },
  { title: 'Güvenli ödeme', text: 'Kart bilgileri Shopier altyapısında işlenir' },
]

export default function ServicePromises() {
  return (
    <section aria-label="Alışveriş güvenceleri" className="border-b border-ink/10">
      <ul className="max-w-[1600px] mx-auto px-5 md:px-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/10">
        {PROMISES.map(p => (
          <li key={p.title} className="py-5 sm:py-7 sm:px-8 first:sm:pl-0 text-center sm:text-left">
            <p className="eyebrow text-ink">{p.title}</p>
            <p className="text-sm text-kul mt-1.5">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
