import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import SearchOverlay from '@/components/layout/SearchOverlay'
import PageViewTracker from '@/components/layout/PageViewTracker'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PageViewTracker />
      <Header />
      <main className="min-h-screen flex flex-col">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
    </>
  )
}
