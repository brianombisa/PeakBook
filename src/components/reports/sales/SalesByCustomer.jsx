
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';

const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'this_month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'last_month':
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
        case 'this_quarter':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
        case 'last_quarter':
            startDate = startOfQuarter(subQuarters(now, 1));
            endDate = endOfQuarter(subQuarters(now, 1));
            break;
        case 'this_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        case 'last_year':
            startDate = startOfYear(subYears(now, 1));
            endDate = endOfYear(subYears(now, 1));
            break;
        default: // all_time
            startDate = new Date(2020, 0, 1); // A reasonable arbitrary start date for "all time"
            endDate = now;
            break;
    }
    
    return { start: startDate, end: endDate };
};

export default function SalesByCustomer({ data = {}, period = 'this_year' }) {
    const { transactions = [], customers = [] } = data;
    const dateRange = getDateRangeFromPeriod(period);
    
    const salesData = useMemo(() => {
        if (!transactions || !customers) return [];

        const customerMap = new Map(customers.map(c => [c.id, c.customer_name]));
        const salesByCustomer = new Map();

        // The dateRange is now always defined, so we don't need the conditional check
        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            // Ensure transaction date is within the inclusive date range
            return txDate >= dateRange.start && txDate <= dateRange.end;
        });

        for (const transaction of filteredTransactions) {
            if (transaction.transaction_type === 'sale' && transaction.client_id) {
                const totalSale = transaction.journal_entries
                    .filter(e => e.account_code.startsWith('4')) // Revenue accounts typically start with 4
                    .reduce((sum, e) => sum + (e.credit_amount || 0) - (e.debit_amount || 0), 0);
                
                const currentSales = salesByCustomer.get(transaction.client_id) || 0;
                salesByCustomer.set(transaction.client_id, currentSales + totalSale);
            }
        }

        return Array.from(salesByCustomer.entries())
            .map(([customerId, totalSales]) => ({
                id: customerId,
                name: customerMap.get(customerId) || 'Unknown Customer',
                sales: totalSales
            }))
            .sort((a, b) => b.sales - a.sales);

    }, [transactions, customers, dateRange]); // dateRange is now a dependency

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Total Sales (KES)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {salesData.map((customer) => (
                    <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                            <Link to={createPageUrl(`CustomerStatement?customerId=${customer.id}`)} className="text-blue-600 hover:underline">
                                {customer.name}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right">{Math.round(customer.sales).toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
