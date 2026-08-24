import JsonLd from './JsonLd';

type ProductSchemaProps = {
  product: {
    name: string;
    description: string;
    images: string[];
    price: number;
    sku?: string;
    inStock?: boolean;
    rating?: number;
    reviewCount?: number;
    url: string;
  };
};

export default function ProductSchema({ product }: ProductSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku || 'N/A',
    brand: {
      '@type': 'Brand',
      name: 'Veloria',
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: 'TRY',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Veloria',
      },
    },
    ...(product.rating && product.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      }
    })
  };

  return <JsonLd type="product" data={schemaData} />;
}
