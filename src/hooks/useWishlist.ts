"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface WishlistItem {
  id: string;
  user_id?: string;
  product_id: string;
  created_at?: string;
  product?: any;
}

const GUEST_WISHLIST_KEY = 'veloria_guest_wishlist';

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Load Guest Wishlist from LocalStorage
  const getGuestWishlist = (): WishlistItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveGuestWishlist = (guestItems: WishlistItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(guestItems));
    } catch (e) {
      console.error("Failed to save guest wishlist:", e);
    }
  };

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems(getGuestWishlist());
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist' as any)
        .select(`
          id,
          user_id,
          product_id,
          created_at,
          product:products (*)
        `)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      const dbItems = (data as WishlistItem[]) || [];

      // Sync guest wishlist items to DB if any exist
      const guestItems = getGuestWishlist();
      if (guestItems.length > 0) {
        for (const gItem of guestItems) {
          if (!dbItems.some(d => d.product_id === gItem.product_id)) {
            await supabase.from('wishlist' as any).insert({
              user_id: user.id,
              product_id: gItem.product_id
            } as any);
          }
        }
        localStorage.removeItem(GUEST_WISHLIST_KEY);
        
        // Re-fetch synced DB items
        const { data: synced } = await supabase
          .from('wishlist' as any)
          .select(`id, user_id, product_id, created_at, product:products (*)`)
          .eq('user_id', user.id);
        setItems((synced as WishlistItem[]) || []);
      } else {
        setItems(dbItems);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setItems(getGuestWishlist());
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some((item) => item.product_id === productId);
  }, [items]);

  const addToWishlist = async (productId: string) => {
    if (isInWishlist(productId)) return { data: null, error: null };

    const newItem: WishlistItem = {
      id: `w-${Date.now()}`,
      product_id: productId,
      created_at: new Date().toISOString()
    };

    // Optimistically update React state immediately
    setItems(prev => [...prev, newItem]);

    if (!user) {
      const updatedGuest = [...getGuestWishlist(), newItem];
      saveGuestWishlist(updatedGuest);
      return { data: newItem, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('wishlist' as any)
        .insert({
          user_id: user.id,
          product_id: productId,
        } as any)
        .select()
        .single();
        
      if (error) throw error;
      await fetchWishlist();
      return { data, error: null };
    } catch (error) {
      console.error('Error adding to wishlist DB:', error);
      return { data: newItem, error: null };
    }
  };

  const removeFromWishlist = async (productId: string) => {
    // Optimistically update React state immediately
    setItems(prev => prev.filter(item => item.product_id !== productId));

    if (!user) {
      const updatedGuest = getGuestWishlist().filter(item => item.product_id !== productId);
      saveGuestWishlist(updatedGuest);
      return { error: null };
    }
    
    try {
      const { error } = await supabase
        .from('wishlist' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
        
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error removing from wishlist DB:', error);
      return { error };
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  return {
    items,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refresh: fetchWishlist
  };
}
