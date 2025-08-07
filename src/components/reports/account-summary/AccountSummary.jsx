import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';

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
            startDate = new Date(2020, 0, 1);
            endDate = now;
            break;
    }
    
    return { startDate, endDate };
};

export default function AccountSummary({ data = {}, period = 'this_year', isLoading }) {
  const { transactions = [], accounts = [] } = data;

  const summaryData = useMemo(() => {
    if (!accounts || accounts.length === 0 || !transactions) {
        return { accounts: [], hasData: false };
    }
    
    const { startDate, endDate } = getDateRangeFromPeriod(period);

    // Calculate opening balances (transactions before the period)
    const openingBalances = new Map();
    accounts.forEach(acc => openingBalances.set(acc.account_code, 0));

    const priorTransactions = transactions.filter(t => new Date(t.transaction_date) < startDate);
    priorTransactions.forEach(t => {
        if (!t.journal_entries) return;
        t.journal_entries.forEach(je => {
            if (openingBalances.has(je.account_code)) {
                openingBalances.set(je.account_code, 
                    (openingBalances.get(je.account_code) || 0) + 
                    (parseFloat(je.debit_amount) || 0) - 
                    (parseFloat(je.credit_amount) || 0)
                );
            }
        });
    });

    // Calculate period activity
    const periodActivity = new Map();
    accounts.forEach(acc => periodActivity.set(acc.account_code, { debits: 0, credits: 0 }));

    const periodTransactions = transactions.filter(t => {
        const txDate = new Date(t.transaction_date);
        return txDate >= startDate && txDate <= endDate;
    });

    periodTransactions.forEach(t => {
        if (!t.journal_entries) return;
        t.journal_entries.forEach(je => {
            if (periodActivity.has(je.account_code)) {
                const activity = periodActivity.get(je.account_code);
                activity.debits += parseFloat(je.debit_amount) || 0;
                activity.credits += parseFloat(je.credit_amount) || 0;
            }
        });
    });

    // Build summary for each account
    const accountSummary = accounts.map(acc => {
        const openingBalance = openingBalances.get(acc.account_code) || 0;
        const activity = periodActivity.get(acc.account_code) || { debits: 0, credits: 0 };
        const netActivity = activity.debits - activity.credits;
        const closingBalance = openingBalance + netActivity;
        
        // Adjust for normal balance (credit accounts should show as positive when they have credit balances)
        const displayOpeningBalance = acc.normal_balance === 'credit' ? -openingBalance : openingBalance;
        const displayClosingBalance = acc.normal_balance === 'credit' ? -closingBalance : closingBalance;
        
        return {
            code: acc.account_code,
            name: acc.account_name,
            type: acc.account_type,
            subtype: acc.account_subtype,
            normalBalance: acc.normal_balance,
            openingBalance: Math.round(displayOpeningBalance),
            debits: Math.round(activity.debits),
            credits: Math.round(activity.credits),
            netActivity: Math.round(netActivity),
            closingBalance: Math.round(displayClosingBalance),
            hasActivity: activity.debits > 0 || activity.credits > 0 || openingBalance !== 0
        };
    }).filter(acc => acc.hasActivity) // Only show accounts with activity
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
        accounts: accountSummary,
        hasData: accountSummary.length > 0,
        periodStart: startDate,
        periodEnd: endDate
    };

  }, [accounts, transactions, period]);

  const getAccountTypeColor = (type) => {
    switch (type) {
        case 'asset': return 'bg-green-100 text-green-800';
        case 'liability': return 'bg-red-100 text-red-800';
        case 'equity': return 'bg-blue-100 text-blue-800';
        case 'revenue': return 'bg-purple-100 text-purple-800';
        case 'expense': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    const absAmount = Math.abs(amount);
    return amount < 0 ? `(${absAmount.toLocaleString()})` : absAmount.toLocaleString();
  };

  if (isLoading) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p>Preparing Account Summary...</p>
          </CardContent>
        </Card>
      );
  }

  if (!summaryData.hasData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500">
          <p className="font-semibold mb-2">No Account Activity</p>
          <p>No account activity found for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  const { accounts: accountList, periodStart, periodEnd } = summaryData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Account Summary
        </CardTitle>
        <CardDescription>
            Account balances and activity from {format(periodStart, 'MMM dd, yyyy')} to {format(periodEnd, 'MMM dd, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Debits</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Net Activity</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {accountList.map(acc => (
                      <TableRow key={acc.code}>
                          <TableCell>
                              <div>
                                  <div className="font-medium">{acc.code} - {acc.name}</div>
                                  {acc.subtype && (
                                      <div className="text-xs text-slate-500 capitalize">
                                          {acc.subtype.replace('_', ' ')}
                                      </div>
                                  )}
                              </div>
                          </TableCell>
                          <TableCell>
                              <Badge className={getAccountTypeColor(acc.type)}>
                                  {acc.type}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                              KES {formatCurrency(acc.openingBalance)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                              {acc.debits > 0 ? `KES ${acc.debits.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                              {acc.credits > 0 ? `KES ${acc.credits.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                              <div className="flex items-center justify-end gap-1">
                                  {acc.netActivity > 0 ? (
                                      <TrendingUp className="w-3 h-3 text-green-600" />
                                  ) : acc.netActivity < 0 ? (
                                      <TrendingDown className="w-3 h-3 text-red-600" />
                                  ) : null}
                                  KES {formatCurrency(acc.netActivity)}
                              </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                              KES {formatCurrency(acc.closingBalance)}
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}