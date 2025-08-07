import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AccountSummary({ accounts = [], transactions = [], dateRange }) {
  const accountSummaryData = useMemo(() => {
    const filteredTransactions = dateRange 
      ? transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
        })
      : transactions;

    // Initialize account balances
    const accountBalances = {};
    accounts.forEach(acc => {
      accountBalances[acc.account_code] = {
        name: acc.account_name,
        type: acc.account_type,
        openingBalance: 0,
        totalDebits: 0,
        totalCredits: 0,
        closingBalance: 0,
        normalBalance: acc.normal_balance || 'debit'
      };
    });

    // Process transactions
    filteredTransactions.forEach(transaction => {
      if (!transaction.journal_entries) return;

      transaction.journal_entries.forEach(entry => {
        const accountCode = entry.account_code;
        if (accountBalances[accountCode]) {
          const debitAmount = Math.round(entry.debit_amount || 0);
          const creditAmount = Math.round(entry.credit_amount || 0);

          accountBalances[accountCode].totalDebits += debitAmount;
          accountBalances[accountCode].totalCredits += creditAmount;

          // Calculate closing balance based on normal balance
          if (accountBalances[accountCode].normalBalance === 'debit') {
            accountBalances[accountCode].closingBalance += debitAmount - creditAmount;
          } else {
            accountBalances[accountCode].closingBalance += creditAmount - debitAmount;
          }
        }
      });
    });

    // Convert to array and filter out zero balances
    const summaryData = Object.entries(accountBalances)
      .map(([code, data]) => ({ 
        code, 
        ...data,
        closingBalance: Math.round(data.closingBalance),
        totalDebits: Math.round(data.totalDebits),
        totalCredits: Math.round(data.totalCredits)
      }))
      .filter(account => account.totalDebits !== 0 || account.totalCredits !== 0 || account.closingBalance !== 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    return summaryData;
  }, [accounts, transactions, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  // Group by account type
  const groupedAccounts = accountSummaryData.reduce((groups, account) => {
    const type = account.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Account Summary</h2>
        <p className="text-slate-600">
          Summary of all accounts with activity
          {dateRange && ` from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`}
        </p>
      </div>

      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="capitalize">{type.replace('_', ' ')} Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Total Debits</TableHead>
                  <TableHead className="text-right">Total Credits</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.totalDebits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.totalCredits)}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      account.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(account.closingBalance)}
                    </TableCell>
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