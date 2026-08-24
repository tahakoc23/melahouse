"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      if (data?.user) {
        // Fetch user profile to check if role is admin
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = (profile as any)?.role;
        
        if (role === 'admin') {
          router.push('/admin');
        } else if (redirectParam) {
          router.push(redirectParam);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('E-posta veya şifre hatalı.');
      } else if (err.message === 'Email not confirmed') {
        setError('E-posta doğrulamanız henüz tamamlanmadı.');
      } else {
        setError(err.message || "Giriş yapılırken bir hata oluştu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200"
    >
      <h1 className="text-2xl font-serif font-semibold text-center text-[#1A1A1A] mb-1 font-playfair">
        MELA HOUSE'a Giriş Yap
      </h1>
      <p className="text-xs text-gray-500 text-center mb-6 font-inter">
        Hesabınıza giriş yaparak siparişlerinizi takip edin ve ayrıcalıklara erişin.
      </p>
      
      {error && (
        <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 rounded-md border border-red-200 font-inter">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-inter text-xs" autoComplete="on">
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" /> E-posta Adresi
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@melahouse.net"
            autoComplete="email"
            name="email"
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A572] focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-400" /> Şifre
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              name="password"
              className="w-full h-10 pl-3 pr-10 py-2 border border-gray-300 rounded-md text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A572] focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="pt-2">
          <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white uppercase tracking-wider text-xs py-3 font-semibold transition-colors cursor-pointer" isLoading={isSubmitting}>
            Giriş Yap
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-gray-600 font-inter">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-[#C5A572] hover:underline font-semibold">
          Hemen Kayıt Olun
        </Link>
      </div>
    </motion.div>
  );
}
