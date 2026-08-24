import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "odeme_bekliyor" | "hazirlaniyor" | "kargoya_verildi" | "teslim_edildi" | "iade_edildi" | "default";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    odeme_bekliyor: "bg-yellow-100 text-yellow-800",
    hazirlaniyor: "bg-blue-100 text-blue-800",
    kargoya_verildi: "bg-purple-100 text-purple-800",
    teslim_edildi: "bg-green-100 text-green-800",
    iade_edildi: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
