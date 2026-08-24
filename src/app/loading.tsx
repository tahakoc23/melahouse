export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <h1 className="font-playfair text-4xl tracking-widest text-black">
          MELA HOUSE
        </h1>
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-transparent border-b-gold-dark rounded-full animate-spin-slow"></div>
        </div>
      </div>
    </div>
  );
}
