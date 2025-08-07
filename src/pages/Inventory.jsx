
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Users, ShoppingCart, BrainCircuit } from 'lucide-react';
import DataService from '../components/services/DataService';
import ItemsTab from '../components/invoicing/ItemsTab';
import SuppliersTab from '../components/expenses/SuppliersTab';
import PurchaseOrdersTab from '../components/expenses/PurchaseOrdersTab';
import InventoryIntelligenceWidget from '../components/dashboard/InventoryIntelligenceWidget';

export default function InventoryPage() {
    const [data, setData] = useState({ 
        items: [], 
        suppliers: [], 
        purchaseOrders: [], 
        invoices: [], 
        transactions: [], 
        expenses: [], 
        companyProfile: null 
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const result = await DataService.loadInventoryData();
        if (result.success) {
            setData(result);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-24 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800">Inventory Management</h1>
                <p className="text-slate-600 mt-2">Oversee your products, stock levels, suppliers, and purchasing pipeline.</p>
            </header>

            <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="items">
                        <Package className="w-4 h-4 mr-2" />
                        Items & Stock
                    </TabsTrigger>
                    <TabsTrigger value="purchasing">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase Orders
                    </TabsTrigger>
                    <TabsTrigger value="suppliers">
                        <Users className="w-4 h-4 mr-2" />
                        Suppliers
                    </TabsTrigger>
                    <TabsTrigger value="intelligence">
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        AI Optimization
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="items" className="mt-6">
                    <ItemsTab 
                        items={data.items} 
                        onRefresh={loadData} 
                        isLoading={isLoading}
                    />
                </TabsContent>
                <TabsContent value="purchasing" className="mt-6">
                    <PurchaseOrdersTab 
                        purchaseOrders={data.purchaseOrders}
                        suppliers={data.suppliers}
                        items={data.items}
                        onRefresh={loadData}
                    />
                </TabsContent>
                <TabsContent value="suppliers" className="mt-6">
                    <SuppliersTab initialSuppliers={data.suppliers} onRefresh={loadData} />
                </TabsContent>
                <TabsContent value="intelligence" className="mt-6">
                    <InventoryIntelligenceWidget 
                        items={data.items}
                        invoices={data.invoices}
                        transactions={data.transactions}
                        expenses={data.expenses}
                        companyProfile={data.companyProfile}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
