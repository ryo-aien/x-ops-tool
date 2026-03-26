import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border bg-white px-3 py-1 text-sm transition-colors placeholder:text-[#536471] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-black border-[#2F3336] focus-visible:border-[#1D9BF0]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
