import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FinancialForecasting({ transactions = [] }) {
    const [forecastPeriod, setForecastPeriod] = useState(3); // Default to 3 months

    const forecastData = useMemo(() => {
        const historicalData = {};

        transactions.forEach(t => {
            const month = new Date(t.transaction_date).toISOString().slice(0, 7);
            if (!historicalData[month]) {
                historicalData[month] = {
                    month,
                    revenue: 0,
                    expenses: 0,
                };
            }
            
            t.journal_entries?.forEach(je => {
                const code = je.account_code || '';
                if (code.startsWith('4')) {
                    historicalData[month].revenue += je.credit_amount || 0;
                } else if (code.startsWith('5') || code.startsWith('6')) {
                    historicalData[month].expenses += je.debit_amount || 0;
                }
            });
        });

        const sortedMonths = Object.values(historicalData).sort((a, b) => a.month.localeCompare(b.month));

        if (sortedMonths.length < 2) return [];

        // Simple linear regression for forecasting
        const avgRevenueChange = (sortedMonths[sortedMonths.length - 1].revenue - sortedMonths[0].revenue) / (sortedMonths.length - 1);
        const avgExpenseChange = (sortedMonths[sortedMonths.length - 1].expenses - sortedMonths[0].expenses) / (sortedMonths.length - 1);
        
        let lastMonth = new Date(sortedMonths[sortedMonths.length - 1].month + '-01');
        let lastRevenue = sortedMonths[sortedMonths.length - 1].revenue;
        let lastExpenses = sortedMonths[sortedMonths.length - 1].expenses;

        const forecast = [];
        for (let i = 1; i <= forecastPeriod; i++) {
            lastMonth.setMonth(lastMonth.getMonth() + 1);
            lastRevenue += avgRevenueChange;
            lastExpenses += avgExpenseChange;
            
            forecast.push({
                month: lastMonth.toISOString().slice(0, 7),
                'Forecast Revenue': Math.round(Math.max(0, lastRevenue)),
                'Forecast Expenses': Math.round(Math.max(0, lastExpenses)),
            });
        }
        
        const combinedData = sortedMonths.map(d => ({
            month: d.month,
            'Actual Revenue': Math.round(d.revenue),
            'Actual Expenses': Math.round(d.expenses),
        })).concat(forecast);


        return combinedData;

    }, [transactions, forecastPeriod]);

    if (transactions.length === 0) {
        return <Card><CardContent className="p-6 text-center text-slate-500">Not enough data for forecasting. At least two months of transactions are required.</CardContent></Card>;
    }

    const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp />
                    Financial Forecasting
                </CardTitle>
                 <CardDescription>
                    AI-powered forecasts based on historical performance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Disclaimer</AlertTitle>
                    <AlertDescription>
                        This is a simplified forecast for illustrative purposes only and should not be used for making financial decisions.
                    </AlertDescription>
                </Alert>
                <Tabs defaultValue="3" onValueChange={(val) => setForecastPeriod(parseInt(val))} className="w-full mb-4">
                    <TabsList>
                        <TabsTrigger value="1">1 Month</TabsTrigger>
                        <TabsTrigger value="3">3 Months</TabsTrigger>
                        <TabsTrigger value="6">6 Months</TabsTrigger>
                        <TabsTrigger value="12">1 Year</TabsTrigger>
                    </TabsList>
                </Tabs>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={forecastData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `KES ${value/1000}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ position: 'relative', marginTop: '10px' }} />
                        <Line type="monotone" dataKey="Actual Revenue" stroke="#16a34a" strokeWidth={2} />
                        <Line type="monotone" dataKey="Actual Expenses" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="Forecast Revenue" stroke="#16a34a" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="Forecast Expenses" stroke="#ef4444" strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}