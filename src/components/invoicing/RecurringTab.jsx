import React, { useState, useEffect, useCallback } from 'react';
import { RecurringInvoice } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import RecurringInvoiceForm from './RecurringInvoiceForm';

export default function RecurringTab({ recurringInvoices = [], customers = [], items = [], onRefresh }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileToDelete, setProfileToDelete] = useState(null);
    const { toast } = useToast();

    const handleSave = async (data) => {
        if (editingProfile) {
            await RecurringInvoice.update(editingProfile.id, data);
        } else {
            await RecurringInvoice.create(data);
        }
        setIsOpen(false);
        setEditingProfile(null);
        onRefresh();
    };

    const handleEdit = (profile) => {
        setEditingProfile(profile);
        setIsOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!profileToDelete) return;
        try {
            await RecurringInvoice.delete(profileToDelete.id);
            toast({ title: "Success", description: "Recurring profile deleted."});
            onRefresh();
        } catch(e) {
            toast({ title: "Error", description: "Failed to delete profile.", variant: "destructive" });
        }
        setProfileToDelete(null);
    };

    return (
        <div className="space-y-6 mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recurring Invoice Profiles</CardTitle>
                    <Button onClick={() => setIsOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> 
                        New Recurring Profile
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Next Due</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recurringInvoices.length > 0 ? recurringInvoices.map(profile => {
                                const customer = customers.find(c => c.id === profile.customer_id);
                                return (
                                <TableRow key={profile.id}>
                                    <TableCell>{customer?.customer_name || 'N/A'}</TableCell>
                                    <TableCell className="capitalize">{profile.frequency}</TableCell>
                                    <TableCell>
                                        {profile.next_due_date ? format(new Date(profile.next_due_date), 'MMM dd, yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {profile.currency || 'KES'} {profile.total_amount?.toLocaleString() || '0'}
                                    </TableCell>
                                    <TableCell className="capitalize">{profile.status}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                                            <Edit className="w-4 h-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setProfileToDelete(profile)}>
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No recurring profiles found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <RecurringInvoiceForm
                recurringInvoice={editingProfile}
                customers={customers}
                items={items}
                onSave={handleSave}
                onCancel={() => {
                    setEditingProfile(null);
                    setIsOpen(false);
                }}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
            />
            
            <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this recurring profile. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}