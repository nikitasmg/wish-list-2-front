"use client"

import * as React from "react"

import { useInputDensity } from "@/components/ui/input-density"
import { cn } from "@/lib/utils"

// 16px до md: при меньшем кегле iOS увеличивает страницу при фокусе.
const DENSITY = {
  lg: "min-h-24 rounded-control-lg px-3.5 py-3 md:text-body",
  md: "min-h-20 rounded-control px-3 py-2 md:text-body-sm",
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const density = useInputDensity()
  return (
    <textarea
      className={cn(
        "flex w-full border border-input bg-background text-lead text-foreground transition-colors duration-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        DENSITY[density],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
