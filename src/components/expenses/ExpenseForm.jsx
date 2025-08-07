
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UploadFile } from '@/api/integrations';
import { Expense } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { BankAccount } from '@/api/entities';
import TransactionService from '../services/TransactionService';
import { useToast } from '@/components/ui/use-toast';
import { Save, X, Loader2, Upload, Plus, Building } from 'lucide-react';
import AuditLogger from '../utils/AuditLogger';

// Quick Supplier Creation Form
const QuickSupplierForm = ({ onSupplierCreated, onCancel }) => {
  const [supplierData, setSupplierData] = useState({
    supplier_name: '',
    contact_person: '',
    contact_email: '',
    phone_number: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newSupplier = await Supplier.create(supplierData);
      toast({ title: "Success", description: "Supplier created successfully." });
      onSupplierCreated(newSupplier);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create supplier.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Supplier</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="supplier_name">Supplier Name *</Label>
          <Input 
            id="supplier_name" 
            value={supplierData.supplier_name}
            onChange={(e) => setSupplierData({...supplierData, supplier_name: e.target.value})}
            placeholder="e.g., Safaricom Ltd"
            required 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input 
              id="contact_person" 
              value={supplierData.contact_person}
              onChange={(e) => setSupplierData({...supplierData, contact_person: e.target.value})}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input 
              id="contact_email" 
              type="email"
              value={supplierData.contact_email}
              onChange={(e) => setSupplierData({...supplierData, contact_email: e.target.value})}
              placeholder="john@company.com"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input 
            id="phone_number" 
            value={supplierData.phone_number}
            onChange={(e) => setSupplierData({...supplierData, phone_number: e.target.value})}
            placeholder="+254 700 000 000"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create Supplier
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default function ExpenseForm({ expense, suppliers = [], accounts = [], onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    supplier_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    status: 'paid',
    receipt_url: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'mpesa',
    bank_account_id: '',
    due_date: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState(suppliers);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    setAllSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    if (expense) {
      setFormData({
        vendor_name: expense.vendor_name || '',
        supplier_id: expense.supplier_id || '',
        expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: expense.description || '',
        amount: expense.amount || '',
        category: expense.category || '',
        status: expense.status || 'paid',
        receipt_url: expense.receipt_url || '',
        payment_date: expense.payment_date ? new Date(expense.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: expense.payment_method || 'mpesa',
        bank_account_id: expense.bank_account_id || '',
        due_date: expense.due_date ? new Date(expense.due_date).toISOString().split('T')[0] : ''
      });
    }
  }, [expense]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await BankAccount.list();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = allSuppliers.find(s => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      vendor_name: selectedSupplier ? selectedSupplier.supplier_name : ''
    }));
  };

  const handleSupplierCreated = (newSupplier) => {
    setAllSuppliers(prev => [...prev, newSupplier]);
    setFormData(prev => ({
      ...prev,
      supplier_id: newSupplier.id,
      vendor_name: newSupplier.supplier_name
    }));
    setIsSupplierDialogOpen(false);
    toast({ title: "Success", description: "Supplier added and selected." });
  };

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let finalReceiptUrl = formData.receipt_url;

    try {
      if (receiptFile) {
        const { file_url } = await UploadFile({ file: receiptFile });
        finalReceiptUrl = file_url;
      }

      const dataToSave = { 
        ...formData, 
        receipt_url: finalReceiptUrl, 
        amount: parseFloat(formData.amount)
      };
      
      let savedExpense;
      if (expense?.id) {
        savedExpense = await Expense.update(expense.id, dataToSave);
        await AuditLogger.log('updated', 'Expense', savedExpense.id, `Updated Expense for ${savedExpense.vendor_name}`);
        toast({ title: "Success", description: "Expense updated." });
      } else {
        savedExpense = await Expense.create(dataToSave);
        // Use the TransactionService to post to GL
        const transaction = await TransactionService.createExpenseTransaction(savedExpense);
        // Link the transaction back to the expense
        await Expense.update(savedExpense.id, { transaction_id: transaction.id });
        await AuditLogger.log('created', 'Expense', savedExpense.id, `Created Expense for ${savedExpense.vendor_name}`);
        toast({ title: "Success", description: "Expense created." });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({ title: "Error", description: "Failed to save expense.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{expense?.id ? 'Edit Expense' : 'Create Expense'}</CardTitle>
        <CardDescription>Fill in the details of the business expense.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_select">Vendor/Supplier</Label>
              <div className="flex gap-2">
                <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select or search supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{supplier.supplier_name}</span>
                          {supplier.contact_email && (
                            <span className="text-xs text-gray-500">{supplier.contact_email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <QuickSupplierForm 
                    onSupplierCreated={handleSupplierCreated}
                    onCancel={() => setIsSupplierDialogOpen(false)}
                  />
                </Dialog>
              </div>
              {!formData.supplier_id && (
                <div className="mt-2">
                  <Input 
                    name="vendor_name" 
                    value={formData.vendor_name} 
                    onChange={handleChange} 
                    placeholder="Or type supplier name manually" 
                    className="text-sm"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="expense_date">Expense Date</Label>
              <Input id="expense_date" name="expense_date" type="date" value={formData.expense_date} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Monthly internet bill" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="e.g., 5000" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="office_supplies">Office Supplies</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="cost_of_sales">Cost of Sales</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'paid' && (
            <div className="p-4 border rounded-md bg-slate-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input id="payment_date" name="payment_date" type="date" value={formData.payment_date} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="bank_account_id">Paid From Account</Label>
                  <Select name="bank_account_id" value={formData.bank_account_id} onValueChange={(value) => handleSelectChange('bank_account_id', value)}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{account.account_name}</span>
                            <span className="text-xs text-gray-500">{account.bank_name} - {account.account_number}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bankAccounts.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No bank accounts found. Set up your accounts in Settings → Banking.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.status === 'unpaid' && (
            <div className="p-4 border rounded-md bg-amber-50 space-y-4">
               <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} />
                </div>
            </div>
          )}

          <div>
            <Label htmlFor="receipt">Attach Receipt</Label>
            <Input id="receipt" type="file" onChange={handleFileChange} />
            {formData.receipt_url && !receiptFile && (
              <a href={formData.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                View current receipt
              </a>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {expense?.id ? 'Save Changes' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
