export const SITE_NAME = 'MELA HOUSE'
export const SITE_DESCRIPTION = 'Lüks Kadın Giyim & İç Giyim'
export const SITE_URL = 'https://melahouse.net'
export const INSTAGRAM_URL = 'https://instagram.com/melahouse.official'
export const INSTAGRAM_HANDLE = '@melahouse.official'
export const SITE_EMAIL = 'info@melahouse.net'


export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  odeme_bekliyor: { label: 'Ödeme Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
  hazirlaniyor: { label: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800' },
  kargoya_verildi: { label: 'Kargoya Verildi', color: 'bg-purple-100 text-purple-800' },
  teslim_edildi: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
  iade_edildi: { label: 'İade Edildi', color: 'bg-orange-100 text-orange-800' },
  iptal_edildi: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
} as const

export const SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Standart'
] as const

export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
] as const
