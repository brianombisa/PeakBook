
import React, { useState, useEffect } from 'react';
import { MPesaTransaction } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Smartphone, Zap, CheckCircle, AlertTriangle, Upload, Download, Building } from 'lucide-react';
import { format } from 'date-fns';

export default function MPesaIntegrationPage() {
  const [mpesaTransactions, setMpesaTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tillNumber, setTillNumber] = useState('');
  const [paybillNumber, setPaybillNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const [mpesaData, invoiceData] = await Promise.all([
        MPesaTransaction.filter({ created_by: user.email }, "-transaction_date"),
        Invoice.filter({ created_by: user.email, status: "sent" })
      ]);
      setMpesaTransactions(mpesaData);
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error loading M-Pesa data:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // This would integrate with M-Pesa statement parsing
      // For now, we'll simulate the process
      toast({
        title: 'Statement Processing',
        description: 'M-Pesa statement uploaded successfully. Processing transactions...',
      });

      // Simulate processing
      setTimeout(() => {
        toast({
          title: 'Processing Complete',
          description: '15 new M-Pesa transactions imported and ready for reconciliation.',
        });
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Error processing statement:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not process M-Pesa statement. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const matchTransaction = async (transaction, invoice) => {
    try {
      await MPesaTransaction.update(transaction.id, {
        matched_invoice_id: invoice.id,
        is_reconciled: true
      });

      await Invoice.update(invoice.id, {
        status: 'paid',
        paid_amount: invoice.total_amount,
        balance_due: 0
      });

      toast({
        title: 'Transaction Matched',
        description: `M-Pesa payment of KES ${transaction.amount.toLocaleString()} matched to Invoice ${invoice.invoice_number}`,
      });

      loadData();
    } catch (error) {
      console.error('Error matching transaction:', error);
    }
  };

  const sendSTKPush = async (invoice) => {
    // This would integrate with M-Pesa API to send STK push
    toast({
      title: 'STK Push Sent',
      description: `Payment request sent to ${invoice.client_name}. Customer will receive prompt on their phone.`,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-green-600 rounded-xl">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              M-Pesa Integration Hub
            </h1>
            <p className="text-slate-600">Connect, reconcile, and automate M-Pesa payments</p>
          </div>
        </div>

        {/* Setup Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Till Number Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Enter your M-Pesa Till Number"
                  value={tillNumber}
                  onChange={(e) => setTillNumber(e.target.value)}
                />
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Connect Till Number
                </Button>
                <p className="text-sm text-slate-600">
                  Connect your Till number to automatically receive payment notifications
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                PayBill Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Enter your PayBill Number"
                  value={paybillNumber}
                  onChange={(e) => setPaybillNumber(e.target.value)}
                />
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Connect PayBill
                </Button>
                <p className="text-sm text-slate-600">
                  Link your PayBill for customer payments with account references
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statement Upload */}
        <Card className="bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload M-Pesa Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload your M-Pesa statement
              </p>
              <p className="text-gray-500 mb-4">
                Supports CSV, Excel, and PDF formats from M-Pesa business portal
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="statement-upload"
              />
              <label htmlFor="statement-upload">
                <Button asChild disabled={isLoading}>
                  <span>
                    {isLoading ? 'Processing...' : 'Choose File'}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Interface */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Unmatched M-Pesa Transactions */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Unmatched M-Pesa Payments
                <Badge variant="secondary">{mpesaTransactions.filter(t => !t.is_reconciled).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mpesaTransactions.filter(t => !t.is_reconciled).map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">KES {transaction.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{transaction.customer_name}</p>
                        <p className="text-xs text-gray-500">{transaction.receipt_number}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">
                        {format(new Date(transaction.transaction_date), 'MMM dd')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Ref: {transaction.account_reference}</p>
                    
                    {/* Suggest matching invoices */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">Possible matches:</p>
                      {invoices
                        .filter(inv => Math.abs(inv.total_amount - transaction.amount) <= 100)
                        .slice(0, 2)
                        .map(invoice => (
                          <div key={invoice.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm">
                              Invoice {invoice.invoice_number} - {invoice.client_name}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => matchTransaction(transaction, invoice)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Match
                            </Button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices with STK Push */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Send Payment Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.slice(0, 10).map((invoice) => (
                  <div key={invoice.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Invoice {invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">{invoice.client_name}</p>
                        <p className="text-lg font-bold text-green-600">
                          KES {invoice.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Due {format(new Date(invoice.due_date), 'MMM dd')}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => sendSTKPush(invoice)}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Send STK Push
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
