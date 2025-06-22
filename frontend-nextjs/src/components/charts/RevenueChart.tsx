"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CalendarIcon } from "@heroicons/react/24/outline";
import ChartContainer from "./ChartContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBusinessMetrics } from "@/hooks/useDashboard";

interface RevenueChartProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  className,
  height = 350,
  showControls = true,
}) => {
  const [period, setPeriod] = useState<string>("30");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const { data: businessMetrics, isLoading, error } = useBusinessMetrics(parseInt(period));

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!businessMetrics?.revenue_forecast?.daily_forecast) return [];

    return businessMetrics.revenue_forecast.daily_forecast.map((item: any) => ({
      date: item.date,
      revenue: item.predicted_revenue,
      actual: item.actual_revenue || 0,
      formattedDate: formatDate(new Date(item.date), "short"),
    }));
  }, [businessMetrics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const controls = showControls ? (
    <div className="flex items-center space-x-2">
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7 Days</SelectItem>
          <SelectItem value="30">30 Days</SelectItem>
          <SelectItem value="90">90 Days</SelectItem>
          <SelectItem value="365">1 Year</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={chartType} onValueChange={(value: "line" | "area") => setChartType(value)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line</SelectItem>
          <SelectItem value="area">Area</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ) : undefined;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="formattedDate" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            name="Predicted Revenue"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#actualGradient)"
            name="Actual Revenue"
          />
        </AreaChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="formattedDate" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
          name="Predicted Revenue"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
          name="Actual Revenue"
        />
      </LineChart>
    );
  };

  return (
    <ChartContainer
      title="Revenue Forecast"
      description="Predicted vs actual revenue over time"
      loading={isLoading}
      error={error?.message}
      height={height}
      className={className}
      actions={controls}
      noData={!chartData || chartData.length === 0}
      noDataMessage="No revenue data available for the selected period"
    >
      {renderChart()}
    </ChartContainer>
  );
};

export default RevenueChart;
