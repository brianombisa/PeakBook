import React, { useState, useEffect } from 'react';
import { BankAccount } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AuditLogger from '../utils/AuditLogger';

const BankAccountForm = ({ account, onSave, onFinished }) => {
    const [formData, setFormData] = useState({
        account_name: '',
        bank_name: '',
        account_number: '',
        currency: 'KES',
        is_default: false,
        ...account
    });
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            if (formData.id) {
                const updatedAccount = await BankAccount.update(formData.id, formData);
                await AuditLogger.logUpdate('BankAccount', updatedAccount.id, account, updatedAccount, updatedAccount.account_name);
                toast({ title: "Success", description: "Bank account updated." });
            } else {
                const newAccount = await BankAccount.create(formData);
                await AuditLogger.logCreate('BankAccount', newAccount, newAccount.account_name);
                toast({ title: "Success", description: "Bank account created." });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving bank account:", error);
            toast({ title: "Error", description: "Failed to save bank account.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div><Label>Account Name</Label><Input placeholder="e.g., KCB Business Account" value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} /></div>
            <div><Label>Bank Name</Label><Input placeholder="e.g., Kenya Commercial Bank" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} /></div>
            <div><Label>Account Number</Label><Input placeholder="Your bank account number" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} /></div>
            <div><Label>Currency</Label><Input value={formData.currency} disabled /></div>
            <div className="flex items-center space-x-2"><Switch id="is_default" checked={formData.is_default} onCheckedChange={checked => setFormData({ ...formData, is_default: checked })} /><Label htmlFor="is_default">Set as default account</Label></div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Account
                </Button>
            </DialogFooter>
        </div>
    );
};

export default function BankAccountsTab() {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const { toast } = useToast();

    const loadAccounts = async () => {
        setIsLoading(true);
        const fetchedAccounts = await BankAccount.list();
        setAccounts(fetchedAccounts);
        setIsLoading(false);
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleAddNew = () => {
        setSelectedAccount(null);
        setIsFormOpen(true);
    };

    const handleEdit = (account) => {
        setSelectedAccount(account);
        setIsFormOpen(true);
    };

    const handleDelete = async (account) => {
        if (window.confirm(`Are you sure you want to delete the account "${account.account_name}"?`)) {
            try {
                await BankAccount.delete(account.id);
                await AuditLogger.logDelete('BankAccount', account.id, account.account_name);
                toast({ title: "Success", description: "Bank account deleted." });
                loadAccounts();
            } catch (error) {
                console.error("Error deleting bank account:", error);
                toast({ title: "Error", description: "Failed to delete bank account.", variant: "destructive" });
            }
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Bank Accounts</CardTitle>
                <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2"/>Add New Account</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Account Name</TableHead><TableHead>Bank</TableHead><TableHead>Account Number</TableHead><TableHead>Default</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan="5" className="text-center">Loading accounts...</TableCell></TableRow>
                        ) : accounts.length > 0 ? (
                            accounts.map(acc => (
                                <TableRow key={acc.id}>
                                    <TableCell className="font-medium">{acc.account_name}</TableCell>
                                    <TableCell>{acc.bank_name}</TableCell>
                                    <TableCell>{acc.account_number}</TableCell>
                                    <TableCell>{acc.is_default ? 'Yes' : 'No'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(acc)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan="5" className="text-center h-24">No bank accounts set up yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
                    </DialogHeader>
                    <BankAccountForm account={selectedAccount} onFinished={() => { setIsFormOpen(false); loadAccounts(); }} />
                </DialogContent>
            </Dialog>
        </Card>
    );
}