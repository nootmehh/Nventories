// src/components/ui/button.tsx

import { cn } from "@/libs/utils"; // Asumsi utility ini ada untuk menggabungkan class names
import { Slot } from "@radix-ui/react-slot";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// 1. Definisi buttonVariants yang lebih lengkap dan logis
const buttonVariants = cva(
  // Base styles: Ini adalah class yang akan selalu ada pada setiap tombol
  "inline-flex items-center justify-center rounded-lg font-bold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none cursor-pointer " +
  "gap-3",

  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-primary-orange to-orange-400 text-white-1 hover:opacity-75",
        outline:
          "bg-transparent border-1 border-primary-orange text-primary-orange hover:bg-white-3",
        ghost:
          "bg-transparent text-grey-desc hover:bg-white-3",
        disabled:
          "bg-white-2 text-grey-desc border-1 border-white-3 cursor-default ",
        Red:
          "bg-transparent text-state-red hover:bg-bg-state-red",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-md",
        sm: "h-9 px-3 text-sm rounded-sm",
        md: "h-10 px-4 py-2.5 text-sm rounded-md", 
        lg: "h-11 px-8 py-3 text-sm rounded-lg",
        icon: "h-12 w-12 p-0",
        smallIcon: "h-8 w-8 p-0 text-xs rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  Icon?: React.ElementType;
  iconPlacement?: 'left' | 'right';
}

const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, Icon, iconPlacement = 'left', children, ...props }, ref) => {
    
    const Comp = asChild ? Slot : "button";

    const iconSizeClass = size === 'sm' ? 'h-4 w-4' : (size === 'lg' ? 'h-5 w-5' : 'h-5 w-5');

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props} 
      >
        {Icon && iconPlacement === 'left' && (
          <Icon className={iconSizeClass} />
        )}
        {children}
        {Icon && iconPlacement === 'right' && (
          <Icon className={iconSizeClass} />
        )}
      </Comp>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton, buttonVariants };