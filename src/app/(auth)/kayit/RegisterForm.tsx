"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TURKISH_CITIES } from "@/lib/constants";
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin } from "lucide-react";

export default function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressTitle, setAddressTitle] = useState("Ev Adresim");
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 10) {
      setError("Lütfen geçerli bir telefon numarası giriniz.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    
    if (!agreed) {
      setError("Kayıt olmak için üyelik koşullarını kabul etmelisiniz.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signUpError } = await signUp(email, password, fullName, phone, {
        title: addressTitle,
        city,
        district,
        addressLine
      });
      
      if (signUpError) throw signUpError;
      
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Kayıt olurken bir hata oluştu.");
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
        Veloria'ya Kayıt Ol
      </h1>
      <p className="text-xs text-gray-500 text-center mb-6 font-inter">
        Üyelik bilgilerinizi ve teslimat adresinizi girerek hızlıca hesabınızı oluşturun.
      </p>
      
      {error && (
        <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 rounded-md border border-red-200 font-inter">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-inter" autoComplete="off">
        {/* Kişisel & İletişim Bilgileri */}
        <div className="space-y-3 border-b border-gray-100 pb-4">
          <h3 className="font-semibold text-gray-800 text-xs font-playfair uppercase tracking-wider text-[#C5A572] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Kişisel Bilgiler
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ör. Selin Yılmaz"
              autoComplete="off"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> E-posta Adresi *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                autoComplete="off"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> Telefon Numarası *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 123 4567"
                autoComplete="off"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-xs"
              />
            </div>
          </div>
        </div>

        {/* Adres Bilgileri */}
        <div className="space-y-3 border-b border-gray-100 pb-4">
          <h3 className="font-semibold text-gray-800 text-xs font-playfair uppercase tracking-wider text-[#C5A572] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Varsayılan Teslimat Adresi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Adres Başlığı</label>
              <input 
                type="text" 
                value={addressTitle} 
                onChange={(e) => setAddressTitle(e.target.value)}
                placeholder="Ev, İş vb." 
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs focus:ring-1 focus:ring-[#C5A572]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">İl (Şehir) *</label>
              <select 
                required 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs font-medium focus:ring-1 focus:ring-[#C5A572]"
              >
                {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">İlçe *</label>
              <input 
                type="text" 
                required
                value={district} 
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kadıköy" 
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs focus:ring-1 focus:ring-[#C5A572]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Açık Adres (Mahalle, Sokak, No, Daire) *</label>
            <textarea 
              required 
              rows={2} 
              value={addressLine} 
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Fenerbahçe Mah. Bağdat Cad. No:12 D:4" 
              className="w-full p-2.5 border border-gray-300 rounded-xs text-xs focus:ring-1 focus:ring-[#C5A572]"
            />
          </div>
        </div>

        {/* Şifre İşlemleri */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Lock className="w-3 h-3 text-gray-400" /> Şifre *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as any}
                  className="w-full h-10 pl-3 pr-10 py-2 border border-gray-300 rounded-md text-xs"
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

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Lock className="w-3 h-3 text-gray-400" /> Şifre Tekrar *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as any}
                  className="w-full h-10 pl-3 pr-10 py-2 border border-gray-300 rounded-md text-xs"
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
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-600 mt-2 font-inter cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-[#C5A572] cursor-pointer w-4 h-4"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>Üyelik koşullarını ve kişisel verilerimin işlenmesini kabul ediyorum.</span>
          </label>
        </div>
        
        <div className="pt-2">
          <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white uppercase text-xs tracking-wider py-3 font-semibold transition-colors cursor-pointer" isLoading={isSubmitting}>
            Hesabımı Oluştur & Kaydet
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-gray-600 font-inter">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-[#C5A572] hover:underline font-semibold">
          Giriş Yapın
        </Link>
      </div>
    </motion.div>
  );
}
