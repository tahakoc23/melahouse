// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error fetching auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        const typedData = data as any;
        setProfile(typedData);
        setIsAdmin(typedData.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    phone?: string,
    addressInfo?: {
      title?: string;
      city?: string;
      district?: string;
      addressLine?: string;
    }
  ) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (!res.error && res.data.user) {
      const newUserId = res.data.user.id;

      // Automatically sign in to establish active auth session
      await supabase.auth.signInWithPassword({ email, password });

      // 1. Create / Update Profile record
      await supabase.from('profiles' as any).upsert({
        id: newUserId,
        email,
        full_name: fullName,
        phone: phone || '',
        role: 'user'
      });

      // 2. Save Registration Address
      if (addressInfo) {
        await supabase.from('addresses' as any).insert({
          user_id: newUserId,
          title: addressInfo.title || 'Ev Adresim',
          full_name: fullName,
          phone: phone || '',
          city: addressInfo.city || 'İstanbul',
          district: addressInfo.district || '',
          address_line: addressInfo.addressLine || '',
          is_default: true
        });
      }
    }

    return res;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('Oturum açmanız gerekiyor') };
    
    return await supabase
      .from('profiles' as any)
      .update(updates as any)
      .eq('id', user.id);
  };

  return {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
