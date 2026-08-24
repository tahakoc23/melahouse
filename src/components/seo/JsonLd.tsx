type JsonLdProps = {
  type: 'organization' | 'product' | 'breadcrumb' | 'local_business';
  data: any;
};

export default function JsonLd({ type, data }: JsonLdProps) {
  let schemaData = {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veloria.com.tr';

  if (type === 'organization') {
    schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Veloria',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: [
        'https://instagram.com/veloria.official',
      ],
      description: 'Veloria - Lüks Kadın Giyim Markası',
    };
  } else if (type === 'local_business') {
    schemaData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Veloria',
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
