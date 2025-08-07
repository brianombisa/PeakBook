import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Supplier } from '@/api/entities';

const SupplierForm = ({ supplier, onSave, onCancel }) => {
    const [formData, setFormData] = useState(supplier || {
        supplier_name: '', contact_person: '', contact_email: '', phone_number: '', rating: 3
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (newRating) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{supplier ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input name="supplier_name" placeholder="Supplier Name" value={formData.supplier_name} onChange={handleChange} />
                <Input name="contact_person" placeholder="Contact Person" value={formData.contact_person} onChange={handleChange} />
                <Input name="contact_email" type="email" placeholder="Contact Email" value={formData.contact_email} onChange={handleChange} />
                <Input name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
                <div>
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(r => (
                            <Star
                                key={r}
                                className={`w-6 h-6 cursor-pointer ${formData.rating >= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                onClick={() => handleRatingChange(r)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSave(formData)}>Save</Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default function SuppliersTab({ initialSuppliers, onRefresh }) {
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSuppliers(initialSuppliers);
    }, [initialSuppliers]);

    const handleSave = async (data) => {
        try {
            if (editingSupplier) {
                await Supplier.update(editingSupplier.id, data);
                toast({ title: "Supplier Updated" });
            } else {
                await Supplier.create(data);
                toast({ title: "Supplier Created" });
            }
            onRefresh();
            setIsFormOpen(false);
            setEditingSupplier(null);
        } catch (error) {
            toast({ title: "Error", description: "Could not save supplier.", variant: "destructive" });
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setIsFormOpen(true);
    };

    const filteredSuppliers = useMemo(() =>
        suppliers.filter(s =>
            s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [suppliers, searchTerm]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>Manage your list of vendors and suppliers.</CardDescription>
                <div className="flex justify-between items-center pt-4">
                    <Input
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingSupplier(null)}>
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Supplier
                            </Button>
                        </DialogTrigger>
                        {isFormOpen && (
                            <SupplierForm
                                supplier={editingSupplier}
                                onSave={handleSave}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Rating</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSuppliers.map(supplier => (
                            <TableRow key={supplier.id} onClick={() => handleEdit(supplier)} className="cursor-pointer">
                                <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                                <TableCell>{supplier.contact_email}</TableCell>
                                <TableCell>{supplier.phone_number}</TableCell>
                                <TableCell>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < supplier.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}