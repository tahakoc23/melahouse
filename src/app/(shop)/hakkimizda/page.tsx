// @ts-nocheck
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Hakkımızda | Veloria',
  description: 'Veloria lüks kadın giyim markasının hikayesi ve vizyonu.',
};

export default async function AboutPage() {
  const supabase = await createClient();

  const { data: contentData } = await supabase
    .from('site_content')
    .select('title, content')
    .eq('content_key', 'about_text')
    .single();

  const aboutText = (contentData?.content as Record<string, string>)?.text || 'Modern kadının zarafetini ve gücünü yansıtan tasarımlarıyla Veloria, lüks giyimde yeni bir standart belirliyor. Her bir parçamız, özenle seçilmiş kumaşlar ve usta işçilikle hayat buluyor.';

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-28 md:pt-36">
      <JsonLd type="organization" data={null} />
      <div className="container mx-auto px-4 max-w-4xl pb-16">
        <section className="mb-16 bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-xs">
          <h2 className="text-3xl font-playfair text-[#1A1A1A] mb-6 border-b border-gray-100 pb-4">Veloria Hakkında</h2>
          <div className="prose prose-lg text-gray-700 font-inter">
            <p className="whitespace-pre-line leading-relaxed">
              {aboutText}
            </p>
          </div>
        </section>

        <section className="mb-16 grid md:grid-cols-2 gap-8">
          <div className="bg-[#1A1A1A] text-[#FAFAF8] p-8 md:p-12 flex flex-col justify-center rounded-xs">
            <h2 className="text-3xl font-playfair text-[#C5A572] mb-6">Vizyonumuz</h2>
            <p className="font-inter leading-relaxed text-gray-300">
              Dünya çapında tanınan, kalitesi ve zamansız tasarımlarıyla öne çıkan öncü bir Türk lüks giyim markası olmak. Sürdürülebilir üretim anlayışımızla modanın geleceğine yön vermek.
            </p>
          </div>
          <div className="bg-[#C5A572] text-[#1A1A1A] p-8 md:p-12 flex flex-col justify-center rounded-xs">
            <h2 className="text-3xl font-playfair mb-6">Misyonumuz</h2>
            <p className="font-inter leading-relaxed font-medium">
              Her kadının kendini özel, güçlü ve zarif hissetmesini sağlayan koleksiyonlar tasarlamak. Geleneksel el işçiliğini modern tasarım anlayışıyla buluşturarak eşsiz parçalar yaratmak.
            </p>
          </div>
        </section>

        <section className="text-center border-t border-gray-200 pt-16">
          <h3 className="text-2xl font-playfair text-[#1A1A1A] mb-6">Bizi Sosyal Medyada Takip Edin</h3>
          <a 
            href="https://instagram.com/veloria.official" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#1A1A1A] text-[#FAFAF8] font-inter font-medium tracking-wide hover:bg-[#C5A572] transition-colors duration-300 shadow-md"
          >
            @veloria.official
          </a>
        </section>
      </div>
    </div>
  );
}
