
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Save, X, Zap, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// IFRS-compliant automatic journal entry rules
const getAutomaticJournalEntries = (transactionType, amount, accounts, selectedAccountCode) => {
  const numericAmount = parseFloat(amount) || 0;
  
  if (numericAmount <= 0) return [];

  const rules = {
    sale: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1100', description: 'Accounts Receivable' },
      contra: { type: 'credit', accountTypes: ['revenue'], defaultCode: '4000', description: 'Sales Revenue' }
    },
    cash_sale: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' },
      contra: { type: 'credit', accountTypes: ['revenue'], defaultCode: '4000', description: 'Sales Revenue' }
    },
    purchase: {
      primary: { type: 'debit', accountTypes: ['expense'], defaultCode: '5000', description: 'Cost of Goods Sold' },
      contra: { type: 'credit', accountTypes: ['liability'], defaultCode: '2000', description: 'Accounts Payable' }
    },
    cash_purchase: {
      primary: { type: 'debit', accountTypes: ['expense'], defaultCode: '5000', description: 'Purchases' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' }
    },
    expense: {
      primary: { type: 'debit', accountTypes: ['expense'], defaultCode: selectedAccountCode || '5100', description: 'Expense Account' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' }
    },
    payment: {
      primary: { type: 'debit', accountTypes: ['liability'], defaultCode: '2000', description: 'Accounts Payable' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' }
    },
    receipt: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1100', description: 'Accounts Receivable' }
    },
    asset_purchase: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1500', description: 'Equipment/Asset' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' }
    },
    loan_received: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' },
      contra: { type: 'credit', accountTypes: ['liability'], defaultCode: '2100', description: 'Bank Loan' }
    },
    owner_investment: {
      primary: { type: 'debit', accountTypes: ['asset'], defaultCode: '1000', description: 'Cash' },
      contra: { type: 'credit', accountTypes: ['equity'], defaultCode: '3000', description: 'Owner\'s Equity' }
    },
    depreciation: {
      primary: { type: 'debit', accountTypes: ['expense'], defaultCode: '5200', description: 'Depreciation Expense' },
      contra: { type: 'credit', accountTypes: ['asset'], defaultCode: '1599', description: 'Accumulated Depreciation' }
    }
  };

  const rule = rules[transactionType];
  if (!rule) return [];

  const findAccount = (accountTypes, defaultCode) => {
    let account = accounts.find(acc => acc.account_code === defaultCode && acc.is_active);
    if (!account) {
      account = accounts.find(acc => accountTypes.includes(acc.account_type) && acc.is_active);
    }
    return account;
  };

  const primaryAccount = findAccount(rule.primary.accountTypes, rule.primary.defaultCode);
  const contraAccount = findAccount(rule.contra.accountTypes, rule.contra.defaultCode);

  const entries = [];
  
  if (primaryAccount) {
    entries.push({
      account_code: primaryAccount.account_code,
      account_name: primaryAccount.account_name,
      debit_amount: rule.primary.type === 'debit' ? numericAmount : 0,
      credit_amount: rule.primary.type === 'credit' ? numericAmount : 0,
      description: rule.primary.description
    });
  }

  if (contraAccount) {
    entries.push({
      account_code: contraAccount.account_code,
      account_name: contraAccount.account_name,
      debit_amount: rule.contra.type === 'debit' ? numericAmount : 0,
      credit_amount: rule.contra.type === 'credit' ? numericAmount : 0,
      description: rule.contra.description
    });
  }

  return entries;
};

export default function TransactionForm({ transaction, accounts, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(transaction || {
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: "",
    description: "",
    total_amount: 0,
    currency: "USD",
    transaction_type: "expense",
    journal_entries: [],
    status: "draft"
  });

  const [useAutoAllocation, setUseAutoAllocation] = useState(true);
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState("");

  // Generate journal entries when key fields change - Fixed the dependency array
  useEffect(() => {
    if (useAutoAllocation && formData.transaction_type && parseFloat(formData.total_amount) > 0) {
      console.log('Generating journal entries for:', formData.transaction_type, formData.total_amount);
      
      const autoEntries = getAutomaticJournalEntries(
        formData.transaction_type, 
        parseFloat(formData.total_amount), 
        accounts || [],
        selectedExpenseAccount
      );
      
      console.log('Generated entries:', autoEntries);
      
      if (autoEntries.length > 0) {
        setFormData(prev => ({
          ...prev,
          journal_entries: autoEntries
        }));
      }
    } else if (!useAutoAllocation && formData.journal_entries.length === 0) {
      // Initialize manual entries
      setFormData(prev => ({
        ...prev,
        journal_entries: [
          { account_code: "", account_name: "", debit_amount: 0, credit_amount: 0, description: "" },
          { account_code: "", account_name: "", debit_amount: 0, credit_amount: 0, description: "" }
        ]
      }));
    }
  }, [formData.transaction_type, formData.total_amount, useAutoAllocation, accounts, selectedExpenseAccount]);

  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseAccountChange = (accountCode) => {
    setSelectedExpenseAccount(accountCode);
  };

  const toggleAutoAllocation = (enabled) => {
    setUseAutoAllocation(enabled);
    if (!enabled) {
      setFormData(prev => ({
        ...prev,
        journal_entries: [
          { account_code: "", account_name: "", debit_amount: 0, credit_amount: 0, description: "" },
          { account_code: "", account_name: "", debit_amount: 0, credit_amount: 0, description: "" }
        ]
      }));
    }
  };

  const handleJournalEntryChange = (index, field, value) => {
    const newEntries = [...formData.journal_entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value
    };

    if (field === 'account_code') {
      const account = accounts.find(acc => acc.account_code === value);
      if (account) {
        newEntries[index].account_name = account.account_name;
      }
    }

    setFormData(prev => ({
      ...prev,
      journal_entries: newEntries
    }));
  };

  const addJournalEntry = () => {
    setFormData(prev => ({
      ...prev,
      journal_entries: [
        ...prev.journal_entries,
        { account_code: "", account_name: "", debit_amount: 0, credit_amount: 0, description: "" }
      ]
    }));
  };

  const removeJournalEntry = (index) => {
    if (formData.journal_entries.length > 2) {
      setFormData(prev => ({
        ...prev,
        journal_entries: prev.journal_entries.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const totalDebits = formData.journal_entries.reduce((sum, entry) => sum + (parseFloat(entry.debit_amount) || 0), 0);
    const totalCredits = formData.journal_entries.reduce((sum, entry) => sum + (parseFloat(entry.credit_amount) || 0), 0);
    return { totalDebits, totalCredits, difference: totalDebits - totalCredits };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totals = calculateTotals();
    
    if (Math.abs(totals.difference) > 0.01) {
      alert("Debits and Credits must balance!");
      return;
    }

    onSubmit({
      ...formData,
      total_amount: totals.totalDebits
    });
  };

  const totals = calculateTotals();
  const expenseAccounts = accounts ? accounts.filter(acc => acc.account_type === 'expense' && acc.is_active) : [];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {transaction ? 'Edit Transaction' : 'New Transaction'}
          <Badge variant="outline" className="text-xs">
            IFRS Compliant
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Depreciation Info Alert */}
          {formData.transaction_type === 'asset_purchase' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>IFRS Depreciation Reminder:</strong> Asset purchases should be depreciated using straight-line method. 
                Annual Depreciation = (Cost - Residual Value) ÷ Useful Life. 
                Record monthly depreciation entries using transaction type "depreciation".
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-allocation Toggle */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-allocation"
                  checked={useAutoAllocation}
                  onCheckedChange={toggleAutoAllocation}
                />
                <label htmlFor="auto-allocation" className="text-sm font-medium cursor-pointer">
                  Enable automatic double-entry allocation (IFRS compliant)
                </label>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Automatically creates proper debit/credit entries based on International Accounting Standards
              </p>
            </AlertDescription>
          </Alert>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="transaction_date">Transaction Date</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                placeholder="Receipt/Invoice #"
              />
            </div>
            <div>
              <Label htmlFor="transaction_type">Transaction Type</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) => handleInputChange('transaction_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Credit Sale</SelectItem>
                  <SelectItem value="cash_sale">Cash Sale</SelectItem>
                  <SelectItem value="purchase">Credit Purchase</SelectItem>
                  <SelectItem value="cash_purchase">Cash Purchase</SelectItem>
                  <SelectItem value="expense">Expense Payment</SelectItem>
                  <SelectItem value="payment">Creditor Payment</SelectItem>
                  <SelectItem value="receipt">Debtor Receipt</SelectItem>
                  <SelectItem value="asset_purchase">Asset Purchase</SelectItem>
                  <SelectItem value="loan_received">Loan Received</SelectItem>
                  <SelectItem value="owner_investment">Owner Investment</SelectItem>
                  <SelectItem value="depreciation">Depreciation Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Transaction description"
                required
              />
            </div>
            <div>
              <Label htmlFor="total_amount">Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Expense Account Selection for Expense Transactions */}
          {useAutoAllocation && formData.transaction_type === 'expense' && expenseAccounts.length > 0 && (
            <div>
              <Label htmlFor="expense_account">Expense Account</Label>
              <Select
                value={selectedExpenseAccount}
                onValueChange={handleExpenseAccountChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense account" />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.account_code}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Journal Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Journal Entries</h3>
              {!useAutoAllocation && (
                <Button type="button" onClick={addJournalEntry} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              )}
            </div>

            {useAutoAllocation && formData.journal_entries.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select transaction type and enter amount to auto-generate journal entries
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {formData.journal_entries.map((entry, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  useAutoAllocation ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                      <Label>Account</Label>
                      {useAutoAllocation ? (
                        <div className="p-2 bg-white rounded border">
                          <div className="font-medium text-sm">
                            {entry.account_code} - {entry.account_name}
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={entry.account_code}
                          onValueChange={(value) => handleJournalEntryChange(index, 'account_code', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts?.map((account) => (
                              <SelectItem key={account.id} value={account.account_code}>
                                {account.account_code} - {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label>Description</Label>
                      {useAutoAllocation ? (
                        <div className="p-2 bg-white rounded border text-sm">
                          {entry.description}
                        </div>
                      ) : (
                        <Input
                          value={entry.description}
                          onChange={(e) => handleJournalEntryChange(index, 'description', e.target.value)}
                          placeholder="Entry description"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Debit</Label>
                      {useAutoAllocation ? (
                        <div className={`p-2 bg-white rounded border font-medium ${
                          entry.debit_amount > 0 ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          ${entry.debit_amount.toFixed(2)}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={entry.debit_amount}
                          onChange={(e) => handleJournalEntryChange(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      )}
                    </div>
                    <div>
                      <Label>Credit</Label>
                      {useAutoAllocation ? (
                        <div className={`p-2 bg-white rounded border font-medium ${
                          entry.credit_amount > 0 ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          ${entry.credit_amount.toFixed(2)}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={entry.credit_amount}
                          onChange={(e) => handleJournalEntryChange(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      )}
                    </div>
                    <div>
                      {!useAutoAllocation && formData.journal_entries.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeJournalEntry(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            {formData.journal_entries.length > 0 && (
              <div className={`rounded-lg p-4 ${
                Math.abs(totals.difference) <= 0.01 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Total Debits:</span>
                    <p className="font-semibold">${totals.totalDebits.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Credits:</span>
                    <p className="font-semibold">${totals.totalCredits.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Difference:</span>
                    <p className={`font-semibold ${
                      Math.abs(totals.difference) > 0.01 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${totals.difference.toFixed(2)}
                    </p>
                  </div>
                </div>
                {Math.abs(totals.difference) <= 0.01 ? (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    ✓ Entries are balanced and IFRS compliant
                  </p>
                ) : (
                  <p className="text-red-600 text-sm mt-2">
                    ⚠️ Debits and Credits must balance for double-entry accounting
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={Math.abs(totals.difference) > 0.01}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
