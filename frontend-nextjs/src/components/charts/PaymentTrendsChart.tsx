"use client";

import React from "react";
import {
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePaymentTrends } from "@/hooks/useDashboard";

interface PaymentTrendsChartProps {
  className?: string;
  height?: number;
}

const PaymentTrendsChart: React.FC<PaymentTrendsChartProps> = ({
  className,
  height = 350,
}) => {
  const { data: paymentTrends, isLoading, error } = usePaymentTrends();

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!paymentTrends?.monthly_trends) return [];

    return paymentTrends.monthly_trends.map((item: any) => ({
      month: item.month,
      onTime: item.on_time_payments,
      delayed: item.delayed_payments,
      overdue: item.overdue_payments,
      total: item.total_payments,
      formattedMonth: formatDate(new Date(item.month + "-01"), "short"),
    }));
  }, [paymentTrends]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-success-600">
              On Time: {data?.onTime || 0} ({formatCurrency((data?.onTime || 0) * 100 / (data?.total || 1))}%)
            </p>
            <p className="text-sm text-warning-600">
              Delayed: {data?.delayed || 0} ({formatCurrency((data?.delayed || 0) * 100 / (data?.total || 1))}%)
            </p>
            <p className="text-sm text-error-600">
              Overdue: {data?.overdue || 0} ({formatCurrency((data?.overdue || 0) * 100 / (data?.total || 1))}%)
            </p>
            <hr className="my-1" />
            <p className="text-sm font-medium text-gray-900">
              Total: {data?.total || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer
      title="Payment Trends"
      description="Payment status distribution over time"
      loading={isLoading}
      error={error?.message}
      height={height}
      className={className}
      noData={!chartData || chartData.length === 0}
      noDataMessage="No payment data available"
    >
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="formattedMonth" 
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="onTime" 
          stackId="a" 
          fill="#22c55e" 
          name="On Time"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="delayed" 
          stackId="a" 
          fill="#f59e0b" 
          name="Delayed"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="overdue" 
          stackId="a" 
          fill="#ef4444" 
          name="Overdue"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default PaymentTrendsChart;
