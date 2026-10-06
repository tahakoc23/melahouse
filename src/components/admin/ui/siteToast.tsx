'use client'

/**
 * Sayfa içi bildirimler (react-hot-toast). Görüntüleyen tek <Toaster/> AdminShell içindedir;
 * sayfalar ayrıca Toaster render etmez.
 */

import toast from 'react-hot-toast'

export const notify = {
  success: (message: string, id?: string) => toast.success(message, { id, duration: 3500 }),
  error: (message: string, id?: string) => toast.error(message, { id, duration: 6000 }),
  info: (message: string, id?: string) => toast(message, { id, duration: 4500 }),
  loading: (message: string, id?: string) => toast.loading(message, { id }),
  dismiss: (id?: string) => toast.dismiss(id),
}
