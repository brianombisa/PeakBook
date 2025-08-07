
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
            startDate = new Date(2020, 0, 1); // A reasonable start date for "all time"
            endDate = now;
            break;
    }
    
    return { start: startDate, end: endDate };
};

export default function TrendAnalysis({ data = {}, period = 'this_year' }) {
    const { transactions = [] } = data;
    const dateRange = getDateRangeFromPeriod(period);

    const trendData = useMemo(() => {
        const filteredTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.transaction_date);
                // Ensure transactionDate is a valid date before comparison
                if (isNaN(transactionDate.getTime())) {
                    console.warn("Invalid transaction date encountered:", t.transaction_date);
                    return false;
                }
                return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
            });

        const monthlyData = {};

        filteredTransactions.forEach(t => {
            const month = new Date(t.transaction_date).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    month,
                    revenue: 0,
                    expenses: 0,
                };
            }
            
            t.journal_entries?.forEach(je => {
                const code = je.account_code || '';
                if (code.startsWith('4')) {
                    monthlyData[month].revenue += je.credit_amount || 0;
                } else if (code.startsWith('5') || code.startsWith('6')) {
                    monthlyData[month].expenses += je.debit_amount || 0;
                }
            });
        });

        const results = Object.values(monthlyData).map(data => ({
            month: data.month,
            Revenue: Math.round(data.revenue),
            Expenses: Math.round(data.expenses),
            'Net Change': Math.round(data.revenue - data.expenses),
        })).sort((a,b) => a.month.localeCompare(b.month));

        return results;

    }, [transactions, dateRange]);
    
    if (trendData.length === 0) {
        return <Card><CardContent className="p-6 text-center text-slate-500">No data available for trend analysis in the selected period.</CardContent></Card>;
    }
    
    const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `KES ${value/1000}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="Revenue" stroke="#16a34a" strokeWidth={2} />
                        <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="Net Change" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
