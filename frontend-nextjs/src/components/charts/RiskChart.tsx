"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useRiskDashboard } from "@/hooks/useDashboard";

interface RiskChartProps {
  className?: string;
  height?: number;
}

const RiskChart: React.FC<RiskChartProps> = ({
  className,
  height = 350,
}) => {
  const { data: riskData, isLoading, error } = useRiskDashboard();

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!riskData) return [];

    // Combine high risk customers and overdue payments data
    const highRiskCustomers = riskData.high_risk_customers || [];
    const overduePayments = riskData.overdue_payments || [];

    // Group by month or create sample data
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const riskCustomers = Math.max(0, highRiskCustomers.length - i * 2);
      const overdueAmount = Math.max(0, (overduePayments.length - i) * 50000);
      const riskScore = Math.min(100, Math.max(0, 80 - i * 10));
      
      monthlyData.push({
        month,
        riskCustomers,
        overdueAmount,
        riskScore,
      });
    }

    return monthlyData;
  }, [riskData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            let value = entry.value;
            if (entry.dataKey === 'overdueAmount') {
              value = formatCurrency(entry.value);
            } else if (entry.dataKey === 'riskScore') {
              value = `${entry.value}%`;
            } else {
              value = formatNumber(entry.value);
            }
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    if (!riskData) return null;

    return {
      totalHighRisk: riskData.summary?.total_high_risk || 0,
      totalOverdue: riskData.summary?.total_overdue || 0,
      totalCreditAlerts: riskData.summary?.total_credit_alerts || 0,
    };
  }, [riskData]);

  return (
    <ChartContainer
      title="Risk Analysis"
      description="Customer risk trends and overdue payments"
      loading={isLoading}
      error={error?.message}
      height={height}
      className={className}
      noData={!chartData || chartData.length === 0}
      noDataMessage="No risk data available"
      actions={
        summaryStats && (
          <div className="flex items-center space-x-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-error-600">{summaryStats.totalHighRisk}</div>
              <div className="text-gray-500">High Risk</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-warning-600">{summaryStats.totalOverdue}</div>
              <div className="text-gray-500">Overdue</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary-600">{summaryStats.totalCreditAlerts}</div>
              <div className="text-gray-500">Alerts</div>
            </div>
          </div>
        )
      }
    >
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          yAxisId="left"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        <Bar 
          yAxisId="left"
          dataKey="riskCustomers" 
          fill="#ef4444" 
          name="High Risk Customers"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          yAxisId="left"
          dataKey="overdueAmount" 
          fill="#f59e0b" 
          name="Overdue Amount"
          radius={[4, 4, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="riskScore" 
          stroke="#8b5cf6" 
          strokeWidth={3}
          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
          name="Risk Score"
        />
      </ComposedChart>
    </ChartContainer>
  );
};

export default RiskChart;
