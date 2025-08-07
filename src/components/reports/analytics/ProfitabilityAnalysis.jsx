
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters, format } from 'date-fns';

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
            startDate = new Date(2020, 0, 1); // A reasonable start date for 'all_time'
            endDate = now;
            break;
    }
    
    return { start: startDate, end: endDate };
};

export default function ProfitabilityAnalysis({ data = {}, period = 'this_year' }) {
    const { transactions = [] } = data;
    const dateRange = getDateRangeFromPeriod(period);

    const profitabilityData = useMemo(() => {
        const filteredTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.transaction_date);
                if (isNaN(transactionDate.getTime())) return false;
                return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
            });

        const monthlyData = {};

        filteredTransactions.forEach(t => {
            const month = format(new Date(t.transaction_date), 'yyyy-MM'); // Use format for consistency
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    month,
                    revenue: 0,
                    cogs: 0,
                    operatingExpenses: 0,
                };
            }

            t.journal_entries?.forEach(je => {
                const code = je.account_code || '';
                const debit = je.debit_amount || 0;
                const credit = je.credit_amount || 0;

                if (code.startsWith('4')) { // Revenue accounts (e.g., 4000-4999)
                    monthlyData[month].revenue += credit - debit;
                } else if (code.startsWith('5')) { // COGS accounts (e.g., 5000-5999)
                    monthlyData[month].cogs += debit - credit;
                } 
                
                if (code.startsWith('6') || code.startsWith('7')) { // Operating expenses (e.g., 6000-6999), Finance costs (e.g., 7000-7999)
                    monthlyData[month].operatingExpenses += debit - credit;
                }
            });
        });

        const sortedMonthsKeys = Object.keys(monthlyData).sort(); // Sorts "yyyy-MM" strings chronologically

        const results = sortedMonthsKeys.map(monthKey => {
            const data = monthlyData[monthKey];
            const grossProfit = data.revenue - data.cogs;
            // Note: Net Profit now correctly considers ALL expenses (COGS + Operating)
            const netProfit = grossProfit - data.operatingExpenses; 
            return {
                month: format(new Date(monthKey + '-02'), 'MMM yyyy'), // Format for display
                revenue: Math.round(data.revenue),
                grossProfit: Math.round(grossProfit),
                netProfit: Math.round(netProfit),
                grossMargin: data.revenue > 0 ? Math.round((grossProfit / data.revenue) * 100) : 0,
                netMargin: data.revenue > 0 ? Math.round((netProfit / data.revenue) * 100) : 0,
            };
        });

        return results;

    }, [transactions, dateRange]);

    if (profitabilityData.length === 0) {
        return <Card><CardContent className="p-6 text-center text-slate-500">No profitability data available for the selected period.</CardContent></Card>;
    }

    const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;
    const formatPercent = (value) => `${value}%`;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Profitability Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={profitabilityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => (name.includes('Margin') ? formatPercent(value) : formatCurrency(value))} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                            <Bar dataKey="grossProfit" fill="#16a34a" name="Gross Profit" />
                            <Bar dataKey="netProfit" fill="#f97316" name="Net Profit" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Gross Profit</TableHead>
                                <TableHead className="text-right">Net Profit</TableHead>
                                <TableHead className="text-right">Gross Margin</TableHead>
                                <TableHead className="text-right">Net Margin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profitabilityData.map(row => (
                                <TableRow key={row.month}>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.grossProfit)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.netProfit)}</TableCell>
                                    <TableCell className="text-right">{formatPercent(row.grossMargin)}</TableCell>
                                    <TableCell className="text-right">{formatPercent(row.netMargin)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
