import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "border-none bg-blue-700 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_rgba(29,78,216,0.35)] hover:bg-blue-800 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_24px_rgba(29,78,216,0.45)]",
        blue:
          "border-none bg-blue-700 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_rgba(29,78,216,0.35)] hover:bg-blue-800 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_24px_rgba(29,78,216,0.45)]",
        dark:
          "border-none bg-neutral-900 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_rgba(0,0,0,0.35)] hover:bg-neutral-800 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_24px_rgba(0,0,0,0.45)]",
        white:
          "border border-neutral-200/80 bg-white text-neutral-900 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_4px_12px_rgba(0,0,0,0.06)] hover:bg-neutral-50 hover:shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(0,0,0,0.1)]",
        emerald:
          "border-none bg-emerald-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_rgba(5,150,105,0.35)] hover:bg-emerald-700 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_24px_rgba(5,150,105,0.45)]",
        destructive:
          "border-none bg-red-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_rgba(220,38,38,0.35)] hover:bg-red-700 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_24px_rgba(220,38,38,0.45)]",
        outline:
          "border border-neutral-300 text-neutral-800 bg-white/80 shadow-sm hover:bg-neutral-100 hover:text-neutral-900",
      },
      size: {
        sm: "px-4 py-2 text-xs sm:text-sm gap-1.5",
        default: "px-6 py-3 text-sm font-medium sm:px-7 sm:py-3.5 sm:text-[15px]",
        lg: "px-7 py-3.5 text-base font-medium sm:px-8 sm:py-4 gap-2.5",
        icon: "p-2.5 aspect-square",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
    target?: string;
    rel?: string;
  };

export function Button({
  className,
  variant,
  size,
  href,
  target,
  rel,
  children,
  ...props
}: ButtonProps) {
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={cn(buttonVariants({ variant, size, className }))}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type || "button"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
