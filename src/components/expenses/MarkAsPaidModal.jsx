import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BankAccount } from '@/api/entities';
import { Expense } from '@/api/entities';
import TransactionService from '../services/TransactionService';
import { useToast } from "@/components/ui/use-toast";
import AuditLogger from '../utils/AuditLogger';

export default function MarkAsPaidModal({ isOpen, onOpenChange, expense, onPaid }) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const loadBankAccounts = async () => {
        try {
          const accounts = await BankAccount.list();
          setBankAccounts(accounts);
          const defaultAccount = accounts.find(acc => acc.is_default);
          if (defaultAccount) {
            setSelectedBankAccountId(defaultAccount.id);
          } else if (accounts.length > 0) {
            setSelectedBankAccountId(accounts[0].id);
          }
        } catch (error) {
          console.error("Failed to load bank accounts", error);
          toast({ title: "Error", description: "Could not load bank accounts.", variant: "destructive" });
        }
      };
      loadBankAccounts();
    }
  }, [isOpen, toast]);

  const handleSave = async () => {
    if (!selectedBankAccountId) {
      toast({ title: "Validation Error", description: "Please select a bank account.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // 1. Create the payment transaction in the General Ledger
      const paymentTransaction = await TransactionService.createExpensePaymentTransaction(
        expense,
        paymentDate,
        selectedBankAccountId
      );

      // 2. Update the expense record with the new status and payment details
      const updatedExpense = await Expense.update(expense.id, {
        status: 'paid',
        payment_date: paymentDate,
        bank_account_id: selectedBankAccountId,
        payment_transaction_id: paymentTransaction.id // Link to the payment transaction
      });

      await AuditLogger.logUpdate('Expense', expense.id, expense, updatedExpense, `Paid expense for ${expense.vendor_name}`);
      toast({ title: "Success!", description: "Expense marked as paid and transaction recorded." });
      onPaid(); // This will trigger a refresh on the main list
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to mark expense as paid:", error);
      toast({ title: "Error", description: `Failed to process payment: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Expense as Paid</DialogTitle>
          <DialogDescription>
            Record a payment for unpaid expense from '{expense?.vendor_name}'.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount to Pay</Label>
            <Input value={`KES ${expense?.amount.toLocaleString()}`} disabled />
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
            <Label htmlFor="bank_account">Pay From Account</Label>
            <Select onValueChange={setSelectedBankAccountId} value={selectedBankAccountId}>
              <SelectTrigger id="bank_account">
                <SelectValue placeholder="Select an account..." />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}