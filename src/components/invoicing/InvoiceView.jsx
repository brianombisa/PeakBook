import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Download, Send, X } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800", 
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-600",
  written_off: "bg-orange-100 text-orange-800"
};

export default function InvoiceView({ invoice, isOpen, onClose, onEdit }) {
  // Early return if invoice is null or undefined
  if (!invoice) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">No invoice data available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Safe property access with defaults
  const invoiceTemplate = invoice.template || 'professional';
  const lineItems = invoice.line_items || [];
  const subtotal = invoice.subtotal || 0;
  const taxAmount = invoice.tax_amount || 0;
  const totalAmount = invoice.total_amount || 0;
  const balanceDue = invoice.balance_due || totalAmount;
  const currency = invoice.currency || 'KES';
  const status = invoice.status || 'draft';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">
                Invoice {invoice.invoice_number || 'N/A'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className={statusColors[status]}>
                  {status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  Template: {invoiceTemplate}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
              <div className="space-y-1">
                <p className="font-medium">{invoice.client_name || 'N/A'}</p>
                {invoice.client_email && (
                  <p className="text-sm text-gray-600">{invoice.client_email}</p>
                )}
                {invoice.client_address && (
                  <p className="text-sm text-gray-600">{invoice.client_address}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Invoice Details:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Invoice Date:</span>
                  <span>{invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{currency}</span>
                </div>
                {invoice.exchange_rate && invoice.exchange_rate !== 1 && (
                  <div className="flex justify-between">
                    <span>Exchange Rate:</span>
                    <span>{invoice.exchange_rate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Item</th>
                    <th className="text-right p-3 font-medium text-gray-700">Qty</th>
                    <th className="text-right p-3 font-medium text-gray-700">Rate</th>
                    <th className="text-right p-3 font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length > 0 ? lineItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.description || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right">{item.quantity || 0}</td>
                      <td className="p-3 text-right">{currency} {(item.unit_price || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-medium">
                        {currency} {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currency} {subtotal.toLocaleString()}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{currency} {taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{currency} {totalAmount.toLocaleString()}</span>
              </div>
              {balanceDue > 0 && balanceDue !== totalAmount && (
                <div className="flex justify-between font-medium text-red-600">
                  <span>Balance Due:</span>
                  <span>{currency} {balanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Terms */}
          {invoice.payment_terms && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Payment Terms</h3>
              <p className="text-gray-600">{invoice.payment_terms}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}