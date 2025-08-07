
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import BenchmarkingService from '../../services/BenchmarkingService';

const BenchmarkCard = ({ title, userValue, industryValue, format, interpretation }) => {
    const isGood = userValue >= industryValue;
    const difference = Math.abs(userValue - industryValue);
    const percentageDiff = industryValue !== 0 ? (difference / industryValue) * 100 : 0;

    let colorClasses, Icon;
    if (interpretation === 'higher_is_better') {
        colorClasses = isGood ? 'text-green-600' : 'text-red-600';
        Icon = isGood ? TrendingUp : TrendingDown;
    } else { // lower_is_better
        colorClasses = !isGood ? 'text-green-600' : 'text-red-600';
        Icon = !isGood ? TrendingUp : TrendingDown;
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Your Business</p>
                        <p className="text-2xl font-bold text-indigo-600">{format(userValue)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Industry Average</p>
                        <p className="text-2xl font-bold text-slate-700">{format(industryValue)}</p>
                    </div>
                </div>
                <div className={`mt-4 flex items-center text-sm ${colorClasses}`}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>
                        {percentageDiff.toFixed(1)}% {isGood ? (interpretation === 'higher_is_better' ? 'above' : 'below') : (interpretation === 'higher_is_better' ? 'below' : 'above')} average
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};


export default function IndustryBenchmarkReport({ invoices, expenses, customers, companyProfile }) {
    const benchmarks = useMemo(() => {
        if (!companyProfile || !companyProfile.business_sector) return null;
        return BenchmarkingService.getIndustryBenchmarks({ invoices, expenses, customers, companyProfile });
    }, [invoices, expenses, customers, companyProfile]);

    if (!companyProfile || !companyProfile.business_sector) {
        return (
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        <div>
                            <CardTitle className="text-amber-800">Complete Your Profile</CardTitle>
                            <CardDescription className="text-amber-700">
                                To see industry benchmarks, please set your "Business Sector" in the Company Profile settings.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }
    
    if (!benchmarks) {
         return <p>Could not generate benchmark data for the {companyProfile.business_sector} sector. This might be due to insufficient peer data.</p>
    }

    const { metrics, sector } = benchmarks;

    return (
        <div className="space-y-6">
            <CardDescription>
                Comparing your performance against the average for the <strong>{sector}</strong> sector.
            </CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BenchmarkCard
                    title="Gross Profit Margin"
                    userValue={metrics.grossProfitMargin.user}
                    industryValue={metrics.grossProfitMargin.industry}
                    format={(v) => `${v.toFixed(1)}%`}
                    interpretation="higher_is_better"
                />
                <BenchmarkCard
                    title="Revenue Growth (MoM)"
                    userValue={metrics.revenueGrowth.user}
                    industryValue={metrics.revenueGrowth.industry}
                    format={(v) => `${v.toFixed(1)}%`}
                    interpretation="higher_is_better"
                />
                <BenchmarkCard
                    title="Average Invoice Value"
                    userValue={metrics.avgInvoiceValue.user}
                    industryValue={metrics.avgInvoiceValue.industry}
                    format={(v) => `KES ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    interpretation="higher_is_better"
                />
                <BenchmarkCard
                    title="Avg. Payment Collection (Days)"
                    userValue={metrics.avgCollectionPeriod.user}
                    industryValue={metrics.avgCollectionPeriod.industry}
                    format={(v) => `${v.toFixed(0)} days`}
                    interpretation="lower_is_better"
                />
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Summary & Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 space-y-2">
                   <p>This report provides a snapshot of your performance relative to your peers. Use these insights to identify areas of strength and opportunities for improvement.</p>
                   {metrics.grossProfitMargin.user < metrics.grossProfitMargin.industry && (
                       <p className="text-amber-800 bg-amber-50 p-3 rounded-md">
                           <strong>Focus Area:</strong> Your profit margins are below average. Consider reviewing your pricing strategy or negotiating better rates with suppliers to improve profitability.
                       </p>
                   )}
                   {metrics.avgCollectionPeriod.user > metrics.avgCollectionPeriod.industry && (
                       <p className="text-amber-800 bg-amber-50 p-3 rounded-md">
                           <strong>Focus Area:</strong> It takes you longer to get paid than your peers. Implement stricter payment terms or automated reminders to shorten your cash conversion cycle.
                       </p>
                   )}
                   {metrics.revenueGrowth.user > metrics.revenueGrowth.industry && (
                       <p className="text-green-800 bg-green-50 p-3 rounded-md">
                           <strong>Well Done:</strong> Your revenue is growing faster than the industry average. Analyze your recent sales strategies to double down on what's working.
                       </p>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
