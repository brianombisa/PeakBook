import React, { Suspense } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load all generic dashboard components
const QuickStats = React.lazy(() => import('../QuickStats'));
const CashFlowChart = React.lazy(() => import('../CashFlowChart'));
const SalesVsExpensesChart = React.lazy(() => import('../SalesVsExpensesChart'));
const ExpenseBreakdown = React.lazy(() => import('../ExpenseBreakdown'));
const OutstandingInvoices = React.lazy(() => import('../OutstandingInvoices'));
const RecentTransactions = React.lazy(() => import('../RecentTransactions'));

const LoadingSkeleton = ({ className }) => (
    <Card className={`h-full ${className}`}>
        <Skeleton className="h-full w-full" />
    </Card>
);

export default function DefaultDashboard({ data, isLoading }) {
    const {
        transactions,
        customers,
        invoices,
        expenses,
        filteredInvoices,
        filteredExpenses,
        filteredTransactions
    } = data;

    return (
        <div className="space-y-6 w-full">
            {/* Quick Stats - Full Width */}
            <div className="w-full">
                <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /></div>}>
                    <QuickStats transactions={transactions} customers={customers} />
                </Suspense>
            </div>
            
            {/* Charts Row - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <CashFlowChart transactions={transactions} isLoading={isLoading} />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <SalesVsExpensesChart invoices={filteredInvoices} expenses={filteredExpenses} isLoading={isLoading} />
                </Suspense>
            </div>
            
            {/* Tables Row - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <OutstandingInvoices invoices={invoices} transactions={transactions} customers={customers} isLoading={isLoading} />
                </Suspense>
                <Suspense fallback={<LoadingSkeleton className="h-[400px]" />}>
                    <ExpenseBreakdown expenses={filteredExpenses} isLoading={isLoading} />
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