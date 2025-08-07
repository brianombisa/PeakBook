import React, { useState, useEffect } from 'react';
import { CreditNote } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Customer } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const reasonLabels = {
  goods_returned: "Goods Returned",
  pricing_error: "Pricing Error", 
  damaged_goods: "Damaged Goods",
  cancellation: "Cancellation",
  discount_adjustment: "Discount Adjustment",
  other: "Other"
};

export default function CreditNoteForm({ creditNote, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    original_invoice_id: '',
    original_invoice_number: '',
    customer_id: '',
    customer_name: '',
    credit_note_date: new Date().toISOString().split('T')[0],
    reason: 'goods_returned',
    line_items: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'KES',
    notes: ''
  });
  
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (creditNote && isOpen) {
      setFormData({
        ...creditNote,
        credit_note_date: creditNote.credit_note_date || new Date().toISOString().split('T')[0],
        line_items: creditNote.line_items || [],
        subtotal: creditNote.subtotal || 0,
        tax_amount: creditNote.tax_amount || 0,
        total_amount: creditNote.total_amount || 0
      });
    }
  }, [creditNote, isOpen]);

  const loadData = async () => {
    try {
      const [invoiceData, customerData] = await Promise.all([
        Invoice.list(),
        Customer.list()
      ]);
      setInvoices(invoiceData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleInvoiceChange = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const customer = customers.find(c => c.id === invoice.customer_id);
      setFormData(prev => ({
        ...prev,
        original_invoice_id: invoiceId,
        original_invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        customer_name: customer?.customer_name || invoice.client_name,
        currency: invoice.currency || 'KES',
        line_items: invoice.line_items?.map(item => ({
          ...item,
          quantity: 0 // Start with 0, user can adjust
        })) || []
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const tax_amount = subtotal * 0.16; // 16% VAT
    const total_amount = subtotal + tax_amount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }));
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' || field === 'unit_price' ? parseFloat(value) || 0 : value
    };
    
    setFormData(prev => ({
      ...prev,
      line_items: newItems
    }));
    
    // Recalculate totals after a short delay
    setTimeout(calculateTotals, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate credit note number if creating new
      let creditNoteNumber = formData.credit_note_number;
      if (!creditNoteNumber) {
        const existingCNs = await CreditNote.list();
        const nextNumber = existingCNs.length + 1;
        creditNoteNumber = `CN-${String(nextNumber).padStart(4, '0')}`;
      }

      const creditNoteData = {
        ...formData,
        credit_note_number: creditNoteNumber,
        status: 'issued'
      };

      let savedCreditNote;
      if (creditNote) {
        savedCreditNote = await CreditNote.update(creditNote.id, creditNoteData);
      } else {
        savedCreditNote = await CreditNote.create(creditNoteData);
      }

      // CRITICAL FIX: Update the original invoice to reflect the credit note
      if (formData.original_invoice_id) {
        const originalInvoice = invoices.find(inv => inv.id === formData.original_invoice_id);
        if (originalInvoice) {
          // Calculate new balance after credit note
          const currentBalance = originalInvoice.balance_due || originalInvoice.total_amount;
          const newBalance = Math.max(0, currentBalance - formData.total_amount);
          
          // Update invoice status if fully credited
          let newStatus = originalInvoice.status;
          if (newBalance === 0 && originalInvoice.status !== 'paid') {
            newStatus = 'paid'; // Mark as paid if fully credited
          }

          await Invoice.update(formData.original_invoice_id, {
            balance_due: newBalance,
            status: newStatus,
            // Add credit note to invoice record
            credit_notes: [
              ...(originalInvoice.credit_notes || []),
              {
                credit_note_id: savedCreditNote.id,
                credit_note_number: creditNoteNumber,
                amount: formData.total_amount,
                date: formData.credit_note_date,
                reason: formData.reason
              }
            ]
          });
        }
      }

      toast({
        title: "Success",
        description: `Credit note ${creditNoteNumber} has been ${creditNote ? 'updated' : 'created'} and applied to the invoice.`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving credit note:', error);
      toast({
        title: "Error",
        description: "Failed to save credit note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableInvoices = invoices.filter(inv => 
    inv.status !== 'cancelled' && inv.status !== 'written_off'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {creditNote ? 'Edit Credit Note' : 'Create Credit Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Original Invoice</Label>
              <Select
                value={formData.original_invoice_id}
                onValueChange={handleInvoiceChange}
                disabled={!!creditNote}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice to credit..." />
                </SelectTrigger>
                <SelectContent>
                  {availableInvoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.client_name} (KES {invoice.total_amount?.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit Note Date</Label>
              <Input
                type="date"
                value={formData.credit_note_date}
                onChange={(e) => setFormData(prev => ({...prev, credit_note_date: e.target.value}))}
                required
              />
            </div>

            <div>
              <Label>Customer</Label>
              <Input
                value={formData.customer_name}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label>Reason for Credit</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({...prev, reason: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reasonLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items */}
          {formData.line_items.length > 0 && (
            <div>
              <Label className="text-base font-semibold">Items to Credit</Label>
              <div className="border rounded-lg mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Original Qty</TableHead>
                      <TableHead>Credit Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.line_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity + (item.credited_quantity || 0)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.quantity + (item.credited_quantity || 0)}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>KES {item.unit_price?.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">
                          KES {(item.quantity * item.unit_price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span>Subtotal:</span>
                  <span>KES {formData.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>VAT (16%):</span>
                  <span>KES {formData.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                  <span>Total Credit:</span>
                  <span className="text-red-600">KES {formData.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Additional notes about this credit note..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !formData.original_invoice_id}>
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {creditNote ? 'Update' : 'Create'} Credit Note
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}