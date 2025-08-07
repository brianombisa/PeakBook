
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Send, FileText, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import ScheduleTransactionModal from '../scheduling/ScheduleTransactionModal';
import { Item } from '@/api/entities'; // Ensure using the correct Item entity

// New imports required for the outlined functionality
import CurrencySelector from './CurrencySelector';
import CurrencyService from '../services/CurrencyService';

const VAT_RATE = 16; // 16% VAT for Kenya

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on receipt', days: 0 },
  { value: 'net_15', label: 'Net 15 days', days: 15 },
  { value: 'net_30', label: 'Net 30 days', days: 30 },
  { value: 'net_60', label: 'Net 60 days', days: 60 },
  { value: 'net_90', label: 'Net 90 days', days: 90 }
];

export default function InvoiceForm({ invoice: initialInvoice, onSave, onCancel, customers, items, isLoading }) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_name: '', client_email: '', client_address: '', customer_id: null,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    line_items: [{ item_id: '', description: '', quantity: 1, unit_price: '', base_price: 0, vat_amount: 0, total: 0, cost_price: 0 }],
    subtotal: 0, tax_amount: 0, total_amount: 0,
    currency: 'KES', // Default currency
    exchange_rate: 1, // Default exchange rate
    base_currency_total: 0, // Total in base currency
    exchange_rate_date: new Date().toISOString().split('T')[0],
    exchange_rate_source: 'manual', // or 'api'
    payment_terms: 'net_15', notes: '', status: 'draft',
  });

  const [currencyData, setCurrencyData] = useState({
    currency: 'KES',
    exchangeRate: 1,
    baseAmount: 0 // This will be calculated based on formData.total_amount
  });
  const [companyBaseCurrency, setCompanyBaseCurrency] = useState('KES');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Effect to load initial invoice data when prop changes
  useEffect(() => {
    if (initialInvoice) {
      setFormData(prev => ({
        ...prev,
        ...initialInvoice,
        // Ensure line_items is always an array
        line_items: initialInvoice.line_items && initialInvoice.line_items.length > 0
          ? initialInvoice.line_items
          : [{ item_id: '', description: '', quantity: 1, unit_price: '', base_price: 0, vat_amount: 0, total: 0, cost_price: 0 }],
      }));
      setCurrencyData({
        currency: initialInvoice.currency || 'KES',
        exchangeRate: initialInvoice.exchange_rate || 1,
        baseAmount: initialInvoice.base_currency_total || 0,
      });
    }
  }, [initialInvoice]);

  // Add new useEffect to load company currency settings
  useEffect(() => {
    loadCompanyCurrency();
  }, []);

  const loadCompanyCurrency = async () => {
    try {
      // Dynamic import to avoid circular dependencies or initial load issues
      const { CompanyProfile } = await import('@/api/entities');
      const { User } = await import('@/api/entities');
      const user = await User.me();
      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setCompanyBaseCurrency(profiles[0].base_currency || 'KES');
        // If it's a new invoice and no initial currency set, default to company base currency
        if (!initialInvoice && !formData.currency) {
          setCurrencyData(prev => ({ ...prev, currency: profiles[0].base_currency || 'KES' }));
          setFormData(prev => ({ ...prev, currency: profiles[0].base_currency || 'KES' }));
        }
      }
    } catch (error) {
      console.error('Error loading company currency:', error);
      toast({
        title: "Currency Load Error",
        description: "Failed to load company base currency.",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = useCallback(() => {
    const updatedItems = formData.line_items.map(item => {
      const unitPrice = parseFloat(item.unit_price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      // Calculate base price and VAT amount for VAT-inclusive unit price
      const base_price_per_unit = unitPrice / (1 + VAT_RATE / 100);
      const vat_amount_per_unit = unitPrice - base_price_per_unit;
      const total_per_item = unitPrice * quantity; // Total for this line item (inclusive of VAT)

      return {
        ...item,
        base_price: base_price_per_unit,
        vat_amount: vat_amount_per_unit,
        total: total_per_item
      };
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
    const tax_amount = updatedItems.reduce((sum, item) => sum + (item.vat_amount * item.quantity), 0);
    const total_amount = updatedItems.reduce((sum, item) => sum + item.total, 0); // Sum of total for each line item

    setFormData(prev => ({
      ...prev,
      line_items: updatedItems,
      subtotal: subtotal,
      tax_amount: tax_amount,
      total_amount: total_amount
    }));

    // Update currency conversion if needed
    if (currencyData.currency !== companyBaseCurrency) {
      setCurrencyData(prev => ({
        ...prev,
        baseAmount: total_amount * (currencyData.exchangeRate || 1)
      }));
    } else {
      setCurrencyData(prev => ({
        ...prev,
        baseAmount: total_amount // If same currency, baseAmount is just total_amount
      }));
    }
  }, [formData.line_items, currencyData.currency, currencyData.exchangeRate, companyBaseCurrency]);

  // Effect to recalculate totals whenever line items, currency, or exchange rate change
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        client_name: customer.customer_name,
        client_email: customer.contact_email,
        client_address: customer.address,
      }));
    }
  };

  const handlePaymentTermsChange = (termValue) => {
    const term = PAYMENT_TERMS.find(t => t.value === termValue);
    if (term) {
      const invoiceDate = new Date(formData.invoice_date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + term.days);

      setFormData(prev => ({
        ...prev,
        payment_terms: termValue,
        due_date: dueDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleInvoiceDateChange = (date) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, invoice_date: date };

      // Recalculate due date based on current payment terms
      const currentTerm = PAYMENT_TERMS.find(t => t.value === updatedFormData.payment_terms);
      if (currentTerm) {
        const invoiceDate = new Date(date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + currentTerm.days);
        updatedFormData.due_date = dueDate.toISOString().split('T')[0];
      }
      return updatedFormData;
    });
  };

  const handleItemSelect = (index, itemId) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (!selectedItem) return;

    const lineItems = [...formData.line_items];
    lineItems[index] = {
      ...lineItems[index],
      item_id: selectedItem.id,
      description: selectedItem.description || selectedItem.item_name,
      unit_price: selectedItem.unit_price || 0,
      cost_price: selectedItem.unit_cost || 0, // Capture the cost price for COGS
    };
    setFormData({ ...formData, line_items: lineItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.line_items];
    // For price and quantity fields, handle empty strings properly
    if (field === 'unit_price' || field === 'quantity') {
      newItems[index] = { ...newItems[index], [field]: value === '' ? '' : value };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { item_id: '', description: '', quantity: 1, unit_price: '', base_price: 0, vat_amount: 0, total: 0, cost_price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, line_items: prev.line_items.filter((_, i) => i !== index) }));
  };

  const handleScheduleInvoice = () => {
    if (!formData.customer_id || !formData.client_email) {
      toast({
        title: "Missing Information",
        description: "Please select a customer with email address first.",
        variant: "destructive"
      });
      return;
    }
    setShowScheduleModal(true);
  };

  const handleCurrencyChange = (newCurrencyData) => {
    setCurrencyData(newCurrencyData);
    setFormData(prev => ({
      ...prev,
      currency: newCurrencyData.currency,
      exchange_rate: newCurrencyData.exchangeRate,
      base_currency_total: newCurrencyData.baseAmount,
      exchange_rate_date: new Date().toISOString().split('T')[0], // Update date on change
      exchange_rate_source: newCurrencyData.source,
    }));
  };

  const handleSubmit = async (status) => {
    // Manually ensure latest calculated totals are in formData before saving
    calculateTotals(); // Ensure latest totals are calculated and currencyData is updated
    
    // Create a copy of formData and currencyData for submission
    const finalFormData = {
      ...formData,
      status: status, // Set the status based on button click
      currency: currencyData.currency,
      exchange_rate: currencyData.exchangeRate,
      base_currency_total: currencyData.baseAmount,
      exchange_rate_date: new Date().toISOString().split('T')[0], // Use current date for exchange rate
      exchange_rate_source: currencyData.source || 'manual', // Source from CurrencySelector, default manual
    };

    try {
      await onSave(finalFormData);
      // Parent component is responsible for success toast and navigation/state reset
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast({
        title: "Error Saving Invoice",
        description: error.message || "An unexpected error occurred while saving the invoice.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <Alert><AlertDescription>Prices are VAT inclusive (16%). The system automatically calculates base price and VAT.</AlertDescription></Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Bill To</h3>
              <Select onValueChange={handleCustomerSelect} value={formData.customer_id || ''}>
                <SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}</SelectContent>
              </Select>
              <div><Label>Client Name</Label><Input value={formData.client_name} readOnly /></div>
              <div><Label>Client Email</Label><Input value={formData.client_email} readOnly /></div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Dates & Terms</h3>
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={e => handleInvoiceDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={handlePaymentTermsChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(term => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Add Currency Selection */}
          <div className="md:col-span-2">
            <CurrencySelector
              selectedCurrency={currencyData.currency}
              onCurrencyChange={handleCurrencyChange}
              baseCurrency={companyBaseCurrency}
              amount={formData.total_amount}
              showConversion={true}
              autoFetchRate={true}
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-4">Items</h3>
            <div className="space-y-2">
              {formData.line_items.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-2 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-grow">
                    <div className="md:col-span-4">
                      <Label>Item/Service</Label>
                      <Select onValueChange={(value) => handleItemSelect(index, value)} value={item.item_id || ''}>
                        <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                        <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.item_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Unit Price (inc. VAT)</Label>
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3 text-right pr-2">
                      <Label>Total</Label>
                      <div className="font-medium mt-2">
                        {CurrencyService.formatCurrency(item.total || 0, currencyData.currency)}
                      </div>
                      <div className="text-xs text-slate-500">
                        (Base: {CurrencyService.formatCurrency((item.base_price || 0) * (item.quantity || 0), currencyData.currency)},
                        VAT: {CurrencyService.formatCurrency((item.vat_amount || 0) * (item.quantity || 0), currencyData.currency)})
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="md:col-span-1 text-red-500 hover:text-red-600 mt-6" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="mt-4"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><Label>Notes / Remarks</Label><Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Thank you for your business." /></div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal (Base)</span>
                <span className="font-medium">{CurrencyService.formatCurrency(formData.subtotal, currencyData.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total VAT (16%)</span>
                <span className="font-medium">{CurrencyService.formatCurrency(formData.tax_amount, currencyData.currency)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{CurrencyService.formatCurrency(formData.total_amount, currencyData.currency)}</span>
              </div>
              {currencyData.currency !== companyBaseCurrency && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total ({companyBaseCurrency}):</span>
                  <span>{CurrencyService.formatCurrency(currencyData.baseAmount, companyBaseCurrency)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isLoading}>
            <FileText className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
          <Button
            variant="outline"
            onClick={handleScheduleInvoice}
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
            disabled={isLoading}
          >
            <Clock className="w-4 h-4 mr-2" /> Schedule Later
          </Button>
          <Button onClick={() => handleSubmit('sent')} disabled={isLoading}>
            <Send className="w-4 h-4 mr-2" /> Save & Send
          </Button>
        </CardFooter>
      </Card>

      <ScheduleTransactionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        transactionType="invoice"
        transactionData={formData} // Pass formData, not invoice, to the modal
        recipientEmail={formData.client_email}
      />
    </>
  );
}
