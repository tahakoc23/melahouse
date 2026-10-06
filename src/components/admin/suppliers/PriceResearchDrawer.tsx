'use client'

import PriceResearchPanel from '@/components/admin/PriceResearchPanel'
import { SiteDialog } from '@/components/admin/ui/SiteDialog'
import { formatTL } from '@/lib/utils'
import { cleanText, metaText, toNumber, type SupplierProduct } from './types'

/** Toptancı ürünü için piyasa fiyat araştırması (sağdan açılan panel) */
export function PriceResearchDrawer({ product, onClose }: { product: SupplierProduct; onClose: () => void }) {
  const cost = toNumber(product.price)

  return (
    <SiteDialog
      open
      onClose={onClose}
      variant="side"
      size="xl"
      title="Fiyat araştır"
      description={`${product.title}${cost > 0 ? ` · Alış ${formatTL(cost)} (KDV dahil)` : ''}`}
    >
      <PriceResearchPanel
        key={product.id}
        compact
        autoRun
        attributes={{
          name: product.title,
          category: metaText(product, 'category'),
          fabric: cleanText(product.fabric),
          color: cleanText(product.color),
        }}
        costPrice={cost > 0 ? cost : undefined}
        supplierProductId={product.id}
      />
    </SiteDialog>
  )
}
