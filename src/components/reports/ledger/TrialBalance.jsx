import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isBefore, isEqual } from 'date-fns';

export default function TrialBalance({ accounts, transactions, asOfDate }) {
    if (!accounts || !transactions) return null;

    const calculateAsOfBalance = (account) => {
        const historicalTransactions = transactions.filter(t => 
            isBefore(new Date(t.transaction_date), asOfDate) || isEqual(new Date(t.transaction_date), asOfDate)
        );

        const balance = historicalTransactions
            .flatMap(t => t.journal_entries)
            .filter(entry => entry.account_code === account.account_code)
            .reduce((sum, entry) => sum + (entry.debit_amount - entry.credit_amount), 0);
            
        return balance;
    };

    let totalDebits = 0;
    let totalCredits = 0;

    const balances = accounts.map(acc => {
        const balance = calculateAsOfBalance(acc);
        if (balance > 0) totalDebits += balance;
        if (balance < 0) totalCredits += Math.abs(balance);
        return { ...acc, balance };
    }).filter(acc => acc.balance !== 0);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit (KES)</TableHead>
                    <TableHead className="text-right">Credit (KES)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {balances.map(acc => (
                    <TableRow key={acc.id}>
                        <TableCell>{acc.account_name}</TableCell>
                        <TableCell className="text-right">{acc.balance > 0 ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                        <TableCell className="text-right">{acc.balance < 0 ? Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <TableRow className="font-bold bg-slate-200 text-lg">
                <TableCell>Totals</TableCell>
                <TableCell className="text-right">{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>
        </Table>
    );
}