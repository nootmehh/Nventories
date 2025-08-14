// src/components/ui/input.tsx

import * as React from "react";
import { cn } from "@/libs/utils";
import { cva, type VariantProps } from "class-variance-authority";
// Tidak perlu import "@/app/globals.css"; di sini

const inputVariants = cva(
  "w-auto px-4 py-2 rounded-lg border text-sm text-primary-blue font-medium shadow-sm focus:outline-none",
  {
    variants: {
      intent: {
        default: "border-grey-1 focus:ring-1 focus:ring-primary-orange",
        error: "border-red-500 text-red-700 placeholder-red-400 focus:ring-2 focus:ring-red-400",
        success: "border-green-500 text-green-700 placeholder-green-400 focus:ring-2 focus:ring-green-400",
        disabled: "bg-white-3 text-grey-desc cursor-not-allowed border-grey-1 shadow-none pointer-events-none",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  errorMessage?: string;
}

const CustomInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, iconLeft, iconRight, className, intent, errorMessage, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-sm font-medium text-grey-desc">{label}</label>
        )}

        <div className="relative z-0 flex items-center">
          {iconLeft && (
            <span className="absolute left-3 text-grey-3 h-5 w-5 flex items-center justify-center">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              inputVariants({ intent }),
              iconLeft && "pl-12",
              iconRight && "pr-12",
              className
            )}
            {...props}
          />
          {iconRight && (
            // PERBAIKAN DI SINI: 'left-3' menjadi 'right-3'
            <span className="absolute right-3 text-grey-desc h-5 w-5 flex items-center justify-center">
              {iconRight}
            </span>
          )}
        </div>

        {intent === "error" && errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export { CustomInput, type InputProps };