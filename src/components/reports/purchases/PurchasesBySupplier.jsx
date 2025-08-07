
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';

const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'this_month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'last_month':
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
        case 'this_quarter':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
        case 'last_quarter':
            startDate = startOfQuarter(subQuarters(now, 1));
            endDate = endOfQuarter(subQuarters(now, 1));
            break;
        case 'this_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        case 'last_year':
            startDate = startOfYear(subYears(now, 1));
            endDate = endOfYear(subYears(now, 1));
            break;
        default: // all_time
            startDate = new Date(2020, 0, 1); // A reasonable start date for "all time"
            endDate = now;
            break;
    }
    
    return { start: startDate, end: endDate };
};

export default function PurchasesBySupplier({ data = {}, period = 'this_year' }) {
  const { expenses = [], transactions = [] } = data; // Keep transactions if used elsewhere, although outline doesn't modify its usage.
  const dateRange = getDateRangeFromPeriod(period);

  const supplierData = useMemo(() => {
    const filteredExpenses = expenses.filter(exp => {
          const expenseDate = new Date(exp.expense_date);
          return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
        });

    const supplierPurchases = {};

    filteredExpenses.forEach(expense => {
      const supplierName = expense.vendor_name || 'Unknown Supplier';
      const amount = Math.round(expense.amount || 0);

      if (!supplierPurchases[supplierName]) {
        supplierPurchases[supplierName] = {
          name: supplierName,
          totalAmount: 0,
          transactionCount: 0,
          averageAmount: 0,
          expenses: []
        };
      }

      supplierPurchases[supplierName].totalAmount += amount;
      supplierPurchases[supplierName].transactionCount += 1;
      supplierPurchases[supplierName].expenses.push(expense);
    });

    // Calculate averages and convert to array
    const suppliersArray = Object.values(supplierPurchases).map(supplier => ({
      ...supplier,
      averageAmount: supplier.transactionCount > 0 
        ? Math.round(supplier.totalAmount / supplier.transactionCount) 
        : 0,
      totalAmount: Math.round(supplier.totalAmount)
    }));

    // Sort by total amount descending
    suppliersArray.sort((a, b) => b.totalAmount - a.totalAmount);

    return suppliersArray;
  }, [expenses, period]); // Changed dependency from dateRange to period

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  const totalPurchases = supplierData.reduce((sum, supplier) => sum + supplier.totalAmount, 0);
  const totalTransactions = supplierData.reduce((sum, supplier) => sum + supplier.transactionCount, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Purchases by Supplier</h2>
        <p className="text-slate-600">Supplier spending analysis and vendor performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPurchases)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalTransactions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{supplierData.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Suppliers by Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierData.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `KES ${(value / 1000)}k`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="totalAmount" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Concentration */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Top 3 Suppliers</span>
                <span className="font-bold">
                  {totalPurchases > 0 
                    ? Math.round((supplierData.slice(0, 3).reduce((sum, s) => sum + s.totalAmount, 0) / totalPurchases) * 100)
                    : 0}% of total spending
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Average per Transaction</span>
                <span className="font-bold">
                  {formatCurrency(totalTransactions > 0 ? totalPurchases / totalTransactions : 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Largest Single Purchase</span>
                <span className="font-bold">
                  {formatCurrency(Math.max(...supplierData.map(s => s.averageAmount), 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Supplier Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Supplier Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Spending</TableHead>
                  <TableHead className="text-right">Average per Transaction</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierData.map((supplier, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-right">{supplier.transactionCount}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(supplier.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supplier.averageAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalPurchases > 0 
                        ? Math.round((supplier.totalAmount / totalPurchases) * 100)
                        : 0}%
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
