
import React, { useState, useMemo, useEffect } from 'react';
import { Customer } from "@/api/entities";
import { User } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { UploadFile, SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Edit, Save, X, Upload, FileText, Paperclip, Loader2, MoreVertical, Send, Trash2, Calendar as CalendarIcon, Combine } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format, subMonths, isWithinInterval } from 'date-fns';
import CustomerStatementView from './CustomerStatementView';
import { motion } from 'framer-motion';
import MergeCustomers from './MergeCustomers';

const CustomerForm = ({ customer, onSave, onCancel, accountManagers }) => {
    const [formData, setFormData] = useState(customer || {
        customer_name: '',
        contact_person: '',
        contact_email: '',
        phone_number: '',
        address: '',
        kra_pin: '',
        credit_limit: 0,
        account_manager_email: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mb-6">
                <CardHeader><CardTitle className="text-xl font-bold text-slate-800">{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="customer_name">Customer Name</Label><Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} placeholder="ABC Company Ltd" required /></div>
                            <div><Label htmlFor="contact_person">Contact Person</Label><Input id="contact_person" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} placeholder="John Doe" /></div>
                            <div><Label htmlFor="contact_email">Email Address</Label><Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} placeholder="john@abccompany.com" required /></div>
                            <div><Label htmlFor="phone_number">Phone Number</Label><Input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} placeholder="+254700000000" /></div>
                        </div>
                        <div><Label htmlFor="address">Address</Label><Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="P.O. Box 123, Nairobi" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="kra_pin">KRA PIN</Label><Input id="kra_pin" value={formData.kra_pin} onChange={(e) => setFormData({...formData, kra_pin: e.target.value})} placeholder="A123456789B" /></div>
                            <div><Label htmlFor="credit_limit">Credit Limit (KES)</Label><Input id="credit_limit" type="number" value={formData.credit_limit} onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value) || 0})} placeholder="100000" /></div>
                        </div>
                        <div>
                            <Label htmlFor="account_manager">Account Manager</Label>
                            <Select value={formData.account_manager_email || ''} onValueChange={(value) => setFormData({...formData, account_manager_email: value})}>
                                <SelectTrigger id="account_manager">
                                    <SelectValue placeholder="Assign a manager..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>None</SelectItem>
                                    {accountManagers.map(am => (
                                        <SelectItem key={am.id} value={am.email}>{am.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
                    <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Save Customer</Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};


const SendStatementDialog = ({ customer, invoices, transactions, isOpen, onOpenChange }) => {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState({ from: subMonths(new Date(), 1), to: new Date() });
    const [isSending, setIsSending] = useState(false);

    const statementItems = useMemo(() => {
        const items = [];
        invoices
            .filter(i => i.customer_id === customer.id && isWithinInterval(new Date(i.invoice_date), { start: dateRange.from, end: dateRange.to }))
            .forEach(inv => items.push({ date: inv.invoice_date, details: `Invoice #${inv.invoice_number}`, debit: inv.total_amount, credit: 0 }));

        transactions
            .filter(t => t.client_id === customer.id && isWithinInterval(new Date(t.transaction_date), { start: dateRange.from, end: dateRange.to }))
            .forEach(t => items.push({ date: t.transaction_date, details: `Payment (${t.reference_number})`, debit: 0, credit: t.total_amount }));

        return items.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [customer, invoices, transactions, dateRange]);

    const handleSend = async () => {
        setIsSending(true);
        let runningBalance = 0;
        const statementBody = `
            Dear ${customer.customer_name},

            Please find your account statement for the period ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}.

            ---
            ${statementItems.map(item => {
                runningBalance += (item.debit || 0) - (item.credit || 0);
                return `${format(new Date(item.date), 'yyyy-MM-dd')}\t${item.details}\tDebit: ${item.debit.toFixed(2)}\tCredit: ${item.credit.toFixed(2)}\tBalance: ${runningBalance.toFixed(2)}`;
            }).join('\n')}
            ---

            Your final balance is KES ${runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2})}.

            Best regards,
            PeakBooks Team
        `;

        try {
            // Note: Sending to external emails is disabled on the platform. This is a simulation.
            console.log("Preparing to send statement to:", customer.contact_email);
            /*
            await SendEmail({
                to: customer.contact_email,
                subject: `Account Statement for ${customer.customer_name}`,
                body: statementBody
            });
            */
            toast({ title: "Statement Sent (Simulated)", description: "An email has been prepared for the customer." });
            onOpenChange(false);
        } catch (e) {
            toast({ title: "Error", description: "Could not send statement.", variant: "destructive" });
        }
        setIsSending(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Send Statement to {customer.customer_name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4"/>{format(dateRange.from, "PPP")}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={d => setDateRange({...dateRange, from: d})} /></PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4"/>{format(dateRange.to, "PPP")}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={d => setDateRange({...dateRange, to: d})} /></PopoverContent>
                        </Popover>
                    </div>
                    <p className="text-sm text-slate-500">Select the date range for the statement. Email sending to external clients is simulated.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                        Send Statement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ManageDocumentsDialog = ({ customer, isOpen, onOpenChange, onRefresh, currentUser }) => {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [localCustomer, setLocalCustomer] = useState(customer);

    // Update localCustomer if prop customer changes (e.g., after a refresh)
    useEffect(() => {
        setLocalCustomer(customer);
    }, [customer]);

    const handleDocUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            const newDoc = { name: file.name, url: file_url, uploaded_at: new Date().toISOString() };
            const updatedDocs = [...(localCustomer.documents || []), newDoc];
            await Customer.update(localCustomer.id, { documents: updatedDocs });
            setLocalCustomer(prev => ({...prev, documents: updatedDocs }));
            toast({ title: "Success", description: "Document uploaded."});
            onRefresh();
        } catch(e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to upload document.", variant: "destructive" });
        }
        setIsUploading(false);
    };

    const canDelete = currentUser?.app_role !== 'Account Manager'; // Assuming only non-AMs can delete

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Documents for {customer.customer_name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4 min-h-[200px]">
                    {localCustomer.documents?.length > 0 ? (
                        <ul className="space-y-2">
                            {localCustomer.documents.map((doc, i) => (
                                <li key={i} className="text-sm flex items-center gap-2 p-2 rounded bg-slate-50">
                                    <Paperclip className="w-4 h-4 text-slate-600" />
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="flex-1 text-blue-600 hover:underline truncate">{doc.name}</a>
                                    <span className="text-xs text-slate-500">{format(new Date(doc.uploaded_at), 'PPP')}</span>
                                    {canDelete && <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500"><Trash2 className="w-4 h-4"/></Button>}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-slate-500 pt-8">No documents attached.</p>}
                </div>
                <DialogFooter>
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('docs-modal-upload').click()} disabled={isUploading}>
                        {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Uploading...</> : <><Upload className="w-4 h-4 mr-2"/> Upload New Document</>}
                    </Button>
                    <input type="file" id="docs-modal-upload" className="hidden" onChange={handleDocUpload} />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function CustomersTab({ customers = [], invoices = [], transactions = [], isLoading, onRefresh, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  // Replaced statementCustomer with showStatement and using selectedCustomer for consistency
  const [showStatement, setShowStatement] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null); // 'send', 'docs', 'delete'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountManagers, setAccountManagers] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAccountManagers = async () => {
        try {
            const users = await User.filter({ app_role: 'Account Manager' });
            setAccountManagers(users);
        } catch (error) {
            console.error("Failed to fetch account managers:", error);
            toast({ title: "Error", description: "Failed to load account managers.", variant: "destructive" });
        }
    };
    fetchAccountManagers();
  }, []);

  const handleActionClick = (customer, action) => {
      setSelectedCustomer(customer);
      setActiveDialog(action);
      // For actions that open specific dialogs/views, clear statement view if it was active
      if (showStatement) setShowStatement(false);
  };

  const handleEdit = (customer) => { setEditingCustomer(customer); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditingCustomer(null); };

  const handleSubmit = async (formData) => {
    try {
      if (editingCustomer) {
        await Customer.update(editingCustomer.id, formData);
        toast({ title: "Success", description: "Customer updated successfully." });
      } else {
        await Customer.create(formData);
        toast({ title: "Success", description: "Customer created successfully." });
      }
      handleCancel();
      onRefresh();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({ title: "Error", description: "Failed to save customer.", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
        await Customer.delete(selectedCustomer.id);
        toast({ title: "Success", description: "Customer deleted." });
        onRefresh();
    } catch (e) {
        toast({ title: "Error", description: "Failed to delete customer.", variant: "destructive" });
    }
    setActiveDialog(null);
    setSelectedCustomer(null); // Clear selected customer after deletion
  };

  const handleMergeComplete = () => {
      setIsMerging(false);
      onRefresh();
  };

  const sortedCustomers = [...customers].sort((a, b) => a.customer_name.localeCompare(b.customer_name));

  // Removed the full-page statement view conditional render
  // if (statementCustomer) { /* ... */ }

  if (isMerging) {
      return <MergeCustomers customers={customers} onCancel={() => setIsMerging(false)} onMergeComplete={handleMergeComplete} />
  }

  const canAddCustomer = currentUser?.app_role !== 'Account Manager';

  return (
    <div className="space-y-6 mt-6">
      {showForm && <CustomerForm customer={editingCustomer} onSave={handleSubmit} onCancel={handleCancel} accountManagers={accountManagers} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customers ({customers.length})</CardTitle>
          {canAddCustomer && (
            <div className="flex gap-2">
              <Button onClick={() => setIsMerging(true)} variant="outline"><Combine className="w-4 h-4 mr-2"/>Merge</Button>
              <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2"/>New Customer</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Account Manager</TableHead><TableHead>Outstanding</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full"/></TableCell></TableRow>
                )) : sortedCustomers.length > 0 ? sortedCustomers.map(c => {
                  const outstanding = invoices.filter(inv => inv.customer_id === c.id && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off').reduce((sum, inv) => sum + inv.balance_due, 0);
                  const manager = accountManagers.find(am => am.email === c.account_manager_email);
                  return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.customer_name}</TableCell>
                        <TableCell>{c.contact_email}</TableCell>
                        <TableCell>{manager?.full_name || <span className="text-slate-400">Unassigned</span>}</TableCell>
                        <TableCell className={outstanding > 0 ? 'text-red-600' : ''}>KES {outstanding.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/* Modified to use showStatement state */}
                                    <DropdownMenuItem onClick={() => { setSelectedCustomer(c); setShowStatement(true); }}>
                                        <FileText className="w-4 h-4 mr-2"/>View Statement
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionClick(c, 'send')}><Send className="w-4 h-4 mr-2"/>Send Statement</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleActionClick(c, 'docs')}><Paperclip className="w-4 h-4 mr-2"/>Manage Documents</DropdownMenuItem>
                                    {canAddCustomer && <DropdownMenuItem onClick={() => handleEdit(c)}><Edit className="w-4 h-4 mr-2"/>Edit</DropdownMenuItem>}
                                    {canAddCustomer && <DropdownMenuItem onClick={() => handleActionClick(c, 'delete')} className="text-red-500"><Trash2 className="w-4 h-4 mr-2"/>Delete</DropdownMenuItem>}
                                </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                      </TableRow>
                  );
                }) : <TableRow><TableCell colSpan={5} className="text-center h-24">No customers found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <>
            <SendStatementDialog
                customer={selectedCustomer}
                invoices={invoices}
                transactions={transactions}
                isOpen={activeDialog === 'send'}
                onOpenChange={() => setActiveDialog(null)}
            />
            <ManageDocumentsDialog
                customer={selectedCustomer}
                isOpen={activeDialog === 'docs'}
                onOpenChange={() => setActiveDialog(null)}
                onRefresh={onRefresh}
                currentUser={currentUser}
            />
            <AlertDialog open={activeDialog === 'delete'} onOpenChange={() => setActiveDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the customer "{selectedCustomer.customer_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActiveDialog(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Customer Statement Dialog - controlled by showStatement */}
            <CustomerStatementView
                customer={selectedCustomer}
                invoices={invoices.filter(inv => inv.customer_id === selectedCustomer.id)}
                transactions={transactions.filter(t => t.client_id === selectedCustomer.id)}
                open={showStatement}
                onClose={() => {
                  setShowStatement(false);
                  setSelectedCustomer(null); // Clear selected customer when statement is closed
                }}
            />
        </>
      )}
    </div>
  );
}
