import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Star, UserCheck, MessageSquare, RefreshCw } from 'lucide-react';
import CustomerIntelligenceService from '../services/CustomerIntelligenceService';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerIntelligenceWidget = ({ data }) => {
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await CustomerIntelligenceService.analyzeCustomers(data);
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
        if (data && data.customers.length > 0) {
            generateInsights();
        } else {
            setIsLoading(false);
        }
    }, [data]);
    
    const iconMap = {
        'High Value': <Star className="w-5 h-5 text-amber-500" />,
        'Needs Attention': <UserCheck className="w-5 h-5 text-red-500" />,
        'New & Promising': <Users className="w-5 h-5 text-green-500" />,
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Customer Intelligence</CardTitle>
                    <CardDescription>AI-powered customer analytics.</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={generateInsights} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-600">
                         <Users className="mx-auto w-8 h-8 mb-2" />
                        <p>{error}</p>
                    </div>
                ) : !insights || (insights.segments.length === 0 && insights.actions.length === 0) ? (
                    <div className="text-center py-8 text-slate-500">
                        <Users className="mx-auto w-8 h-8 mb-2" />
                        <p>No customer data to analyze.</p>
                        <p className="text-sm">Add customers and invoices to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Customer Segments</h4>
                            <div className="space-y-3">
                            {insights.segments.map((seg, i) => (
                                <div key={i}>
                                <h5 className="text-sm font-medium flex items-center gap-2 mb-2">{iconMap[seg.segment_name]} {seg.segment_name}</h5>
                                {seg.customers.map((cust, j) => (
                                    <div key={j} className="text-xs p-2 bg-slate-100 rounded-md mb-1">
                                        <p className="font-bold">{cust.name}</p>
                                        <p className="text-slate-600">{cust.reason}</p>
                                    </div>
                                ))}
                                </div>
                            ))}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Suggested Actions</h4>
                            <div className="space-y-3">
                            {insights.actions.map((act, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-indigo-600 mt-1"/>
                                    <div>
                                        <p className="font-semibold text-indigo-800">{act.title}</p>
                                        <p className="text-sm text-indigo-700">{act.description}</p>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CustomerIntelligenceWidget;