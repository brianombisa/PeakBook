import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ShoppingCart, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import VendorIntelligenceService from '../services/VendorIntelligenceService';
// We will create PurchaseOrderForm and InventoryIntelligenceService later
// For now, let's assume they exist for the structure.
// import PurchaseOrderForm from './PurchaseOrderForm'; 
import { PurchaseOrder } from '@/api/entities';

const SmartSuggestionCard = ({ suggestion, onCreatePo }) => (
    <Card className="bg-blue-50 border-l-4 border-blue-500">
        <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0 pt-1">
                    <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-slate-800">{suggestion.title}</p>
                    <p className="text-sm text-slate-600">{suggestion.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Best Supplier: <span className="font-medium">{suggestion.bestSupplier.name}</span> |
                        Estimated Cost: <span className="font-medium">KES {suggestion.estimatedCost.toLocaleString()}</span>
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <Button size="sm" onClick={() => onCreatePo(suggestion)}>Create PO</Button>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function PurchaseOrdersTab({ purchaseOrders: initialPo, suppliers, items, onRefresh }) {
    const [purchaseOrders, setPurchaseOrders] = useState(initialPo);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const runIntelligence = async () => {
        setIsLoading(true);
        try {
            // This service will encapsulate the logic for generating suggestions
            const newSuggestions = await VendorIntelligenceService.generatePurchaseSuggestions({ items, suppliers });
            setSuggestions(newSuggestions);
            toast({ title: "AI Suggestions Updated", description: `Found ${newSuggestions.length} purchasing opportunities.` });
        } catch (error) {
            console.error("Error generating purchase suggestions:", error);
            toast({ title: "Intelligence Error", variant: "destructive" });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        runIntelligence();
        setPurchaseOrders(initialPo);
    }, [initialPo, items, suppliers]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary">Draft</Badge>;
            case 'sent': return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
            case 'received': return <Badge className="bg-green-100 text-green-800">Received</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    
    // Placeholder for opening PO form
    const handleCreatePoFromSuggestion = (suggestion) => {
        alert(`Creating PO from suggestion: ${suggestion.title}`);
        // Here you would open a PurchaseOrderForm modal with pre-filled data
    };
    
    const handleCreateNewPo = () => {
        alert("Opening new Purchase Order form.");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-6 h-6 text-blue-600" />
                                Smart Suggestions
                            </CardTitle>
                            <CardDescription>AI-powered recommendations to optimize your purchasing.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={runIntelligence} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading && <p>Analyzing purchasing data...</p>}
                    {!isLoading && suggestions.length === 0 && (
                        <p className="text-center text-slate-500 py-4">No specific recommendations at this time. Your purchasing looks optimized!</p>
                    )}
                    {suggestions.map((s, i) => (
                        <SmartSuggestionCard key={i} suggestion={s} onCreatePo={handleCreatePoFromSuggestion} />
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Purchase Orders</CardTitle>
                            <CardDescription>Manage your orders with suppliers.</CardDescription>
                        </div>
                        <Button onClick={handleCreateNewPo}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            New Purchase Order
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Expected Delivery</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.length > 0 ? purchaseOrders.map(po => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.po_number}</TableCell>
                                    <TableCell>{po.supplier_name}</TableCell>
                                    <TableCell>{format(new Date(po.order_date), 'PPP')}</TableCell>
                                    <TableCell>{po.expected_delivery_date ? format(new Date(po.expected_delivery_date), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>KES {po.total_amount.toLocaleString()}</TableCell>
                                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No purchase orders found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}