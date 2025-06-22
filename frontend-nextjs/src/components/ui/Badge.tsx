import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-600 text-white hover:bg-primary-700",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        success: "border-transparent bg-success-100 text-success-800 hover:bg-success-200",
        warning: "border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200",
        error: "border-transparent bg-error-100 text-error-800 hover:bg-error-200",
        outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
        "outline-primary": "border-primary-300 text-primary-700 hover:bg-primary-50",
        "outline-success": "border-success-300 text-success-700 hover:bg-success-50",
        "outline-warning": "border-warning-300 text-warning-700 hover:bg-warning-50",
        "outline-error": "border-error-300 text-error-700 hover:bg-error-50",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, children, icon, onRemove, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
          >
            <svg
              className="h-2 w-2"
              fill="currentColor"
              viewBox="0 0 8 8"
            >
              <path d="M1.5 1.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Remove</span>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
