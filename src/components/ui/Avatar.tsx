import * as React from "react"
import { cn } from "../../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800",
        {
          "h-8 w-8 text-xs": size === "sm",
          "h-10 w-10 text-sm": size === "md",
          "h-12 w-12 text-base": size === "lg",
          "h-16 w-16 text-lg": size === "xl",
        },
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-gray-500 dark:text-gray-400 uppercase">
          {fallback.substring(0, 2)}
        </div>
      )}
    </div>
  )
}
