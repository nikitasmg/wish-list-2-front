import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Метка-таблетка: «главная мечта», «новый», статусы подарков.
const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-2 text-micro font-bold [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        accent: "bg-primary/15 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        muted: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: { variant: "muted" },
  }
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
