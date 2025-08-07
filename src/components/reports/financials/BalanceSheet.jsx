
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters, format } from 'date-fns';
import { Eye, Building, TrendingDown, Landmark, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChartOfAccountsService from '../../services/ChartOfAccountsService';

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
        default: 
            startDate = new Date(2020, 0, 1);
            endDate = now; 
            break;
    }
    return { startDate, endDate };
};

// Enhanced drill-down component
const BalanceSheetDrillDown = ({ open, onClose, title, amount, accountCodes, accounts, transactions, period }) => {
    const ledgerData = useMemo(() => {
        if (!open || !accountCodes || !period) return { entries: [], openingBalance: 0, closingBalance: 0, matchingAccounts: [] };
        
        const { startDate, endDate } = getDateRangeFromPeriod(period);

        // Find all accounts that match the account codes
        const matchingAccounts = accounts.filter(acc => 
            accountCodes.some(code => acc.account_code.startsWith(code))
        );

        // Calculate Opening Balance (before the period starts)
        const priorTransactions = transactions.filter(t => new Date(t.transaction_date) < startDate);
        let openingBalance = 0;
        for (const t of priorTransactions) {
            for (const je of t.journal_entries) {
                if (accountCodes.some(code => je.account_code.startsWith(code))) {
                    openingBalance += (je.debit_amount || 0) - (je.credit_amount || 0);
                }
            }
        }

        // Get Transactions within the period
        const periodTransactions = transactions
            .filter(t => {
                const tDate = new Date(t.transaction_date);
                return tDate >= startDate && tDate <= endDate;
            })
            .filter(t => t.journal_entries.some(je => accountCodes.some(code => je.account_code.startsWith(code))))
            .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        // Create ledger entries with a running balance
        let runningBalance = openingBalance;
        const entries = [];
        for (const t of periodTransactions) {
            for (const je of t.journal_entries) {
                if (accountCodes.some(code => je.account_code.startsWith(code))) {
                    const debit = je.debit_amount || 0;
                    const credit = je.credit_amount || 0;
                    runningBalance += (debit - credit);
                    entries.push({
                        id: `${t.id}-${je.account_code}`,
                        date: t.transaction_date,
                        reference: t.reference_number,
                        description: je.description || t.description,
                        accountCode: je.account_code,
                        debit,
                        credit,
                        balance: runningBalance
                    });
                }
            }
        }

        return { entries, openingBalance, closingBalance: runningBalance, matchingAccounts };

    }, [open, accountCodes, transactions, period, accounts]);

    const formatCurrency = (val) => `KES ${Math.round(val).toLocaleString()}`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Ledger Drill Down: {title}
                    </DialogTitle>
                    <DialogDescription>
                        Showing the calculation for the balance as of {format(getDateRangeFromPeriod(period).endDate, 'PPP')}.
                        Final Balance: {formatCurrency(ledgerData.closingBalance)}
                    </DialogDescription>
                </DialogHeader>
                
                {/* Show matching accounts */}
                <div className="mb-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-800 mb-2">Accounts Included:</h4>
                    <div className="flex flex-wrap gap-2">
                        {ledgerData.matchingAccounts.map(acc => (
                            <Badge key={acc.id} variant="outline" className="text-xs">
                                {acc.account_code} - {acc.account_name}
                            </Badge>
                        ))}
                    </div>
                    {ledgerData.matchingAccounts.length === 0 && (
                        <p className="text-red-600 text-sm">⚠️ No matching accounts found for codes: {accountCodes?.join(', ') || 'not available'}</p>
                    )}
                </div>

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ref</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="font-bold bg-slate-50">
                                <TableCell colSpan={6}>Opening Balance</TableCell>
                                <TableCell className="text-right">{formatCurrency(ledgerData.openingBalance)}</TableCell>
                            </TableRow>
                            {ledgerData.entries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>{format(new Date(entry.date), 'dd-MMM-yyyy')}</TableCell>
                                    <TableCell>{entry.reference}</TableCell>
                                    <TableCell className="text-xs">{entry.accountCode}</TableCell>
                                    <TableCell>{entry.description}</TableCell>
                                    <TableCell className="text-right">
                                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(entry.balance)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold bg-slate-100 border-t-2">
                                <TableCell colSpan={6}>Closing Balance</TableCell>
                                <TableCell className="text-right">{formatCurrency(ledgerData.closingBalance)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    {ledgerData.entries.length === 0 && (
                         <div className="text-center py-8 text-gray-500">
                            No transactions found for this account group in the selected period. The balance is carried forward from previous periods.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function BalanceSheet({ transactions = [], accounts = [], period = 'this_year', isLoading }) {
    const [drillDownData, setDrillDownData] = useState(null);
    
    const calculatedData = useMemo(() => {
        if (!accounts || accounts.length === 0) {
            return { hasData: false, message: 'No chart of accounts found.' };
        }

        if (!transactions || transactions.length === 0) {
            return { hasData: false, message: 'No transactions found.' };
        }

        const { endDate } = getDateRangeFromPeriod(period);
        
        // Debug: Let's see what accounts we actually have
        console.log('Available accounts:', accounts.map(a => ({ code: a.account_code, name: a.account_name, type: a.account_type })));
        
        const balances = ChartOfAccountsService.getAccountBalances(accounts, transactions, endDate);
        
        // Enhanced Balance Sheet calculation with flexible account matching
        let currentAssets = 0, nonCurrentAssets = 0;
        let currentLiabilities = 0, nonCurrentLiabilities = 0;
        let totalEquity = 0;
        
        // Assets (positive balances for asset accounts)
        accounts.forEach(account => {
            const balance = balances.get(account.account_code)?.balance || 0;
            
            if (account.account_type === 'asset' || account.account_code.startsWith('1')) {
                if (account.account_subtype === 'current_asset' || 
                    account.account_code.match(/^1[01]\d\d/) || 
                    account.account_name?.toLowerCase().includes('cash') ||
                    account.account_name?.toLowerCase().includes('receivable') ||
                    account.account_name?.toLowerCase().includes('inventory')) {
                    currentAssets += balance;
                } else {
                    nonCurrentAssets += balance;
                }
            }
            
            // Liabilities (negative balances for liability accounts, but we show as positive)
            if (account.account_type === 'liability' || account.account_code.startsWith('2')) {
                if (account.account_subtype === 'current_liability' || 
                    account.account_code.match(/^2[01]\d\d/) ||
                    account.account_name?.toLowerCase().includes('payable')) {
                    currentLiabilities += Math.abs(balance); // Show as positive
                } else {
                    nonCurrentLiabilities += Math.abs(balance);
                }
            }
            
            // Equity (negative balances for equity accounts, but we show as positive)
            if (account.account_type === 'equity' || account.account_code.startsWith('3')) {
                totalEquity += Math.abs(balance);
            }
        });

        const totalAssets = currentAssets + nonCurrentAssets;
        const totalLiabilities = currentLiabilities + nonCurrentLiabilities;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
        const variance = totalAssets - totalLiabilitiesAndEquity;
        const balanceCheck = Math.abs(variance) < 1; // Allow for rounding

        // Debug output
        console.log('Balance Sheet Debug:', {
            currentAssets,
            nonCurrentAssets,
            totalAssets,
            currentLiabilities,
            nonCurrentLiabilities,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity,
            variance,
            balanceCheck
        });
        
        return {
            currentAssets,
            nonCurrentAssets,
            totalAssets,
            currentLiabilities,
            nonCurrentLiabilities,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity,
            variance,
            balanceCheck,
            hasData: true,
            calculationDate: endDate,
            accountCount: accounts.length,
            transactionCount: transactions.filter(t => new Date(t.transaction_date) <= endDate).length,
            // Diagnostic data
            assetAccounts: accounts.filter(a => a.account_type === 'asset' || a.account_code.startsWith('1')),
            liabilityAccounts: accounts.filter(a => a.account_type === 'liability' || a.account_code.startsWith('2')),
            equityAccounts: accounts.filter(a => a.account_type === 'equity' || a.account_code.startsWith('3'))
        };

    }, [transactions, accounts, period]);

    const handleDrillDown = (title, amount, accountCodes) => {
        setDrillDownData({ title, amount, accountCodes });
    };

    const ClickableAmount = ({ amount, accountName, accountCodes }) => (
        <Button
            variant="ghost"
            className="font-medium justify-end p-0 h-auto hover:underline text-slate-900 hover:text-slate-700"
            onClick={() => handleDrillDown(accountName, amount, accountCodes)}
            disabled={!amount}
        >
            <span className="flex items-center gap-1">
                KES {Math.round(amount).toLocaleString()}
                {!!amount && <Eye className="w-3 h-3 opacity-30" />}
            </span>
        </Button>
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Calculating Balance Sheet...</p>
                </CardContent>
            </Card>
        );
    }

    if (!calculatedData || !calculatedData.hasData) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-slate-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-semibold mb-2">Insufficient Data for Balance Sheet</p>
                    <p>{calculatedData?.message || "Cannot generate Balance Sheet."}</p>
                    <p className="text-xs mt-2">Ensure you have a chart of accounts and posted transactions.</p>
                </CardContent>
            </Card>
        );
    }

    const { calculationDate } = calculatedData;

    return (
        <div className="space-y-6">
            {/* Diagnostic Information */}
            {(!calculatedData.totalLiabilities && !calculatedData.totalEquity) && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        <strong>Chart of Accounts Issue Detected:</strong>
                        <br />• Assets Accounts Found: {calculatedData.assetAccounts.length}
                        <br />• Liability Accounts Found: {calculatedData.liabilityAccounts.length} 
                        <br />• Equity Accounts Found: {calculatedData.equityAccounts.length}
                        <br />
                        {calculatedData.liabilityAccounts.length === 0 && calculatedData.equityAccounts.length === 0 && (
                            <span className="text-red-600">⚠️ No liability or equity accounts found. Please create accounts with codes starting with '2' (liabilities) and '3' (equity).</span>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Balance Sheet (IFRS Compliant)
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                        As of {format(calculationDate, 'PPP')} • {calculatedData.accountCount} accounts • {calculatedData.transactionCount} transactions
                    </p>
                    {calculatedData.balanceCheck ? (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-2 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-green-800 text-sm font-medium">
                                    ✅ Balance Sheet is balanced.
                                </p>
                                <p className="text-xs text-green-700">
                                    Assets = Liabilities + Equity (Variance: KES {Math.round(calculatedData.variance).toLocaleString()})
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mt-2 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-red-800 text-sm font-medium">
                                    ⚠️ Balance Sheet does not balance!
                                </p>
                                <p className="text-xs text-red-700">
                                    Variance: KES {Math.round(calculatedData.variance).toLocaleString()} 
                                    (Assets: {calculatedData.totalAssets.toLocaleString()} vs L+E: {calculatedData.totalLiabilitiesAndEquity.toLocaleString()})
                                </p>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                        
                        {/* ASSETS SECTION */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-blue-200 pb-2">
                                <Landmark className="w-4 h-4 text-blue-600" />
                                ASSETS
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                    <span className="font-semibold">Current Assets</span>
                                    <ClickableAmount 
                                        amount={calculatedData.currentAssets} 
                                        accountName="Current Assets"
                                        accountCodes={['10', '11']}
                                    />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                    <span className="font-semibold">Non-Current Assets</span>
                                    <ClickableAmount 
                                        amount={calculatedData.nonCurrentAssets} 
                                        accountName="Non-Current Assets"
                                        accountCodes={['12', '13', '14', '15']}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-800 text-lg">TOTAL ASSETS</span>
                                    <span className="text-blue-800 font-bold text-xl">
                                        KES {Math.round(calculatedData.totalAssets).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* LIABILITIES & EQUITY SECTION */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b-2 border-red-200 pb-2">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                LIABILITIES & EQUITY
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                                    <span className="font-semibold">Current Liabilities</span>
                                    <ClickableAmount 
                                        amount={calculatedData.currentLiabilities} 
                                        accountName="Current Liabilities"
                                        accountCodes={['20', '21']}
                                    />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                                    <span className="font-semibold">Non-Current Liabilities</span>
                                    <ClickableAmount 
                                        amount={calculatedData.nonCurrentLiabilities} 
                                        accountName="Non-Current Liabilities"
                                        accountCodes={['22', '23']}
                                    />
                                </div>
                                <div className="flex justify-between items-center font-bold text-red-800 border-t-2 border-red-300 pt-3 mt-3">
                                    <span>Total Liabilities</span>
                                    <span>KES {Math.round(calculatedData.totalLiabilities).toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-green-50 rounded mt-4">
                                    <span className="font-semibold">Total Equity</span>
                                    <ClickableAmount 
                                        amount={calculatedData.totalEquity} 
                                        accountName="Total Equity"
                                        accountCodes={['30', '31', '32']}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-100 p-4 rounded-lg border-2 border-slate-300 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-lg">TOTAL LIABILITIES & EQUITY</span>
                                    <span className="text-slate-800 font-bold text-xl">
                                        KES {Math.round(calculatedData.totalLiabilitiesAndEquity).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BalanceSheetDrillDown
                open={!!drillDownData}
                onClose={() => setDrillDownData(null)}
                title={drillDownData?.title || ''}
                amount={drillDownData?.amount || 0}
                accountCodes={drillDownData?.accountCodes}
                accounts={accounts}
                transactions={transactions}
                period={period}
            />
        </div>
    );
}
