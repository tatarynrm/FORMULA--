import * as React from "react"
import { cn } from "@/lib/utils"

// States follow the Figma "Inputs" variables: default, focus, error, disabled.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-full border border-input bg-surface-raised px-4 text-body-md text-foreground transition-colors outline-none placeholder:text-input-placeholder",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-input-error-border aria-invalid:bg-input-error-bg",
        "disabled:cursor-not-allowed disabled:border-input-disabled-border disabled:bg-input-disabled-bg disabled:text-input-disabled-text",
        className
      )}
      {...props}
    />
  )
}

export { Input }
