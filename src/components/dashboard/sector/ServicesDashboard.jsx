import React, { Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Clock, Users, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Lazy load standard components
const CashFlowChart = React.lazy(() => import('../CashFlowChart'));
const OutstandingInvoices = React.lazy(() => import('../OutstandingInvoices'));
const RecentTransactions = React.lazy(() => import('../RecentTransactions'));

const LoadingSkeleton = ({ className }) => (
    <Card className={`h-full ${className}`}>
        <Skeleton className="h-full w-full" />
    </Card>
);

const ServiceKPI = ({ title, value, icon: Icon, color }) => (
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

const RevenueByCustomerChart = ({ invoices = [], customers = [] }) => {
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    const chartData = useMemo(() => {
        const customerRevenue = {};
        invoices.forEach(inv => {
            customerRevenue[inv.customer_id] = (customerRevenue[inv.customer_id] || 0) + (inv.total_amount || 0);
        });

        const sortedCustomers = Object.entries(customerRevenue)
            .sort(([, revA], [, revB]) => revB - revA)
            .slice(0, 5);

        return sortedCustomers.map(([customerId, revenue]) => {
            const customerDetails = customers.find(c => c.id === customerId);
            return {
                name: customerDetails?.customer_name || 'Unknown',
                value: revenue
            };
        });
    }, [invoices, customers]);

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ServicesDashboard({ data, isLoading }) {
    const {
        transactions,
        customers,
        invoices,
        filteredTransactions
    } = data;

    const servicesStats = useMemo(() => {
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
        const daysToPay = paidInvoices.map(inv => {
            const invoiceDate = new Date(inv.invoice_date);
            const paidDate = new Date(inv.updated_date);
            return Math.abs(paidDate - invoiceDate) / (1000 * 60 * 60 * 24);
        });
        const avgDaysToPay = daysToPay.length > 0 ? daysToPay.reduce((sum, days) => sum + days, 0) / daysToPay.length : 0;
        
        return {
            unbilledHours: 'N/A', // Placeholder for future time tracking feature
            avgCollectionPeriod: `${Math.round(avgDaysToPay)} days`,
            totalCustomers: customers.length,
            totalBilled: `KES ${Math.round(invoices.reduce((s,i) => s + i.total_amount, 0)).toLocaleString()}`
        };
    }, [invoices, customers]);

    return (
        <div className="space-y-6 w-full">
            {/* Service-specific KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton />}>
                    <ServiceKPI 
                        title="Total Billed" 
                        value={servicesStats.totalBilled} 
                        icon={DollarSign}
                        color={{ bg: 'bg-green-100', text: 'text-green-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <ServiceKPI 
                        title="Avg. Collection Period" 
                        value={servicesStats.avgCollectionPeriod} 
                        icon={Clock}
                        color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <ServiceKPI 
                        title="Active Clients" 
                        value={servicesStats.totalCustomers} 
                        icon={Users}
                        color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
                    />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton />}>
                    <ServiceKPI 
                        title="Unbilled Hours" 
                        value={servicesStats.unbilledHours} 
                        icon={Briefcase}
                        color={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                    />
                </Suspense>
            </div>

            {/* Charts Row - Service Focused */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <CashFlowChart transactions={transactions} isLoading={isLoading} />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <RevenueByCustomerChart invoices={invoices} customers={customers} />
                </Suspense>
            </div>

            {/* Outstanding & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <OutstandingInvoices invoices={invoices} transactions={transactions} customers={customers} isLoading={isLoading} />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton className="h-[450px]" />}>
                    <RecentTransactions transactions={filteredTransactions} isLoading={isLoading} />
                </Suspense>
            </div>
        </div>
    );
}