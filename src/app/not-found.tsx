import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-playfair text-[#C5A572] mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl font-playfair text-[#1A1A1A] mb-6">Sayfa Bulunamadı</h2>
        <p className="text-gray-600 font-inter mb-10 max-w-md mx-auto">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. 
          Yeni koleksiyonlarımızı keşfetmek için ana sayfaya dönebilirsiniz.
        </p>
        <Link 
          href="/" 
          className="inline-block px-8 py-4 bg-[#1A1A1A] text-[#FAFAF8] font-inter font-medium tracking-wide hover:bg-[#C5A572] transition-colors duration-300"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
