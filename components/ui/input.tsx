"use client"

import * as React from "react"

import { useInputDensity } from "@/components/ui/input-density"
import { cn } from "@/lib/utils"

// 16px до md: при меньшем кегле iOS увеличивает страницу при фокусе.
const DENSITY = {
  lg: "h-control-lg rounded-control-lg px-3.5 md:text-body",
  md: "h-control rounded-control px-3 md:text-body-sm",
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const density = useInputDensity()
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border border-input bg-background text-lead text-foreground transition-colors duration-fast file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          DENSITY[density],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
