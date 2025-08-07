import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters, startOfDay } from 'date-fns';
import { BookOpen } from 'lucide-react';

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

export default function GeneralLedger({ transactions = [], accounts = [], period = 'this_year', isLoading }) {

    const ledgerData = useMemo(() => {
        if (!accounts.length || !transactions.length) return [];

        const { startDate, endDate } = getDateRangeFromPeriod(period);

        const accountMap = new Map(accounts.map(acc => [acc.account_code, { ...acc, entries: [] }]));

        const openingBalances = new Map();
        accounts.forEach(acc => openingBalances.set(acc.account_code, 0));
        
        // Calculate opening balances
        const priorTransactions = transactions.filter(t => new Date(t.transaction_date) < startOfDay(startDate));
        priorTransactions.forEach(t => {
            t.journal_entries.forEach(entry => {
                const currentBalance = openingBalances.get(entry.account_code) || 0;
                openingBalances.set(entry.account_code, currentBalance + (entry.debit_amount || 0) - (entry.credit_amount || 0));
            });
        });

        const transactionsInPeriod = transactions.filter(t => {
            const tDate = new Date(t.transaction_date);
            return tDate >= startDate && tDate <= endDate;
        });

        transactionsInPeriod.forEach(t => {
            t.journal_entries.forEach(entry => {
                if (accountMap.has(entry.account_code)) {
                    accountMap.get(entry.account_code).entries.push({
                        date: t.transaction_date,
                        description: t.description,
                        debit: entry.debit_amount || 0,
                        credit: entry.credit_amount || 0,
                    });
                }
            });
        });

        const result = [];
        accountMap.forEach((account, code) => {
            if (account.entries.length > 0 || openingBalances.get(code) !== 0) { // Include accounts with opening balance but no activity
                let runningBalance = openingBalances.get(code) || 0;
                const sortedEntries = account.entries.sort((a,b) => new Date(a.date) - new Date(b.date));
                
                const entriesWithBalance = sortedEntries.map(entry => {
                    runningBalance += entry.debit - entry.credit;
                    return { ...entry, balance: runningBalance };
                });

                result.push({
                    ...account,
                    openingBalance: openingBalances.get(code) || 0,
                    entries: entriesWithBalance,
                    closingBalance: runningBalance
                });
            }
        });

        return result.sort((a,b) => a.account_code.localeCompare(b.account_code));

    }, [accounts, transactions, period]);

    if (isLoading) return <p>Loading General Ledger...</p>;
    if (ledgerData.length === 0) return <p>No transactions found for the selected period.</p>;

    return (
        <div className="space-y-6">
            {ledgerData.map(account => (
                <Card key={account.account_code}>
                    <CardHeader>
                        <CardTitle>{account.account_code} - {account.account_name}</CardTitle>
                        <CardDescription>
                            Account Type: <Badge variant="outline">{account.account_type}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="font-semibold">
                                    <TableCell colSpan={4}>Opening Balance</TableCell>
                                    <TableCell className="text-right">{account.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                                {account.entries.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(new Date(entry.date), 'dd-MMM-yyyy')}</TableCell>
                                        <TableCell>{entry.description}</TableCell>
                                        <TableCell className="text-right">{entry.debit > 0 ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                        <TableCell className="text-right">{entry.credit > 0 ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                        <TableCell className="text-right">{entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-semibold bg-slate-50">
                                    <TableCell colSpan={4}>Closing Balance</TableCell>
                                    <TableCell className="text-right">{account.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}