import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lustre-purple focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-lustre-purple/15 text-lustre-purple border-lustre-purple/30 font-sans font-semibold text-[10px] uppercase tracking-widest px-3 py-1",
        secondary:
          "bg-elevated text-lustre-muted border-border font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        destructive:
          "bg-lustre-rose-dim/20 text-lustre-rose border-lustre-rose/30 font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        outline: "border-border bg-transparent text-lustre-muted font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        premium: "bg-gold-bg border-lustre-gold/40 text-lustre-gold font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        paid: "bg-badge-paid-bg text-badge-paid-text border-transparent font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        processing: "bg-badge-processing-bg text-badge-processing-text border-transparent font-sans text-[10px] uppercase tracking-widest px-3 py-1",
        pending: "bg-badge-pending-bg text-badge-pending-text border-transparent font-sans text-[10px] uppercase tracking-widest px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
