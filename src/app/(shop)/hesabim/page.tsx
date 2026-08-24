// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, LogOut, User, MapPin, Settings, Plus, Edit2, Trash2, Check, Lock, Mail, Phone, Home, ShieldCheck, Package, Truck, CheckCircle2, Clock, RefreshCw, AlertCircle 
} from "lucide-react";
import { TURKISH_CITIES } from "@/lib/constants";
import Image from "next/image";
import OrderReturnModal from "@/components/shop/OrderReturnModal";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; step: number }> = {
  odeme_bekliyor: { label: 'Ödeme Bekliyor', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, step: 1 },
  odeme_alindi: { label: 'Sipariş Alındı', color: 'bg-sky-50 text-sky-800 border-sky-200', icon: Package, step: 1 },
  siparis_alindi: { label: 'Sipariş Alındı', color: 'bg-sky-50 text-sky-800 border-sky-200', icon: Package, step: 1 },
  hazirlaniyor: { label: 'Hazırlanıyor', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Package, step: 2 },
  kargoya_verildi: { label: 'Kargoya Verildi', color: 'bg-purple-50 text-purple-800 border-purple-200', icon: Truck, step: 3 },
  teslim_edildi: { label: 'Teslim Edildi', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2, step: 4 },
  iade_talebi: { label: 'İade Talebi Alındı', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: RefreshCw, step: 4 },
  iade_edildi: { label: 'İade Edildi', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: RefreshCw, step: 0 },
  iptal_edildi: { label: 'İptal Edildi', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: Clock, step: 0 },
};

const renderAddressText = (addr: any) => {
  if (!addr) return 'Adres bilgisi yok';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [
      addr.full_name || addr.fullName ? `Alıcı: ${addr.full_name || addr.fullName}` : null,
      addr.phone ? `Tel: ${addr.phone}` : null,
      addr.address_line || addr.line,
      [addr.district, addr.city].filter(Boolean).join(' / '),
      addr.zip || addr.postal_code
    ].filter(Boolean);
    return parts.join(' - ');
  }
  return String(addr);
};

export default function AccountPage() {
  const { user, profile, loading, updateProfile, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">("profile");

  // Profile States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Addresses States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<any | null>(null);

  // Orders & Return Modal States
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [returnOrder, setReturnOrder] = useState<any | null>(null);

  const [addrForm, setAddrForm] = useState({
    title: "Ev Adresim",
    fullName: "",
    phone: "",
    city: "İstanbul",
    district: "",
    addressLine: "",
    zip: "34000",
    isDefault: false
  });

  // Load User Data, Addresses & Orders
  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris");
    }
    if (user) {
      setEmail(user.email || "");
      setFullName(profile?.full_name || user.user_metadata?.full_name || "");
      setPhone(profile?.phone || user.user_metadata?.phone || "");
      fetchUserAddresses(user.id);
      fetchUserOrders(user.id);
    }
  }, [user, loading, router, profile]);

  const fetchUserAddresses = async (userId: string) => {
    setAddrLoading(true);
    try {
      const { data, error } = await supabase
        .from("addresses" as any)
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (!error && data) {
        setAddresses(data);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setAddrLoading(false);
    }
  };

  const fetchUserOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders" as any)
        .select("*, order_items(*, products(*, product_images(*)))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center font-inter text-gray-500 pt-44">
        <Loader2 className="animate-spin text-[#C5A572] w-8 h-8" />
      </div>
    );
  }

  // Update Profile Info & Password
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (newPassword && newPassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }

    if (newPassword && newPassword !== newPasswordConfirm) {
      setProfileMsg({ type: 'error', text: 'Şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    setProfileSaving(true);

    try {
      await updateProfile({ full_name: fullName, phone });

      const authUpdates: any = {
        data: { full_name: fullName, phone }
      };

      if (email && email !== user.email) {
        authUpdates.email = email;
      }
      if (newPassword) {
        authUpdates.password = newPassword;
      }

      const { error: authErr } = await supabase.auth.updateUser(authUpdates);
      if (authErr) throw authErr;

      setNewPassword("");
      setNewPasswordConfirm("");
      setProfileMsg({ type: 'success', text: 'Profil ve üyelik bilgileriniz başarıyla güncellendi.' });
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setProfileMsg({ type: 'error', text: err.message || 'Güncellenirken bir hata oluştu.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Open Address Modal for New
  const handleOpenNewAddrModal = () => {
    setEditingAddr(null);
    setAddrForm({
      title: "Ev Adresim",
      fullName: fullName || user.user_metadata?.full_name || "",
      phone: phone || user.user_metadata?.phone || "",
      city: "İstanbul",
      district: "",
      addressLine: "",
      zip: "34000",
      isDefault: addresses.length === 0
    });
    setIsAddrModalOpen(true);
  };

  // Open Address Modal for Edit
  const handleOpenEditAddrModal = (addr: any) => {
    setEditingAddr(addr);
    const matchedCity = TURKISH_CITIES.find(c => c.toLowerCase() === (addr.city || '').trim().toLowerCase()) || addr.city || "İstanbul";

    setAddrForm({
      title: addr.title || "Ev",
      fullName: addr.full_name || "",
      phone: addr.phone || "",
      city: matchedCity,
      district: addr.district || "",
      addressLine: addr.address_line || "",
      zip: addr.postal_code || "34000",
      isDefault: addr.is_default || false
    });
    setIsAddrModalOpen(true);
  };

  // Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (addrForm.isDefault) {
        await supabase
          .from("addresses" as any)
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      if (editingAddr) {
        await supabase
          .from("addresses" as any)
          .update({
            title: addrForm.title,
            full_name: addrForm.fullName,
            phone: addrForm.phone,
            city: addrForm.city,
            district: addrForm.district,
            address_line: addrForm.addressLine,
            postal_code: addrForm.zip,
            is_default: addrForm.isDefault
          })
          .eq("id", editingAddr.id);
      } else {
        await supabase
          .from("addresses" as any)
          .insert({
            user_id: user.id,
            title: addrForm.title,
            full_name: addrForm.fullName,
            phone: addrForm.phone,
            city: addrForm.city,
            district: addrForm.district,
            address_line: addrForm.addressLine,
            postal_code: addrForm.zip,
            is_default: addrForm.isDefault
          });
      }

      setIsAddrModalOpen(false);
      fetchUserAddresses(user.id);
    } catch (err) {
      console.error("Address save error:", err);
      alert("Adres kaydedilirken bir hata oluştu.");
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addrId: string) => {
    if (confirm("Bu adresi silmek istediğinize emin misiniz?")) {
      try {
        await supabase.from("addresses" as any).delete().eq("id", addrId);
        fetchUserAddresses(user.id);
      } catch (err) {
        console.error("Delete address error:", err);
      }
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (addrId: string) => {
    try {
      await supabase.from("addresses" as any).update({ is_default: false }).eq("user_id", user.id);
      await supabase.from("addresses" as any).update({ is_default: true }).eq("id", addrId);
      fetchUserAddresses(user.id);
    } catch (err) {
      console.error("Set default address error:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-44 md:pt-52 font-inter text-xs">
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Nav */}
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xs text-left transition-all cursor-pointer text-xs font-semibold uppercase tracking-wider ${
                activeTab === 'profile' 
                  ? 'bg-[#1A1A1A] text-[#C5A572] shadow-sm' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <User className="w-4 h-4 text-[#C5A572]" />
              Profil Bilgileri
            </button>
            <button 
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xs text-left transition-all cursor-pointer text-xs font-semibold uppercase tracking-wider ${
                activeTab === 'addresses' 
                  ? 'bg-[#1A1A1A] text-[#C5A572] shadow-sm' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#C5A572]" />
              Adreslerim ({addresses.length})
            </button>
            <button 
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xs text-left transition-all cursor-pointer text-xs font-semibold uppercase tracking-wider ${
                activeTab === 'orders' 
                  ? 'bg-[#1A1A1A] text-[#C5A572] shadow-sm' 
                  : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4 text-[#C5A572]" />
              Siparişlerim ({orders.length})
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xs text-left text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors mt-6 cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-xs p-6 md:p-8 shadow-xs">
            
            {/* 1. TAB: PROFIL BILGILERI */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-playfair font-semibold text-[#1A1A1A]">Profil Bilgileri & Şifre</h2>
                  <p className="text-gray-500 text-[11px] mt-1">Üyelik bilgilerinizi, telefon numaranızı ve şifrenizi güncelleyin.</p>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-xs text-xs font-medium ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg pt-2" autoComplete="off">
                  <div className="space-y-3 border-b border-gray-100 pb-5">
                    <h3 className="font-semibold text-gray-800 text-xs font-playfair uppercase tracking-wider text-[#C5A572]">
                      Kişisel İletişim Bilgileri
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Ad Soyad
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        className="w-full p-2.5 border rounded-xs text-xs" 
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> E-posta Adresi
                      </label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-2.5 border rounded-xs text-xs" 
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> Telefon Numarası
                      </label>
                      <input 
                        type="tel" 
                        required 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="0555 123 4567" 
                        className="w-full p-2.5 border rounded-xs text-xs" 
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-semibold text-gray-800 text-xs font-playfair uppercase tracking-wider text-[#C5A572]">
                      Şifre Güncelleme (Opsiyonel)
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-400" /> Yeni Şifre
                      </label>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full p-2.5 border rounded-xs text-xs font-mono" 
                        autoComplete="new-password"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-400" /> Yeni Şifre Tekrar
                      </label>
                      <input 
                        type="password" 
                        value={newPasswordConfirm} 
                        onChange={e => setNewPasswordConfirm(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full p-2.5 border rounded-xs text-xs font-mono" 
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={profileSaving} 
                      className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-8 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. TAB: ADRESLERIM */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                  <div>
                    <h2 className="text-xl font-playfair font-semibold text-[#1A1A1A]">Kayıtlı Adreslerim</h2>
                    <p className="text-gray-500 text-[11px] mt-0.5">Teslimat adreslerinizi yönetin ve yeni adres ekleyin.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleOpenNewAddrModal}
                    className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-4 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Adres Ekle</span>
                  </button>
                </div>

                {addrLoading ? (
                  <div className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C5A572]" />
                    <p>Adresleriniz yükleniyor...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xs border border-dashed border-gray-200 space-y-3">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 font-medium text-xs">Henüz kayıtlı adresiniz bulunmuyor.</p>
                    <button 
                      type="button" 
                      onClick={handleOpenNewAddrModal}
                      className="bg-[#C5A572] hover:bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                    >
                      İlk Adresinizi Ekleyin
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`p-4 rounded-xs border transition-all relative flex flex-col justify-between space-y-3 ${
                          addr.is_default ? 'border-[#C5A572] bg-amber-50/20 shadow-xs' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between border-b pb-2 mb-2">
                            <span className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-[#C5A572]" />
                              {addr.title || 'Teslimat Adresi'}
                            </span>
                            {addr.is_default && (
                              <span className="bg-[#C5A572] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#1A1A1A] text-xs">{addr.full_name}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">{addr.phone}</p>
                          <p className="text-gray-700 text-xs mt-2 leading-relaxed">{addr.address_line}</p>
                          <p className="text-gray-500 text-[11px] font-medium">{addr.district} / {addr.city}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px]">
                          {!addr.is_default && (
                            <button 
                              type="button" 
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[#C5A572] hover:underline font-semibold cursor-pointer"
                            >
                              Varsayılan Yap
                            </button>
                          )}
                          <div className="flex items-center gap-3 ml-auto">
                            <button 
                              type="button" 
                              onClick={() => handleOpenEditAddrModal(addr)}
                              className="text-gray-600 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Düzenle
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. TAB: SIPARISLERIM */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-playfair font-semibold text-[#1A1A1A]">Siparişlerim</h2>
                  <p className="text-gray-500 text-[11px] mt-1">Verdiğiniz siparişleri ve kargo takip bilgilerinizi canlı takip edin.</p>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C5A572]" />
                    <p>Siparişleriniz yükleniyor...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xs border border-dashed border-gray-200 space-y-3">
                    <Package className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 font-medium text-xs">Henüz bir siparişiniz bulunmamaktadır.</p>
                    <button 
                      type="button" 
                      onClick={() => router.push("/urunler")}
                      className="bg-[#C5A572] hover:bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                    >
                      Koleksiyonu Keşfet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => {
                      const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['siparis_alindi'];
                      const StatusIcon = statusCfg.icon;

                      const itemsSum = order.order_items?.reduce((sum: number, it: any) => sum + (Number(it.unit_price || it.total_price || 0) * Number(it.quantity || 1)), 0) || 0;
                      const calculatedTotal = Number(order.total ?? order.total_amount ?? itemsSum);

                      // Calculate 14-Day Return Eligibility
                      const deliveryDate = new Date(order.updated_at || order.created_at);
                      const diffDays = Math.floor((new Date().getTime() - deliveryDate.getTime()) / (1000 * 3600 * 24));
                      const canReturn = order.status === 'teslim_edildi' && diffDays <= 14;
                      const daysLeft = Math.max(0, 14 - diffDays);

                      return (
                        <div key={order.id} className="border border-gray-200 rounded-xs overflow-hidden bg-white shadow-xs">
                          {/* Order Header Bar */}
                          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Sipariş Numarası</p>
                              <p className="font-mono font-bold text-[#1A1A1A]">{order.order_number || `VEL-ORD-${order.id.slice(0, 6).toUpperCase()}`}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Tarih</p>
                              <p className="font-medium text-[#1A1A1A]">{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Toplam Tutar</p>
                              <p className="font-bold text-[#1A1A1A] text-xs">{calculatedTotal.toLocaleString('tr-TR')} ₺</p>
                            </div>
                            <div className={`px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-bold text-xs ${statusCfg.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{statusCfg.label}</span>
                            </div>
                          </div>

                          {/* Cargo Shipping Details Banner (if available) */}
                          {(order.cargo_company || order.cargo_tracking_number) && (
                            <div className="bg-purple-50/80 border-b border-purple-100 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-950">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <div>
                                  <span className="font-bold text-purple-900">Kargo Firması: </span>
                                  <span className="font-semibold">{order.cargo_company || 'Kargoya Verildi'}</span>
                                  {order.cargo_tracking_number && (
                                    <span className="ml-4 font-bold text-purple-900">Takip No: <span className="font-mono bg-white border border-purple-200 px-2 py-0.5 rounded-xs text-purple-950 font-bold">{order.cargo_tracking_number}</span></span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-xs">
                                Kargo Takibi Aktif
                              </span>
                            </div>
                          )}

                          {/* 1. Return Status Banner: Pending Request */}
                          {order.status === 'iade_talebi' && (
                            <div className="bg-amber-50 border-b border-amber-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
                              <div className="flex items-center gap-2.5">
                                <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0 animate-spin" />
                                <div>
                                  <span className="font-bold text-amber-900 text-xs">İade Talebiniz Alındı ve İşleme Konuldu</span>
                                  <p className="text-[11px] text-amber-800 mt-0.5">Yöneticilerimiz talebinizi inceliyor. Kargo iade kodu oluşturulduğunda tarafınıza bilgilendirme yapılacaktır.</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-xs">
                                İnceleme Aşamasında
                              </span>
                            </div>
                          )}

                          {/* 2. Return Status Banner: Completed Return */}
                          {order.status === 'iade_edildi' && (
                            <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <div>
                                  <span className="font-bold text-emerald-900 text-xs">İade İşleminiz Başarıyla Tamamlandı</span>
                                  <p className="text-[11px] text-emerald-800 mt-0.5">Ürün iadeniz onaylanmış ve ücret iadesi ödeme yaptığınız karta aktarılmıştır.</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-xs">
                                İade Onaylandı
                              </span>
                            </div>
                          )}

                          {/* 3. 14-Day Return Action Banner (Only when status is delivered and not returned) */}
                          {order.status === 'teslim_edildi' && (
                            <div className="bg-amber-50/60 border-b border-amber-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 text-amber-900 font-medium">
                                <RefreshCw className="w-4 h-4 text-[#C5A572] flex-shrink-0" />
                                {canReturn ? (
                                  <span>
                                    <span className="font-bold">14 Günlük Kolay İade Hakkınız Aktif!</span> (Kalan Süre: <span className="font-bold text-[#1A1A1A]">{daysLeft} Gün</span>)
                                  </span>
                                ) : (
                                  <span className="text-gray-500 font-medium">14 günlük yasal iade süresi tamamlanmıştır.</span>
                                )}
                              </div>

                              {canReturn && (
                                <button
                                  type="button"
                                  onClick={() => setReturnOrder(order)}
                                  className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-4 py-1.5 rounded-xs font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>İade Talebi Başlat</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Order Step Progress Indicator */}
                          {statusCfg.step > 0 && order.status !== 'iade_talebi' && order.status !== 'iade_edildi' && (
                            <div className="px-4 pt-4 pb-2 border-b border-gray-100 bg-gray-50/20">
                              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                <div className={`space-y-1 ${statusCfg.step >= 1 ? 'text-sky-700 font-bold' : 'text-gray-400'}`}>
                                  <div className={`h-1.5 rounded-full ${statusCfg.step >= 1 ? 'bg-sky-500' : 'bg-gray-200'}`} />
                                  <span>1. Sipariş Alındı</span>
                                </div>
                                <div className={`space-y-1 ${statusCfg.step >= 2 ? 'text-indigo-700 font-bold' : 'text-gray-400'}`}>
                                  <div className={`h-1.5 rounded-full ${statusCfg.step >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                                  <span>2. Hazırlanıyor</span>
                                </div>
                                <div className={`space-y-1 ${statusCfg.step >= 3 ? 'text-purple-700 font-bold' : 'text-gray-400'}`}>
                                  <div className={`h-1.5 rounded-full ${statusCfg.step >= 3 ? 'bg-purple-500' : 'bg-gray-200'}`} />
                                  <span>3. Kargoya Verildi</span>
                                </div>
                                <div className={`space-y-1 ${statusCfg.step >= 4 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                                  <div className={`h-1.5 rounded-full ${statusCfg.step >= 4 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                  <span>4. Teslim Edildi</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Order Items */}
                          <div className="p-4 space-y-3">
                            {order.order_items?.map((item: any) => {
                              const product = item.products;
                              const mainImg = product?.product_images?.find((img: any) => img.is_primary)?.image_url || product?.product_images?.[0]?.image_url;

                              return (
                                <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                                  <div className="relative w-12 h-16 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0 border border-gray-200">
                                    {mainImg && <Image unoptimized src={mainImg} alt={product?.name || item.product_name || "Ürün"} fill className="object-cover" />}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-[#1A1A1A] text-xs">{product?.name || item.product_name || "Ürün"}</h4>
                                    <p className="text-gray-500 text-[10px] mt-0.5">Adet: {item.quantity}</p>
                                  </div>
                                  <p className="font-semibold text-[#1A1A1A] text-xs">{((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('tr-TR')} ₺</p>
                                </div>
                              );
                            })}

                            {/* Shipping Address summary */}
                            {order.shipping_address && (
                              <div className="pt-2 flex items-start gap-1.5 text-[11px] text-gray-600">
                                <MapPin className="w-3.5 h-3.5 text-[#C5A572] flex-shrink-0 mt-0.5" />
                                <span><span className="font-semibold text-[#1A1A1A]">Teslimat Adresi:</span> {renderAddressText(order.shipping_address)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 14-Day Order Return Modal */}
      {returnOrder && (
        <OrderReturnModal
          isOpen={!!returnOrder}
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSuccess={() => {
            if (returnOrder) {
              setOrders(prev => prev.map(o => o.id === returnOrder.id ? { ...o, status: 'iade_talebi' } : o));
            }
            fetchUserOrders(user.id);
          }}
        />
      )}

      {/* Address Create / Edit Modal */}
      {isAddrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-inter">
          <div className="bg-white rounded-xs border border-gray-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-playfair font-semibold text-lg text-[#1A1A1A]">
                {editingAddr ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddrModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Adres Başlığı *</label>
                  <input 
                    type="text" 
                    required 
                    value={addrForm.title} 
                    onChange={e => setAddrForm({...addrForm, title: e.target.value})} 
                    placeholder="Ev, İş vb." 
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad *</label>
                  <input 
                    type="text" 
                    required 
                    value={addrForm.fullName} 
                    onChange={e => setAddrForm({...addrForm, fullName: e.target.value})} 
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon Numarası *</label>
                  <input 
                    type="tel" 
                    required 
                    value={addrForm.phone} 
                    onChange={e => setAddrForm({...addrForm, phone: e.target.value})} 
                    placeholder="0555 123 4567" 
                    className="w-full p-2.5 border rounded-xs text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">İl (Şehir) *</label>
                  <select 
                    required 
                    value={addrForm.city} 
                    onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} 
                    className="w-full p-2.5 border rounded-xs text-xs font-medium bg-white text-[#1A1A1A]"
                  >
                    {TURKISH_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">İlçe *</label>
                <input 
                  type="text" 
                  required 
                  value={addrForm.district} 
                  onChange={e => setAddrForm({...addrForm, district: e.target.value})} 
                  placeholder="Kadıköy" 
                  className="w-full p-2.5 border rounded-xs text-xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Açık Adres (Mahalle, Sokak, No, Daire) *</label>
                <textarea 
                  required 
                  rows={3} 
                  value={addrForm.addressLine} 
                  onChange={e => setAddrForm({...addrForm, addressLine: e.target.value})} 
                  placeholder="Fenerbahçe Mah. Bağdat Cad. No:12 D:4" 
                  className="w-full p-2.5 border rounded-xs text-xs" 
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 pt-1">
                <input 
                  type="checkbox" 
                  checked={addrForm.isDefault} 
                  onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} 
                  className="accent-[#C5A572] w-4 h-4 cursor-pointer" 
                />
                <span>Varsayılan Teslimat Adresi Olarak İşaretle</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddrModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xs text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#C5A572] text-white rounded-xs text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                >
                  {editingAddr ? 'Adresi Güncelle' : 'Adresi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
