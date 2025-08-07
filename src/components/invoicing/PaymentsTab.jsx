
import React, { useState, useEffect } from 'react';
import { Transaction } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { BankAccount } from "@/api/entities"; // Import BankAccount
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Save } from 'lucide-react'; // Added Loader2
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { AuditLogger } from '../utils/AuditLogger';

const PaymentForm = ({ customers, invoices, bankAccounts, onRefresh }) => {
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedBankAccount, setSelectedBankAccount] = useState(''); // New state
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [open, setOpen] = useState(false);
    const [outstandingBalance, setOutstandingBalance] = useState(0);
    const [isSaving, setIsSaving] = useState(false); // Add saving state
    const { toast } = useToast();

    const unpaidInvoices = invoices.filter(inv => inv.customer_id === selectedCustomer && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off');

    useEffect(() => {
        if (selectedCustomer) {
            const balance = unpaidInvoices.reduce((sum, inv) => sum + inv.balance_due, 0);
            setOutstandingBalance(balance);
        } else {
            setOutstandingBalance(0);
        }
    }, [selectedCustomer, invoices, unpaidInvoices]);
    
    useEffect(() => {
        // Pre-select the default bank account if available
        const defaultAccount = bankAccounts.find(acc => acc.is_default);
        if (defaultAccount) {
            setSelectedBankAccount(defaultAccount.id);
        }
    }, [bankAccounts]);

    const handleSavePayment = async () => {
        if (!selectedCustomer || !paymentAmount || paymentAmount <= 0 || !selectedBankAccount) {
            toast({ title: "Error", description: "Please select a customer, a bank account, and enter a valid payment amount.", variant: "destructive" });
            return;
        }

        setIsSaving(true); // Set saving state to true
        try {
            // Distribute payment across oldest invoices first
            let amountToApply = paymentAmount;
            for (const inv of unpaidInvoices.sort((a,b) => new Date(a.due_date) - new Date(b.due_date))) {
                if (amountToApply <= 0) break;
                
                const amountForThisInvoice = Math.min(amountToApply, inv.balance_due);
                const newPaidAmount = inv.paid_amount + amountForThisInvoice;
                const newBalanceDue = inv.balance_due - amountForThisInvoice;
                
                await Invoice.update(inv.id, {
                    paid_amount: newPaidAmount,
                    balance_due: newBalanceDue,
                    status: newBalanceDue <= 0 ? 'paid' : inv.status
                });

                amountToApply -= amountForThisInvoice;
            }
            
            // NEW: Sequential reference number logic for receipts
            const receiptTransactions = await Transaction.filter({ transaction_type: 'receipt' });
            let nextReceiptNumber = 101;
            if (receiptTransactions.length > 0) {
                const numericRefs = receiptTransactions
                    .map(t => parseInt(t.reference_number))
                    .filter(n => !isNaN(n));
                
                if (numericRefs.length > 0) {
                    const maxRef = Math.max(...numericRefs);
                    nextReceiptNumber = maxRef + 1;
                }
            }

            // Create transaction record
            const customer = customers.find(c => c.id === selectedCustomer);
            const savedTransaction = await Transaction.create({
                transaction_date: paymentDate,
                reference_number: nextReceiptNumber.toString(), // Use new sequential number
                description: `Payment from ${customer.customer_name}`,
                total_amount: paymentAmount,
                currency: 'KES',
                transaction_type: 'receipt',
                client_id: selectedCustomer,
                bank_account_id: selectedBankAccount, // Save the selected bank account ID
                status: 'posted',
                journal_entries: [
                  { account_code: "1010", account_name: "Cash at Bank", debit_amount: paymentAmount, credit_amount: 0 },
                  { account_code: "1100", account_name: "Accounts Receivable", debit_amount: 0, credit_amount: paymentAmount }
                ]
            });

            await AuditLogger.logCreate('Transaction', savedTransaction, `Payment Receipt ${savedTransaction.reference_number}`);
            
            toast({ title: "Success", description: "Payment recorded successfully." });
            onRefresh();
            setOpen(false);
            // Reset form
            setSelectedCustomer('');
            setPaymentAmount(0); // Reset to 0 after successful save
            setSelectedBankAccount(bankAccounts.find(acc => acc.is_default)?.id || '');
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        } finally {
            setIsSaving(false); // Always reset saving state
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2"/>New Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div><Label>Customer</Label><Select onValueChange={setSelectedCustomer}><SelectTrigger><SelectValue placeholder="Select a customer..."/></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}</SelectContent></Select></div>
                    
                    {selectedCustomer && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm font-medium text-blue-800">
                                Outstanding Balance: KES {outstandingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </p>
                        </div>
                    )}
                    
                    <div>
                        <Label>Deposit to Account</Label>
                        <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a bank account..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {bankAccounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.account_name} ({acc.bank_name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div><Label>Payment Date</Label><Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} /></div>
                    <div><Label>Amount Received</Label><Input type="number" placeholder="Enter amount" value={paymentAmount || ''} onChange={e => setPaymentAmount(parseFloat(e.target.value) || '')} /></div>
                    {selectedCustomer && <p className="text-sm text-slate-500">This payment will be automatically applied to the oldest outstanding invoices for this customer.</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSavePayment} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function PaymentsTab({ transactions, invoices, customers, bankAccounts, onRefresh, isLoading }) {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments Received</CardTitle>
          <PaymentForm customers={customers} invoices={invoices} bankAccounts={bankAccounts} onRefresh={onRefresh} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Reference</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array(5).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full"/></TableCell></TableRow>) 
                : transactions.length > 0 ? transactions.map(t => {
                    const customer = customers.find(c => c.id === t.client_id);
                    return (
                        <TableRow key={t.id}>
                            <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{customer?.customer_name || 'N/A'}</TableCell>
                            <TableCell>{t.reference_number}</TableCell>
                            <TableCell className="font-medium text-green-600">KES {t.total_amount.toLocaleString()}</TableCell>
                        </TableRow>
                    );
                }) : <TableRow><TableCell colSpan={4} className="text-center h-24">No payments recorded yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
