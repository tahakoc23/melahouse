// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Package, Truck, CheckCircle2, Clock, MapPin, RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Siparişlerim | Veloria",
};

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

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/giris?redirect=/siparislerim");
  }

  const adminClient = createAdminClient();
  const { data: orders } = await adminClient
    .from("orders")
    .select("*, order_items(*, products(*, product_images(*)))")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-44 md:pt-52 pb-20 font-inter text-xs">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-playfair font-semibold text-[#1A1A1A]">Siparişlerim</h1>
          <p className="text-xs text-gray-500 mt-2">Geçmiş ve mevcut tüm siparişlerinizin kargo durumunu canlı takip edin.</p>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xs border border-gray-200 shadow-xs max-w-lg mx-auto">
            <Package className="w-12 h-12 text-[#C5A572] mx-auto mb-3" />
            <h3 className="text-lg font-playfair font-semibold mb-1 text-[#1A1A1A]">Henüz siparişiniz bulunmamaktadır</h3>
            <p className="text-gray-500 mb-6 text-xs max-w-xs mx-auto">Veloria lüks kadın giyim koleksiyonunu keşfederek ilk siparişinizi hemen oluşturabilirsiniz.</p>
            <Link href="/urunler" className="inline-flex items-center justify-center h-11 px-8 bg-[#1A1A1A] hover:bg-[#C5A572] text-white font-semibold transition-colors uppercase tracking-wider text-xs shadow-md">
              Koleksiyonu Keşfet
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['siparis_alindi'];
              const StatusIcon = statusCfg.icon;

              const itemsSum = order.order_items?.reduce((sum: number, it: any) => sum + (Number(it.unit_price || it.total_price || 0) * Number(it.quantity || 1)), 0) || 0;
              const orderTotal = Number(order.total ?? order.total_amount ?? itemsSum);

              const deliveryDate = new Date(order.updated_at || order.created_at);
              const diffDays = Math.floor((new Date().getTime() - deliveryDate.getTime()) / (1000 * 3600 * 24));
              const canReturn = order.status === 'teslim_edildi' && diffDays <= 14;

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-xs transition-all hover:border-gray-300">
                  {/* Order Header */}
                  <div className="bg-gray-50/80 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-200 text-xs">
                    <div className="flex flex-wrap gap-6 sm:gap-10">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Sipariş Tarihi</p>
                        <p className="font-semibold text-[#1A1A1A]">
                          {new Date(order.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Toplam Tutar</p>
                        <p className="font-semibold text-[#1A1A1A] text-sm">
                          {formatPrice(orderTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Sipariş Numarası</p>
                        <p className="font-mono font-bold text-[#1A1A1A]">
                          {order.order_number || `VEL-ORD-${order.id.slice(0, 6).toUpperCase()}`}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-bold text-xs ${statusCfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Cargo Shipping Details Banner (if available) */}
                  {(order.cargo_company || order.cargo_tracking_number) && (
                    <div className="bg-purple-50/70 border-b border-purple-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-950">
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
                      <span className="text-[11px] font-medium text-purple-700 bg-purple-100/60 px-2.5 py-1 rounded-xs">
                        Kargo Takibi Aktif
                      </span>
                    </div>
                  )}

                  {/* Return Status Banner: Pending Request */}
                  {order.status === 'iade_talebi' && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
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

                  {/* Return Status Banner: Completed Return */}
                  {order.status === 'iade_edildi' && (
                    <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950">
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

                  {/* Order Step Progress Indicator */}
                  {statusCfg.step > 0 && order.status !== 'iade_talebi' && order.status !== 'iade_edildi' && (
                    <div className="px-6 pt-5 pb-2 border-b border-gray-100 bg-gray-50/30">
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className={`space-y-1 ${statusCfg.step >= 1 ? 'text-sky-700 font-bold' : 'text-gray-400'}`}>
                          <div className={`h-1.5 rounded-full ${statusCfg.step >= 1 ? 'bg-sky-500' : 'bg-gray-200'}`} />
                          <span>1. Sipariş Alındı</span>
                        </div>
                        <div className={`space-y-1 ${statusCfg.step >= 2 ? 'text-indigo-700 font-bold' : 'text-gray-400'}`}>
                          <div className={`h-1.5 rounded-full ${statusCfg.step >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                          <span>2. Hazırlanıyor</span>
                        </div>
                        <div className={`space-y-1 ${statusCfg.step >= 3 ? 'text-[#C5A572] font-bold' : 'text-gray-400'}`}>
                          <div className={`h-1.5 rounded-full ${statusCfg.step >= 3 ? 'bg-[#C5A572]' : 'bg-gray-200'}`} />
                          <span>3. Kargoya Verildi</span>
                        </div>
                        <div className={`space-y-1 ${statusCfg.step >= 4 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                          <div className={`h-1.5 rounded-full ${statusCfg.step >= 4 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                          <span>4. Teslim Edildi</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Body Items */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => {
                        const product = item.products;
                        const mainImg = product?.product_images?.find((img: any) => img.is_primary)?.image_url || product?.product_images?.[0]?.image_url;

                        return (
                          <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                            <div className="relative w-14 h-18 bg-gray-100 rounded-xs overflow-hidden flex-shrink-0 border border-gray-200">
                              {mainImg ? (
                                <Image unoptimized src={mainImg} alt={product?.name || item.product_name || "Ürün"} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1A1A1A] text-xs">{product?.name || item.product_name || "Ürün"}</h4>
                              <p className="text-gray-500 text-[11px] mt-0.5">Adet: <span className="font-medium text-[#1A1A1A]">{item.quantity}</span></p>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-[#1A1A1A] text-xs">{formatPrice(item.unit_price || 0)}</p>
                              <p className="text-gray-400 text-[10px] mt-0.5">Toplam: {formatPrice((item.unit_price || 0) * (item.quantity || 1))}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shipping Address info */}
                    {order.shipping_address && (
                      <div className="pt-3 border-t border-gray-100 flex items-start gap-2 text-[11px] text-gray-600 bg-gray-50/50 p-3 rounded-xs">
                        <MapPin className="w-4 h-4 text-[#C5A572] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-[#1A1A1A]">Teslimat Adresi: </span>
                          <span>{renderAddressText(order.shipping_address)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
