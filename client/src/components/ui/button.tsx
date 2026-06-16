import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lustre-purple disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-brand text-white hover:opacity-90 font-sans font-medium",
        outline:
          "bg-transparent border border-border-strong text-lustre-text font-sans font-medium hover:border-lustre-purple/50 hover:bg-lustre-purple/5",
        destructive:
          "bg-lustre-rose/10 border border-lustre-rose/20 text-lustre-rose hover:bg-lustre-rose/20 font-sans font-medium",
        secondary:
          "bg-elevated border border-border text-lustre-muted hover:text-lustre-text hover:bg-hover font-sans",
        ghost: "bg-transparent text-lustre-muted hover:text-lustre-text hover:bg-elevated font-sans",
        link: "text-lustre-purple underline-offset-4 hover:underline font-sans",
        pill: "rounded-full border border-lustre-purple/40 text-lustre-purple px-6 py-2.5 font-sans hover:bg-lustre-purple/10",
        gold: "bg-gradient-gold text-black font-semibold rounded-lg hover:opacity-90",
      },
      size: {
        default: "px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
