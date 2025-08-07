import { Expense } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { User } from '@/api/entities';
import { Transaction } from '@/api/entities';
import AuditLogger from '../utils/AuditLogger';

class ExpenseAPI {
    static async getExpenses(filters = {}) {
        try {
            const user = await User.me();
            const userFilter = { created_by: user.email, ...filters };
            
            const expenses = await Expense.filter(userFilter, "-expense_date");
            
            return {
                success: true,
                data: expenses,
                meta: {
                    total: expenses.length,
                    currency: 'KES'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'FETCH_EXPENSES_ERROR'
            };
        }
    }

    static async getExpenseById(expenseId) {
        try {
            const user = await User.me();
            const expenses = await Expense.filter({ 
                id: expenseId, 
                created_by: user.email 
            });
            
            if (expenses.length === 0) {
                return {
                    success: false,
                    error: 'Expense not found',
                    code: 'EXPENSE_NOT_FOUND'
                };
            }

            return {
                success: true,
                data: expenses[0]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'FETCH_EXPENSE_ERROR'
            };
        }
    }

    static async createExpense(expenseData) {
        try {
            const user = await User.me();
            
            const savedExpense = await Expense.create({
                ...expenseData,
                currency: 'KES',
                status: expenseData.status || 'draft',
                created_by: user.email
            });

            // Create accounting transaction if approved
            if (savedExpense.status === 'approved') {
                await this.createExpenseTransaction(savedExpense, user);
            }

            await AuditLogger.logCreate('Expense', savedExpense);

            return {
                success: true,
                data: savedExpense,
                message: 'Expense created successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'CREATE_EXPENSE_ERROR'
            };
        }
    }

    static async updateExpense(expenseId, updateData) {
        try {
            const user = await User.me();
            
            const existingExpenses = await Expense.filter({ 
                id: expenseId, 
                created_by: user.email 
            });
            
            if (existingExpenses.length === 0) {
                return {
                    success: false,
                    error: 'Expense not found',
                    code: 'EXPENSE_NOT_FOUND'
                };
            }

            const oldExpense = existingExpenses[0];
            const updatedExpense = await Expense.update(expenseId, updateData);

            // Create transaction if status changed to approved
            if (updateData.status === 'approved' && oldExpense.status !== 'approved') {
                await this.createExpenseTransaction(updatedExpense, user);
            }

            await AuditLogger.logUpdate('Expense', expenseId, oldExpense, updatedExpense, updatedExpense.description);

            return {
                success: true,
                data: updatedExpense,
                message: 'Expense updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'UPDATE_EXPENSE_ERROR'
            };
        }
    }

    static async deleteExpense(expenseId) {
        try {
            const user = await User.me();
            
            const expenses = await Expense.filter({ 
                id: expenseId, 
                created_by: user.email 
            });
            
            if (expenses.length === 0) {
                return {
                    success: false,
                    error: 'Expense not found',
                    code: 'EXPENSE_NOT_FOUND'
                };
            }

            await AuditLogger.logDelete('Expense', expenseId, expenses[0].description);
            await Expense.delete(expenseId);

            return {
                success: true,
                message: 'Expense deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'DELETE_EXPENSE_ERROR'
            };
        }
    }

    static async getExpenseStats() {
        try {
            const user = await User.me();
            const expenses = await Expense.filter({ created_by: user.email });
            
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const thisMonthExpenses = expenses.filter(exp => {
                const expDate = new Date(exp.expense_date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            });

            const categoryBreakdown = {};
            expenses.forEach(exp => {
                const category = exp.category || 'other';
                categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (exp.amount || 0);
            });

            const stats = {
                total_expenses: expenses.length,
                draft_expenses: expenses.filter(exp => exp.status === 'draft').length,
                approved_expenses: expenses.filter(exp => exp.status === 'approved').length,
                paid_expenses: expenses.filter(exp => exp.status === 'paid').length,
                total_amount: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
                this_month_amount: thisMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
                category_breakdown: categoryBreakdown
            };

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'GET_STATS_ERROR'
            };
        }
    }

    static async createExpenseTransaction(expense, user) {
        try {
            await Transaction.create({
                transaction_date: expense.expense_date,
                reference_number: `EXP-${expense.id}`,
                description: `${expense.description} - ${expense.vendor_name}`,
                total_amount: expense.amount,
                currency: expense.currency || 'KES',
                transaction_type: 'expense',
                journal_entries: [
                    {
                        account_code: expense.account_code || "5100",
                        account_name: "Expense Account",
                        debit_amount: expense.amount,
                        credit_amount: 0,
                        description: expense.description
                    },
                    {
                        account_code: "1000",
                        account_name: "Cash",
                        debit_amount: 0,
                        credit_amount: expense.amount,
                        description: `Payment to ${expense.vendor_name}`
                    }
                ],
                status: 'posted',
                created_by: user.email
            });
        } catch (error) {
            console.error('Error creating expense transaction:', error);
        }
    }
}

export default ExpenseAPI;