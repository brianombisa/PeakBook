
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Bot, Plus, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import DataService from '../components/services/DataService';
import ExpenseList from '../components/expenses/ExpenseList';
import AiExpenseCreator from '../components/expenses/AiExpenseCreator';
import ExpenseForm from '../components/expenses/ExpenseForm';
import TransactionService from '../components/services/TransactionService';
import { Expense } from '@/api/entities';
import AuditLogger from '../components/utils/AuditLogger';

export default function ExpensesPage() {
    const [data, setData] = useState({ expenses: [], suppliers: [], items: [], purchaseOrders: [], accounts: [] });
    const [view, setView] = useState('list'); // 'list', 'form'
    const [editingExpense, setEditingExpense] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiCreatorOpen, setIsAiCreatorOpen] = useState(false);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const expenseResult = await DataService.loadExpensePageData();
        const transactionResult = await DataService.loadTransactionData();

        if (expenseResult.success && transactionResult.success) {
            setData({
                expenses: expenseResult.expenses || [],
                suppliers: expenseResult.suppliers || [],
                items: expenseResult.items || [],
                purchaseOrders: expenseResult.purchaseOrders || [],
                accounts: transactionResult.accounts || []
            });
        } else {
            toast({ title: "Error", description: "Failed to load expense data.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBackToList = () => {
        setView('list');
        setEditingExpense(null);
        loadData();
    };

    const handleCreateNew = () => {
        setEditingExpense(null);
        setView('form');
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setView('form');
    };

    const handleDelete = async (expense) => {
        // You can implement a confirmation dialog here
        try {
            await Expense.delete(expense.id);
            toast({ title: "Success", description: "Expense deleted successfully." });
            await AuditLogger.logDelete('Expense', expense.id, expense.description);
            loadData();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({ title: "Error", description: "Failed to delete expense.", variant: "destructive" });
        }
    };
    
    const handleAiSuccess = (extractedData, receiptUrl) => {
        setEditingExpense({ ...extractedData, receipt_url: receiptUrl });
        setIsAiCreatorOpen(false);
        setView('form');
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="p-8 space-y-4">
                    <Skeleton className="h-24 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

        switch (view) {
            case 'form':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                         <div className="flex items-center gap-4 mb-6">
                            <Button variant="outline" size="icon" onClick={handleBackToList}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h2 className="text-2xl font-bold text-slate-700">
                                {editingExpense?.id ? 'Edit Expense' : 'Create New Expense'}
                            </h2>
                        </div>
                        <ExpenseForm
                            expense={editingExpense}
                            suppliers={data.suppliers}
                            accounts={data.accounts}
                            onCancel={handleBackToList}
                            onSuccess={handleBackToList}
                        />
                    </motion.div>
                );
            case 'list':
            default:
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-800">Spend Management</h1>
                                <p className="text-slate-600 mt-2">Track and categorize all your business expenses.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsAiCreatorOpen(true)} variant="outline">
                                    <Bot className="w-4 h-4 mr-2" /> Create with AI
                                </Button>
                                <Button onClick={handleCreateNew}>
                                    <Plus className="w-4 h-4 mr-2" /> New Expense
                                </Button>
                            </div>
                        </div>
                        <ExpenseList
                            expenses={data.expenses}
                            suppliers={data.suppliers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRefresh={loadData}
                        />
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
                {isAiCreatorOpen && (
                    <AiExpenseCreator
                        onSuccess={handleAiSuccess}
                        onClose={() => setIsAiCreatorOpen(false)}
                    />
                )}
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
                <div key={view}>
                    {renderContent()}
                </div>
            </AnimatePresence>
        </div>
    );
}
