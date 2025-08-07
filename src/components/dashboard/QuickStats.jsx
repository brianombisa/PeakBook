import React, { useMemo } from 'react';
import MetricCard from './MetricCard';
import { DollarSign, AlertCircle, TrendingUp, Users } from 'lucide-react';

export default function QuickStats({ transactions = [], customers = [] }) {
  const stats = useMemo(() => {
    const accountsReceivable = transactions
      .filter(t => t.journal_entries.some(e => e.account_code === '1200'))
      .flatMap(t => t.journal_entries)
      .filter(e => e.account_code === '1200')
      .reduce((sum, entry) => sum + (entry.debit_amount - entry.credit_amount), 0);
      
    const accountsPayable = transactions
      .filter(t => t.journal_entries.some(e => e.account_code === '2100'))
      .flatMap(t => t.journal_entries)
      .filter(e => e.account_code === '2100')
      .reduce((sum, entry) => sum + (entry.credit_amount - entry.debit_amount), 0);

    const netIncome = transactions
      .filter(t => ['4000', '5000', '6000', '6100'].some(code => t.journal_entries.some(e => e.account_code.startsWith(code.substring(0,1)))))
      .flatMap(t => t.journal_entries)
      .reduce((sum, entry) => {
          const code = entry.account_code;
          if (code.startsWith('4')) { // Revenue
              return sum + (entry.credit_amount - entry.debit_amount);
          }
          if (code.startsWith('5') || code.startsWith('6')) { // Expenses
              return sum - (entry.debit_amount - entry.credit_amount);
          }
          return sum;
      }, 0);
      
    return {
      outstandingReceivables: accountsReceivable > 0 ? accountsReceivable : 0,
      outstandingPayables: accountsPayable > 0 ? accountsPayable : 0,
      netIncome,
      totalCustomers: customers.length
    };
  }, [transactions, customers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Outstanding Receivables"
        value={`KES ${Math.round(stats.outstandingReceivables).toLocaleString()}`}
        icon={DollarSign}
        trend="▲ 5%"
        trendColor="text-green-500"
      />
      <MetricCard
        title="Outstanding Payables"
        value={`KES ${Math.round(stats.outstandingPayables).toLocaleString()}`}
        icon={AlertCircle}
        trend="▼ 2%"
        trendColor="text-red-500"
      />
      <MetricCard
        title="Net Income (All Time)"
        value={`KES ${Math.round(stats.netIncome).toLocaleString()}`}
        icon={TrendingUp}
        trendColor={stats.netIncome >= 0 ? "text-green-500" : "text-red-500"}
      />
      <MetricCard
        title="Total Customers"
        value={stats.totalCustomers.toString()}
        icon={Users}
      />
    </div>
  );
}