"use client";

import React from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
  actions?: React.ReactNode;
  noData?: boolean;
  noDataMessage?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  children,
  loading = false,
  error = null,
  height = 300,
  className,
  actions,
  noData = false,
  noDataMessage = "No data available",
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="text-error-500 text-sm font-medium">Error loading chart</div>
            <div className="text-gray-500 text-xs mt-1">{error}</div>
          </div>
        </div>
      );
    }

    if (noData) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="text-gray-400 text-sm">{noDataMessage}</div>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("", className)}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-medium">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ChartContainer;
