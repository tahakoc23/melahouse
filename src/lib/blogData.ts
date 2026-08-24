export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  date: string
  readTime: string
  category: string
  image: string
  content: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'İpek ve Saten Elbiselerin Bakımı: Uzun Ömürlü Lüksün Sırları',
    slug: 'ipek-ve-saten-elbiselerin-bakimi',
    excerpt: 'Saf ipek ve dökümlü saten kumaşlar, doğru bakımla yıllar boyu ilk günkü ışıltısını ve yumuşak dokusunu korur. İpek giysilerinizi nasıl yıkamalı, ütülemeli ve saklamalısınız?',
    date: '24 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Kumaş & Bakım Rehberi',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">MELA HOUSE koleksiyonlarında kullanılan saf ipek ve dökümlü premium saten kumaşlar, <strong>online kadın giyim</strong> dünyasında zamansız lüksün simgesidir. Hassas doğal dokuları sebebiyle doğru bakım ilkeleri uygulandığında yıllar boyu ilk günkü ışıltısını korur.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. İpek ve Saten Kumaşların Yıkama Esasları</h3>
      <p>Saf ipek giysiler ve <strong>günlük şık elbise</strong> tasarımları kesinlikle yüksek sıcaklıkta veya klasik çamaşır makinelerinin sıkma programlarında yıkanmamalıdır. Soğuk suda (maksimum 30°C), ipek kumaşa özel pH dengeli şampuanlar ile elde çitilemeden yıkanması tavsiye edilir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Kurutma ve Ütüleme Teknikleri</h3>
      <p>Lüks <strong>kadın giyim</strong> ürünlerinizi asarken doğrudan güneş ışığına maruz bırakmaktan kaçının. Ütüleme işleminde elbisenin ters yüzünü çevirip düşük ısıda (ipek ayarında) veya buharlı dikey ütü ile kırışıklıklar giderilmelidir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Muhafaza Koşulları</h3>
      <p>İpek elbiselerinizi nefes alabilen pamuklu elbise kılıflarında saklayarak nem ve tozdan koruyabilirsiniz.</p>
    `
  },
  {
    id: '2',
    title: 'Düğün İçin Sade ve Şık Kadın Elbise Modelleri & Kombin Tüyoları',
    slug: 'dusun-icin-sade-ve-sik-kadin-elbise-modelleri',
    excerpt: 'Düğün ve davetlerde hem göz alıcı hem de zarif görünmenin sırrı: Düğün için sade ve şık kadın elbise modelleri, renk paletleri ve aksesuar önerileri.',
    date: '23 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Davet & Abiye',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Özel günlerde abartıdan uzak ama büyüleyici bir şıklık yakalamak isteyen kadınlar için <strong>düğün için sade ve şık kadın elbise modelleri</strong> harika bir seçenektir. Zarafet, detayların mükemmel uyumunda gizlidir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Uzun Elbise Modelleri İle Zamansız Zarafet</h3>
      <p>Özellikle kır ve salon düğünlerinde dökümlü <strong>uzun elbise modelleri</strong> ve saten kruvaze elbiseler zarafetinizi öne çıkarır. Şampanya, pudra ve zümrüt yeşili tonları bu sezonun en popüler davet renkleridir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Abiye Elbise Modellerinde Kumaş Kalitesinin Önemi</h3>
      <p>Farklı <strong>abiye elbise modelleri</strong> arasında seçim yaparken kumaşın duruşu en belirleyici unsurdur. Premium ipek şifon ve saten kumaşlar, hareket ettikçe akıcı bir görünüm sağlar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Aksesuar ve Ayakkabı Tamamlayıcıları</h3>
      <p>Sade elbiselerinizi pırlanta veya inci takılar ve ince bantlı topuklu ayakkabılar ile kombinleyerek zahmetsiz bir zarafet elde edebilirsiniz.</p>
    `
  },
  {
    id: '3',
    title: 'En İyi ve Güvenilir Kadın Giyim Siteleri Seçim Rehberi',
    slug: 'en-iyi-ve-guvenilir-kadin-giyim-siteleri',
    excerpt: 'İnternetten güvenli kıyafet alışverişi yaparken dikkat edilmesi gereken güvenlik kriterleri, hızlı kargo, şeffaf iade süreçleri ve kumaş kalitesi rehberi.',
    date: '22 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Alışveriş Rehberi',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Dijital dünyada <strong>en iyi ve güvenilir kadın giyim siteleri</strong> arasında doğru tercihi yapmak, hem bütçenizi korur hem de hayal ettiğiniz kaliteye ulaşmanızı sağlar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. SSL ve Güvenli Ödeme Altyapısı</h3>
      <p>Önde gelen <strong>kadın giyim siteleri</strong> 256-bit SSL güvenlik sertifikası ve Shopier / Iyzico gibi lisanslı ödeme altyapıları kullanır. Alışveriş yapmadan önce adres çubuğundaki kilit simgesini kontrol edin.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Beden Tablosu ve Detaylı Ürün Fotoğrafları</h3>
      <p>Profesyonel <strong>online kadın giyim</strong> platformları ürünlerinin kumaş içeriğini, model ölçülerini ve detaylı beden tablosunu şeffafça paylaşır.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Şeffaf İade ve Değişim Politikası</h3>
      <p>MELA HOUSE olarak 14 gün koşulsuz iade ve hızlı müşteri desteği sunarak müşterilerimize güvenli bir alışveriş deneyimi sağlıyoruz.</p>
    `
  },
  {
    id: '4',
    title: 'Kısa Boylular İçin Elbise Modelleri Nasıl Seçilir? İllüzyon Tüyoları',
    slug: 'kisa-boylular-icin-elbise-modelleri-nasil-secilir',
    excerpt: 'Minyon kadınlar için boyu daha uzun ve silueti zarif gösteren elbise modelleri, V yaka kesimler, yüksek bel detayları ve doğru etek boyu seçim rehberi.',
    date: '21 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Vücut Tipine Göre Stil',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Pek çok minyon kadın <strong>kısa boylular için elbise modelleri nasıl seçilir</strong> sorusunun yanıtını arar. Doğru optik illüzyonlar ve kalıp tercihleri ile daha uzun ve dengeli bir görünüm elde etmek mümkündür.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. V Yaka ve Yüksek Bel Kesimler</h3>
      <p>Farklı <strong>kadın elbise modelleri</strong> incelenirken V yaka ve göğüs altından başlayan yüksek bel kesimler gövdeyi uzun gösterir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Monokrom Tek Renk Şıklığı</h3>
      <p>Üst ve alt giyimde aynı renk tonlarını kullanmak vücudu kesintisiz bir çizgi gibi algılatır. Çiçekli <strong>yazlık elbise</strong> seçimlerinde ise küçük desenli kumaşlar tercih edilmelidir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">3. Etek Boyu Seçimi</h3>
      <p>Diz üstü biter mini elbiseler ya da bileği açıkta bırakan yırtmaçlı <strong>uzun elbise modelleri</strong> bacak boyunu daha uzun gösterir.</p>
    `
  },
  {
    id: '5',
    title: 'Ofis İçin Kadın Kumaş Pantolon Ceket Kombinleri & Kurumsal Şıklık',
    slug: 'ofis-icin-kadin-kumas-pantolon-ceket-kombinleri',
    excerpt: 'İş hayatında güçlü, profesyonel ve konforlu bir duruş için ofis için kadın kumaş pantolon ceket kombinleri, yüksek bel kesimler ve oversize blazer stili.',
    date: '20 Ağustos 2026',
    readTime: '9 dk okuma',
    category: 'Ofis Modası',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">İş yaşamında stiliniz vizyonunuzun aynasıdır. <strong>Ofis için kadın kumaş pantolon ceket kombinleri</strong>, hem konforu hem de otoriter şıklığı bir arada sunar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Yüksek Bel Kumaş Pantolon Şıklığı</h3>
      <p>Kırışmayan kaliteli kumaşlardan üretilen <strong>yüksek bel kumaş pantolon</strong> modelleri, gün boyu toplantılarda rahatlık ve şıklık vadeder.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Kadın Blazer Ceket İle Modern Dokunuş</h3>
      <p>Klasik kesim veya dökümlü <strong>kadın blazer ceket</strong> tasarımlarını içine giyeceğiniz <strong>kadın şifon bluz</strong> veya <strong>kadın basic tişört</strong> ile kombinleyerek modern <strong>ofis kombinleri kadın</strong> stili oluşturabilirsiniz.</p>
    `
  },
  {
    id: '6',
    title: 'Siyah Mini Elbise Kombinleri: Her Ortama Uyum Sağlayan Zamansız Şıklık',
    slug: 'siyah-mini-elbise-kombinleri-zamansiz-siklik',
    excerpt: 'Coco Chanel’den günümüze kadın gardırobunun en kurtarıcı parçası olan siyah mini elbise nasıl kombinlenir? Gündüz spor, gece şık stil önerileri.',
    date: '19 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Kombin Rehberi',
    image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Her kadının dolabında mutlaka bulunması gereken ikonik parça hiç şüphesiz <strong>siyah mini elbise</strong> modelleridir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Gündüz Şıklığı</h3>
      <p>Siyah mini elbiseyi sneaker ve <strong>kadın oversize gömlek</strong> ile tamamlayarak spor ve dinamik <strong>günlük şık elbise</strong> tarzı yakalayabilirsiniz.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Gece Davetleri</h3>
      <p>Şık bir topuklu ayakkabı ve <strong>deri ceket kadın</strong> stili ile birleştirerek iddialı <strong>kadın kıyafet kombinleri</strong> oluşturabilirsiniz.</p>
    `
  },
  {
    id: '7',
    title: 'Kadın Trençkot Modelleri ve Sonbahar Şıklığı Rehberi',
    slug: 'kadin-trenckot-modelleri-ve-sonbahar-kombinleri',
    excerpt: 'Mevsim geçişlerinin vazgeçilmezi kadın trençkot modelleri, taba, bej ve siyah tonları, kemer detayları ve doğru kombin yöntemleri.',
    date: '18 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Dış Giyim',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Sonbaharın yağmurlu ve rüzgarlı günlerinde zarafetinizden ödün vermemek için <strong>kadın trençkot modelleri</strong> en ikonik dış giyim parçasıdır.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Zamansız Bej ve Taba Tonları</h3>
      <p>Klasik kruvaze kemerli trençkotlar her tarz elbiseyle mükemmel uyum sağlar. Kış aylarında ise yerini <strong>kadın kaban</strong> ve <strong>deri ceket kadın</strong> tasarımlarına bırakır.</p>
    `
  },
  {
    id: '8',
    title: 'Abiye Elbise Modelleri: Söz, Nişan ve Mezuniyet Elbiseleri Rehberi',
    slug: 'abiye-elbise-modelleri-soz-nisan-mezuniyet',
    excerpt: 'Hayatınızın en özel günlerinde göz alıcı olun: Söz nişan elbiseleri, mezuniyet elbiseleri ve nikah elbisesi kadın modellerinde en trend renkler ve kesimler.',
    date: '17 Ağustos 2026',
    readTime: '9 dk okuma',
    category: 'Davet & Abiye',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Özel kutlama ve davetlerde <strong>abiye elbise modelleri</strong> seçimi büyüleyici bir anı bırakmanın anahtarıdır.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Söz Nişan Elbiseleri</h3>
      <p>Evde veya salonda gerçekleşen söz merasimlerinde pastel tonlarda <strong>söz nişan elbiseleri</strong> ve saten balık elbiseler tercih edilir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Mezuniyet Elbiseleri</h3>
      <p>Genç ve dinamik <strong>mezuniyet elbiseleri</strong> seçiminde uçuş uçuş yırtmaçlı şifon veya sırt dekolteli elbiseler öne çıkar.</p>
    `
  },
  {
    id: '9',
    title: 'Modern Nikah Elbisesi Kadın Modelleri ve Nikah Kombin İpuçları',
    slug: 'nikah-elbisesi-kadin-sade-ve-modern-tasarimlar',
    excerpt: 'Geleneksel gelinliklerin ötesinde modern ve zarif nikah elbisesi kadın tasarımları, ipek şapka & duvak aksesuarları ve ayakkabı tercihleri.',
    date: '16 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Özel Günler',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Son yıllarda sadeliği benimseyen gelin adayları için <strong>nikah elbisesi kadın</strong> modelleri büyük bir trend haline geldi.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Sade ve Şık Tasarımlar</h3>
      <p>Dökümlü kırık beyaz saten elbiseler, <strong>düğün için sade ve şık kadın elbise modelleri</strong> arayanlar için unutulmaz bir zarafet sunar.</p>
    `
  },
  {
    id: '10',
    title: 'Kadın İkili Takım ve Kadın Triko Takım Rahatlığı',
    slug: 'kadin-ikili-takim-ve-triko-takim-sikligi',
    excerpt: 'Hem evde hem sokakta çabasız şıklık: Kadın ikili takım, kadın triko takım ve kışlık kadın ev giyim koleksiyonları ile üst düzey konfor.',
    date: '15 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Takım & Konfor',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Günlük hayatta pratik ve uyumlu görünmenin en kolay yolu <strong>kadın ikili takım</strong> modelleridir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">Triko Takımların Sıcaklığı</h3>
      <p>Yumuşak dokulu <strong>kadın triko takım</strong> ve <strong>kışlık kadın ev giyim</strong> ürünleri soğuk havalarda stilden ödün vermeden konfor sunar.</p>
    `
  },
  {
    id: '11',
    title: 'Mom Jean Kadın ve Yüksek Bel Kumaş Pantolon Kombinleri',
    slug: 'mom-jean-kadin-ve-yuksek-bel-pantolon-kombinleri',
    excerpt: 'Sokak modasından ofise uzanan pantolon şıklığı: Mom jean kadın ve yüksek bel kumaş pantolon kombinlerinde doğru parça seçimleri.',
    date: '14 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Pantolon & Jean',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Rahat kesimiyle vintage bir hava katan <strong>mom jean kadın</strong> pantolonlar günümüz sokak modasının başrolündedir.</p>
    `
  },
  {
    id: '12',
    title: 'Kadın Oversize Gömlek ve Kadın Şifon Bluz İle Şık Kombinler',
    slug: 'kadin-oversize-gomlek-ve-sifon-bluz-trendleri',
    excerpt: 'Her mevsime uyum sağlayan maskülen ve feminen dokunuşlar: Kadın oversize gömlek ve uçuş uçuş kadın şifon bluz stilleri.',
    date: '13 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Üst Giyim',
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Zamansız bir şıklık için <strong>kadın oversize gömlek</strong> ve şeffaf dokulu <strong>kadın şifon bluz</strong> modelleri vazgeçilmezdir.</p>
    `
  },
  {
    id: '13',
    title: 'Crop Top Modelleri Nasıl Kombinlenir? Yüksek Bel Şıklığı',
    slug: 'crop-top-modelleri-ve-yuksek-bel-pantolonlar',
    excerpt: 'Yaz sezonunun ve sokak modasının gözdesi crop top modelleri ile yüksek bel kumaş pantolon ve etek kombinleme tüyoları.',
    date: '12 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Trendler',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Genç ve dinamik tarzın simgesi olan <strong>crop top modelleri</strong>, yüksek bel alt giyim parçalarıyla birleştiğinde mükemmel bir vücut oranı sunar.</p>
    `
  },
  {
    id: '14',
    title: 'Yazlık Elbise ve Uzun Elbise Modelleri İle Renkli Sezon Trendleri',
    slug: 'yazlik-elbise-ve-uzun-elbise-modelleri',
    excerpt: 'Sıcak yaz günlerinde serin ve şık kalın: Uçuş uçuş yazlık elbise, desenli uzun elbise modelleri ve plaj giyim kadın önerileri.',
    date: '11 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Yaz Modası',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Güneşin enerjisini stilinize yansıtan <strong>yazlık elbise</strong> ve <strong>uzun elbise modelleri</strong> ile sezonun en renkli kombinlerini hazırlayın.</p>
    `
  },
  {
    id: '15',
    title: 'Kışlık Kadın Ev Giyim ve Konforlu Triko Tasarımlar',
    slug: 'kislik-kadin-ev-giyim-ve-konforlu-triko-tasarimlar',
    excerpt: 'Soğuk günlerde evde şıklık ve sıcaklık: Kışlık kadın ev giyim, kadın triko takım ve yumuşacık dokular.',
    date: '10 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Ev Giyimi',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Evde geçirilen zaman kalitesini artıran <strong>kışlık kadın ev giyim</strong> koleksiyonları estetik ve konforu harmanlar.</p>
    `
  },
  {
    id: '16',
    title: 'Plaj Giyim Kadın Modası: Pareo, İpek Kimono ve Şık Mayolar',
    slug: 'plaj-giyim-kadin-pareo-ve-kimono-modasi',
    excerpt: 'Tatil gardırobunuzun star parçaları: Plaj giyim kadın koleksiyonları, desenli ipek kimonolar ve plaj elbiseleri.',
    date: '09 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Tatil & Plaj',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Deniz kenarında lüksü hissetmek isteyenler için <strong>plaj giyim kadın</strong> modelleri ve ipek kimonolar sezonun favorisidir.</p>
    `
  },
  {
    id: '17',
    title: 'Kadın Kaban ve Deri Ceket Kadın Dış Giyim Rehberi',
    slug: 'kadin-kaban-ve-deri-ceket-kadin-stil-rehberi',
    excerpt: 'Kış aylarında sıcak ve karizmatik duruş: Kadın kaban, deri ceket kadın ve kadın trençkot modelleri ile stilinizi tamamlayın.',
    date: '08 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Dış Giyim',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Kış kombinlerinin ilk göze çarpan unsuru olan <strong>kadın kaban</strong> ve asi duruşlu <strong>deri ceket kadın</strong> tasarımları dış giyim modasına yön veriyor.</p>
    `
  },
  {
    id: '18',
    title: 'Günlük Şık Elbise Modelleri İle Çabasız Zarafet',
    slug: 'gunluk-sik-elbise-ile-cabassiz-zarafet',
    excerpt: 'Günün her saatinde zahmetsiz şıklık: Günlük şık elbise tasarımları, babet ve spor ayakkabı kombinasyonları.',
    date: '07 Ağustos 2026',
    readTime: '5 dk okuma',
    category: 'Günlük Moda',
    image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Sabah ne giyeceğim derdine son veren <strong>günlük şık elbise</strong> tasarımları ile çabasız zarafetin tadını çıkarın.</p>
    `
  },
  {
    id: '19',
    title: 'Kadın Kıyafet Kombinleri: Renk Uyumları ve Kapsül Gardırop',
    slug: 'kadin-kiyafet-kombinleri-renk-uyumu-ve-stil',
    excerpt: 'Farklı parçaları doğru eşleştirme sanatı: Kadın kıyafet kombinleri, renk çarkı uyumu ve gardırop detoksu.',
    date: '06 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Kombin Rehberi',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Uyumlu ve etkileyici <strong>kadın kıyafet kombinleri</strong> oluşturmak doğru renk paletleri ve kaliteli temel parçalarla başlar.</p>
    `
  },
  {
    id: '20',
    title: 'Online Kadın Giyim Alışverişinde Doğru Beden ve Kumaş Seçimi',
    slug: 'online-kadin-giyim-alisverisinde-beden-secim-tuyolari',
    excerpt: 'İnternetten kıyafet alırken iade riski olmadan tam uyan beden seçimi, kumaş esnekliği ve kalıp rehberi.',
    date: '05 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Alışveriş Tüyoları',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Keyifli bir <strong>online kadın giyim</strong> alışverişi için vücut ölçülerinizi doğru almak ve kumaş içeriklerini iyi okumak gerekir.</p>
    `
  },
  {
    id: '21',
    title: 'Kadın Blazer Ceket İle Geceden Gündüze Şık Kombinler',
    slug: 'kadin-blazer-ceket-ile-geceden-gunduze-kombinler',
    excerpt: 'Gardırobun en joker parçası: Kadın blazer ceket modelleri ile jean, elbise ve kumaş pantolon eşleştirmeleri.',
    date: '04 Ağustos 2026',
    readTime: '6 dk okuma',
    category: 'Ceket & Kombin',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">İster ofiste ister akşam yemeğinde: <strong>kadın blazer ceket</strong> her kombine anında sofistike bir dokunuş katar.</p>
    `
  },
  {
    id: '22',
    title: 'Sessiz Lüks (Quiet Luxury) ve Zamansız Kadın Giyim Felsefesi',
    slug: 'sessiz-luks-ve-zamansiz-kadin-giyim-felsefesi',
    excerpt: 'Logolardan uzak, kumaş kalitesi ve kusursuz dikimle öne çıkan sessiz lüks akımı ve MELA HOUSE tasarım felsefesi.',
    date: '03 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Moda Felsefesi',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Dünyayı kasıp kavuran sessiz lüks trendi, <strong>kadın giyim</strong> dünyasına kalite odaklı ve zamansız bir yaklaşım getiriyor.</p>
    `
  },
  /* --- 8 YENİ KADIN İÇ GİYİM & LÜKS EV GİYİMİ SEO REHBERİ --- */
  {
    id: '23',
    title: 'İpek Gecelik ve Saten Sabahlık Seçim Rehberi: Lüks İç Giyim Şıklığı',
    slug: 'ipek-gecelik-ve-saten-sabahlik-kombin-rehberi',
    excerpt: 'Evde ve özel anlarınızda kendinizi şımartmanın en zarif yolu. Lüks kadın iç giyim, ipek gecelik modelleri ve dantel detaylı saten sabahlık tüyoları.',
    date: '02 Ağustos 2026',
    readTime: '7 dk okuma',
    category: 'Lüks İç Giyim',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Cildinize dokunan en zarif kumaşlardan üretilen <strong>lüks kadın iç giyim</strong> ve <strong>ipek gecelik modelleri</strong>, günün yorgunluğunu üzerinizden atarken zarafetinizi korumanızı sağlar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. İpek Geceliklerin Cilt Sağlığına Faydaları</h3>
      <p>Saf ipek, yapısı gereği protein lifleri içerir ve cildin nem dengesini korumaya yardımcı olur. Farklı <strong>kadın iç giyim modelleri</strong> arasında %100 ipek gecelikler, aşınmayı önleyerek gece boyunca pürüzsüz bir uyku kalitesi sunar.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">2. Saten Sabahlık ve Kimono Kombinleri</h3>
      <p>Sabah uyandığınızda veya akşam dinlenirken üzerinize geçireceğiniz dökümlü bir <strong>saten sabahlık ve kimono</strong>, evdeki duruşunuza anında sofistike bir dokunuş katar.</p>
    `
  },
  {
    id: '24',
    title: 'Dantelli Büstiyer ve Jartiyer Takımı Nasıl Kombinlenir?',
    slug: 'dantelli-bustiyer-ve-jartiyer-takimi-sikligi',
    excerpt: 'Feminenliğin vurgusu dantelli büstiyer, jartiyer takımı ve ipek fantezi iç giyim tasarımlarında doğru beden ve stil seçim rehberi.',
    date: '01 Ağustos 2026',
    readTime: '8 dk okuma',
    category: 'Lüks İç Giyim',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Özel koleksiyonların en göz alıcı parçalarından olan <strong>dantelli büstiyer</strong> ve <strong>jartiyer takımı</strong>, özgüvenli ve çekici bir stil yaratmak isteyen kadınların bir numaralı tercihidir.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Dantelli Büstiyerlerin Dış Giyimde Kullanımı</h3>
      <p>Günümüz modasında <strong>ipek fantezi iç giyim</strong> ve büstiyer parçaları artık sadece elbise altında kalmıyor; şık bir <strong>kadın blazer ceket</strong> içine giyilerek gece davetlerinde iddialı bir kombin oluşturuyor.</p>
    `
  },
  {
    id: '25',
    title: 'Çeyizlik İç Giyim Seti ve Gelin İç Giyim Takımları Seçim Rehberi',
    slug: 'ceyizlik-ic-giyim-seti-ve-gelin-bohcasi-rehberi',
    excerpt: 'Gelin adaylarının çeyiz bohçası için en şık ve kaliteli çeyizlik iç giyim seti, gelin iç giyim takımları ve ipek sabahlık önerileri.',
    date: '31 Temmuz 2026',
    readTime: '9 dk okuma',
    category: 'Çeyiz & Gelin',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Evlilik hazırlığındaki gelin adayları için hazırlanan <strong>çeyizlik iç giyim seti</strong> ve <strong>gelin iç giyim takımları</strong>, çeyiz bohçasının en özel ve değerli parçalarıdır.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Çeyizlik Setlerde Olması Gereken Parçalar</h3>
      <p>Eksiksiz bir çeyizlik <strong>kadın iç giyim modelleri</strong> seçkisinde dantelli gecelik seti, saten sabahlık, 6'lı iç çamaşırı takımı ve ev terliği yer almalıdır.</p>
    `
  },
  {
    id: '26',
    title: 'İz Yapmayan Dikişsiz Çamaşır ve Günlük Pamuklu İç Giyim Tüyoları',
    slug: 'iz-yapmayan-dikissiz-camasir-ve-gunluk-konfor',
    excerpt: 'Dar elbise ve kumaş pantolonların altında belli olmayan iz yapmayan dikişsiz çamaşır modelleri ve nefes alan günlük pamuklu iç giyim rehberi.',
    date: '30 Temmuz 2026',
    readTime: '6 dk okuma',
    category: 'Günlük İç Giyim',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Özellikle dar abiyeler veya beyaz kumaş pantolonlar giyildiğinde kıyafet çizgisini bozmayan <strong>iz yapmayan dikişsiz çamaşır</strong> modelleri büyük bir konfor kurtarıcısıdır.</p>

      <h3 className="font-playfair text-2xl font-semibold text-[#1A1A1A] mt-8 mb-4">1. Günlük Pamuklu İç Giyim ve Sağlık</h3>
      <p>Günlük kullanımda cilt sağlığı için %100 organik nefes alabilir <strong>günlük pamuklu iç giyim</strong> çeşitleri tercih edilmelidir.</p>
    `
  },
  {
    id: '27',
    title: 'Büyük Beden Kadın İç Giyim ve Destekli Sütyen Takımı Seçimi',
    slug: 'buyuk-beden-kadin-ic-giyim-ve-destekli-sutyen-takimi',
    excerpt: 'Kavisli ve kıvrımlı hatlara sahip kadınlar için toparlayıcı ve rahat büyük beden kadın iç giyim, destekli sütyen takımı seçim tüyoları.',
    date: '29 Temmuz 2026',
    readTime: '7 dk okuma',
    category: 'İç Giyim Rehberi',
    image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Doğru beden ve askı yapısına sahip <strong>büyük beden kadın iç giyim</strong> ve <strong>destekli sütyen takımı</strong> seçimi omurga sağlığı ve duruş zarafeti için kritik önem taşır.</p>
    `
  },
  {
    id: '28',
    title: 'Kadın Pijama Takımı Saten Şıklığı ve Ev Modası Trendleri',
    slug: 'saten-pijama-takimi-ve-kadin-ev-giyim-trendleri',
    excerpt: 'Evdeki şıklığınızı taçlandıran düğmeli kadın pijama takımı saten modelleri, ipek ev elbiseleri ve kadın ev giyim ve iç giyim kombinleri.',
    date: '28 Temmuz 2026',
    readTime: '6 dk okuma',
    category: 'Ev Modası',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Son dönemde ev modasının en popüler trendi olan <strong>kadın pijama takımı saten</strong> koleksiyonları, pürüzsüz dokusuyla kendinizi özel hissettirir.</p>
    `
  },
  {
    id: '29',
    title: 'Şeffaf Babydoll ve İpek Fantezi İç Giyim Modasında Zarafet',
    slug: 'seffaf-babydoll-ve-ipek-fantezi-ic-giyim-modasi',
    excerpt: 'Tül ve dantelin romantik buluşması: Şeffaf babydoll modelleri, ipek fantezi iç giyim ve özel geceler için cesur tasarımlar.',
    date: '27 Temmuz 2026',
    readTime: '6 dk okuma',
    category: 'Lüks İç Giyim',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">Gizemli ve romantik dokunuşlar sunan <strong>şeffaf babydoll</strong> ve <strong>ipek fantezi iç giyim</strong> tasarımları incelikli dantel işçilikleriyle büyüler.</p>
    `
  },
  {
    id: '30',
    title: 'En İyi Kadın İç Giyim Markaları ve Kumaş Kalitesi Seçim Rehberi',
    slug: 'en-iyi-kadin-ic-giyim-markalari-ve-kumas-kalitesi',
    excerpt: 'Kaliteli, uzun ömürlü ve sağlıklı çamaşır alışverişi yaparken nelere dikkat edilmeli? En iyi kadın iç giyim markaları kıyaslaması.',
    date: '26 Temmuz 2026',
    readTime: '8 dk okuma',
    category: 'Alışveriş Rehberi',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop',
    content: `
      <p class="lead font-medium text-gray-800 text-base leading-relaxed">İç giyim alışverişinde doğru seçim yapmak <strong>en iyi kadın iç giyim markaları</strong> ve kumaş etiketi okuma bilinciyle mümkündür.</p>
    `
  }
]
