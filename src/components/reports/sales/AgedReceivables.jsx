
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { Eye, Clock, AlertTriangle } from 'lucide-react';
import AccountsReceivableService from '../../services/AccountsReceivableService';

// Drill-down modal to show invoices for a specific customer
const CustomerInvoicesDrillDown = ({ open, onClose, customerName, invoices, balance }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {customerName} - Outstanding Balance: KES {balance.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const daysOverdue = Math.max(0, differenceInDays(new Date(), new Date(invoice.due_date)));
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>KES {invoice.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        KES {(invoice.balance_due || invoice.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {daysOverdue > 0 ? (
                          <span className="text-red-600 font-medium">{daysOverdue} days</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No outstanding invoices found for this customer.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AgedReceivables({ invoices = [], customers = [], transactions = [] }) {
  const [drillDownData, setDrillDownData] = useState(null);
  const [agedReceivablesData, setAgedReceivablesData] = useState({ agedData: [], totals: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Use centralized service for consistent calculations
  useEffect(() => {
    const calculateAgedReceivables = async () => {
      setIsLoading(true);
      try {
        const result = await AccountsReceivableService.getAgedReceivables(invoices, customers, transactions);
        setAgedReceivablesData(result);
      } catch (error) {
        console.error('Error calculating aged receivables:', error);
        setAgedReceivablesData({ agedData: [], totals: { totalBalance: 0, current: 0, days31to60: 0, days61to90: 0, over90: 0 } });
      } finally {
        setIsLoading(false);
      }
    };

    if (invoices.length > 0 && customers.length > 0) {
      calculateAgedReceivables();
    } else {
        setIsLoading(false);
        setAgedReceivablesData({ agedData: [], totals: { totalBalance: 0, current: 0, days31to60: 0, days61to90: 0, over90: 0 } });
    }
  }, [invoices, customers, transactions]);

  const handleCustomerDrillDown = (customer) => {
    setDrillDownData({
      customerName: customer.customerName,
      invoices: customer.invoices,
      balance: customer.totalBalance
    });
  };

  const ClickableCustomerName = ({ customer }) => (
    <Button
      variant="ghost"
      className="font-medium justify-start p-0 h-auto hover:underline text-blue-600 hover:text-blue-800"
      onClick={() => handleCustomerDrillDown(customer)}
    >
      <span className="flex items-center gap-1">
        {customer.customerName}
        <Eye className="w-3 h-3 opacity-60" />
      </span>
    </Button>
  );

  const getRiskLevel = (customer) => {
    // Avoid division by zero if totalBalance is 0
    if (customer.totalBalance === 0) return { level: 'None', color: 'bg-gray-100 text-gray-800' };

    // A higher proportion of older receivables indicates higher risk
    // Weights: Over 90 days (3x), 61-90 days (2x), 31-60 days (1x)
    const riskScore = (customer.over90 * 3 + customer.days61to90 * 2 + customer.days31to60) / customer.totalBalance;
    
    if (riskScore > 1.5) return { level: 'High', color: 'bg-red-100 text-red-800' }; // More than half balance is very old
    if (riskScore > 0.7) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }; // Significant portion is old
    return { level: 'Low', color: 'bg-green-100 text-green-800' }; // Mostly current or recent
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Calculating aged receivables...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Aged Accounts Receivable
          </CardTitle>
          <p className="text-sm text-slate-600">
            Outstanding customer balances grouped by age (click customer names for details)
            <br />
            <span className="text-xs text-slate-500">
              Calculated using centralized AR service for data consistency
            </span>
          </p>
        </CardHeader>
        <CardContent>
          {agedReceivablesData.agedData.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600 font-medium">TOTAL OUTSTANDING</p>
                  <p className="text-lg font-bold text-blue-800">
                    KES {agedReceivablesData.totals.totalBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-600 font-medium">CURRENT (0-30)</p>
                  <p className="text-lg font-bold text-green-800">
                    KES {agedReceivablesData.totals.current.toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-yellow-600 font-medium">31-60 DAYS</p>
                  <p className="text-lg font-bold text-yellow-800">
                    KES {agedReceivablesData.totals.days31to60.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-orange-600 font-medium">61-90 DAYS</p>
                  <p className="text-lg font-bold text-orange-800">
                    KES {agedReceivablesData.totals.days61to90.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-red-600 font-medium">OVER 90 DAYS</p>
                  <p className="text-lg font-bold text-red-800">
                    KES {agedReceivablesData.totals.over90.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Balance</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">31-60 Days</TableHead>
                      <TableHead className="text-right">61-90 Days</TableHead>
                      <TableHead className="text-right">Over 90 Days</TableHead>
                      <TableHead className="text-center">Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agedReceivablesData.agedData.map((customer) => {
                      const risk = getRiskLevel(customer);
                      return (
                        <TableRow key={customer.customerId}>
                          <TableCell>
                            <ClickableCustomerName customer={customer} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            KES {customer.totalBalance.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.current > 0 ? `KES ${customer.current.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.days31to60 > 0 ? `KES ${customer.days31to60.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.days61to90 > 0 ? `KES ${customer.days61to90.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.over90 > 0 ? 
                              <span className="text-red-600 font-medium">KES {customer.over90.toLocaleString()}</span> 
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${risk.color} border`}>
                              {risk.level}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Outstanding Receivables</h3>
              <p className="text-slate-500">
                All your customers have paid their invoices. Great job on collections!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drill-down modal */}
      <CustomerInvoicesDrillDown
        open={!!drillDownData}
        onClose={() => setDrillDownData(null)}
        customerName={drillDownData?.customerName || ''}
        invoices={drillDownData?.invoices || []}
        balance={drillDownData?.balance || 0}
      />
    </div>
  );
}
