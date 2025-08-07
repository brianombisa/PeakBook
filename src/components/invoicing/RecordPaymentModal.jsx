
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BankAccount } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' }
];

export default function RecordPaymentModal({ isOpen, onClose, invoice, onRefresh }) {
  const [amount, setAmount] = useState(''); // Amount as string for input
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && invoice) {
      const balance = invoice.balance_due || 0;
      setAmount(balance.toString()); // Set initial amount to outstanding balance
      setOutstandingBalance(balance);
      setPaymentDate(new Date().toISOString().split('T')[0]); // Set current date

      // Load bank accounts
      const loadBankAccounts = async () => {
        try {
          const accounts = await BankAccount.list();
          setBankAccounts(accounts);
          const defaultAccount = accounts.find(acc => acc.is_default);
          if (defaultAccount) {
            setBankAccountId(defaultAccount.id);
          }
        } catch (error) {
          console.error("Failed to load bank accounts", error);
          toast({ title: "Error", description: "Could not load bank accounts.", variant: "destructive" });
        }
      };
      loadBankAccounts();
    }
  }, [isOpen, invoice, toast]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid payment amount.", variant: "destructive" });
      return;
    }
    if (!bankAccountId) {
      toast({ title: "Validation Error", description: "Please select a bank account.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await onRefresh({
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId,
        notes: notes,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        customer_id: invoice.customer_id
      });
      onClose(false);
      // Reset form
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('bank_transfer');
      setBankAccountId('');
      setNotes('');
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast({ title: "Error", description: `Failed to record payment: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for Invoice {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700">Outstanding Balance</p>
            <p className="text-xl font-bold text-blue-800">
              KES {outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value)}
            >
              <SelectTrigger id="payment_method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account">Deposit to Account</Label>
            <Select
              value={bankAccountId}
              onValueChange={(value) => setBankAccountId(value)}
            >
              <SelectTrigger id="bank_account">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} ({account.bank_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment reference or additional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
