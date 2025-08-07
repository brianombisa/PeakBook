import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { FileText, Receipt, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Customer } from '@/api/entities';
import { Label } from '@/components/ui/label';

// Re-using the full Invoice and Expense forms is complex.
// We will use simplified forms here for true "quick add" functionality.
// Note: These assume the full forms on their respective pages handle all complexity.
// For now, only the Customer form is simplified here. The other forms are placeholders.
// A full implementation would require dedicated "QuickInvoiceForm" and "QuickExpenseForm" components.

const QuickCustomerForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email) {
            toast({ title: "Validation Error", description: "Please enter a name and email.", variant: "destructive" });
            return;
        }
        await Customer.create({ client_name: name, client_email: email, status: 'active' });
        onSave('Customer');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Inc." />
            </div>
            <div>
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. contact@acme.com" />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Customer</Button>
            </div>
        </form>
    );
};

export default function QuickAddModal({ open, onOpenChange, initialView = 'invoice' }) {
    const { toast } = useToast();
    
    const handleSave = (entity) => {
        toast({
            title: "Success!",
            description: `${entity} has been created successfully.`
        });
        onOpenChange(false);
        // In a real app, you might want to trigger a data refresh here.
        window.location.reload(); 
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpencha_nge={onOpenChange}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <DialogTitle>Quick Add</DialogTitle>
                    <DialogDescription>
                        Quickly create a new item. The page will refresh after saving.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={initialView} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="invoice"><FileText className="mr-2 h-4 w-4"/>Invoice</TabsTrigger>
                        <TabsTrigger value="expense"><Receipt className="mr-2 h-4 w-4"/>Expense</TabsTrigger>
                        <TabsTrigger value="customer"><UserPlus className="mr-2 h-4 w-4"/>Customer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="invoice">
                        <div className="p-4 text-center text-slate-500">
                          <p className="mb-4">Please navigate to the Invoicing page to create a new invoice.</p>
                          <Button onClick={() => window.location.href = '/Invoicing'}>Go to Invoicing</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="expense">
                        <div className="p-4 text-center text-slate-500">
                          <p className="mb-4">Please navigate to the Expenses page to create a new expense.</p>
                          <Button onClick={() => window.location.href = '/Expenses'}>Go to Expenses</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="customer">
                        <QuickCustomerForm onSave={handleSave} onCancel={handleCancel} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}