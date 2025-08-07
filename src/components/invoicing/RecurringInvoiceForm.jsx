import React, { useState, useEffect } from 'react';
import { RecurringInvoice } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Save, X, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { exchangeRates } from "@/api/functions";

export default function RecurringInvoiceForm({ 
    recurringInvoice, 
    customers, 
    items, 
    onSave, 
    onCancel, 
    isOpen, 
    onOpenChange 
}) {
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        line_items: [],
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        currency: 'KES',
        exchange_rate: 1,
        notes: '',
        status: 'active'
    });
    
    const [availableCurrencies] = useState([
        { code: 'KES', name: 'Kenyan Shilling' },
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'ZAR', name: 'South African Rand' },
        { code: 'UGX', name: 'Ugandan Shilling' },
        { code: 'TZS', name: 'Tanzanian Shilling' }
    ]);
    
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (recurringInvoice) {
            setFormData({
                ...recurringInvoice,
                start_date: recurringInvoice.start_date || new Date().toISOString().split('T')[0],
                line_items: recurringInvoice.line_items || [],
                subtotal: recurringInvoice.subtotal || 0,
                tax_amount: recurringInvoice.tax_amount || 0,
                total_amount: recurringInvoice.total_amount || 0,
                currency: recurringInvoice.currency || 'KES',
                exchange_rate: recurringInvoice.exchange_rate || 1
            });
        }
    }, [recurringInvoice]);

    // Fetch exchange rate when currency changes
    useEffect(() => {
        if (formData.currency !== 'KES') {
            fetchExchangeRate();
        } else {
            setFormData(prev => ({ ...prev, exchange_rate: 1 }));
        }
    }, [formData.currency]);

    const fetchExchangeRate = async () => {
        if (formData.currency === 'KES') return;
        
        setIsLoadingRate(true);
        try {
            const { data } = await exchangeRates({
                action: 'getCurrentRate',
                baseCurrency: formData.currency,
                targetCurrency: 'KES'
            });
            
            if (data.success) {
                setFormData(prev => ({ ...prev, exchange_rate: data.rate }));
                calculateTotals({ ...formData, exchange_rate: data.rate });
            }
        } catch (error) {
            toast({
                title: "Exchange Rate Error",
                description: "Could not fetch current exchange rate. Please enter manually.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingRate(false);
        }
    };

    const calculateTotals = (updatedFormData = formData) => {
        const subtotal = updatedFormData.line_items.reduce((sum, item) => 
            sum + (item.quantity * item.unit_price), 0
        );
        const tax_amount = subtotal * 0.16; // 16% VAT
        const total_amount = subtotal + tax_amount;

        setFormData(prev => ({
            ...prev,
            subtotal,
            tax_amount,
            total_amount
        }));
    };

    const addLineItem = () => {
        const newItem = {
            item_id: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0
        };
        
        setFormData(prev => ({
            ...prev,
            line_items: [...prev.line_items, newItem]
        }));
    };

    const updateLineItem = (index, field, value) => {
        const updatedItems = [...formData.line_items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // If item is selected from dropdown, populate details
        if (field === 'item_id' && value) {
            const selectedItem = items.find(item => item.id === value);
            if (selectedItem) {
                updatedItems[index] = {
                    ...updatedItems[index],
                    description: selectedItem.item_name,
                    unit_price: selectedItem.unit_price
                };
            }
        }
        
        // Calculate line total
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price;
        
        const newFormData = { ...formData, line_items: updatedItems };
        setFormData(newFormData);
        calculateTotals(newFormData);
    };

    const removeLineItem = (index) => {
        const updatedItems = formData.line_items.filter((_, i) => i !== index);
        const newFormData = { ...formData, line_items: updatedItems };
        setFormData(newFormData);
        calculateTotals(newFormData);
    };

    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            customer_name: customer?.customer_name || ''
        }));
    };

    const handleSubmit = async () => {
        if (!formData.customer_id || formData.line_items.length === 0) {
            toast({
                title: "Validation Error",
                description: "Please select a customer and add at least one item.",
                variant: "destructive"
            });
            return;
        }

        try {
            await onSave(formData);
            toast({ title: "Success", description: "Recurring invoice profile saved successfully." });
        } catch (error) {
            toast({ 
                title: "Error", 
                description: "Failed to save recurring invoice profile.", 
                variant: "destructive" 
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {recurringInvoice ? 'Edit' : 'Create'} Recurring Invoice Profile
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Customer and Frequency Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Customer *</Label>
                            <Select onValueChange={handleCustomerChange} value={formData.customer_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.customer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label>Billing Frequency *</Label>
                            <Select onValueChange={(value) => setFormData(prev => ({...prev, frequency: value}))} value={formData.frequency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                                    <SelectItem value="annually">Annually (Yearly)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label>Start Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(new Date(formData.start_date), 'PPP')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={new Date(formData.start_date)}
                                        onSelect={(date) => setFormData(prev => ({
                                            ...prev, 
                                            start_date: date.toISOString().split('T')[0]
                                        }))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Currency Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Invoice Currency</Label>
                            <Select onValueChange={(value) => setFormData(prev => ({...prev, currency: value}))} value={formData.currency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCurrencies.map(currency => (
                                        <SelectItem key={currency.code} value={currency.code}>
                                            {currency.code} - {currency.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {formData.currency !== 'KES' && (
                            <div>
                                <Label>Exchange Rate (1 {formData.currency} = ? KES)</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={formData.exchange_rate}
                                    onChange={(e) => setFormData(prev => ({...prev, exchange_rate: parseFloat(e.target.value) || 1}))}
                                    disabled={isLoadingRate}
                                />
                                {isLoadingRate && <p className="text-xs text-gray-500 mt-1">Fetching current rate...</p>}
                            </div>
                        )}
                    </div>

                    {/* Line Items Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Label className="text-base font-semibold">Invoice Items *</Label>
                            <Button onClick={addLineItem} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Item/Service</TableHead>
                                        <TableHead className="w-[300px]">Description</TableHead>
                                        <TableHead className="w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[120px]">Unit Price</TableHead>
                                        <TableHead className="w-[120px]">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.line_items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    onValueChange={(value) => updateLineItem(index, 'item_id', value)}
                                                    value={item.item_id}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select item..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {items.map(availableItem => (
                                                            <SelectItem key={availableItem.id} value={availableItem.id}>
                                                                {availableItem.item_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    placeholder="Item description..."
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    min="1"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {formData.currency} {item.total.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLineItem(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    
                                    {formData.line_items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                No items added yet. Click "Add Item" to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Totals Section */}
                    {formData.line_items.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                                <div></div>
                                <div></div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formData.currency} {formData.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>VAT (16%):</span>
                                        <span>{formData.currency} {formData.tax_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>{formData.currency} {formData.total_amount.toLocaleString()}</span>
                                    </div>
                                    {formData.currency !== 'KES' && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Total in KES:</span>
                                            <span>KES {(formData.total_amount * formData.exchange_rate).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div>
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                            placeholder="Any additional notes for this recurring invoice..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Recurring Profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}