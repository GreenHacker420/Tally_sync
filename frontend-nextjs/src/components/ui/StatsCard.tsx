import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period?: string;
  };
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error" | "secondary";
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = "primary",
  loading = false,
  className,
  onClick,
}) => {
  const colorClasses = {
    primary: {
      icon: "bg-primary-100 text-primary-600",
      change: "text-primary-600",
    },
    success: {
      icon: "bg-success-100 text-success-600",
      change: "text-success-600",
    },
    warning: {
      icon: "bg-warning-100 text-warning-600",
      change: "text-warning-600",
    },
    error: {
      icon: "bg-error-100 text-error-600",
      change: "text-error-600",
    },
    secondary: {
      icon: "bg-gray-100 text-gray-600",
      change: "text-gray-600",
    },
  };

  const getChangeColor = (type: "increase" | "decrease") => {
    return type === "increase" ? "text-success-600" : "text-error-600";
  };

  const getChangeIcon = (type: "increase" | "decrease") => {
    return type === "increase" ? "↗" : "↘";
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
        hover={!!onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center">
            {icon && (
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center",
                    colorClasses[color].icon
                  )}
                >
                  {icon}
                </div>
              </div>
            )}
            <div className={cn("w-0 flex-1", icon && "ml-5")}>
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {value}
                  </div>
                  {change && (
                    <div
                      className={cn(
                        "ml-2 flex items-baseline text-sm font-semibold",
                        getChangeColor(change.type)
                      )}
                    >
                      <span className="mr-1">
                        {getChangeIcon(change.type)}
                      </span>
                      {Math.abs(change.value)}%
                      {change.period && (
                        <span className="ml-1 text-gray-500 font-normal">
                          {change.period}
                        </span>
                      )}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
