import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataService from '../components/services/DataService';
import ForecastingService from '../components/services/ForecastingService';
import ForecastChart from '../components/forecasting/ForecastChart';
import ForecastInsights from '../components/forecasting/ForecastInsights';

export default function CashFlowForecastPage() {
    const [forecastData, setForecastData] = useState([]);
    const [forecastPeriod, setForecastPeriod] = useState(90); // 30, 90, 180 days
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateForecast = async () => {
            setIsLoading(true);
            const reportData = await DataService.loadReportsData();
            const forecast = ForecastingService.generateCashFlowForecast(
                reportData.transactions,
                reportData.invoices,
                reportData.expenses,
                forecastPeriod
            );
            setForecastData(forecast);
            setIsLoading(false);
        };
        generateForecast();
    }, [forecastPeriod]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800">AI Cash Flow Forecast</h1>
                        <p className="text-slate-600 mt-2">Predict your future cash position with our intelligent forecasting engine.</p>
                    </div>
                    <Select value={String(forecastPeriod)} onValueChange={(val) => setForecastPeriod(Number(val))}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Forecast Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">Next 30 Days</SelectItem>
                            <SelectItem value="90">Next 90 Days</SelectItem>
                            <SelectItem value="180">Next 180 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ForecastChart data={forecastData} isLoading={isLoading} />
                    </div>
                    <div>
                        <ForecastInsights data={forecastData} isLoading={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
}