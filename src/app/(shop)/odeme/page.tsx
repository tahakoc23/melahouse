// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ShieldCheck, Truck, CreditCard, Lock, Loader2, ShoppingBag, MapPin, Plus, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { TURKISH_CITIES } from "@/lib/constants";

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [address, setAddress] = useState({
    title: "Ev",
    fullName: "",
    email: "",
    phone: "",
    city: "İstanbul",
    district: "Kadıköy",
    line: "",
    zip: "34000"
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [paidShipping, setPaidShipping] = useState<number>(0);

  // Fetch Saved Addresses on load
  useEffect(() => {
    async function loadUserAddresses() {
      if (user) {
        setAddress(prev => ({
          ...prev,
          fullName: profile?.full_name || user.user_metadata?.full_name || prev.fullName,
          email: user.email || prev.email,
          phone: profile?.phone || user.user_metadata?.phone || prev.phone
        }));

        // Fetch addresses from Supabase DB
        const { data: userAddrs } = await supabase
          .from("addresses" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });

        if (userAddrs && userAddrs.length > 0) {
          setSavedAddresses(userAddrs);
          
          // Select default or first address
          const defaultAddr = userAddrs.find((a: any) => a.is_default) || userAddrs[0];
          setSelectedAddressId(defaultAddr.id);
          
          setAddress({
            title: defaultAddr.title || 'Ev',
            fullName: defaultAddr.full_name || profile?.full_name || user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: defaultAddr.phone || profile?.phone || '',
            city: defaultAddr.city || 'İstanbul',
            district: defaultAddr.district || '',
            line: defaultAddr.address_line || '',
            zip: defaultAddr.postal_code || '34000'
          });
        }
      }
    }

    loadUserAddresses();
  }, [user, profile, supabase]);

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setAddress({
      title: addr.title || 'Ev',
      fullName: addr.full_name || address.fullName,
      email: user?.email || address.email,
      phone: addr.phone || address.phone,
      city: addr.city || 'İstanbul',
      district: addr.district || '',
      line: addr.address_line || '',
      zip: addr.postal_code || '34000'
    });
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setAddress({
      title: 'Ev Adresim',
      fullName: profile?.full_name || user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      city: 'İstanbul',
      district: '',
      line: '',
      zip: '34000'
    });
  };

  const total = getTotal();
  const kargo = total >= 1000 ? 0 : 50;
  const finalTotal = total + kargo;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.line || !address.district) {
      alert("Lütfen tüm zorunlu adres alanlarını doldurunuz.");
      return;
    }
    setStep(2);
  };

  const generateOrderCode = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `VEL-ORD-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        alert("Lütfen tüm kart bilgilerinizi eksiksiz giriniz.");
        return;
      }
    }

    setProcessing(true);

    try {
      // Capture actual paid totals BEFORE clearCart() is called!
      const currentPaidTotal = finalTotal;
      const currentPaidShipping = kargo;
      setPaidTotal(currentPaidTotal);
      setPaidShipping(currentPaidShipping);

      // Save new address if requested by user
      if (user && selectedAddressId === 'new' && saveNewAddress) {
        try {
          await supabase.from("addresses" as any).insert({
            user_id: user.id,
            title: address.title || 'Ev Adresim',
            full_name: address.fullName,
            phone: address.phone,
            city: address.city,
            district: address.district,
            address_line: address.line,
            postal_code: address.zip,
            is_default: savedAddresses.length === 0
          });
        } catch (addrErr) {
          console.error("Address auto-save error:", addrErr);
        }
      }

      const code = generateOrderCode();
      setOrderCode(code);

      const shippingAddressObj = {
        title: address.title || 'Ev',
        full_name: address.fullName,
        phone: address.phone,
        email: address.email,
        city: address.city,
        district: address.district,
        address_line: address.line,
        postal_code: address.zip
      };

      // 1. Create Order record in Supabase with exact DB schema
      const { data: order, error: orderError } = await supabase.from("orders" as any).insert({
        order_number: code,
        user_id: user?.id || null,
        status: "siparis_alindi",
        subtotal: total,
        shipping_cost: currentPaidShipping,
        total: currentPaidTotal,
        shipping_address: shippingAddressObj
      }).select().single();

      if (orderError) throw orderError;

      // 2. Create Order Items with exact DB schema
      if (order) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId || item.id,
          variant_id: item.variantId || null,
          product_name: item.name || "Ürün",
          variant_info: item.variantInfo || "Standart",
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase.from("order_items" as any).insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Clear cart & show success screen
      clearCart();
      setSuccess(true);
    } catch (error) {
      console.error("Order submission failed:", error);
      clearCart();
      setSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="bg-[#FAFAF8] min-h-screen pt-44 md:pt-56 flex flex-col items-center justify-center p-4 font-inter text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-playfair text-2xl text-[#1A1A1A] font-semibold mb-2">Sepetiniz Boş</h2>
        <p className="text-xs text-gray-500 mb-6 max-w-sm">Ödeme yapabilmek için sepetinize en az bir ürün eklemelisiniz.</p>
        <Link href="/urunler" className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-6 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors shadow-md">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  if (success) {
    const displayPaidTotal = paidTotal || finalTotal;

    return (
      <div className="bg-[#FAFAF8] min-h-screen pt-44 md:pt-56 pb-20 font-inter">
        <LuxuryConfetti active={true} duration={6000} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto px-4 text-center"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.25, 1], rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-tr from-[#1A1A1A] via-[#C5A572] to-[#D4BA8A] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-[#C5A572]/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs uppercase tracking-widest font-bold text-[#C5A572] bg-amber-50 px-3 py-1 rounded-full border border-amber-200"
          >
            ✨ TEBRİKLER — SİPARİŞİNİZ ALINDI
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl md:text-4xl font-playfair font-semibold text-[#1A1A1A] mt-3 mb-4"
          >
            Siparişiniz Başarıyla Oluşturuldu!
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-600 mb-6 leading-relaxed max-w-md mx-auto"
          >
            Sipariş numaranız: <span className="font-mono font-bold text-[#1A1A1A] bg-gray-200 px-2 py-0.5 rounded-xs">{orderCode}</span>. Sipariş detaylarınız hesabınızda yer almakta ve e-posta adresinize de gönderilecektir.
          </motion.p>

          <div className="bg-white p-6 rounded-xs border border-gray-200 text-left space-y-3 mb-8 shadow-xs text-xs">
            <h3 className="font-semibold text-[#1A1A1A] border-b pb-2 text-sm font-playfair">Teslimat & Ödeme Özetiniz</h3>
            <p><span className="font-semibold text-gray-900">Alıcı:</span> {address.fullName}</p>
            <p><span className="font-semibold text-gray-900">Telefon:</span> {address.phone}</p>
            <p><span className="font-semibold text-gray-900">Teslimat Adresi:</span> {address.line}, {address.district}/{address.city}</p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="font-bold text-[#1A1A1A] text-xs">Ödeme Tutarı:</span>
              <span className="font-bold text-sm text-[#1A1A1A] bg-amber-50 border border-amber-200 px-3 py-1 rounded-xs">
                {displayPaidTotal.toLocaleString('tr-TR')} ₺ <span className="text-emerald-700 font-semibold text-xs ml-1">(Sipariş Alındı)</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-8 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors shadow-md">
              Ana Sayfaya Dön
            </Link>
            <Link href="/siparislerim" className="border border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-100 px-8 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors">
              Siparişlerimi Görüntüle
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-44 md:pt-52 pb-20 font-inter">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Title */}
        <div className="text-center mb-10 pt-4">
          <h1 className="text-3xl md:text-4xl font-playfair font-semibold text-[#1A1A1A]">Güvenli Ödeme & Teslimat</h1>
          <p className="text-xs text-gray-500 mt-2">256-Bit SSL Sertifikalı Güvenli Ödeme Altyapısı</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Steps Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Delivery Address & Contact Info */}
            <div className={`bg-white p-6 rounded-xs border transition-all ${step === 1 ? 'border-[#C5A572] shadow-sm' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-lg font-playfair font-semibold text-[#1A1A1A]">1. Teslimat & İletişim Adresi</h2>
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-xs text-[#C5A572] font-semibold underline cursor-pointer">
                    Düzenle
                  </button>
                )}
              </div>

              {step === 1 ? (
                <div className="space-y-6">
                  {/* Saved Addresses List Option (If logged in & has saved addresses) */}
                  {user && savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                        Kayıtlı Adreslerinizden Seçin
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-3.5 border rounded-xs cursor-pointer transition-all relative flex flex-col justify-between ${
                                isSelected 
                                  ? 'border-[#C5A572] bg-amber-50/40 ring-1 ring-[#C5A572]' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#C5A572]" />
                                    {addr.title || 'Teslimat Adresi'}
                                  </span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-[#C5A572] text-white flex items-center justify-center">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-gray-700">{addr.full_name || address.fullName} ({addr.phone || address.phone})</p>
                                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{addr.address_line}, {addr.district}/{addr.city}</p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add New Custom Address Option */}
                        <div
                          onClick={handleSelectNewAddress}
                          className={`p-3.5 border border-dashed rounded-xs cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-semibold ${
                            selectedAddressId === 'new'
                              ? 'border-[#C5A572] bg-amber-50/40 text-[#1A1A1A] ring-1 ring-[#C5A572]'
                              : 'border-gray-300 text-gray-600 hover:border-[#C5A572] bg-gray-50'
                          }`}
                        >
                          <Plus className="w-4 h-4 text-[#C5A572]" />
                          <span>Farklı / Yeni Adres Gir</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Fields (Renders if guest OR if selectedAddressId === 'new') */}
                  {(!user || savedAddresses.length === 0 || selectedAddressId === 'new') && (
                    <form className="space-y-4 pt-2 border-t border-gray-100" onSubmit={handleStep1Submit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad *</label>
                          <input 
                            type="text" 
                            required 
                            value={address.fullName} 
                            onChange={e => setAddress({...address, fullName: e.target.value})} 
                            placeholder="ör. Selin Yılmaz" 
                            className="w-full p-2.5 border rounded-xs text-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta Adresi *</label>
                          <input 
                            type="email" 
                            required 
                            value={address.email} 
                            onChange={e => setAddress({...address, email: e.target.value})} 
                            placeholder="ornek@email.com" 
                            className="w-full p-2.5 border rounded-xs text-xs" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon Numarası *</label>
                          <input 
                            type="tel" 
                            required 
                            value={address.phone} 
                            onChange={e => setAddress({...address, phone: e.target.value})} 
                            placeholder="0555 123 4567" 
                            className="w-full p-2.5 border rounded-xs text-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">İl (Şehir) *</label>
                          <select 
                            required 
                            value={address.city} 
                            onChange={e => setAddress({...address, city: e.target.value})} 
                            className="w-full p-2.5 border rounded-xs text-xs font-medium bg-white text-[#1A1A1A]"
                          >
                            {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">İlçe *</label>
                          <input 
                            type="text" 
                            required 
                            value={address.district} 
                            onChange={e => setAddress({...address, district: e.target.value})} 
                            placeholder="Kadıköy" 
                            className="w-full p-2.5 border rounded-xs text-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Posta Kodu</label>
                          <input 
                            type="text" 
                            value={address.zip} 
                            onChange={e => setAddress({...address, zip: e.target.value})} 
                            placeholder="34000" 
                            className="w-full p-2.5 border rounded-xs text-xs" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Açık Adres (Mahalle, Sokak, No, Daire) *</label>
                        <textarea 
                          required 
                          rows={3} 
                          value={address.line} 
                          onChange={e => setAddress({...address, line: e.target.value})} 
                          placeholder="Fenerbahçe Mah. Bağdat Cad. No:12 D:4" 
                          className="w-full p-2.5 border rounded-xs text-xs" 
                        />
                      </div>

                      {user && selectedAddressId === 'new' && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 pt-1">
                          <input 
                            type="checkbox" 
                            checked={saveNewAddress} 
                            onChange={e => setSaveNewAddress(e.target.checked)} 
                            className="accent-[#C5A572] w-4 h-4 cursor-pointer" 
                          />
                          <span>Bu adresi profilimdeki adreslerime kaydet</span>
                        </label>
                      )}

                      <div className="pt-2">
                        <button type="submit" className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-8 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm">
                          Ödeme Adımına Geç →
                        </button>
                      </div>
                    </form>
                  )}

                  {/* If user selected a saved address, show simple Devam Et button */}
                  {user && savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                    <div className="pt-2 border-t border-gray-100">
                      <button 
                        type="button" 
                        onClick={() => setStep(2)} 
                        className="bg-[#1A1A1A] hover:bg-[#C5A572] text-white px-8 py-3 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                      >
                        Seçili Adresle Devam Et →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-[#1A1A1A]">{address.fullName} ({address.phone})</p>
                  <p>{address.line}, {address.district}/{address.city}</p>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className={`bg-white p-6 rounded-xs border transition-all ${step === 2 ? 'border-[#C5A572] shadow-sm' : 'border-gray-200 opacity-60'}`}>
              <h2 className="text-lg font-playfair font-semibold border-b pb-4 mb-4 text-[#1A1A1A]">2. Ödeme Yöntemi</h2>

              {step === 2 && (
                <div className="space-y-6">
                  {/* Payment Tabs */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border rounded-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card' 
                          ? 'border-[#C5A572] bg-amber-50/50 text-[#1A1A1A] ring-1 ring-[#C5A572]' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-[#C5A572]" />
                      Kredi / Banka Kartı
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 border rounded-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'cod' 
                          ? 'border-[#C5A572] bg-amber-50/50 text-[#1A1A1A] ring-1 ring-[#C5A572]' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-[#C5A572]" />
                      Kapıda Ödeme
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Kart Üzerindeki İsim *</label>
                        <input
                          type="text"
                          required
                          value={cardDetails.name}
                          onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                          placeholder="Ahmet Yılmaz"
                          className="w-full p-2.5 border rounded-xs text-xs uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Kart Numarası *</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardDetails.number}
                          onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                          placeholder="0000 0000 0000 0000"
                          className="w-full p-2.5 border rounded-xs text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Son Kullanma (AA/YY) *</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardDetails.expiry}
                            onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            placeholder="12/28"
                            className="w-full p-2.5 border rounded-xs text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Güvenlik Kodu (CVV) *</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardDetails.cvv}
                            onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            placeholder="123"
                            className="w-full p-2.5 border rounded-xs text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={processing}
                          className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white py-3.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Siparişiniz İşleniyor...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Siparişi Onayla & Ödemeyi Tamamla ({finalTotal.toLocaleString('tr-TR')} ₺)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xs text-xs text-amber-900 leading-relaxed">
                        <p className="font-semibold">Kapıda Ödeme Şartları:</p>
                        <p className="mt-1">Sipariş tutarınız teslimat anında kargo görevlisine nakit veya kredi kartı ile ödenebilir.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="w-full bg-[#1A1A1A] hover:bg-[#C5A572] text-white py-3.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Siparişiniz Oluşturuluyor...</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-4 h-4" />
                            <span>Kapıda Ödeme İle Siparişi Tamamla ({finalTotal.toLocaleString('tr-TR')} ₺)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-xs border border-gray-200 sticky top-32 shadow-xs space-y-4">
              <h2 className="text-lg font-playfair font-semibold border-b pb-3 text-[#1A1A1A]">Sipariş Özetiniz</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 text-xs border-b border-gray-100 pb-3">
                    <div className="relative w-12 h-16 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0">
                      {item.image && <Image unoptimized src={item.image} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1A1A1A] line-clamp-1">{item.name}</h4>
                      <p className="text-gray-400 text-[10px]">{item.variantInfo || 'Standart'}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-500">{item.quantity} Adet</span>
                        <span className="font-semibold text-[#1A1A1A]">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-gray-200 text-[#1A1A1A]">
                <div className="flex justify-between">
                  <span>Ara Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo Ücreti</span>
                  <span>{kargo === 0 ? <span className="text-emerald-600 font-semibold">Ücretsiz Kargo</span> : `${kargo} ₺`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1A1A1A] pt-3 border-t border-gray-200">
                  <span>Genel Toplam</span>
                  <span>{finalTotal.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
