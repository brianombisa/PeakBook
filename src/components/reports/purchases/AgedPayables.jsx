import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function AgedPayables({ expenses = [], transactions = [] }) {
  const agedPayablesData = useMemo(() => {
    const today = new Date();
    const unpaidExpenses = expenses.filter(expense => 
      expense.status !== 'paid' && expense.status !== 'cancelled'
    );

    const agingBuckets = {
      current: { label: 'Current (0-30 days)', amount: 0, count: 0, expenses: [] },
      days31_60: { label: '31-60 days', amount: 0, count: 0, expenses: [] },
      days61_90: { label: '61-90 days', amount: 0, count: 0, expenses: [] },
      over90: { label: 'Over 90 days', amount: 0, count: 0, expenses: [] }
    };

    unpaidExpenses.forEach(expense => {
      const expenseDate = new Date(expense.expense_date);
      const daysOverdue = Math.floor((today - expenseDate) / (1000 * 60 * 60 * 24));
      const amount = Math.round(expense.amount || 0);

      let bucket;
      if (daysOverdue <= 30) bucket = 'current';
      else if (daysOverdue <= 60) bucket = 'days31_60';
      else if (daysOverdue <= 90) bucket = 'days61_90';
      else bucket = 'over90';

      agingBuckets[bucket].amount += amount;
      agingBuckets[bucket].count += 1;
      agingBuckets[bucket].expenses.push({
        ...expense,
        daysOverdue,
        amount
      });
    });

    const totalPayables = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);

    // Prepare chart data
    const chartData = Object.entries(agingBuckets)
      .filter(([_, bucket]) => bucket.amount > 0)
      .map(([key, bucket]) => ({
        name: bucket.label,
        value: bucket.amount,
        percentage: totalPayables > 0 ? Math.round((bucket.amount / totalPayables) * 100) : 0
      }));

    return {
      agingBuckets,
      totalPayables: Math.round(totalPayables),
      chartData,
      unpaidCount: unpaidExpenses.length
    };
  }, [expenses]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;
  const COLORS = ['#22c55e', '#eab308', '#f97316', '#dc2626'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Aged Payables Summary</h2>
        <p className="text-slate-600">Outstanding supplier payments by aging period</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(agedPayablesData.totalPayables)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{agedPayablesData.unpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue (60+ days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(agedPayablesData.agingBuckets.days61_90.amount + agedPayablesData.agingBuckets.over90.amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payables by Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agedPayablesData.chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                  >
                    {agedPayablesData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Aging Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Aging Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age Period</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(agedPayablesData.agingBuckets).map(([key, bucket]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{bucket.label}</TableCell>
                    <TableCell className="text-right">{bucket.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(bucket.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {agedPayablesData.totalPayables > 0 
                        ? Math.round((bucket.amount / agedPayablesData.totalPayables) * 100)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Payables Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Days Overdue</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(agedPayablesData.agingBuckets)
                  .flatMap(bucket => bucket.expenses)
                  .sort((a, b) => b.daysOverdue - a.daysOverdue)
                  .map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.vendor_name || 'Unknown Supplier'}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">
                        <span className={expense.daysOverdue > 60 ? 'text-red-600 font-medium' : ''}>
                          {expense.daysOverdue}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}