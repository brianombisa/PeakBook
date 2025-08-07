
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3, Banknote, Scale, BookOpen, Clock, FileText, Users, Package,
    Rss, Percent, Target, TrendingUp, Calculator, DollarSign,
    PieChart, Activity, Zap, ChevronRight, Trophy, Briefcase, BookCopy // BookCopy added
} from 'lucide-react';

// Unified and re-structured report data directly within categories
const reportCategories = [
    {
        name: 'Financial Statements',
        icon: Banknote,
        reports: [
            {
                id: 'profit-loss',
                name: 'Profit & Loss Statement',
                description: 'Revenue, expenses, and profitability analysis',
                icon: BarChart3,
                color: 'bg-blue-500', premium: false
            },
            {
                id: 'balance-sheet',
                name: 'Balance Sheet',
                description: 'Assets, liabilities, and equity position',
                icon: Scale,
                color: 'bg-green-500', premium: false
            },
            {
                id: 'cash-flow',
                name: 'Cash Flow Statement',
                description: 'Track cash movement from operations',
                icon: Banknote,
                color: 'bg-purple-500', premium: false
            },
        ],
    },
    {
        name: 'Business Performance & Ratios',
        icon: Activity,
        reports: [
            {
                id: 'business-ratios',
                name: 'Financial Ratios Dashboard',
                description: 'Complete ratio analysis with insights and benchmarks',
                icon: Calculator,
                color: 'bg-teal-500', premium: true
            },
            {
                id: 'kpi-dashboard',
                name: 'KPI Dashboard',
                description: 'Key performance indicators and trends',
                icon: Activity,
                color: 'bg-orange-500', premium: true
            },
            {
                id: 'profitability-analysis',
                name: 'Profitability Analysis',
                description: 'Deep dive into margins and profit drivers',
                icon: TrendingUp,
                color: 'bg-red-500', premium: true
            },
        ],
    },
    {
        name: 'Ledger Reports',
        icon: BookCopy, // Icon updated as per outline
        reports: [
            {
                id: 'trial-balance',
                name: 'Trial Balance',
                description: 'Lists all accounts and their balances to verify debit/credit equality.', // Description updated as per outline
                icon: BookOpen,
                color: 'bg-amber-500', premium: false
            },
            {
                id: 'general-ledger',
                name: 'General Ledger',
                description: 'Shows detailed transaction history for every account.', // Description updated as per outline
                icon: FileText,
                color: 'bg-slate-500', premium: false
            },
            {
                id: 'account-summary',
                name: 'Account Summary',
                description: 'A summary of debits, credits, and balances for all accounts.', // Description updated as per outline
                icon: Percent,
                color: 'bg-indigo-500', premium: false
            },
        ],
    },
    {
        name: 'Sales & Customer Reports', // Retained original category name for consistency
        icon: Users,
        reports: [
            {
                id: 'aged-receivables',
                name: 'Aged Receivables Summary', // Retained original report name for consistency
                description: 'Tracks unpaid customer invoices by age.', // Description updated as per outline
                icon: Clock,
                color: 'bg-pink-500', premium: false
            },
            {
                id: 'sales-by-customer',
                name: 'Sales by Customer',
                description: 'Revenue analysis by customer with insights',
                icon: Users,
                color: 'bg-cyan-500', premium: false
            },
            {
                id: 'customer-profitability',
                name: 'Customer Profitability',
                description: 'Most profitable customers and segments',
                icon: Target,
                color: 'bg-lime-500', premium: true
            },
            {
                id: 'sales-by-item',
                name: 'Sales by Item/Service',
                description: 'Top-selling products and services',
                icon: Package,
                color: 'bg-gray-500', premium: false
            },
        ],
    },
    {
        name: 'Purchase & Supplier Reports',
        icon: Rss,
        reports: [
            {
                id: 'aged-payables',
                name: 'Aged Payables Summary',
                description: 'Outstanding supplier bills by aging',
                icon: Clock,
                color: 'bg-orange-500', premium: false
            },
            {
                id: 'purchases-by-supplier',
                name: 'Purchases by Supplier',
                description: 'Spending analysis by supplier',
                icon: Rss,
                color: 'bg-purple-500', premium: false
            },
            {
                id: 'expense-analysis',
                name: 'Expense Analysis',
                description: 'Detailed expense categorization and trends',
                icon: PieChart,
                color: 'bg-red-500', premium: true
            },
        ],
    },
    {
        name: 'Tax & Compliance',
        icon: DollarSign,
        reports: [
            {
                id: 'vat-report',
                name: 'VAT Report (Kenya)',
                description: 'VAT collected, paid, and liability summary',
                icon: DollarSign,
                color: 'bg-blue-600', premium: true
            },
            {
                id: 'withholding-tax',
                name: 'Withholding Tax Report',
                description: 'WHT deductions and payments tracking',
                icon: Percent,
                color: 'bg-green-600', premium: true
            },
        ],
    },
    {
        name: 'Advanced Analytics',
        icon: Zap,
        reports: [
            {
                id: 'budget-vs-actual',
                name: 'Budget vs Actual',
                description: 'Compare performance against budgets',
                icon: Target,
                color: 'bg-indigo-600', premium: true
            },
            {
                id: 'trend-analysis',
                name: 'Trend Analysis',
                description: 'Multi-period comparative analysis',
                icon: TrendingUp,
                color: 'bg-teal-600', premium: true
            },
            {
                id: 'financial-forecasting',
                name: 'Financial Forecasting',
                description: 'AI-powered revenue and expense forecasts',
                icon: Zap,
                color: 'bg-purple-600', premium: true
            },
            {
                id: 'industry-benchmark',
                name: 'Industry Benchmark',
                description: 'Compare your performance to industry averages.',
                icon: Briefcase,
                color: 'bg-rose-600', premium: true
            },
        ],
    },
    {
        name: 'Goals & Strategy',
        icon: Target,
        reports: [
            {
                id: 'goal-manager',
                name: 'Goal Manager',
                description: 'Set, track, and manage your business objectives.',
                icon: Trophy,
                color: 'bg-emerald-500', premium: true
            },
        ],
    },
];

export default function ReportSelector({ onSelectReport }) {
    const handleReportSelect = (report) => {
        onSelectReport(report);
    };

    return (
        <div className="space-y-12"> {/* Increased space-y for category separation */}
            {reportCategories.map((category) => (
                <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: category.name === 'Financial Statements' ? 0 : 0.1 }}
                >
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <category.icon className="w-8 h-8 text-indigo-600" />
                        {category.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {category.reports.map((report) => (
                            <Card
                                key={report.id}
                                className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-xl hover:-translate-y-1"
                                onClick={() => handleReportSelect(report)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-lg ${report.color} group-hover:scale-110 transition-transform`}>
                                            <report.icon className="w-6 h-6 text-white" />
                                        </div>
                                        {report.premium && (
                                            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                                                Premium
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">
                                        {report.name}
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {report.description}
                                    </p>
                                    <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                                        Generate Report
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
