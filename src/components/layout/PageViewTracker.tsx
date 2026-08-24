"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PageViewTracker() {
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Only track shop pages (don't track admin pages or API routes)
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const trackUniqueVisitor = async () => {
      try {
        // Calculate today's date in Turkey local timezone
        const now = new Date();
        const trDate = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
        const todayStr = `${trDate.getFullYear()}-${String(trDate.getMonth() + 1).padStart(2, '0')}-${String(trDate.getDate()).padStart(2, '0')}`;

        const lastVisited = localStorage.getItem("melahouse_unique_visited_date");

        // If user already visited today, DO NOT increment count (counted as 1 unique visitor per day!)
        if (lastVisited === todayStr) {
          return;
        }

        // Mark as visited today and call RPC
        localStorage.setItem("melahouse_unique_visited_date", todayStr);
        await supabase.rpc('increment_daily_unique_visitor');
      } catch (err) {
        console.error("Unique visitor tracking error:", err);
      }
    };

    trackUniqueVisitor();
  }, [pathname, supabase]);

  return null;
}
