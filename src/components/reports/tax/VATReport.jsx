
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

export default function VATReport({ invoices = [], expenses = [], period = 'this_year' }) {
  const vatData = useMemo(() => {
    const allInvoices = invoices || [];
    const allExpenses = expenses || [];

    const monthlyData = {};

    const processTransaction = (dateStr, vatableAmount, vatAmount, type) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;
            const monthKey = format(date, 'yyyy-MM');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: format(date, 'MMMM yyyy'),
                    outputVAT: 0,
                    inputVAT: 0,
                    vatableSales: 0,
                    vatablePurchases: 0,
                };
            }

            if (type === 'sale') {
                monthlyData[monthKey].outputVAT += vatAmount;
                monthlyData[monthKey].vatableSales += vatableAmount;
            } else if (type === 'purchase') {
                monthlyData[monthKey].inputVAT += vatAmount;
                monthlyData[monthKey].vatablePurchases += vatableAmount;
            }
        } catch (e) {
            console.warn("Invalid date for VAT calculation:", dateStr);
        }
    };
    
    // Output VAT (from Invoices)
    allInvoices.forEach(invoice => {
      const totalAmount = invoice.total_amount || 0;
      let vatAmount = invoice.tax_amount || 0;
      // If tax isn't specified, calculate it assuming 16% VAT inclusive price
      if (vatAmount === 0 && totalAmount > 0) {
        vatAmount = Math.round((totalAmount * 16) / 116);
      }
      const vatableAmount = totalAmount - vatAmount;
      if (vatAmount > 0) {
        processTransaction(invoice.invoice_date, vatableAmount, vatAmount, 'sale');
      }
    });

    // Input VAT (from Expenses) - assuming all expenses are vatable for simplicity
    allExpenses.forEach(expense => {
      const totalAmount = expense.amount || 0;
      let vatAmount = expense.tax_amount || 0;
       if (vatAmount === 0 && totalAmount > 0) {
            vatAmount = Math.round((totalAmount * 16) / 116);
        }
      const vatableAmount = totalAmount - vatAmount;
      if (vatAmount > 0) {
        processTransaction(expense.expense_date, vatableAmount, vatAmount, 'purchase');
      }
    });

    const sortedMonths = Object.values(monthlyData).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
    
    const totals = sortedMonths.reduce((acc, month) => {
        acc.outputVAT += month.outputVAT;
        acc.inputVAT += month.inputVAT;
        acc.netVATPayable += (month.outputVAT - month.inputVAT);
        return acc;
    }, { outputVAT: 0, inputVAT: 0, netVATPayable: 0 });

    return {
      monthlyData: sortedMonths,
      totals,
      vatRate: 16
    };
  }, [invoices, expenses]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VAT Summary by Month</CardTitle>
          <CardDescription>Value Added Tax summary for Kenya (16% standard rate)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Output VAT (Sales)</TableHead>
                <TableHead className="text-right">Input VAT (Purchases)</TableHead>
                <TableHead className="text-right">Net VAT Payable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatData.monthlyData.map((data, index) => {
                  const netVAT = data.outputVAT - data.inputVAT;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(data.outputVAT)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(data.inputVAT)}</TableCell>
                      <TableCell className={`text-right font-bold ${netVAT >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(netVAT)}
                      </TableCell>
                    </TableRow>
                  )
              })}
              <TableRow className="bg-slate-100 font-bold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatCurrency(vatData.totals.outputVAT)}</TableCell>
                <TableCell className="text-right">{formatCurrency(vatData.totals.inputVAT)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(vatData.totals.netVATPayable)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
