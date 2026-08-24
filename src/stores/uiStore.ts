import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isCartOpen: boolean;
  toggleMobileMenu: (isOpen?: boolean) => void;
  toggleSearch: (isOpen?: boolean) => void;
  toggleCart: (isOpen?: boolean) => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isCartOpen: false,
  toggleMobileMenu: (isOpen) =>
    set((state) => ({
      isMobileMenuOpen: isOpen !== undefined ? isOpen : !state.isMobileMenuOpen,
      isSearchOpen: false,
      isCartOpen: false,
    })),
  toggleSearch: (isOpen) =>
    set((state) => ({
      isSearchOpen: isOpen !== undefined ? isOpen : !state.isSearchOpen,
      isMobileMenuOpen: false,
      isCartOpen: false,
    })),
  toggleCart: (isOpen) =>
    set((state) => ({
      isCartOpen: isOpen !== undefined ? isOpen : !state.isCartOpen,
      isMobileMenuOpen: false,
      isSearchOpen: false,
    })),
  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      isCartOpen: false,
    }),
}));
