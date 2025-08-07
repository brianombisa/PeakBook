import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WithholdingTaxReport({ transactions = [], expenses = [], dateRange }) {
  const withholdingTaxData = useMemo(() => {
    const filteredTransactions = dateRange 
      ? transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        })
      : transactions;

    const filteredExpenses = dateRange 
      ? expenses.filter(e => {
          const expenseDate = new Date(e.expense_date);
          return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
        })
      : expenses;

    // Withholding tax categories and rates (Kenya)
    const whTaxRates = {
      'professional_services': 5, // 5% for professional services
      'rent': 10, // 10% for rent
      'interest': 15, // 15% for interest payments
      'dividends': 5, // 5% for dividends
      'management_fees': 5, // 5% for management fees
      'consultancy': 5, // 5% for consultancy
      'commission': 5, // 5% for commission
    };

    const withholdingItems = [];
    let totalWithholdingTax = 0;
    let totalGrossAmount = 0;

    // Process expenses that may have withholding tax
    filteredExpenses.forEach(expense => {
      const category = expense.category;
      const amount = Math.round(expense.amount || 0);
      let whRate = 0;
      let whTax = 0;

      // Determine if withholding tax applies
      if (category === 'professional_services' || category === 'rent') {
        whRate = whTaxRates[category] || 0;
        // If expense already includes withholding tax deducted
        if (expense.tax_amount && expense.tax_amount > 0) {
          whTax = Math.round(expense.tax_amount);
        } else if (whRate > 0) {
          // Calculate estimated withholding tax
          whTax = Math.round((amount * whRate) / (100 + whRate));
        }
      }

      if (whTax > 0) {
        withholdingItems.push({
          date: expense.expense_date,
          description: expense.description,
          vendor: expense.vendor_name || 'Unknown Vendor',
          category: category?.replace('_', ' ').toUpperCase() || 'OTHER',
          grossAmount: amount,
          whRate: whRate,
          whTax: whTax,
          netAmount: amount - whTax
        });

        totalWithholdingTax += whTax;
        totalGrossAmount += amount;
      }
    });

    // Also check transactions for withholding tax entries
    filteredTransactions.forEach(transaction => {
      if (transaction.journal_entries) {
        transaction.journal_entries.forEach(entry => {
          // Look for withholding tax accounts (typically 2300-2399)
          if (entry.account_code >= '2300' && entry.account_code < '2400' && entry.credit_amount > 0) {
            withholdingItems.push({
              date: transaction.transaction_date,
              description: transaction.description,
              vendor: 'From Transaction',
              category: 'WITHHOLDING TAX',
              grossAmount: Math.round(entry.debit_amount || 0),
              whRate: 0,
              whTax: Math.round(entry.credit_amount),
              netAmount: Math.round((entry.debit_amount || 0) - entry.credit_amount)
            });

            totalWithholdingTax += Math.round(entry.credit_amount);
            totalGrossAmount += Math.round(entry.debit_amount || 0);
          }
        });
      }
    });

    // Sort by date descending
    withholdingItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary by category
    const categoryBreakdown = {};
    withholdingItems.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = {
          count: 0,
          grossAmount: 0,
          whTax: 0
        };
      }
      categoryBreakdown[item.category].count += 1;
      categoryBreakdown[item.category].grossAmount += item.grossAmount;
      categoryBreakdown[item.category].whTax += item.whTax;
    });

    return {
      withholdingItems,
      totalWithholdingTax: Math.round(totalWithholdingTax),
      totalGrossAmount: Math.round(totalGrossAmount),
      totalNetAmount: Math.round(totalGrossAmount - totalWithholdingTax),
      categoryBreakdown,
      transactionCount: withholdingItems.length
    };
  }, [transactions, expenses, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Withholding Tax Report</h2>
        <p className="text-slate-600">
          Withholding tax deductions and obligations
          {dateRange && ` from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(withholdingTaxData.totalGrossAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Withholding Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(withholdingTaxData.totalWithholdingTax)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(withholdingTaxData.totalNetAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{withholdingTaxData.transactionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Withholding Tax by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead className="text-right">Withholding Tax</TableHead>
                <TableHead className="text-right">Average Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(withholdingTaxData.categoryBreakdown).map(([category, data]) => (
                <TableRow key={category}>
                  <TableCell className="font-medium">{category}</TableCell>
                  <TableCell className="text-right">{data.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.grossAmount)}</TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {formatCurrency(data.whTax)}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.grossAmount > 0 ? Math.round((data.whTax / data.grossAmount) * 100) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Withholding Tax Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Gross Amount</TableHead>
                  <TableHead className="text-right">WH Rate</TableHead>
                  <TableHead className="text-right">WH Tax</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withholdingTaxData.withholdingItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.vendor}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.grossAmount)}</TableCell>
                    <TableCell className="text-right">{item.whRate}%</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(item.whTax)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.netAmount)}
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