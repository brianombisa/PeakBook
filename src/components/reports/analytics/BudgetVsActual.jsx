import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BudgetVsActual({ transactions = [], dateRange }) {
  const budgetData = useMemo(() => {
    const filteredTransactions = dateRange 
      ? transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        })
      : transactions;

    // Since we don't have budget data, we'll create estimated budgets based on actual performance
    // In a real system, this would come from a Budget entity

    // Calculate actual figures by category
    const actualData = {
      revenue: 0,
      operatingExpenses: 0,
      marketingExpenses: 0,
      officeExpenses: 0,
      travelExpenses: 0,
      otherExpenses: 0
    };

    filteredTransactions.forEach(transaction => {
      if (transaction.transaction_type === 'sale') {
        actualData.revenue += Math.round(transaction.total_amount || 0);
      } else if (transaction.transaction_type === 'expense') {
        // Categorize expenses based on description or journal entries
        const description = transaction.description?.toLowerCase() || '';
        const amount = Math.round(transaction.total_amount || 0);
        
        if (description.includes('marketing') || description.includes('advertising')) {
          actualData.marketingExpenses += amount;
        } else if (description.includes('office') || description.includes('supplies')) {
          actualData.officeExpenses += amount;
        } else if (description.includes('travel') || description.includes('transport')) {
          actualData.travelExpenses += amount;
        } else {
          actualData.operatingExpenses += amount;
        }
      }
    });

    // Create estimated budgets (120% of actual for conservative planning)
    const budgetData = {
      revenue: Math.round(actualData.revenue * 1.2),
      operatingExpenses: Math.round(actualData.operatingExpenses * 1.1),
      marketingExpenses: Math.round(actualData.marketingExpenses * 1.15),
      officeExpenses: Math.round(actualData.officeExpenses * 1.1),
      travelExpenses: Math.round(actualData.travelExpenses * 1.2),
      otherExpenses: Math.round(actualData.otherExpenses * 1.1)
    };

    // Prepare chart data
    const chartData = [
      {
        category: 'Revenue',
        budget: budgetData.revenue,
        actual: actualData.revenue,
        variance: actualData.revenue - budgetData.revenue,
        variancePercent: budgetData.revenue > 0 ? Math.round(((actualData.revenue - budgetData.revenue) / budgetData.revenue) * 100) : 0
      },
      {
        category: 'Operating Expenses',
        budget: budgetData.operatingExpenses,
        actual: actualData.operatingExpenses,
        variance: budgetData.operatingExpenses - actualData.operatingExpenses,
        variancePercent: budgetData.operatingExpenses > 0 ? Math.round(((budgetData.operatingExpenses - actualData.operatingExpenses) / budgetData.operatingExpenses) * 100) : 0
      },
      {
        category: 'Marketing',
        budget: budgetData.marketingExpenses,
        actual: actualData.marketingExpenses,
        variance: budgetData.marketingExpenses - actualData.marketingExpenses,
        variancePercent: budgetData.marketingExpenses > 0 ? Math.round(((budgetData.marketingExpenses - actualData.marketingExpenses) / budgetData.marketingExpenses) * 100) : 0
      },
      {
        category: 'Office',
        budget: budgetData.officeExpenses,
        actual: actualData.officeExpenses,
        variance: budgetData.officeExpenses - actualData.officeExpenses,
        variancePercent: budgetData.officeExpenses > 0 ? Math.round(((budgetData.officeExpenses - actualData.officeExpenses) / budgetData.officeExpenses) * 100) : 0
      },
      {
        category: 'Travel',
        budget: budgetData.travelExpenses,
        actual: actualData.travelExpenses,
        variance: budgetData.travelExpenses - actualData.travelExpenses,
        variancePercent: budgetData.travelExpenses > 0 ? Math.round(((budgetData.travelExpenses - actualData.travelExpenses) / budgetData.travelExpenses) * 100) : 0
      }
    ].filter(item => item.budget > 0 || item.actual > 0);

    const totalBudget = Object.values(budgetData).reduce((sum, val) => sum + val, 0);
    const totalActual = Object.values(actualData).reduce((sum, val) => sum + val, 0);

    return {
      chartData,
      totalBudget: Math.round(totalBudget),
      totalActual: Math.round(totalActual),
      totalVariance: Math.round(totalActual - totalBudget),
      totalVariancePercent: totalBudget > 0 ? Math.round(((totalActual - totalBudget) / totalBudget) * 100) : 0
    };
  }, [transactions, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Budget vs Actual Analysis</h2>
        <p className="text-slate-600">Performance against estimated budgets</p>
        <p className="text-xs text-slate-400 mt-1">Note: Budgets are estimated based on historical performance patterns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(budgetData.totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(budgetData.totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${budgetData.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(budgetData.totalVariance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variance %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${budgetData.totalVariancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budgetData.totalVariancePercent >= 0 ? '+' : ''}{budgetData.totalVariancePercent}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `KES ${(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                <Bar dataKey="actual" fill="#22C55E" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-right p-4 font-medium">Budget</th>
                  <th className="text-right p-4 font-medium">Actual</th>
                  <th className="text-right p-4 font-medium">Variance</th>
                  <th className="text-right p-4 font-medium">Variance %</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.chartData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.category}</td>
                    <td className="p-4 text-right">{formatCurrency(item.budget)}</td>
                    <td className="p-4 text-right">{formatCurrency(item.actual)}</td>
                    <td className={`p-4 text-right font-medium ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </td>
                    <td className={`p-4 text-right font-medium ${item.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}