import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Package, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

// Smart Alerts Component for SMEs
const SmartSMEAlerts = ({ invoices, expenses, items, bankBalance }) => {
    const alerts = [];

    // Cash flow alerts
    const totalOverdue = invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total_amount, 0);
    
    if (totalOverdue > 100000) {
        alerts.push({
            type: 'critical',
            title: 'High Overdue Receivables',
            message: `KES ${totalOverdue.toLocaleString()} overdue. Consider following up urgently.`,
            action: 'View Receivables'
        });
    }

    // Inventory alerts
    const lowStockItems = items.filter(item => 
        item.is_trackable && 
        item.current_stock <= item.reorder_level
    );
    
    if (lowStockItems.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStockItems.length} items below reorder level.`,
            action: 'Restock Items'
        });
    }

    // Tax compliance alerts
    const lastVATReturn = new Date(); // This should come from KRATaxReturn entity
    const daysSinceVAT = differenceInDays(new Date(), lastVATReturn);
    
    if (daysSinceVAT > 25) {
        alerts.push({
            type: 'urgent',
            title: 'VAT Return Due Soon',
            message: 'Monthly VAT return is due in less than 5 days.',
            action: 'Generate Return'
        });
    }

    return (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Business Alerts ({alerts.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <p className="text-green-700 text-sm">✅ All systems running smoothly!</p>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert, index) => (
                            <div key={index} className={`p-3 rounded-lg border-l-4 ${
                                alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                                alert.type === 'urgent' ? 'border-orange-500 bg-orange-50' :
                                'border-yellow-500 bg-yellow-50'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="text-xs">
                                        {alert.action}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Enhanced Cash Flow Widget
const EnhancedCashFlowWidget = ({ transactions, invoices, expenses }) => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    
    // Calculate expected inflows (unpaid invoices due within 30 days)
    const expectedInflows = invoices
        .filter(inv => inv.status !== 'paid' && new Date(inv.due_date) <= next30Days)
        .reduce((sum, inv) => sum + inv.total_amount, 0);
    
    // Calculate expected outflows (unpaid expenses due within 30 days)
    const expectedOutflows = expenses
        .filter(exp => exp.status === 'unpaid' && exp.due_date && new Date(exp.due_date) <= next30Days)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Current bank balance (simplified - should come from bank integration)
    const currentBalance = 250000; // This should be real bank balance
    
    const projectedBalance = currentBalance + expectedInflows - expectedOutflows;
    const healthScore = projectedBalance > 100000 ? 'healthy' : projectedBalance > 0 ? 'caution' : 'critical';
    
    return (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
                <CardTitle className="text-indigo-800">30-Day Cash Flow Forecast</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-xl font-bold text-gray-800">
                            KES {currentBalance.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Expected In</p>
                        <p className="text-xl font-bold text-green-600">
                            +{expectedInflows.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Expected Out</p>
                        <p className="text-xl font-bold text-red-600">
                            -{expectedOutflows.toLocaleString()}
                        </p>
                    </div>
                </div>
                
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Projected Balance</span>
                        <Badge className={
                            healthScore === 'healthy' ? 'bg-green-100 text-green-800' :
                            healthScore === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }>
                            {healthScore.toUpperCase()}
                        </Badge>
                    </div>
                    <p className={`text-2xl font-bold ${
                        projectedBalance > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        KES {projectedBalance.toLocaleString()}
                    </p>
                    
                    {projectedBalance < 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-700">
                                ⚠️ Negative cash flow projected. Consider collecting receivables or arranging additional funding.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Business Health Score
const BusinessHealthScore = ({ revenue, expenses, receivables, payables }) => {
    // Calculate key ratios
    const monthlyRevenue = revenue / 12; // Assuming yearly revenue
    const monthlyExpenses = expenses / 12;
    const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;
    
    const receivablesTurnover = monthlyRevenue > 0 ? receivables / (monthlyRevenue / 30) : 0; // Days
    const payablesTurnover = monthlyExpenses > 0 ? payables / (monthlyExpenses / 30) : 0; // Days
    
    // Health score calculation (0-100)
    let healthScore = 50; // Base score
    
    // Profitability (40% weight)
    if (profitMargin > 20) healthScore += 20;
    else if (profitMargin > 10) healthScore += 15;
    else if (profitMargin > 5) healthScore += 10;
    else if (profitMargin > 0) healthScore += 5;
    else healthScore -= 10;
    
    // Cash management (30% weight)
    if (receivablesTurnover < 30) healthScore += 15; // Good collection
    else if (receivablesTurnover < 45) healthScore += 10;
    else if (receivablesTurnover < 60) healthScore += 5;
    else healthScore -= 5; // Poor collection
    
    // Liquidity (30% weight)
    const currentRatio = receivables / Math.max(payables, 1);
    if (currentRatio > 2) healthScore += 15;
    else if (currentRatio > 1.5) healthScore += 10;
    else if (currentRatio > 1) healthScore += 5;
    else healthScore -= 10;
    
    healthScore = Math.max(0, Math.min(100, healthScore)); // Clamp between 0-100
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Attention';
    };
    
    return (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
                <CardTitle className="text-purple-800">Business Health Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <div className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>
                        {Math.round(healthScore)}
                    </div>
                    <div className="text-lg font-medium text-gray-700">
                        {getScoreLabel(healthScore)}
                    </div>
                    <Progress value={healthScore} className="mt-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Profit Margin</span>
                        <span className={profitMargin > 10 ? 'text-green-600' : 'text-red-600'}>
                            {profitMargin.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Collection Period</span>
                        <span className={receivablesTurnover < 30 ? 'text-green-600' : 'text-red-600'}>
                            {Math.round(receivablesTurnover)} days
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Liquidity Ratio</span>
                        <span className={currentRatio > 1 ? 'text-green-600' : 'text-red-600'}>
                            {currentRatio.toFixed(1)}
                        </span>
                    </div>
                </div>
                
                {healthScore < 60 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-700">
                            💡 Tip: Focus on collecting outstanding receivables and improving profit margins.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export { SmartSMEAlerts, EnhancedCashFlowWidget, BusinessHealthScore };