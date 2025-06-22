"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatNumber } from "@/lib/utils";
import { useInventoryAnalytics } from "@/hooks/useDashboard";

interface InventoryChartProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

const InventoryChart: React.FC<InventoryChartProps> = ({
  className,
  height = 350,
  showControls = true,
}) => {
  const [chartType, setChartType] = useState<"stock-levels" | "demand-trends">("stock-levels");
  
  const { data: inventoryAnalytics, isLoading, error } = useInventoryAnalytics();

  // Transform data for stock levels pie chart
  const stockLevelsData = React.useMemo(() => {
    if (!inventoryAnalytics) return [];

    const lowStock = inventoryAnalytics.low_stock_items?.length || 0;
    const overStock = inventoryAnalytics.overstock_items?.length || 0;
    const normalStock = (inventoryAnalytics.total_items || 0) - lowStock - overStock;

    return [
      { name: "Normal Stock", value: normalStock, color: "#22c55e" },
      { name: "Low Stock", value: lowStock, color: "#f59e0b" },
      { name: "Overstock", value: overStock, color: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [inventoryAnalytics]);

  // Transform data for demand trends
  const demandTrendsData = React.useMemo(() => {
    if (!inventoryAnalytics?.demand_trends) return [];

    return inventoryAnalytics.demand_trends.slice(0, 10).map((item: any) => ({
      name: item.item_name || item.name,
      demand: item.predicted_demand || item.demand,
      current_stock: item.current_stock || item.stock,
    }));
  }, [inventoryAnalytics]);

  const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (chartType === "stock-levels") {
        const data = payload[0];
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900">{data.name}</p>
            <p className="text-sm" style={{ color: data.payload.color }}>
              Items: {formatNumber(data.value)}
            </p>
          </div>
        );
      } else {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {formatNumber(entry.value)}
              </p>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const controls = showControls ? (
    <Select value={chartType} onValueChange={(value: "stock-levels" | "demand-trends") => setChartType(value)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="stock-levels">Stock Levels</SelectItem>
        <SelectItem value="demand-trends">Demand Trends</SelectItem>
      </SelectContent>
    </Select>
  ) : undefined;

  const renderChart = () => {
    if (chartType === "stock-levels") {
      return (
        <PieChart>
          <Pie
            data={stockLevelsData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {stockLevelsData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      );
    }

    return (
      <BarChart
        data={demandTrendsData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="demand" 
          fill="#3b82f6" 
          name="Predicted Demand"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="current_stock" 
          fill="#22c55e" 
          name="Current Stock"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    );
  };

  const getTitle = () => {
    return chartType === "stock-levels" ? "Stock Level Distribution" : "Top Items - Demand vs Stock";
  };

  const getDescription = () => {
    return chartType === "stock-levels" 
      ? "Distribution of items by stock status"
      : "Predicted demand vs current stock for top items";
  };

  return (
    <ChartContainer
      title={getTitle()}
      description={getDescription()}
      loading={isLoading}
      error={error?.message}
      height={height}
      className={className}
      actions={controls}
      noData={
        (chartType === "stock-levels" && (!stockLevelsData || stockLevelsData.length === 0)) ||
        (chartType === "demand-trends" && (!demandTrendsData || demandTrendsData.length === 0))
      }
      noDataMessage="No inventory data available"
    >
      {renderChart()}
    </ChartContainer>
  );
};

export default InventoryChart;
