import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
];

export default function ExpenseBreakdown({ expenses, isLoading }) {
  const generateChartData = () => {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });

    return Object.entries(categoryTotals)
      .map(([category, total]) => ({
        name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: total,
        percentage: 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const chartData = generateChartData();
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  chartData.forEach(item => {
    item.percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
  });

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-800">Expense Breakdown</CardTitle>
        <p className="text-slate-600 text-sm">By category</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`KES ${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-slate-700">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">KES {entry.value.toLocaleString()}</span>
                    <span className="text-slate-500 ml-2">({entry.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No expense data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}