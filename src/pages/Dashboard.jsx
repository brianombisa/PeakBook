
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataService from '../components/services/DataService';
import { motion } from 'framer-motion';
import { BarChart, Bot, AlertTriangle, RefreshCw, BrainCircuit, Users, Package, Info, LifeBuoy } from 'lucide-react'; // Added LifeBuoy
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';

// AI WIDGETS
import BusinessIntelligenceWidget from '../components/dashboard/BusinessIntelligenceWidget';
import CustomerIntelligenceWidget from '../components/dashboard/CustomerIntelligenceWidget';
import PeakAdvisorWidget from '../components/dashboard/PeakAdvisorWidget';
import ConsultationWidget from '../components/dashboard/ConsultationWidget'; // Import new widget

// Simple loading component
const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">PeakBooks</h2>
            <p className="text-slate-500">Loading your dashboard...</p>
        </div>
    </div>
);

// Simple error component
const ErrorDisplay = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-red-50 border-red-200">
            <CardHeader>
                <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-semibold">Connection Issue</h3>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-red-700 mb-4">Unable to load dashboard data.</p>
                <Button onClick={onRetry} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </CardContent>
        </Card>
    </div>
);

// Simple metric card component
const MetricCard = ({ title, value, isCurrency = false }) => {
    const displayValue = isCurrency ? `KES ${(value || 0).toLocaleString()}` : (value || 0).toLocaleString();
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{displayValue}</div>
            </CardContent>
        </Card>
    );
};

// Simple overview component
const DashboardOverview = ({ data, period }) => {
    const { invoices = [], expenses = [], customers = [] } = data;
    
    // Calculate metrics safely
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Revenue" value={totalRevenue} isCurrency />
                <MetricCard title="Total Expenses" value={totalExpenses} isCurrency />
                <MetricCard title="Net Profit" value={netProfit} isCurrency />
                <MetricCard title="Customers" value={customers.length} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Business Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>Total Invoices:</span>
                            <span className="font-medium">{invoices.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid Invoices:</span>
                            <span className="font-medium">{paidInvoices.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Expenses:</span>
                            <span className="font-medium">{expenses.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Active Customers:</span>
                            <span className="font-medium">{customers.length}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState({
        user: null,
        companyProfile: null,
        invoices: [],
        expenses: [],
        transactions: [],
        customers: [],
        items: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('this_year');
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const result = await DataService.loadDashboardData();
            
            if (result.success) {
                setDashboardData({
                    user: result.user || null,
                    companyProfile: result.companyProfile || null,
                    invoices: result.invoices || [],
                    expenses: result.expenses || [],
                    transactions: result.transactions || [],
                    customers: result.customers || [],
                    items: result.items || []
                });
            } else {
                setError(result.error || 'Failed to load data');
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRetry = useCallback(() => {
        loadData();
    }, [loadData]);

    // Show loading state
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Show error state
    if (error) {
        return <ErrorDisplay error={error} onRetry={handleRetry} />;
    }

    const { user, companyProfile } = dashboardData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-2xl font-semibold text-slate-700">
                                Good morning, {user?.full_name?.split(' ')[0] || 'User'}.
                            </h2>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-white/60">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="last_year">Last Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="p-1 rounded-xl bg-gradient-to-r from-blue-900 to-amber-500 shadow-lg w-full">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                                    Financial Command Center
                                </h1>
                            </div>
                        </div>

                        <p className="text-lg text-gray-500">
                            {companyProfile?.company_name ? `${companyProfile.company_name}, here` : "Here"} is your business at a glance.
                        </p>
                    </div>
                </motion.div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2"> {/* Changed to 5 columns */}
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <BarChart className="w-4 h-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="intelligence" className="flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> Business AI
                        </TabsTrigger>
                        <TabsTrigger value="customers" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Customer AI
                        </TabsTrigger>
                        <TabsTrigger value="advisor" className="flex items-center gap-2">
                            <Bot className="w-4 h-4" /> PeakAdvisor
                        </TabsTrigger>
                        <TabsTrigger value="consultation" className="flex items-center gap-2"> {/* New Tab */}
                            <LifeBuoy className="w-4 h-4" /> Consultation
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 w-full">
                        <DashboardOverview data={dashboardData} period={period} />
                    </TabsContent>

                    <TabsContent value="intelligence" className="mt-6 w-full">
                        <BusinessIntelligenceWidget data={dashboardData} />
                    </TabsContent>

                    <TabsContent value="customers" className="mt-6 w-full">
                        <CustomerIntelligenceWidget data={dashboardData} />
                    </TabsContent>
                    
                    <TabsContent value="advisor" className="mt-6 w-full">
                        <PeakAdvisorWidget data={dashboardData} />
                    </TabsContent>

                    <TabsContent value="consultation" className="mt-6 w-full"> {/* New Tab Content */}
                        <ConsultationWidget data={dashboardData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
