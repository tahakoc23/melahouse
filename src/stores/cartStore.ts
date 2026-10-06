import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants';

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variantInfo?: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
  maxStock?: number;
};

/** Kalem için izin verilen en yüksek adet: stok (biliniyorsa) ile genel üst sınırın küçüğü. */
const quantityCap = (maxStock?: number) =>
  typeof maxStock === 'number' && Number.isFinite(maxStock) && maxStock >= 0
    ? Math.min(Math.floor(maxStock), MAX_QUANTITY_PER_ITEM)
    : MAX_QUANTITY_PER_ITEM;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: (isOpen?: boolean) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === item.id
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            const existing = newItems[existingItemIndex];
            const maxStock = item.maxStock ?? existing.maxStock;
            const cap = quantityCap(maxStock);

            newItems[existingItemIndex] = {
              ...existing,
              maxStock,
              quantity: Math.max(1, Math.min(existing.quantity + item.quantity, cap)),
            };
            return { items: newItems, isOpen: true };
          }

          const cap = quantityCap(item.maxStock);
          if (cap < 1) return { isOpen: true };
          return {
            items: [...state.items, { ...item, quantity: Math.max(1, Math.min(item.quantity, cap)) }],
            isOpen: true,
          };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        if (!Number.isFinite(quantity) || quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(Math.floor(quantity), quantityCap(item.maxStock))) }
              : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleCart: (isOpen) =>
        set((state) => ({ isOpen: isOpen !== undefined ? isOpen : !state.isOpen })),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'melahouse-cart',
    }
  )
);
