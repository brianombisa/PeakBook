import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function GeneralLedger({ accounts = [], transactions = [], dateRange }) {
  const ledgerData = useMemo(() => {
    const filteredTransactions = dateRange
      ? transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        })
      : transactions;

    const ledger = {};

    accounts.forEach(acc => {
      ledger[acc.account_code] = {
        name: acc.account_name,
        type: acc.account_type,
        entries: [],
        balance: 0,
        normalBalance: acc.normal_balance || 'debit'
      };
    });

    filteredTransactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)).forEach(t => {
      t.journal_entries?.forEach(je => {
        if (ledger[je.account_code]) {
          const debit = Math.round(je.debit_amount || 0);
          const credit = Math.round(je.credit_amount || 0);

          let runningBalance;
          if(ledger[je.account_code].normalBalance === 'debit') {
              ledger[je.account_code].balance += (debit - credit);
          } else {
              ledger[je.account_code].balance += (credit - debit);
          }
          runningBalance = ledger[je.account_code].balance;

          ledger[je.account_code].entries.push({
            date: t.transaction_date,
            description: je.description || t.description,
            ref: t.reference_number,
            debit,
            credit,
            balance: Math.round(runningBalance)
          });
        }
      });
    });

    return Object.entries(ledger)
      .filter(([_, data]) => data.entries.length > 0)
      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
      .map(([code, data]) => ({ code, ...data }));

  }, [accounts, transactions, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  return (
    <div className="space-y-6">
       <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">General Ledger</h2>
        <p className="text-slate-600">
          Detailed transaction view for each account
          {dateRange && ` from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`}
        </p>
      </div>
      {ledgerData.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-slate-500">No ledger activity for the selected period.</CardContent></Card>
      ) : ledgerData.map(account => (
        <Card key={account.code}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{account.code} - {account.name}</span>
              <Badge variant="outline">{account.type}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Ref#</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.ref}</TableCell>
                    <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                    <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}