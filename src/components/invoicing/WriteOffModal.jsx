import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

export default function WriteOffModal({ isOpen, onOpenChange, invoice, onWriteOff }) {
  const [writeOffData, setWriteOffData] = useState({
    amount: '',
    write_off_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && invoice) {
      // Calculate outstanding balance
      const totalPaid = (invoice.payments_received || []).reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingBalance = invoice.total_amount - totalPaid - (invoice.write_off_amount || 0);
      
      setWriteOffData(prev => ({
        ...prev,
        amount: outstandingBalance.toString(),
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        customer_id: invoice.customer_id
      }));
    }
  }, [isOpen, invoice]);

  const handleSave = async () => {
    if (!writeOffData.amount || parseFloat(writeOffData.amount) <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid write-off amount.", variant: "destructive" });
      return;
    }
    if (!writeOffData.reason.trim()) {
      toast({ title: "Validation Error", description: "Please provide a reason for the write-off.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await onWriteOff({
        ...writeOffData,
        amount: parseFloat(writeOffData.amount)
      });
      onOpenChange(false);
      // Reset form
      setWriteOffData({
        amount: '',
        write_off_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
    } catch (error) {
      console.error("Failed to write off invoice:", error);
      toast({ title: "Error", description: `Failed to write off invoice: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Write Off Invoice
          </DialogTitle>
          <DialogDescription>
            Mark Invoice {invoice?.invoice_number} from {invoice?.client_name} as uncollectible.
            This will record a bad debt expense and remove the amount from Accounts Receivable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Outstanding Balance</Label>
            <Input value={`KES ${writeOffData.amount && parseFloat(writeOffData.amount).toLocaleString()}`} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="write_off_amount">Write-off Amount</Label>
            <Input
              id="write_off_amount"
              type="number"
              step="0.01"
              value={writeOffData.amount}
              onChange={(e) => setWriteOffData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="write_off_date">Write-off Date</Label>
            <Input
              id="write_off_date"
              type="date"
              value={writeOffData.write_off_date}
              onChange={(e) => setWriteOffData(prev => ({ ...prev, write_off_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Write-off</Label>
            <Textarea
              id="reason"
              value={writeOffData.reason}
              onChange={(e) => setWriteOffData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Customer filed for bankruptcy, unable to locate customer..."
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
            {isSaving ? 'Processing...' : 'Write Off Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}