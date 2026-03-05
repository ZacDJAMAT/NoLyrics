import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils.ts"

const inputVariants = cva(
    "flex w-full outline-none focus:outline-none ring-0 transition-[box-shadow,background-color,border-color] duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-ring",

                glass: `
          bg-white/10 text-foreground placeholder:text-muted-foreground/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]
          border border-white/10 
          focus:border-primary/30 focus:ring-[3px] focus:ring-primary/30 focus:bg-white/20
        `,
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
        VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(inputVariants({ variant, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }