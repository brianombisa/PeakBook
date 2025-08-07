import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function CashFlowChart({ transactions = [], isLoading }) {
  const generateCashFlowData = () => {
    const months = 12; // Show last 12 months
    const cashFlowData = [];
    
    // Calculate initial balance from all transactions before the chart's 12-month window
    const chartStartDate = startOfMonth(subMonths(new Date(), months - 1));
    const initialBalance = transactions
        .filter(t => {
          const tDate = new Date(t.transaction_date);
          return tDate < chartStartDate;
        })
        .reduce((sum, t) => {
            // Inflows
            if (t.transaction_type === 'receipt' || t.transaction_type === 'sale') return sum + (t.total_amount || 0);
            // Outflows
            if (t.transaction_type === 'payment' || t.transaction_type === 'expense') return sum - (t.total_amount || 0);
            return sum;
        }, 0);
        
    let runningBalance = initialBalance;

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const monthLabel = format(monthStart, "MMM yy");

      // Calculate Net Flow for the current month
      const netFlow = transactions
        .filter(t => {
          const tDate = new Date(t.transaction_date);
          return tDate >= monthStart && tDate <= monthEnd;
        })
        .reduce((sum, t) => {
            if (t.transaction_type === 'receipt' || t.transaction_type === 'sale') return sum + (t.total_amount || 0);
            if (t.transaction_type === 'payment' || t.transaction_type === 'expense') return sum - (t.total_amount || 0);
            return sum;
        }, 0);
        
      runningBalance += netFlow;

      cashFlowData.push({
        month: monthLabel,
        balance: Math.round(runningBalance),
      });
    }

    return cashFlowData;
  };

  const cashFlowData = generateCashFlowData();
  const currentBalance = cashFlowData[cashFlowData.length - 1]?.balance || 0;
  const previousBalance = cashFlowData.length > 1 ? cashFlowData[cashFlowData.length - 2]?.balance || 0 : currentBalance;
  const monthlyChange = currentBalance - previousBalance;
  const isPositive = monthlyChange >= 0;

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-800">Monthly Cash Flow Trend</CardTitle>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}KES {monthlyChange.toLocaleString()}
            </span>
            <span className="text-sm text-slate-500">vs last month</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <span className="text-2xl font-bold text-slate-900">
            KES {currentBalance.toLocaleString()}
          </span>
          <span className="text-sm text-slate-500">current balance</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
                interval={Math.floor(cashFlowData.length / 6)}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                formatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value, name) => [`KES ${value.toLocaleString()}`, name === 'balance' ? 'Balance' : name]}
                labelStyle={{ color: '#1e293b' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}