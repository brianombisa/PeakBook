import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const ForecastChart = ({ data, isLoading }) => {
    if (isLoading) {
        return <Card className="h-[400px] flex items-center justify-center"><p>Generating forecast...</p></Card>;
    }

    const formatXAxis = (tickItem) => {
        return format(new Date(tickItem), 'MMM d');
    };

    const formatTooltip = (value, name) => {
        return [`KES ${value.toLocaleString()}`, name];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cash Balance Forecast</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatXAxis} />
                        <YAxis tickFormatter={(val) => `KES ${val/1000}k`} />
                        <Tooltip formatter={formatTooltip} />
                        <Legend />
                        <Area type="monotone" dataKey="lowerBound" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="Worst Case" />
                        <Area type="monotone" dataKey="upperBound" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.1} name="Best Case" />
                        <Area type="monotone" dataKey="balance" stroke="#ffc658" fill="#ffc658" fillOpacity={0.4} name="Projected Balance" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default ForecastChart;