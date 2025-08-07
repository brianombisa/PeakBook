import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

const ForecastInsights = ({ data, isLoading }) => {
    if (isLoading || data.length === 0) {
        return <Card><CardHeader><CardTitle>Insights</CardTitle></CardHeader><CardContent>Loading insights...</CardContent></Card>;
    }

    const startBalance = data[0].balance;
    const endBalance = data[data.length - 1].balance;
    const lowestPoint = Math.min(...data.map(d => d.balance));
    const highestPoint = Math.max(...data.map(d => d.balance));
    const netChange = endBalance - startBalance;

    const insights = [
        {
            icon: netChange > 0 ? <TrendingUp className="text-green-500"/> : <TrendingDown className="text-red-500"/>,
            title: 'Projected Net Change',
            value: `KES ${netChange.toLocaleString()}`,
            color: netChange > 0 ? 'text-green-600' : 'text-red-600'
        },
        {
            icon: <TrendingDown className="text-orange-500"/>,
            title: 'Lowest Projected Balance',
            value: `KES ${lowestPoint.toLocaleString()}`,
            color: 'text-orange-600'
        },
        {
            icon: <TrendingUp className="text-blue-500"/>,
            title: 'Highest Projected Balance',
            value: `KES ${highestPoint.toLocaleString()}`,
            color: 'text-blue-600'
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-slate-100 rounded-lg">
                        <div className="p-2 bg-white rounded-full">{insight.icon}</div>
                        <div>
                            <p className="text-sm text-gray-600">{insight.title}</p>
                            <p className={`text-lg font-bold ${insight.color}`}>{insight.value}</p>
                        </div>
                    </div>
                ))}
                
                {lowestPoint < 0 && (
                     <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-8 h-5 text-red-500 mt-1"/>
                        <div>
                            <h4 className="font-semibold text-red-700">Cash Flow Warning</h4>
                            <p className="text-sm text-red-600">Your cash balance is projected to go negative. Immediate action is recommended to collect outstanding invoices or delay payments.</p>
                        </div>
                    </div>
                )}

                 {lowestPoint > 50000 && (
                     <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-8 h-5 text-green-500 mt-1"/>
                        <div>
                            <h4 className="font-semibold text-green-700">Healthy Cash Position</h4>
                            <p className="text-sm text-green-600">Your cash flow appears stable for the forecast period. Consider investing surplus cash.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ForecastInsights;