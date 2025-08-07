/**
 * IFRS-Compliant Chart of Accounts Service
 * This is the single source of truth for all financial calculations
 */
import { format, startOfDay, endOfDay } from 'date-fns';

class ChartOfAccountsService {
    /**
     * IFRS Standard Chart of Accounts Structure
     */
    static getStandardAccountStructure() {
        return {
            // ASSETS (1000-1999)
            assets: {
                current_assets: ['1000-1199'],
                non_current_assets: ['1200-1999']
            },
            // LIABILITIES (2000-2999)
            liabilities: {
                current_liabilities: ['2000-2199'],
                non_current_liabilities: ['2200-2999']
            },
            // EQUITY (3000-3999)
            equity: {
                share_capital: ['3000-3199'],
                retained_earnings: ['3200-3299'],
                other_equity: ['3300-3999']
            },
            // REVENUE (4000-4999)
            revenue: {
                operating_revenue: ['4000-4799'],
                other_income: ['4800-4999']
            },
            // EXPENSES (5000-9999)
            expenses: {
                cost_of_sales: ['5000-5999'],
                operating_expenses: ['6000-7999'],
                finance_costs: ['8000-8999'],
                tax_expense: ['9000-9999']
            }
        };
    }

    /**
     * Calculate account balances as of a specific date
     */
    static getAccountBalances(accounts, transactions, asOfDate = new Date()) {
        const balances = new Map();
        
        // Initialize all accounts with zero balance
        accounts.forEach(acc => {
            balances.set(acc.account_code, {
                balance: 0,
                debitTotal: 0,
                creditTotal: 0,
                account: acc
            });
        });

        // Filter transactions up to the specified date
        const relevantTransactions = transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            return txDate <= endOfDay(asOfDate) && t.status === 'posted';
        });

        // Process each journal entry
        for (const transaction of relevantTransactions) {
            if (!transaction.journal_entries) continue;
            
            for (const entry of transaction.journal_entries) {
                const accountCode = entry.account_code;
                if (!balances.has(accountCode)) continue;

                const current = balances.get(accountCode);
                const debit = parseFloat(entry.debit_amount) || 0;
                const credit = parseFloat(entry.credit_amount) || 0;

                current.debitTotal += debit;
                current.creditTotal += credit;
                current.balance += (debit - credit);
            }
        }

        return balances;
    }

    /**
     * Generate Balance Sheet data following IFRS structure
     */
    static generateBalanceSheetData(accounts, balances) {
        // ASSETS
        const currentAssets = this.calculateAccountTypeTotal(accounts, balances, ['1000', '1199']);
        const nonCurrentAssets = this.calculateAccountTypeTotal(accounts, balances, ['1200', '1999']);
        const totalAssets = currentAssets + nonCurrentAssets;

        // LIABILITIES
        const currentLiabilities = this.calculateAccountTypeTotal(accounts, balances, ['2000', '2199']);
        const nonCurrentLiabilities = this.calculateAccountTypeTotal(accounts, balances, ['2200', '2999']);
        const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

        // EQUITY
        const shareCapital = this.calculateAccountTypeTotal(accounts, balances, ['3000', '3199']);
        const retainedEarnings = this.calculateAccountTypeTotal(accounts, balances, ['3200', '3299']);
        const otherEquity = this.calculateAccountTypeTotal(accounts, balances, ['3300', '3999']);
        const totalEquity = shareCapital + retainedEarnings + otherEquity;

        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
        const balanceCheck = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

        return {
            currentAssets,
            nonCurrentAssets,
            totalAssets,
            currentLiabilities,
            nonCurrentLiabilities,
            totalLiabilities,
            shareCapital,
            retainedEarnings,
            otherEquity,
            totalEquity,
            totalLiabilitiesAndEquity,
            balanceCheck,
            variance: totalAssets - totalLiabilitiesAndEquity
        };
    }

    /**
     * Generate Profit & Loss data following IFRS structure
     */
    static generateProfitLossData(transactions, invoices, startDate, endDate) {
        // Revenue from paid invoices (matching dashboard logic)
        const revenue = invoices
            .filter(inv => {
                const invoiceDate = new Date(inv.invoice_date);
                return invoiceDate >= startDate && 
                       invoiceDate <= endDate && 
                       (inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue');
            })
            .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        // Expenses from transactions
        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            return txDate >= startDate && txDate <= endDate && t.status === 'posted';
        });

        let costOfSales = 0;
        let operatingExpenses = 0;
        let financeCosts = 0;
        let otherIncome = 0;

        filteredTransactions.forEach(transaction => {
            if (!transaction.journal_entries) return;
            
            transaction.journal_entries.forEach(entry => {
                const code = entry.account_code || '';
                const debit = parseFloat(entry.debit_amount) || 0;
                const credit = parseFloat(entry.credit_amount) || 0;
                
                if (code.startsWith('5')) {
                    costOfSales += (debit - credit);
                } else if (code.startsWith('6') || code.startsWith('7')) {
                    operatingExpenses += (debit - credit);
                } else if (code.startsWith('8')) {
                    financeCosts += (debit - credit);
                } else if (code.startsWith('48') || code.startsWith('49')) {
                    otherIncome += (credit - debit);
                }
            });
        });

        const grossProfit = revenue - costOfSales;
        const operatingProfit = grossProfit - operatingExpenses;
        const profitBeforeTax = operatingProfit + otherIncome - financeCosts;
        const netProfit = profitBeforeTax; // Simplified, no tax calculation

        return {
            revenue,
            costOfSales,
            grossProfit,
            operatingExpenses,
            operatingProfit,
            otherIncome,
            financeCosts,
            profitBeforeTax,
            netProfit,
            grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
            netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
        };
    }

    /**
     * Generate Trial Balance data
     */
    static generateTrialBalanceData(accounts, balances) {
        let totalDebits = 0;
        let totalCredits = 0;

        const trialBalanceRows = accounts
            .filter(account => {
                const balance = balances.get(account.account_code);
                return balance && (balance.debitTotal > 0 || balance.creditTotal > 0);
            })
            .map(account => {
                const balanceData = balances.get(account.account_code);
                const balance = balanceData.balance;
                
                let debitBalance = 0;
                let creditBalance = 0;

                // Determine normal balance presentation
                if (account.normal_balance === 'debit') {
                    debitBalance = balance >= 0 ? balance : 0;
                    creditBalance = balance < 0 ? Math.abs(balance) : 0;
                } else {
                    creditBalance = balance <= 0 ? Math.abs(balance) : 0;
                    debitBalance = balance > 0 ? balance : 0;
                }

                totalDebits += debitBalance;
                totalCredits += creditBalance;

                return {
                    accountCode: account.account_code,
                    accountName: account.account_name,
                    debitBalance,
                    creditBalance,
                    accountType: account.account_type
                };
            })
            .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        return {
            rows: trialBalanceRows,
            totalDebits,
            totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
            variance: totalDebits - totalCredits
        };
    }

    /**
     * Calculate total for accounts within a range
     */
    static calculateAccountTypeTotal(accounts, balances, [startCode, endCode]) {
        return accounts
            .filter(acc => acc.account_code >= startCode && acc.account_code <= endCode)
            .reduce((total, acc) => {
                const balanceData = balances.get(acc.account_code);
                return total + (balanceData ? balanceData.balance : 0);
            }, 0);
    }

    /**
     * Generate General Ledger data for a specific account
     */
    static generateGeneralLedgerData(accountCode, transactions, startDate, endDate) {
        const relevantTransactions = transactions
            .filter(t => {
                const txDate = new Date(t.transaction_date);
                return txDate >= startDate && 
                       txDate <= endDate && 
                       t.status === 'posted' &&
                       t.journal_entries.some(je => je.account_code === accountCode);
            })
            .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        let runningBalance = 0;
        const ledgerEntries = [];

        relevantTransactions.forEach(transaction => {
            const relevantEntries = transaction.journal_entries.filter(je => je.account_code === accountCode);
            
            relevantEntries.forEach(entry => {
                const debit = parseFloat(entry.debit_amount) || 0;
                const credit = parseFloat(entry.credit_amount) || 0;
                runningBalance += (debit - credit);

                ledgerEntries.push({
                    date: transaction.transaction_date,
                    reference: transaction.reference_number,
                    description: entry.description || transaction.description,
                    debit,
                    credit,
                    balance: runningBalance
                });
            });
        });

        return ledgerEntries;
    }

    /**
     * Calculate key financial ratios
     */
    static calculateFinancialRatios(balanceSheetData, profitLossData) {
        const {
            currentAssets,
            currentLiabilities,
            totalAssets,
            totalLiabilities,
            totalEquity
        } = balanceSheetData;

        const {
            revenue,
            grossProfit,
            netProfit
        } = profitLossData;

        return {
            // Liquidity Ratios
            currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
            
            // Profitability Ratios
            grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
            netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
            returnOnAssets: totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0,
            returnOnEquity: totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0,
            
            // Leverage Ratios
            debtToAssets: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
            debtToEquity: totalEquity > 0 ? (totalLiabilities / totalEquity) * 100 : 0,
            equityRatio: totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0
        };
    }
}

export default ChartOfAccountsService;