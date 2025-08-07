import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText, CheckCircle, DollarSign } from 'lucide-react';
import AccountsReceivableService from '../services/AccountsReceivableService';

export default function InvoiceStats({ invoices = [], transactions = [] }) {
  const stats = useMemo(async () => {
    // Use centralized AR service for consistency
    const arData = await AccountsReceivableService.calculateOutstandingReceivables(invoices, transactions);
    
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      totalInvoices,
      paidInvoices,
      totalRevenue: Math.round(totalRevenue),
      outstandingAmount: arData.outstandingAmount
    };
  }, [invoices, transactions]);

  const [calculatedStats, setCalculatedStats] = React.useState({
    totalInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    outstandingAmount: 0
  });

  React.useEffect(() => {
    stats.then(setCalculatedStats);
  }, [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculatedStats.totalInvoices}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{calculatedStats.paidInvoices}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            KES {calculatedStats.totalRevenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <DollarSign className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            KES {calculatedStats.outstandingAmount.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}