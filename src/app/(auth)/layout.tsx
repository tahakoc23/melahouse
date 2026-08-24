import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    redirect("/");
  }
  
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 font-serif text-3xl font-bold text-[#1A1A1A] tracking-widest uppercase">
        Veloria
      </Link>
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {children}
      </div>
    </div>
  );
}
