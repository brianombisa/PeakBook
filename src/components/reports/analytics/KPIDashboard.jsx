
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Users, 
    Clock, 
    Target,
    AlertCircle,
    CheckCircle,
    BarChart3,
    Percent
} from 'lucide-react';
import { 
    isWithinInterval, subMonths, startOfMonth, endOfMonth, 
    startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters 
} from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const getDateRangeFromPeriod = (period) => {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'this_month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'last_month':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      break;
    case 'this_quarter':
      startDate = startOfQuarter(now);
      endDate = endOfQuarter(now);
      break;
    case 'last_quarter':
      startDate = startOfQuarter(subQuarters(now, 1));
      endDate = endOfQuarter(subQuarters(now, 1));
      break;
    case 'this_year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    case 'last_year':
      startDate = startOfYear(subYears(now, 1));
      endDate = endOfYear(subYears(now, 1));
      break;
    default: // all_time
      startDate = new Date(2020, 0, 1); // Or a very early date
      endDate = now;
      break;
  }
  
  return { start: startDate, end: endDate };
};

export default function KPIDashboard({ data = {}, period = 'this_year' }) {
    const { invoices, expenses, customers, goals } = data;
    const dateRange = getDateRangeFromPeriod(period);

    // Calculate current period metrics
    const currentRevenue = (invoices || [])
        .filter(inv => (inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue') && 
                      isWithinInterval(new Date(inv.invoice_date), dateRange))
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    const currentExpenses = (expenses || [])
        .filter(exp => isWithinInterval(new Date(exp.expense_date), dateRange))
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const netProfit = currentRevenue - currentExpenses;
    const profitMargin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0;

    // Calculate previous period for comparison
    const previousPeriodStart = startOfMonth(subMonths(dateRange.start, 1));
    const previousPeriodEnd = endOfMonth(subMonths(dateRange.start, 1));
    
    const previousRevenue = (invoices || [])
        .filter(inv => (inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue') && 
                      isWithinInterval(new Date(inv.invoice_date), { start: previousPeriodStart, end: previousPeriodEnd }))
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    const previousExpenses = (expenses || [])
        .filter(exp => isWithinInterval(new Date(exp.expense_date), { start: previousPeriodStart, end: previousPeriodEnd }))
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate growth rates
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expenseGrowth = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

    // Customer metrics
    const activeCustomers = (customers || []).filter(c => 
        (invoices || []).some(inv => inv.customer_id === c.id && 
                                   isWithinInterval(new Date(inv.invoice_date), dateRange))
    ).length;

    const averageOrderValue = currentRevenue > 0 && (invoices || []).length > 0 ? 
        currentRevenue / (invoices || []).filter(inv => 
            isWithinInterval(new Date(inv.invoice_date), dateRange)
        ).length : 0;

    // Outstanding invoices
    const outstandingAmount = (invoices || [])
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off')
        .reduce((sum, inv) => sum + (inv.balance_due || inv.total_amount || 0), 0);

    const overdueAmount = (invoices || [])
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off' && 
                      new Date(inv.due_date) < new Date())
        .reduce((sum, inv) => sum + (inv.balance_due || inv.total_amount || 0), 0);

    // Cash conversion cycle (simplified)
    const averageCollectionDays = 30; // Simplified - would calculate from actual payment data
    const cashConversionCycle = averageCollectionDays;

    // Goal progress
    const activeGoals = (goals || []).filter(g => g.status === 'active' || g.status === 'on_track' || g.status === 'at_risk');
    const goalsOnTrack = activeGoals.filter(g => g.current_value >= g.target_value * 0.8).length;
    const goalCompletionRate = activeGoals.length > 0 ? (goalsOnTrack / activeGoals.length) * 100 : 0;

    // KPI definitions with targets and insights
    const kpis = [
        {
            title: "Revenue Growth",
            value: revenueGrowth,
            format: "percentage",
            target: 10,
            trend: revenueGrowth >= 0 ? "up" : "down",
            status: revenueGrowth >= 10 ? "excellent" : revenueGrowth >= 5 ? "good" : revenueGrowth >= 0 ? "fair" : "poor",
            icon: DollarSign,
            description: "Month-over-month revenue growth rate"
        },
        {
            title: "Profit Margin",
            value: profitMargin,
            format: "percentage",
            target: 20,
            trend: profitMargin >= 20 ? "up" : profitMargin >= 10 ? "stable" : "down",
            status: profitMargin >= 20 ? "excellent" : profitMargin >= 10 ? "good" : profitMargin >= 5 ? "fair" : "poor",
            icon: TrendingUp,
            description: "Net profit as percentage of revenue"
        },
        {
            title: "Customer Retention",
            value: activeCustomers,
            format: "number",
            target: Math.max(activeCustomers * 1.1, 50),
            trend: "stable",
            status: activeCustomers >= 50 ? "excellent" : activeCustomers >= 20 ? "good" : "fair",
            icon: Users,
            description: "Number of active customers this period"
        },
        {
            title: "Average Order Value",
            value: averageOrderValue,
            format: "currency",
            target: averageOrderValue * 1.2,
            trend: "stable",
            status: averageOrderValue >= 50000 ? "excellent" : averageOrderValue >= 20000 ? "good" : "fair",
            icon: Target,
            description: "Average value per customer transaction"
        },
        {
            title: "Collection Efficiency",
            value: outstandingAmount > 0 ? (1 - (overdueAmount / outstandingAmount)) * 100 : 100,
            format: "percentage",
            target: 90,
            trend: overdueAmount < outstandingAmount * 0.1 ? "up" : "down",
            status: overdueAmount < outstandingAmount * 0.1 ? "excellent" : overdueAmount < outstandingAmount * 0.2 ? "good" : "poor",
            icon: Clock,
            description: "Percentage of receivables collected on time"
        },
        {
            title: "Expense Control",
            value: Math.abs(expenseGrowth),
            format: "percentage",
            target: 5,
            trend: expenseGrowth <= 5 ? "up" : expenseGrowth <= 15 ? "stable" : "down",
            status: expenseGrowth <= 5 ? "excellent" : expenseGrowth <= 15 ? "good" : "poor",
            icon: BarChart3,
            description: "Expense growth rate compared to revenue"
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'good': return 'text-blue-600 bg-blue-100';
            case 'fair': return 'text-yellow-600 bg-yellow-100';
            case 'poor': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
            default: return <BarChart3 className="w-4 h-4 text-blue-600" />;
        }
    };

    const formatValue = (value, format) => {
        switch (format) {
            case 'percentage': return `${value.toFixed(1)}%`;
            case 'currency': return `KES ${value.toLocaleString()}`;
            case 'number': return value.toString();
            default: return value.toString();
        }
    };

    // Revenue trend data for chart
    const revenueData = Array.from({ length: 12 }, (_, i) => {
        const month = subMonths(new Date(), 11 - i);
        const monthRevenue = (invoices || [])
            .filter(inv => (inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue') && 
                          new Date(inv.invoice_date).getMonth() === month.getMonth() &&
                          new Date(inv.invoice_date).getFullYear() === month.getFullYear())
            .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        
        return {
            month: month.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthRevenue,
            expenses: (expenses || [])
                .filter(exp => new Date(exp.expense_date).getMonth() === month.getMonth() &&
                              new Date(exp.expense_date).getFullYear() === month.getFullYear())
                .reduce((sum, exp) => sum + (exp.amount || 0), 0)
        };
    });

    return (
        <div className="space-y-8">
            {/* Executive KPI Overview */}
            <Card className="glass-effect border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        Key Performance Indicators
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kpis.map((kpi, index) => {
                            const Icon = kpi.icon;
                            const progress = kpi.target > 0 ? Math.min((kpi.value / kpi.target) * 100, 150) : 0;
                            
                            return (
                                <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Icon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getTrendIcon(kpi.trend)}
                                                <Badge className={getStatusColor(kpi.status)}>
                                                    {kpi.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{kpi.title}</h3>
                                                <p className="text-sm text-slate-500">{kpi.description}</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-2xl font-bold text-slate-900">
                                                        {formatValue(kpi.value, kpi.format)}
                                                    </span>
                                                    <span className="text-sm text-slate-500">
                                                        Target: {formatValue(kpi.target, kpi.format)}
                                                    </span>
                                                </div>
                                                <Progress value={Math.min(progress, 100)} className="h-2" />
                                                <p className="text-xs text-slate-500">
                                                    {progress >= 100 ? 'Target exceeded!' : `${(100 - progress).toFixed(0)}% to target`}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Revenue vs Expenses Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                                <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, '']} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stackId="1" 
                                    stroke="#10b981" 
                                    fill="#10b981" 
                                    fillOpacity={0.8} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="expenses" 
                                    stackId="2" 
                                    stroke="#ef4444" 
                                    fill="#ef4444" 
                                    fillOpacity={0.8} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            Goal Achievement Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-purple-600 mb-2">
                                    {goalCompletionRate.toFixed(0)}%
                                </div>
                                <p className="text-slate-600">Goals on Track</p>
                                <Progress value={goalCompletionRate} className="h-3 mt-3" />
                            </div>
                            
                            <div className="space-y-3">
                                {activeGoals.slice(0, 4).map((goal, index) => {
                                    const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
                                    const isOnTrack = progress >= 80;
                                    
                                    return (
                                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {isOnTrack ? 
                                                    <CheckCircle className="w-5 h-5 text-green-600" /> :
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                }
                                                <div>
                                                    <p className="font-medium text-slate-800">{goal.goal_name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-bold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Health Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Cash Position
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600">Net Profit This Period</p>
                                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    KES {Math.abs(netProfit).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {netProfit >= 0 ? 'Profit' : 'Loss'} - {profitMargin.toFixed(1)}% margin
                                </p>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500">Revenue</p>
                                        <p className="font-bold">KES {currentRevenue.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Expenses</p>
                                        <p className="font-bold">KES {currentExpenses.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Collections
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600">Outstanding Amount</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    KES {outstandingAmount.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Total receivables</p>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Overdue</span>
                                        <span className={`font-bold ${overdueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            KES {overdueAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={outstandingAmount > 0 ? (overdueAmount / outstandingAmount) * 100 : 0} 
                                        className="h-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-xl">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Customer Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-600">Active Customers</p>
                                <p className="text-2xl font-bold text-purple-600">{activeCustomers}</p>
                                <p className="text-sm text-slate-500">This period</p>
                            </div>
                            <div className="pt-3 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Avg Order Value</span>
                                        <span className="font-bold">KES {averageOrderValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Revenue per Customer</span>
                                        <span className="font-bold">
                                            KES {activeCustomers > 0 ? (currentRevenue / activeCustomers).toLocaleString() : '0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
