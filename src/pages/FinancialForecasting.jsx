
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FinancialForecasting({ transactions = [] }) {
    const [forecastPeriod, setForecastPeriod] = useState(6); // Default to 6 months

    const forecastData = useMemo(() => {
        if (transactions.length < 2) {
            return [];
        }

        const monthlyData = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!acc[monthKey]) {
                acc[monthKey] = { revenue: 0, expenses: 0 };
            }

            if (transaction.type === 'income') {
                acc[monthKey].revenue += transaction.amount;
            } else if (transaction.type === 'expense') {
                acc[monthKey].expenses += transaction.amount;
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData)
            .sort()
            .map(month => ({
                month,
                revenue: monthlyData[month].revenue,
                expenses: monthlyData[month].expenses,
            }));

        if (sortedMonths.length < 2) {
            return []; // Need at least two months to calculate a trend
        }

        // Calculate average monthly change for revenue and expenses
        let totalRevenueChange = 0;
        let totalExpensesChange = 0;
        for (let i = 1; i < sortedMonths.length; i++) {
            totalRevenueChange += sortedMonths[i].revenue - sortedMonths[i-1].revenue;
            totalExpensesChange += sortedMonths[i].expenses - sortedMonths[i-1].expenses;
        }
        const avgMonthlyRevenueChange = totalRevenueChange / (sortedMonths.length - 1);
        const avgMonthlyExpensesChange = totalExpensesChange / (sortedMonths.length - 1);

        let lastMonthDate = new Date(sortedMonths[sortedMonths.length - 1].month + '-01');
        let lastRevenue = sortedMonths[sortedMonths.length - 1].revenue;
        let lastExpenses = sortedMonths[sortedMonths.length - 1].expenses;

        const forecast = [];
        for (let i = 1; i <= forecastPeriod; i++) {
            lastMonthDate.setMonth(lastMonthDate.getMonth() + 1);
            // Simple linear projection based on average monthly change
            lastRevenue = Math.max(0, lastRevenue + avgMonthlyRevenueChange); // Ensure revenue doesn't go negative
            lastExpenses = Math.max(0, lastExpenses + avgMonthlyExpensesChange); // Ensure expenses don't go negative

            forecast.push({
                month: `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`,
                'Forecasted Revenue': Math.round(lastRevenue),
                'Forecasted Expenses': Math.round(lastExpenses),
            });
        }
        
        const combinedData = sortedMonths.map(d => ({
            month: d.month,
            'Actual Revenue': Math.round(d.revenue),
            'Actual Expenses': Math.round(d.expenses),
        })).concat(forecast);

        return combinedData;

    }, [transactions, forecastPeriod]);

    if (transactions.length < 2) {
        return <Card><CardContent className="p-6 text-center text-slate-500">Not enough data for forecasting. At least two months of transactions are required.</CardContent></Card>;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> Financial Forecast</CardTitle>
                <CardDescription>Projected revenue and expenses based on historical data.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">For Planning Purposes</AlertTitle>
                    <AlertDescription>
                        This is a simplified forecast for illustrative purposes only and should not be used for making financial decisions.
                    </AlertDescription>
                </Alert>
                <div className="w-full mb-4">
                    <Select onValueChange={(val) => setForecastPeriod(parseInt(val))} defaultValue="6">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Forecast Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">1 Year</SelectItem>
                            <SelectItem value="24">2 Years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Actual Revenue" stroke="#16a34a" strokeWidth={2} />
                        <Line type="monotone" dataKey="Actual Expenses" stroke="#dc2626" strokeWidth={2} />
                        <Line type="monotone" dataKey="Forecasted Revenue" stroke="#3b82f6" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="Forecasted Expenses" stroke="#f97316" strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
