import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white shadow-soft hover:shadow-medium hover:scale-105 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-medium",
        outline:
          "border-2 border-primary/20 bg-card text-primary hover:bg-primary hover:text-white hover:border-primary shadow-soft hover:shadow-medium hover:scale-105 dark:bg-muted dark:text-foreground dark:border-border dark:hover:bg-primary dark:hover:text-primary-foreground",
        secondary:
          "gradient-secondary text-white shadow-soft hover:shadow-medium hover:scale-105 active:scale-95",
        ghost: "hover:bg-primary/10 hover:text-primary transition-smooth",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        accent: "gradient-accent text-white shadow-soft hover:shadow-medium hover:scale-105 active:scale-95",
        social: "bg-white border-2 border-border text-foreground shadow-soft hover:shadow-medium hover:scale-105 hover:border-primary/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
