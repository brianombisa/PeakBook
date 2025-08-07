
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';

const COLORS = ['#3b82f6', '#16a34a', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];

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
            startDate = new Date(2020, 0, 1);
            endDate = now;
            break;
    }

    return { start: startDate, end: endDate };
};

export default function ExpenseAnalysis({ data = {}, period = 'this_year' }) {
    const { expenses = [] } = data;
    const dateRange = getDateRangeFromPeriod(period);

    const analysisData = useMemo(() => {
        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.expense_date);
            return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
        });

        const byCategory = {};

        filteredExpenses.forEach(expense => {
            const category = expense.category || 'Other';
            if (!byCategory[category]) {
                byCategory[category] = { name: category, value: 0, count: 0 };
            }
            byCategory[category].value += Math.round(expense.amount || 0);
            byCategory[category].count += 1;
        });

        const totalExpenses = Object.values(byCategory).reduce((sum, cat) => sum + cat.value, 0);

        const chartData = Object.values(byCategory).map(cat => ({
            ...cat,
            percentage: totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(0) : 0,
        })).sort((a,b) => b.value - a.value);

        return { chartData, totalExpenses };
    }, [expenses, dateRange]);

    if (analysisData.chartData.length === 0) {
        return <Card><CardContent className="p-6 text-center text-slate-500">No expense data available for the selected period.</CardContent></Card>;
    }

    const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Expense Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analysisData.chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percentage }) => `${name} (${percentage}%)`}
                            >
                                {analysisData.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Expense Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="text-right">Transactions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analysisData.chartData.map(row => (
                                <TableRow key={row.name}>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                                    <TableCell className="text-right">{row.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
