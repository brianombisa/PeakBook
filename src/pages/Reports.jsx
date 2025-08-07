import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import DataService from '../components/services/DataService';
import ReportSelector from '../components/reports/ReportSelector';
import ReportContainer from '../components/reports/ReportContainer';

// Import all report components
import ProfitAndLoss from '../components/reports/financials/ProfitAndLoss';
import BalanceSheet from '../components/reports/financials/BalanceSheet';
import CashFlowStatement from '../components/reports/financials/CashFlowStatement';
import TrialBalance from '../components/reports/trial-balance/TrialBalance';
import GeneralLedger from '../components/reports/general-ledger/GeneralLedger';
import AccountSummary from '../components/reports/account-summary/AccountSummary';
import AgedReceivables from '../components/reports/aged-receivables/AgedReceivables';
import SalesByCustomer from '../components/reports/sales/SalesByCustomer';
import SalesByItem from '../components/reports/sales/SalesByItem';
import AgedPayables from '../components/reports/purchases/AgedPayables';
import PurchasesBySupplier from '../components/reports/purchases/PurchasesBySupplier';
import ExpenseAnalysis from '../components/reports/purchases/ExpenseAnalysis';
import VATReport from '../components/reports/tax/VATReport';
import WithholdingTaxReport from '../components/reports/tax/WithholdingTaxReport';
import BusinessRatios from '../components/reports/performance/BusinessRatios';
import KPIDashboard from '../components/reports/analytics/KPIDashboard';
import CustomerProfitability from '../components/reports/analytics/CustomerProfitability';
import BudgetVsActual from '../components/reports/analytics/BudgetVsActual';
import TrendAnalysis from '../components/reports/analytics/TrendAnalysis';
import FinancialForecasting from '../components/reports/analytics/FinancialForecasting';
import ProfitabilityAnalysis from '../components/reports/analytics/ProfitabilityAnalysis';
import IndustryBenchmarkReport from '../components/reports/analytics/IndustryBenchmarkReport';
import GoalManager from '../components/reports/goals/GoalManager';

export default function ReportsPage() {
    const [data, setData] = useState({
        transactions: [],
        accounts: [],
        invoices: [],
        expenses: [],
        customers: [],
        items: [],
        suppliers: [],
        goals: [],
        companyProfile: null // Added companyProfile
    });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [period, setPeriod] = useState('this_year');
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const result = await DataService.loadReportsData();
            
            if (result.success) {
                setData({
                    transactions: result.transactions || [],
                    accounts: result.accounts || [],
                    invoices: result.invoices || [],
                    expenses: result.expenses || [],
                    customers: result.customers || [],
                    items: result.items || [], 
                    suppliers: result.suppliers || [],
                    goals: result.goals || [],
                    companyProfile: result.companyProfile || null // Set companyProfile directly from result
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load reports data. Please try refreshing the page.",
                    variant: "destructive"
                });
            }
            setIsLoading(false);
        };

        loadData();
    }, [toast]);

    const handleBackToReports = () => {
        setSelectedReport(null);
    };

    const renderReport = () => {
        if (!selectedReport) return null;

        const reportComponents = {
            'profit-loss': ProfitAndLoss,
            'balance-sheet': BalanceSheet,
            'cash-flow': CashFlowStatement,
            'trial-balance': TrialBalance,
            'general-ledger': GeneralLedger,
            'account-summary': AccountSummary,
            'aged-receivables': AgedReceivables,
            'sales-by-customer': SalesByCustomer,
            'sales-by-item': SalesByItem,
            'aged-payables': AgedPayables,
            'purchases-by-supplier': PurchasesBySupplier,
            'expense-analysis': ExpenseAnalysis,
            'vat-report': VATReport,
            'withholding-tax': WithholdingTaxReport,
            'business-ratios': BusinessRatios,
            'kpi-dashboard': KPIDashboard,
            'customer-profitability': CustomerProfitability,
            'budget-vs-actual': BudgetVsActual,
            'trend-analysis': TrendAnalysis,
            'financial-forecasting': FinancialForecasting,
            'profitability-analysis': ProfitabilityAnalysis,
            'industry-benchmark': IndustryBenchmarkReport,
            'goal-manager': GoalManager,
        };

        const ReportComponent = reportComponents[selectedReport.id];

        if (!ReportComponent) {
            return <div className="p-8 text-center text-slate-500">Report component not found.</div>;
        }

        // GoalManager has a specific `onRefresh` prop needed
        const extraProps = selectedReport.id === 'goal-manager' ? { onRefresh: () => {} } : {};

        return (
             <ReportContainer title={selectedReport.name}>
                <ReportComponent 
                    {...data} // Pass all data down, including companyProfile
                    period={period} 
                    isLoading={isLoading} 
                    {...extraProps}
                />
             </ReportContainer>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <AnimatePresence mode="wait">
                    {!selectedReport ? (
                        <motion.div
                            key="report-selector"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <header className="mb-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h1 className="text-4xl font-bold text-slate-800">Financial Reports</h1>
                                        <p className="text-slate-600 mt-2">Comprehensive business insights and analytics</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-slate-500" />
                                        <Select value={period} onValueChange={setPeriod}>
                                            <SelectTrigger className="w-[180px] bg-white/80">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="this_month">This Month</SelectItem>
                                                <SelectItem value="last_month">Last Month</SelectItem>
                                                <SelectItem value="this_quarter">This Quarter</SelectItem>
                                                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                                                <SelectItem value="this_year">This Year</SelectItem>
                                                <SelectItem value="last_year">Last Year</SelectItem>
                                                <SelectItem value="all_time">All Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </header>
                            <ReportSelector onSelectReport={setSelectedReport} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="report-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <header className="mb-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" onClick={handleBackToReports}>
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back to Reports
                                        </Button>
                                        <div>
                                            <h1 className="text-3xl font-bold text-slate-800">{selectedReport.name}</h1>
                                            <p className="text-slate-600">{selectedReport.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-slate-500" />
                                        <Select value={period} onValueChange={setPeriod}>
                                            <SelectTrigger className="w-[180px] bg-white/80">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="this_month">This Month</SelectItem>
                                                <SelectItem value="last_month">Last Month</SelectItem>
                                                <SelectItem value="this_quarter">This Quarter</SelectItem>
                                                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                                                <SelectItem value="this_year">This Year</SelectItem>
                                                <SelectItem value="last_year">Last Year</SelectItem>
                                                <SelectItem value="all_time">All Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </header>
                            {renderReport()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}