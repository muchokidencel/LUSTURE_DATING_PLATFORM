import * as React from "react"

import { cn } from "../../lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full bg-white dark:bg-elevated border border-border-subtle dark:border-border rounded-[10px] px-4 py-3 text-lustre-text placeholder:text-lustre-faint font-sans outline-none focus:border-lustre-purple focus:ring-1 focus:ring-lustre-purple/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
