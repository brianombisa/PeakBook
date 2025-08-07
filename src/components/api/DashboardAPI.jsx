import { User } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { Expense } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Customer } from '@/api/entities';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format } from 'date-fns';

class DashboardAPI {
    static async getDashboardData(period = 'ytd') {
        try {
            const user = await User.me();
            const userFilter = { created_by: user.email };

            // Set date range based on period
            const today = new Date();
            let dateRange;
            
            if (period === 'this_month') {
                dateRange = { start: startOfMonth(today), end: endOfMonth(today) };
            } else if (period === 'last_month') {
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                dateRange = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
            } else {
                dateRange = { start: startOfYear(today), end: today };
            }

            // Load all data
            const [invoices, expenses, transactions, customers] = await Promise.all([
                Invoice.filter(userFilter, "-invoice_date"),
                Expense.filter(userFilter, "-expense_date"),
                Transaction.filter(userFilter, "-transaction_date"),
                Customer.filter(userFilter)
            ]);

            // Calculate metrics
            const currentRevenue = invoices
                .filter(inv => (inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue') && 
                              isWithinInterval(new Date(inv.invoice_date), dateRange))
                .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

            const currentExpenses = expenses
                .filter(exp => isWithinInterval(new Date(exp.expense_date), dateRange))
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);

            const outstandingInvoices = invoices
                .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off')
                .reduce((sum, inv) => sum + (inv.balance_due || inv.total_amount || 0), 0);

            const overdueInvoices = invoices
                .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && 
                              inv.status !== 'written_off' && new Date(inv.due_date) < new Date())
                .reduce((sum, inv) => sum + (inv.balance_due || inv.total_amount || 0), 0);

            const profitBeforeTax = currentRevenue - currentExpenses;

            // Cash flow data for chart
            const cashFlowData = this.generateCashFlowData(transactions, invoices, expenses);

            // Recent transactions
            const recentTransactions = transactions
                .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                .slice(0, 10);

            // Top customers
            const topCustomers = customers.map(customer => ({
                ...customer,
                totalInvoiced: invoices
                    .filter(inv => inv.customer_id === customer.id)
                    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
            })).sort((a, b) => b.totalInvoiced - a.totalInvoiced).slice(0, 5);

            return {
                success: true,
                data: {
                    metrics: {
                        revenue: currentRevenue,
                        expenses: currentExpenses,
                        profit: profitBeforeTax,
                        outstanding: outstandingInvoices,
                        overdue: overdueInvoices
                    },
                    charts: {
                        cashFlow: cashFlowData,
                        expensesByCategory: this.getExpensesByCategory(expenses)
                    },
                    recent: {
                        transactions: recentTransactions,
                        invoices: invoices.slice(0, 5)
                    },
                    insights: {
                        topCustomers,
                        totalCustomers: customers.length,
                        totalInvoices: invoices.length,
                        overdueCount: invoices.filter(inv => 
                            inv.status !== 'paid' && inv.status !== 'cancelled' && 
                            inv.status !== 'written_off' && new Date(inv.due_date) < new Date()
                        ).length
                    }
                },
                meta: {
                    period,
                    dateRange: {
                        start: format(dateRange.start, 'yyyy-MM-dd'),
                        end: format(dateRange.end, 'yyyy-MM-dd')
                    },
                    currency: 'KES'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'DASHBOARD_ERROR'
            };
        }
    }

    static generateCashFlowData(transactions, invoices, expenses) {
        // Generate last 30 days of cash flow data
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            
            const dayIncome = invoices
                .filter(inv => inv.status === 'paid' && inv.invoice_date === dateStr)
                .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) +
                transactions
                .filter(t => t.transaction_type === 'receipt' && t.transaction_date === dateStr)
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);
            
            const dayExpenses = expenses
                .filter(exp => exp.expense_date === dateStr)
                .reduce((sum, exp) => sum + (exp.amount || 0), 0) +
                transactions
                .filter(t => t.transaction_type === 'expense' && t.transaction_date === dateStr)
                .reduce((sum, t) => sum + (t.total_amount || 0), 0);
            
            data.push({
                date: format(date, 'MMM dd'),
                income: dayIncome,
                expenses: dayExpenses,
                net: dayIncome - dayExpenses
            });
        }
        return data;
    }

    static getExpensesByCategory(expenses) {
        const categoryTotals = {};
        expenses.forEach(expense => {
            const category = expense.category || 'other';
            categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value
            }))
            .sort((a, b) => b.value - a.value);
    }
}

export default DashboardAPI;