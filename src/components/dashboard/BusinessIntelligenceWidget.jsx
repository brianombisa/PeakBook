import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import BusinessIntelligenceService from '../services/BusinessIntelligenceService';
import { motion, AnimatePresence } from 'framer-motion';

const InsightCard = ({ insight, index }) => {
    const severityMap = {
        'Critical': 'bg-red-500 border-red-700',
        'High': 'bg-orange-500 border-orange-700',
        'Medium': 'bg-yellow-500 border-yellow-700',
        'Low': 'bg-blue-500 border-blue-700',
    };
    const iconMap = {
        'Critical': <AlertTriangle className="w-5 h-5" />,
        'High': <TrendingDown className="w-5 h-5" />,
        'Medium': <Lightbulb className="w-5 h-5" />,
        'Low': <TrendingUp className="w-5 h-5" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white/50 rounded-lg shadow-md border border-slate-200/50"
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-full text-white ${severityMap[insight.severity] || 'bg-gray-500'}`}>
                    {iconMap[insight.severity] || <Lightbulb className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                        <Badge variant="secondary" className={severityMap[insight.severity] + ' text-white'}>{insight.severity}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Suggested Action</p>
                        <p className="text-sm text-indigo-700 font-medium">{insight.suggested_action}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const BusinessIntelligenceWidget = ({ data }) => {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await BusinessIntelligenceService.analyzeFinancials(data);
            if (result.success) {
                setInsights(result.insights);
            } else {
                setError(result.error);
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (data && (data.invoices.length > 0 || data.expenses.length > 0)) {
            generateInsights();
        } else {
            setIsLoading(false);
        }
    }, [data]);

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Business Intelligence</CardTitle>
                    <CardDescription>AI-powered financial insights.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={generateInsights} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <AnimatePresence>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-600">
                            <AlertTriangle className="mx-auto w-8 h-8 mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : insights.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Lightbulb className="mx-auto w-8 h-8 mb-2" />
                            <p>Not enough data to generate insights.</p>
                            <p className="text-sm">Add more invoices and expenses.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {insights.map((insight, index) => (
                                <InsightCard key={index} insight={insight} index={index} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default BusinessIntelligenceWidget;