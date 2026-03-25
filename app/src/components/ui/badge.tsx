import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1D9BF0]/20 text-[#1D9BF0]",
        secondary: "border-transparent bg-[#536471]/20 text-[#71767B]",
        destructive: "border-transparent bg-[#F4212E]/15 text-[#F4212E]",
        outline: "border-[#2F3336] text-[#71767B]",
        success: "border-transparent bg-[#00BA7C]/15 text-[#00BA7C]",
        warning: "border-transparent bg-[#FFD400]/15 text-[#FFD400]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
