import React, { Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Lazy load standard components
const QuickStats = React.lazy(() => import('../QuickStats'));
const OutstandingInvoices = React.lazy(() => import('../OutstandingInvoices'));
const RecentTransactions = React.lazy(() => import('../RecentTransactions'));

const LoadingSkeleton = ({ className }) => (
    <Card className={`h-full ${className}`}>
        <Skeleton className="h-full w-full" />
    </Card>
);

// Retail-specific KPI card
const RetailKPI = ({ title, value, icon: Icon, color }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
            <div className={`p-2 rounded-full ${color.bg}`}>
                <Icon className={`w-4 h-4 ${color.text}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

// Retail-specific: Top selling products chart
const TopSellingProductsChart = ({ invoices = [], items = [] }) => {
    const chartData = useMemo(() => {
        const productSales = {};
        invoices.forEach(invoice => {
            invoice.line_items?.forEach(line => {
                if (line.item_id) {
                    productSales[line.item_id] = (productSales[line.item_id] || 0) + line.quantity;
                }
            });
        });

        const sortedProducts = Object.entries(productSales)
            .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
            .slice(0, 5);

        return sortedProducts.map(([itemId, quantity]) => {
            const itemDetails = items.find(i => i.id === itemId);
            return {
                name: itemDetails?.item_name || 'Unknown',
                quantity: quantity
            };
        });
    }, [invoices, items]);

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Top Selling Products
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" stroke="#64748b" fontSize={12} />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={12} 
                                width={100}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <Tooltip
                                formatter={(value) => [value, "Units Sold"]}
                                labelStyle={{ color: '#1e293b' }}
                                contentStyle={{ 
                                    backgroundColor: 'white', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Bar dataKey="quantity" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default function RetailDashboard({ data, isLoading }) {
    const {
        transactions,
        customers,
        invoices,
        items,
        filteredTransactions
    } = data;

    const retailStats = useMemo(() => {
        const totalSalesValue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
        const avgSaleValue = invoices.length > 0 ? totalSalesValue / invoices.length : 0;
        const lowStockItems = items.filter(item => 
            item.is_trackable && 
            item.current_stock <= (item.reorder_level || 0)
        ).length;

        return {
            avgSaleValue: `KES ${Math.round(avgSaleValue).toLocaleString()}`,
            inventoryValue: `KES ${Math.round(items.reduce((sum, item) => sum + ((item.unit_cost || 0) * (item.current_stock || 0)), 0)).toLocaleString()}`,
            lowStockItems
        };
    }, [invoices, items]);

    return (
        <div className="space-y-6 w-full">
            {/* Quick Stats - Retail Focused */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton />}>
                    <RetailKPI 
                        title="Avg. Sale Value" 
                        value={retailStats.avgSaleValue} 
                        icon={ShoppingCart}
                        color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <RetailKPI 
                        title="Inventory Value" 
                        value={retailStats.inventoryValue} 
                        icon={Package}
                        color={{ bg: 'bg-green-100', text: 'text-green-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <RetailKPI 
                        title="Low Stock Items" 
                        value={retailStats.lowStockItems} 
                        icon={AlertTriangle}
                        color={{ bg: 'bg-red-100', text: 'text-red-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <RetailKPI 
                        title="Total Customers" 
                        value={customers.length} 
                        icon={Users}
                        color={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                    />
                </Suspense>
            </div>
            
            {/* Charts Row - Retail Focused */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <TopSellingProductsChart invoices={invoices} items={items} />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <OutstandingInvoices invoices={invoices} transactions={transactions} customers={customers} isLoading={isLoading} />
                </Suspense>
            </div>
            
            {/* Recent Transactions - Full Width */}
            <div className="w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[450px]" />}>
                    <RecentTransactions transactions={filteredTransactions} isLoading={isLoading} />
                </Suspense>
            </div>
        </div>
    );
}