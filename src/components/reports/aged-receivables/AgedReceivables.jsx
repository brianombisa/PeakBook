import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { Eye, Clock, AlertTriangle, Users } from 'lucide-react';
import AccountsReceivableService from '../../services/AccountsReceivableService';

const CustomerInvoicesDrillDown = ({ open, onClose, customerName, invoices, balance }) => {
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Outstanding Invoices for {customerName}</DialogTitle>
                    <p className="text-sm text-slate-500">Total Due: KES {balance.toLocaleString()}</p>
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell>{invoice.invoice_number}</TableCell>
                                    <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="text-right">KES {invoice.total_amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function AgedReceivables({ data = {}, period = 'this_year', isLoading }) {
  const { invoices = [], customers = [], transactions = [] } = data;
  const [drillDownData, setDrillDownData] = useState(null);
  
  const agedReceivablesData = useMemo(() => {
    if (!invoices || invoices.length === 0 || !customers || customers.length === 0) {
        return { agedData: [], totals: {}, hasData: false };
    }
    
    const customerMap = new Map(customers.map(c => [c.id, c.customer_name]));
    const customerBalances = new Map();

    const allPaidInvoices = new Set();
    transactions.forEach(t => {
        if(t.transaction_type === 'receipt' && t.invoice_id) {
            allPaidInvoices.add(t.invoice_id);
        }
    });

    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && !allPaidInvoices.has(inv.id));
    
    unpaidInvoices.forEach(invoice => {
        const customerId = invoice.customer_id;
        const customerName = customerMap.get(customerId) || 'Unknown Customer';
        if (!customerBalances.has(customerId)) {
            customerBalances.set(customerId, {
                customerId,
                customerName,
                totalBalance: 0,
                current: 0,
                days31to60: 0,
                days61to90: 0,
                over90: 0,
                invoices: []
            });
        }

        const balanceDue = invoice.total_amount;
        const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
        
        const customerRecord = customerBalances.get(customerId);
        customerRecord.totalBalance += balanceDue;
        customerRecord.invoices.push(invoice);
        
        if (daysOverdue <= 30) customerRecord.current += balanceDue;
        else if (daysOverdue <= 60) customerRecord.days31to60 += balanceDue;
        else if (daysOverdue <= 90) customerRecord.days61to90 += balanceDue;
        else customerRecord.over90 += balanceDue;
    });

    const agedData = Array.from(customerBalances.values());
    const totals = agedData.reduce((acc, curr) => ({
        totalBalance: acc.totalBalance + curr.totalBalance,
        current: acc.current + curr.current,
        days31to60: acc.days31to60 + curr.days31to60,
        days61to90: acc.days61to90 + curr.days61to90,
        over90: acc.over90 + curr.over90,
    }), { totalBalance: 0, current: 0, days31to60: 0, days61to90: 0, over90: 0 });

    return { agedData, totals, hasData: agedData.length > 0 };
  }, [invoices, customers, transactions]);

  const handleCustomerDrillDown = (customerData) => {
    setDrillDownData(customerData);
  };
  
  const ClickableCustomerName = ({ customerData }) => (
    <Button
        variant="link"
        className="p-0 h-auto font-medium text-blue-600 hover:underline"
        onClick={() => handleCustomerDrillDown(customerData)}
    >
        {customerData.customerName}
        <Eye className="w-3 h-3 ml-2 opacity-50" />
    </Button>
  );

  const getRiskLevel = (customer) => {
    if (customer.over90 > 0) return { label: 'High Risk', color: 'bg-red-100 text-red-800' };
    if (customer.days61to90 > 0) return { label: 'Medium Risk', color: 'bg-amber-100 text-amber-800' };
    if (customer.days31to60 > 0) return { label: 'Low Risk', color: 'bg-blue-100 text-blue-800' };
    return { label: 'On Track', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Analyzing Receivables...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agedReceivablesData.hasData) {
      return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Aged Accounts Receivable
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Outstanding Receivables</h3>
                      <p className="text-slate-500">
                        No unpaid invoices found for the selected period.
                      </p>
                    </div>
                </CardContent>
            </Card>
      )
  }

  const { agedData, totals } = agedReceivablesData;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Aged Receivables Summary
        </CardTitle>
        <CardDescription>
            Outstanding customer balances grouped by aging period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">31-60 Days</TableHead>
              <TableHead className="text-right">61-90 Days</TableHead>
              <TableHead className="text-right">90+ Days</TableHead>
              <TableHead className="text-right">Total Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agedData.map(customer => (
                <TableRow key={customer.customerId}>
                    <TableCell>
                        <ClickableCustomerName customerData={customer} />
                        <div>
                            <Badge variant="outline" className={getRiskLevel(customer).color}>
                                {getRiskLevel(customer).label}
                            </Badge>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">KES {customer.current.toLocaleString()}</TableCell>
                    <TableCell className="text-right">KES {customer.days31to60.toLocaleString()}</TableCell>
                    <TableCell className="text-right">KES {customer.days61to90.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">KES {customer.over90.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">KES {customer.totalBalance.toLocaleString()}</TableCell>
                </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-slate-50 font-bold">
              <TableCell>Totals</TableCell>
              <TableCell className="text-right">KES {totals.current.toLocaleString()}</TableCell>
              <TableCell className="text-right">KES {totals.days31to60.toLocaleString()}</TableCell>
              <TableCell className="text-right">KES {totals.days61to90.toLocaleString()}</TableCell>
              <TableCell className="text-right">KES {totals.over90.toLocaleString()}</TableCell>
              <TableCell className="text-right text-lg">KES {totals.totalBalance.toLocaleString()}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
    <CustomerInvoicesDrillDown 
        open={!!drillDownData}
        onClose={() => setDrillDownData(null)}
        customerName={drillDownData?.customerName}
        invoices={drillDownData?.invoices || []}
        balance={drillDownData?.totalBalance || 0}
    />
    </>
  );
}