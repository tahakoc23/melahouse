type JsonLdProps = {
  type: 'organization' | 'product' | 'breadcrumb' | 'local_business';
  data: any;
};

export default function JsonLd({ type, data }: JsonLdProps) {
  let schemaData = {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://melahouse.net';

  if (type === 'organization') {
    schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'MELA HOUSE',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: [
        'https://instagram.com/melahouse.official',
      ],
      description: 'MELA HOUSE - Lüks Kadın Giyim Markası',
    };
  } else if (type === 'local_business') {
    schemaData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'MELA HOUSE',
      image: `${baseUrl}/logo.png`,
      '@id': baseUrl,
      url: baseUrl,
      telephone: '+905000000000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Moda Sk.',
        addressLocality: 'Kadıköy',
        addressRegion: 'İstanbul',
        postalCode: '34000',
        addressCountry: 'TR'
      }
    };
  } else if (type === 'product' || type === 'breadcrumb') {
      schemaData = data;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
