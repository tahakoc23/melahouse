import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "text" | "image" | "avatar";
}

export function Skeleton({ className, variant = "text", ...props }: SkeletonProps) {
  const variants = {
    card: "rounded-xl",
    text: "rounded-md",
    image: "rounded-lg",
    avatar: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
