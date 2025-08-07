import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const RatioCard = ({ title, value, interpretation, isGood }) => {
    const displayValue = isNaN(value) ? 'N/A' : value.toFixed(2);
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold mb-2">{displayValue}</p>
                <div className="flex items-center gap-2 mb-2">
                    {displayValue !== 'N/A' && (isGood ? 
                        <TrendingUp className="w-5 h-5 text-green-600" /> : 
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{isGood ? 'Healthy' : 'Needs Attention'}</span>
                </div>
                <CardDescription>{interpretation}</CardDescription>
            </CardContent>
        </Card>
    );
};

export default function BusinessRatios({ accounts, transactions, dateRange }) {
    const ratios = useMemo(() => {
        if (!transactions || !accounts || transactions.length === 0) {
            return {
                currentRatio: 0,
                quickRatio: 0,
                debtToEquity: 0,
                grossProfitMargin: 0,
                netProfitMargin: 0,
            };
        }

        const accountMap = new Map(accounts.map(acc => [acc.account_code, acc]));
        const balances = new Map();

        const endOfPeriod = dateRange ? dateRange.end : new Date();
        const transactionsInPeriod = transactions.filter(t => new Date(t.transaction_date) <= endOfPeriod);

        for (const transaction of transactionsInPeriod) {
            for (const entry of transaction.journal_entries) {
                const currentBalance = balances.get(entry.account_code) || { debit: 0, credit: 0 };
                currentBalance.debit += entry.debit_amount || 0;
                currentBalance.credit += entry.credit_amount || 0;
                balances.set(entry.account_code, currentBalance);
            }
        }

        let currentAssets = 0, currentLiabilities = 0, totalEquity = 0, totalLiabilities = 0, inventory = 0;
        let revenue = 0, costOfSales = 0, netIncome = 0;

        balances.forEach((b, code) => {
            const account = accountMap.get(code);
            if (!account) return;

            const finalBalance = account.normal_balance === 'debit' ? b.debit - b.credit : b.credit - b.debit;

            if (account.account_subtype === 'current_asset') currentAssets += finalBalance;
            if (account.account_subtype === 'current_liability') currentLiabilities += finalBalance;
            if (account.account_type === 'equity') totalEquity += finalBalance;
            if (account.account_type === 'liability') totalLiabilities += finalBalance;
            // Assuming inventory account code is around 1200
            if (account.account_code?.startsWith('12')) inventory += finalBalance;
        });

        const pnlTransactions = dateRange ? transactions.filter(t => new Date(t.transaction_date) >= dateRange.start && new Date(t.transaction_date) <= dateRange.end) : transactions;

        for (const transaction of pnlTransactions) {
            for (const entry of transaction.journal_entries) {
                 const account = accountMap.get(entry.account_code);
                 if(!account) continue;
                 if(account.account_type === 'revenue') revenue += (entry.credit_amount - entry.debit_amount);
                 if(account.account_type === 'expense') {
                     const expenseAmount = entry.debit_amount - entry.credit_amount;
                     netIncome -= expenseAmount;
                     if(account.account_code?.startsWith('50')) costOfSales += expenseAmount;
                 }
            }
        }
        netIncome += revenue;

        const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
        const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
        const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
        const grossProfitMargin = revenue > 0 ? ((revenue - costOfSales) / revenue) * 100 : 0;
        const netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

        return { currentRatio, quickRatio, debtToEquity, grossProfitMargin, netProfitMargin };
    }, [accounts, transactions, dateRange]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RatioCard 
                title="Current Ratio"
                value={ratios.currentRatio}
                interpretation="Measures ability to pay short-term debts. A ratio above 1.5 is generally considered healthy."
                isGood={ratios.currentRatio >= 1.5}
            />
            <RatioCard 
                title="Quick Ratio (Acid-Test)"
                value={ratios.quickRatio}
                interpretation="Similar to Current Ratio but excludes less liquid inventory. Above 1 is strong."
                isGood={ratios.quickRatio >= 1}
            />
            <RatioCard 
                title="Debt-to-Equity Ratio"
                value={ratios.debtToEquity}
                interpretation="Indicates how much debt a company is using to finance its assets relative to equity. Lower is better."
                isGood={ratios.debtToEquity < 1}
            />
             <RatioCard 
                title="Gross Profit Margin (%)"
                value={ratios.grossProfitMargin}
                interpretation="The percentage of revenue left after subtracting the cost of goods sold. Higher is better."
                isGood={ratios.grossProfitMargin > 20}
            />
            <RatioCard 
                title="Net Profit Margin (%)"
                value={ratios.netProfitMargin}
                interpretation="The percentage of revenue left after all expenses have been deducted. Higher is better."
                isGood={ratios.netProfitMargin > 5}
            />
        </div>
    );
}