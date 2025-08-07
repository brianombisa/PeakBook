import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfMonth, getMonth, getYear } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// IMPORTANT: This chart now uses the `invoices` and `expenses` props,
// which are pre-filtered by date in the main Dashboard component.
// This ensures it only shows data for the selected period.
export default function SalesVsExpensesChart({ invoices, expenses, isLoading }) {
  const generateChartData = () => {
    const dataByMonth = {};

    // Process Sales from pre-filtered invoices
    invoices.forEach(item => {
      const date = new Date(item.invoice_date);
      const monthKey = format(date, "MMM yyyy");
      
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { date: startOfMonth(date), sales: 0, expenses: 0 };
      }
      dataByMonth[monthKey].sales += item.total_amount || 0;
    });

    // Process Expenses from pre-filtered expenses
    expenses.forEach(item => {
      const date = new Date(item.expense_date);
      const monthKey = format(date, "MMM yyyy");
      
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { date: startOfMonth(date), sales: 0, expenses: 0 };
      }
      dataByMonth[monthKey].expenses += item.amount || 0;
    });
    
    return Object.values(dataByMonth)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(d => ({ ...d, date: format(d.date, "MMM yyyy") }));
  };

  const chartData = generateChartData();
  const totalSales = chartData.reduce((sum, month) => sum + month.sales, 0);
  const totalExpenses = chartData.reduce((sum, month) => sum + month.expenses, 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-800">Monthly Sales vs Expenses</CardTitle>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-600">Sales: KES {totalSales.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-600">Expenses: KES {totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                  interval={chartData.length > 12 ? Math.floor(chartData.length / 12) : 0}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  formatter={(value) => `KES ${Math.round(value).toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `KES ${Math.round(value).toLocaleString()}`, 
                    name === 'sales' ? 'Sales' : 'Expenses'
                  ]}
                  labelStyle={{ color: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="sales" 
                  fill="#10b981" 
                  name="Sales"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="#ef4444" 
                  name="Expenses"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}