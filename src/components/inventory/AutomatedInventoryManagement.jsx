import React, { useState, useEffect } from 'react';
import { Item } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TransactionService from '../services/TransactionService';

// Automated COGS Calculator
const AutomatedCOGSCalculator = ({ invoice, items }) => {
    const [cogsBreakdown, setCOGSBreakdown] = useState([]);
    
    useEffect(() => {
        if (invoice && invoice.line_items) {
            const breakdown = invoice.line_items.map(lineItem => {
                const item = items.find(i => i.id === lineItem.item_id);
                const unitCost = item?.unit_cost || 0;
                const totalCogs = lineItem.quantity * unitCost;
                const grossProfit = lineItem.total - totalCogs;
                const grossMargin = lineItem.total > 0 ? (grossProfit / lineItem.total) * 100 : 0;
                
                return {
                    ...lineItem,
                    unitCost,
                    totalCogs,
                    grossProfit,
                    grossMargin
                };
            });
            setCOGSBreakdown(breakdown);
        }
    }, [invoice, items]);
    
    const totalCOGS = cogsBreakdown.reduce((sum, item) => sum + item.totalCogs, 0);
    const totalGrossProfit = cogsBreakdown.reduce((sum, item) => sum + item.grossProfit, 0);
    const overallMargin = invoice?.total_amount > 0 ? (totalGrossProfit / invoice.total_amount) * 100 : 0;
    
    return (
        <Card className="bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    COGS Analysis - Invoice {invoice?.invoice_number}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-lg font-bold text-gray-800">
                            KES {(invoice?.total_amount || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Total COGS</p>
                        <p className="text-lg font-bold text-red-600">
                            KES {totalCOGS.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Gross Profit</p>
                        <p className="text-lg font-bold text-green-600">
                            KES {totalGrossProfit.toLocaleString()}
                        </p>
                    </div>
                </div>
                
                <div className="text-center mb-4">
                    <Badge className={
                        overallMargin > 30 ? 'bg-green-100 text-green-800' :
                        overallMargin > 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }>
                        Gross Margin: {overallMargin.toFixed(1)}%
                    </Badge>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>COGS</TableHead>
                            <TableHead>Gross Profit</TableHead>
                            <TableHead>Margin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cogsBreakdown.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>KES {item.unitCost.toLocaleString()}</TableCell>
                                <TableCell>KES {item.totalCogs.toLocaleString()}</TableCell>
                                <TableCell className={item.grossProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                                    KES {item.grossProfit.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge className={
                                        item.grossMargin > 30 ? 'bg-green-100 text-green-800' :
                                        item.grossMargin > 15 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }>
                                        {item.grossMargin.toFixed(1)}%
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {overallMargin < 20 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-700">
                            ⚠️ Low profit margin detected. Consider reviewing your pricing or reducing costs.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Smart Reorder Alerts
const SmartReorderSystem = ({ items, salesHistory = [] }) => {
    const [reorderSuggestions, setReorderSuggestions] = useState([]);
    
    useEffect(() => {
        // Calculate reorder suggestions based on sales velocity
        const suggestions = items
            .filter(item => item.is_trackable)
            .map(item => {
                // Calculate average monthly sales from invoice history
                const itemSales = salesHistory
                    .flatMap(invoice => invoice.line_items || [])
                    .filter(lineItem => lineItem.item_id === item.id);
                
                const totalSold = itemSales.reduce((sum, sale) => sum + sale.quantity, 0);
                const monthlySales = totalSold / 3; // Assuming 3 months of history
                const daysRemaining = monthlySales > 0 ? (item.current_stock / (monthlySales / 30)) : 999;
                
                return {
                    ...item,
                    monthlySales,
                    daysRemaining: Math.round(daysRemaining),
                    isLowStock: item.current_stock <= item.reorder_level,
                    isCritical: daysRemaining < 7,
                    suggestedOrder: Math.max(item.reorder_level * 2, monthlySales * 1.5)
                };
            })
            .filter(item => item.isLowStock || item.isCritical)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
            
        setReorderSuggestions(suggestions);
    }, [items, salesHistory]);
    
    const handleGeneratePO = async (item) => {
        try {
            // Create a purchase order automatically
            const poData = {
                po_number: 'PO-' + Date.now(),
                supplier_name: 'Default Supplier', // Should be linked to actual supplier
                order_date: new Date().toISOString().split('T')[0],
                line_items: [{
                    item_id: item.id,
                    description: item.item_name,
                    quantity: item.suggestedOrder,
                    unit_cost: item.unit_cost,
                    total: item.suggestedOrder * item.unit_cost
                }],
                total_amount: item.suggestedOrder * item.unit_cost,
                status: 'draft'
            };
            
            // This would create a PO - simplified for demo
            console.log('Generated PO:', poData);
            
        } catch (error) {
            console.error('Error generating PO:', error);
        }
    };
    
    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Smart Reorder Alerts ({reorderSuggestions.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {reorderSuggestions.length === 0 ? (
                    <p className="text-green-700 text-sm">✅ All inventory levels are healthy!</p>
                ) : (
                    <div className="space-y-3">
                        {reorderSuggestions.slice(0, 5).map(item => (
                            <div key={item.id} className={`p-3 rounded-lg border-l-4 ${
                                item.isCritical ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-sm">{item.item_name}</h4>
                                        <p className="text-xs text-gray-600">
                                            Stock: {item.current_stock} | Reorder Level: {item.reorder_level}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Estimated {item.daysRemaining} days remaining
                                        </p>
                                        {item.isCritical && (
                                            <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                                                CRITICAL - Order Now!
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-600">Suggested Order</p>
                                        <p className="font-semibold text-sm">{Math.round(item.suggestedOrder)} units</p>
                                        <Button 
                                            size="sm" 
                                            className="text-xs mt-1"
                                            onClick={() => handleGeneratePO(item)}
                                        >
                                            <ShoppingCart className="w-3 h-3 mr-1" />
                                            Create PO
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export { AutomatedCOGSCalculator, SmartReorderSystem };