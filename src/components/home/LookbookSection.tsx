'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface LookbookContent {
  id?: string
  title: string
  image_url: string
  description: string
  link_url?: string
}

interface LookbookSectionProps {
  content?: LookbookContent | null
}

// Admin panelinde "lookbook" içeriği girilmediğinde gösterilen marka bölümü
const DEFAULT_LOOKBOOK: LookbookContent = {
  title: 'Az parça, doğru parça.',
  image_url: 'https://images.unsplash.com/photo-1637248666370-70a4a603c23e?q=80&w=1400&auto=format&fit=crop',
  description:
    'MELA HOUSE, günlükten davete uzanan bir kadın gardırobunu kumaşı ve kalıbı özenle seçilmiş parçalarla kurar. Koleksiyonlarımızı her sezon küçük ve seçkin tutuyoruz; böylece her parça diğerleriyle kolayca eşleşir.',
  link_url: '/hakkimizda',
}

const ease = [0.22, 1, 0.36, 1] as const

export default function LookbookSection({ content }: LookbookSectionProps) {
  const c = content || DEFAULT_LOOKBOOK

  return (
    <section className="bg-murdum text-white" aria-labelledby="marka-baslik">
      <div className="max-w-[1600px] mx-auto grid md:grid-cols-12 items-stretch">
        <div className="relative md:col-span-5 aspect-[4/5] md:aspect-auto md:min-h-[640px] overflow-hidden">
          <Image
            src={c.image_url}
            alt=""
            fill
            sizes="(min-width: 768px) 42vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="md:col-span-7 flex flex-col justify-center px-6 py-16 md:px-20 lg:px-28">
          <p className="eyebrow text-gold-light mb-8">Felsefemiz</p>
          <motion.h2
            id="marka-baslik"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
            className="font-display italic text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-10"
          >
            {c.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl mb-12 font-light"
          >
            {c.description}
          </motion.p>
          <Link href={c.link_url || '/hakkimizda'} className="eyebrow link-couture self-start text-white">
            Hikayemiz
          </Link>
        </div>
      </div>
    </section>
  )
}
