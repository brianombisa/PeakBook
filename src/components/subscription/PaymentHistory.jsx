import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function PaymentHistory({ payments = [] }) {
  const handleDownloadReceipt = (payment) => {
    // In a real implementation, this would generate and download a PDF receipt
    console.log('Downloading receipt for payment:', payment.id);
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Payments Yet</h3>
            <p className="text-slate-500">Your payment history will appear here once you make your first payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : 'Pending'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      KES {payment.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method}
                      {payment.mpesa_phone && (
                        <div className="text-sm text-slate-500">
                          {payment.mpesa_phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {payment.transaction_id || payment.mpesa_receipt_number || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`${statusColors[payment.status]} border font-medium`}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.billing_period_start && payment.billing_period_end ? (
                        <>
                          {format(new Date(payment.billing_period_start), 'MMM dd')} - {' '}
                          {format(new Date(payment.billing_period_end), 'MMM dd, yyyy')}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}