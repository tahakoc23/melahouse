'use client'

/**
 * Ürün sayfalarına özel toast kanalı. Ayrı bir toasterId kullanılır; böylece admin
 * layout'u kendi <Toaster/>'ını eklese de bildirimler iki kez görünmez.
 */
import toast, { Toaster } from 'react-hot-toast'
import type { ReactNode } from 'react'

const TOASTER_ID = 'admin-products'

export function ProductToaster() {
  return (
    <Toaster
      toasterId={TOASTER_ID}
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: { fontSize: '14px', color: '#171214', borderRadius: '8px', border: '1px solid #E7E3DE', maxWidth: 480 },
        success: { iconTheme: { primary: '#171214', secondary: '#fff' } },
      }}
    />
  )
}

export const productToast = {
  success: (msg: ReactNode, duration?: number) => toast.success(() => <>{msg}</>, { toasterId: TOASTER_ID, duration }),
  error: (msg: ReactNode, duration = 6000) => toast.error(() => <>{msg}</>, { toasterId: TOASTER_ID, duration }),
}
