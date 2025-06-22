import React from "react";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  showHome = true,
  separator = <ChevronRightIcon className="h-4 w-4 text-gray-400" />,
}) => {
  const allItems = showHome
    ? [{ title: "Home", href: "/dashboard" }, ...items]
    : items;

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = showHome && index === 0;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mr-2">{separator}</span>
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary-600",
                    isLast ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  {isHome ? (
                    <div className="flex items-center">
                      <HomeIcon className="h-4 w-4 mr-1" />
                      <span className="sr-only">{item.title}</span>
                    </div>
                  ) : (
                    item.title
                  )}
                </Link>
              ) : (
                <span
                  className={cn(
                    "text-sm font-medium",
                    isLast ? "text-gray-900" : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isHome ? (
                    <div className="flex items-center">
                      <HomeIcon className="h-4 w-4 mr-1" />
                      <span className="sr-only">{item.title}</span>
                    </div>
                  ) : (
                    item.title
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
