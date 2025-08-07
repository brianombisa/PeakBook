import React, { useState, useMemo } from 'react';
import { Customer } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { RecurringInvoice } from "@/api/entities";
import { CreditNote } from "@/api/entities";
import AuditLogger from '../utils/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowRight, Combine, AlertTriangle } from 'lucide-react';

export default function MergeCustomers({ customers, onCancel, onMergeComplete }) {
  const [primaryCustomerId, setPrimaryCustomerId] = useState(null);
  const [duplicateCustomerIds, setDuplicateCustomerIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const primaryCustomer = useMemo(() => customers.find(c => c.id === primaryCustomerId), [primaryCustomerId, customers]);
  const duplicateCustomers = useMemo(() => customers.filter(c => duplicateCustomerIds.includes(c.id)), [duplicateCustomerIds, customers]);

  const handleSelectDuplicate = (customerId) => {
    setDuplicateCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };
  
  const handleMerge = async () => {
    if (!primaryCustomer || duplicateCustomers.length === 0) {
      toast({ title: "Selection Missing", description: "Please select a primary customer and at least one duplicate.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Re-assign all related records from duplicates to the primary
      for (const duplicate of duplicateCustomers) {
        // Update Invoices
        await Invoice.update({ customer_id: duplicate.id }, { customer_id: primaryCustomer.id });
        // Update Transactions
        await Transaction.update({ client_id: duplicate.id }, { client_id: primaryCustomer.id });
        // Update Recurring Invoices
        await RecurringInvoice.update({ customer_id: duplicate.id }, { customer_id: primaryCustomer.id });
        // Update Credit Notes
        await CreditNote.update({ customer_id: duplicate.id }, { customer_id: primaryCustomer.id });
      }

      // 2. Log the merge action
      await AuditLogger.logMerge('Customer', primaryCustomer, duplicateCustomers);

      // 3. Delete the duplicate customers
      for (const duplicate of duplicateCustomers) {
        await Customer.delete(duplicate.id);
      }

      toast({ title: "Merge Successful", description: `${duplicateCustomers.length} customer(s) were merged into ${primaryCustomer.customer_name}.` });
      onMergeComplete();

    } catch (error) {
      console.error("Merge failed:", error);
      toast({ title: "Merge Failed", description: "An error occurred while merging customers.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Combine className="w-6 h-6 text-blue-600" />
          Merge Duplicate Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Primary Customer Selection */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-700">1. Select Primary Customer (To Keep)</h3>
            <Select onValueChange={setPrimaryCustomerId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Choose a customer..." /></SelectTrigger>
              <SelectContent>
                {customers
                  .filter(c => !duplicateCustomerIds.includes(c.id))
                  .map(c => <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {primaryCustomer && (
              <Card className="mt-2 p-4 bg-slate-50">
                <p className="font-bold">{primaryCustomer.customer_name}</p>
                <p className="text-sm text-slate-600">{primaryCustomer.contact_email}</p>
                <p className="text-sm text-slate-500">ID: {primaryCustomer.id}</p>
              </Card>
            )}
          </div>
          
          {/* Duplicate Customers Selection */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-700">2. Select Duplicates (To Merge & Delete)</h3>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-1">
                {customers
                  .filter(c => c.id !== primaryCustomerId)
                  .map(c => (
                    <div 
                      key={c.id}
                      onClick={() => !isLoading && handleSelectDuplicate(c.id)}
                      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${duplicateCustomerIds.includes(c.id) ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={duplicateCustomerIds.includes(c.id)} 
                        readOnly
                        className="mr-3"
                      />
                      <div>
                        <p>{c.customer_name}</p>
                        <p className="text-xs text-slate-500">{c.contact_email}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This action is irreversible. All invoices and transactions from the duplicate customer(s) will be reassigned to the primary customer. The duplicate customer records will then be permanently deleted.
          </AlertDescription>
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button 
          onClick={handleMerge} 
          disabled={isLoading || !primaryCustomer || duplicateCustomers.length === 0}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Combine className="w-4 h-4 mr-2"/>}
          Merge {duplicateCustomers.length} Customer(s)
        </Button>
      </CardFooter>
    </Card>
  );
}