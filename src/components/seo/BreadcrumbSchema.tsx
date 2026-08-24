import JsonLd from './JsonLd';

type BreadcrumbItem = {
  name: string;
  url: string;
};

type BreadcrumbSchemaProps = {
  items: BreadcrumbItem[];
};

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd type="breadcrumb" data={schemaData} />;
}
