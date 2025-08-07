import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import ChartOfAccountsService from '../../services/ChartOfAccountsService';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters, format } from 'date-fns';

const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    let endDate;
    switch (period) {
        case 'this_month': endDate = endOfMonth(now); break;
        case 'last_month': endDate = endOfMonth(subMonths(now, 1)); break;
        case 'this_quarter': endDate = endOfQuarter(now); break;
        case 'last_quarter': endDate = endOfQuarter(subQuarters(now, 1)); break;
        case 'this_year': endDate = endOfYear(now); break;
        case 'last_year': endDate = endOfYear(subYears(now, 1)); break;
        default: endDate = now; break;
    }
    return { endDate };
};

export default function TrialBalance({ transactions = [], accounts = [], period = 'this_year', isLoading }) {
    const trialBalanceData = useMemo(() => {
        if (!accounts || accounts.length === 0) {
            return { hasData: false, message: 'No chart of accounts found.' };
        }

        if (!transactions || transactions.length === 0) {
            return { hasData: false, message: 'No transactions found.' };
        }

        const { endDate } = getDateRangeFromPeriod(period);
        const balances = ChartOfAccountsService.getAccountBalances(accounts, transactions, endDate);
        const tbData = ChartOfAccountsService.generateTrialBalanceData(accounts, balances);
        
        return {
            ...tbData,
            hasData: true,
            asOfDate: endDate,
            accountsWithActivity: tbData.rows.length,
            totalAccounts: accounts.length
        };

    }, [transactions, accounts, period]);

    const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Trial Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Calculating Trial Balance...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!trialBalanceData.hasData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Trial Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="font-semibold mb-2">Cannot Generate Trial Balance</p>
                        <p>{trialBalanceData.message}</p>
                        <p className="text-xs mt-2">Ensure you have both a chart of accounts and posted transactions.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Trial Balance (IFRS Standard)
                </CardTitle>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        As of {format(trialBalanceData.asOfDate, 'PPP')} • 
                        {trialBalanceData.accountsWithActivity} of {trialBalanceData.totalAccounts} accounts with activity
                    </p>
                    <div className="flex items-center gap-2">
                        {trialBalanceData.isBalanced ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Balanced
                            </Badge>
                        ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-300">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Out of Balance
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!trialBalanceData.isBalanced && (
                    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-800">Trial Balance is Out of Balance</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">
                            Variance: {formatCurrency(trialBalanceData.variance)} 
                            (Debits: {formatCurrency(trialBalanceData.totalDebits)}, Credits: {formatCurrency(trialBalanceData.totalCredits)})
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                            Check your journal entries for errors. All debits must equal credits.
                        </p>
                    </div>
                )}

                <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead className="w-32 text-right">Debit Balance</TableHead>
                                <TableHead className="w-32 text-right">Credit Balance</TableHead>
                                <TableHead className="w-24">Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trialBalanceData.rows.map((row, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    <TableCell className="font-mono text-sm font-medium">{row.accountCode}</TableCell>
                                    <TableCell className="font-medium">{row.accountName}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {row.accountType}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* TOTALS ROW */}
                            <TableRow className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                                <TableCell colSpan={2} className="font-bold text-slate-800">
                                    TOTAL
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800">
                                    {formatCurrency(trialBalanceData.totalDebits)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800">
                                    {formatCurrency(trialBalanceData.totalCredits)}
                                </TableCell>
                                <TableCell>
                                    {trialBalanceData.isBalanced ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Summary Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Total Debits</p>
                        <p className="font-bold text-lg">{formatCurrency(trialBalanceData.totalDebits)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Total Credits</p>
                        <p className="font-bold text-lg">{formatCurrency(trialBalanceData.totalCredits)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Variance</p>
                        <p className={`font-bold text-lg ${trialBalanceData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trialBalanceData.variance)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className={`font-bold text-lg ${trialBalanceData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                            {trialBalanceData.isBalanced ? '✓ Balanced' : '⚠ Out of Balance'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}