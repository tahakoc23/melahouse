import ProductForm from '@/components/admin/product-form/ProductForm'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { from_supplier } = await searchParams
  const fromSupplierId = typeof from_supplier === 'string' && from_supplier ? from_supplier : null
  // key: aynı sayfada farklı toptancı ürünüyle açılırsa form sıfırdan kurulur
  return <ProductForm key={fromSupplierId || 'new'} mode="create" fromSupplierId={fromSupplierId} />
}
