import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            const currentQuantity = newItems[existingItemIndex].quantity;
            const maxStock = item.maxStock ?? Infinity;
            
            newItems[existingItemIndex].quantity = Math.min(
              currentQuantity + item.quantity,
              maxStock
            );
            return { items: newItems, isOpen: true };
          }
          
          return { items: [...state.items, item], isOpen: true };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
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
      name: 'veloria-cart',
    }
  )
);
