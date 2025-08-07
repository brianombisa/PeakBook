import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { format } from 'date-fns';

const transactionTypes = [
    { value: 'receipt', label: 'Receipt/Deposit' },
    { value: 'expense', label: 'Expense/Payment' },
    { value: 'adjustment', label: 'Bank Adjustment' },
    { value: 'transfer', label: 'Transfer' }
];

const commonAccounts = [
    { code: '1000', name: 'Cash and Bank', type: 'asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '4000', name: 'Sales Revenue', type: 'revenue' },
    { code: '5000', name: 'Office Expenses', type: 'expense' },
    { code: '5100', name: 'Bank Charges', type: 'expense' },
    { code: '5200', name: 'Interest Income', type: 'revenue' },
    { code: '5300', name: 'Miscellaneous Expenses', type: 'expense' }
];

export default function NewTransactionModal({ bankTransaction, onSave, onClose }) {
    const [formData, setFormData] = useState({
        transaction_date: bankTransaction?.date || new Date().toISOString().split('T')[0],
        reference_number: `BANK-${new Date().getTime()}`,
        description: bankTransaction?.description || '',
        total_amount: Math.abs(bankTransaction?.credit || bankTransaction?.debit || 0),
        currency: 'KES',
        transaction_type: (bankTransaction?.credit || 0) > 0 ? 'receipt' : 'expense',
        journal_entries: []
    });

    const [selectedAccount, setSelectedAccount] = useState('');

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTransactionTypeChange = (type) => {
        setFormData(prev => ({ ...prev, transaction_type: type }));
        
        // Auto-generate basic journal entries based on transaction type
        const amount = formData.total_amount;
        let entries = [];
        
        switch (type) {
            case 'receipt':
                entries = [
                    { account_code: '1000', account_name: 'Cash and Bank', debit_amount: amount, credit_amount: 0 },
                    { account_code: '4000', account_name: 'Sales Revenue', debit_amount: 0, credit_amount: amount }
                ];
                break;
            case 'expense':
                entries = [
                    { account_code: '5000', account_name: 'Office Expenses', debit_amount: amount, credit_amount: 0 },
                    { account_code: '1000', account_name: 'Cash and Bank', debit_amount: 0, credit_amount: amount }
                ];
                break;
            case 'adjustment':
                entries = [
                    { account_code: '5100', account_name: 'Bank Charges', debit_amount: amount, credit_amount: 0 },
                    { account_code: '1000', account_name: 'Cash and Bank', debit_amount: 0, credit_amount: amount }
                ];
                break;
        }
        
        setFormData(prev => ({ ...prev, journal_entries: entries }));
    };

    const handleSave = () => {
        // Basic validation
        if (!formData.transaction_date || !formData.description || !formData.total_amount) {
            return;
        }
        
        onSave(formData);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Transaction</DialogTitle>
                    <DialogDescription>
                        This bank transaction doesn't have a match in your ledger. Create a new transaction to record it.
                    </DialogDescription>
                </DialogHeader>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Bank Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="bg-slate-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Date:</span> {format(new Date(bankTransaction?.date), 'PPP')}
                            </div>
                            <div>
                                <span className="font-medium">Amount:</span> KES {Math.abs(bankTransaction?.credit || bankTransaction?.debit || 0).toLocaleString()}
                            </div>
                            <div className="col-span-2">
                                <span className="font-medium">Description:</span> {bankTransaction?.description}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">New Transaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="transaction_date">Transaction Date</Label>
                                <Input
                                    id="transaction_date"
                                    type="date"
                                    value={formData.transaction_date}
                                    onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="reference_number">Reference Number</Label>
                                <Input
                                    id="reference_number"
                                    value={formData.reference_number}
                                    onChange={(e) => handleInputChange('reference_number', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="transaction_type">Transaction Type</Label>
                            <Select 
                                value={formData.transaction_type} 
                                onValueChange={handleTransactionTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select transaction type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {transactionTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Enter transaction description"
                            />
                        </div>

                        <div>
                            <Label htmlFor="total_amount">Amount (KES)</Label>
                            <Input
                                id="total_amount"
                                type="number"
                                step="0.01"
                                value={formData.total_amount}
                                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Journal Entries Preview */}
                        {formData.journal_entries.length > 0 && (
                            <div>
                                <Label>Journal Entries (Auto-generated)</Label>
                                <div className="mt-2 border rounded-md">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="p-2 text-left">Account</th>
                                                <th className="p-2 text-right">Debit</th>
                                                <th className="p-2 text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.journal_entries.map((entry, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2">{entry.account_code} - {entry.account_name}</td>
                                                    <td className="p-2 text-right">
                                                        {entry.debit_amount > 0 ? `KES ${entry.debit_amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        {entry.credit_amount > 0 ? `KES ${entry.credit_amount.toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            Create Transaction
                        </Button>
                    </CardFooter>
                </Card>
            </DialogContent>
        </Dialog>
    );
}