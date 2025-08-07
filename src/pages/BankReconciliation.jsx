import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatementUploader from '../components/reconciliation/StatementUploader';
import ReconciliationWorkspace from '../components/reconciliation/ReconciliationWorkspace';
import { BankAccount } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Landmark, UploadCloud, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BankReconciliationPage() {
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [peakBooksTransactions, setPeakBooksTransactions] = useState([]);
    const [bankStatementTransactions, setBankStatementTransactions] = useState([]);
    const [view, setView] = useState('select_account'); // select_account, workspace
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const accounts = await BankAccount.list();
                const transactions = await Transaction.filter({ status: 'posted' });
                setBankAccounts(accounts);
                setPeakBooksTransactions(transactions);
            } catch (error) {
                toast({ title: 'Error', description: 'Could not load accounts or transactions.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [toast]);

    const handleStatementUpload = (statementData) => {
        setBankStatementTransactions(statementData);
        setView('workspace');
        toast({ title: 'Success', description: `Successfully imported ${statementData.length} bank transactions.` });
    };

    const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-12">Loading Bank Accounts...</div>;
        }

        if (view === 'select_account') {
            return (
                <Card className="max-w-2xl mx-auto mt-12">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Landmark /> Select Account to Reconcile</CardTitle>
                        <CardDescription>Choose a bank account and upload its statement to begin reconciliation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {bankAccounts.length > 0 ? (
                            <>
                                <Select onValueChange={setSelectedAccountId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a bank account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.account_name} ({acc.bank_name} - {acc.account_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedAccountId && (
                                    <StatementUploader onUpload={handleStatementUpload} />
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500 border rounded-lg">
                                <AlertCircle className="mx-auto w-10 h-10 mb-2 text-yellow-500" />
                                <p className="font-semibold">No Bank Accounts Found</p>
                                <p className="text-sm">Please add a bank account in Settings to start reconciliation.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        }

        if (view === 'workspace') {
            return (
                <ReconciliationWorkspace
                    bankAccount={selectedAccount}
                    bankTransactions={bankStatementTransactions}
                    peakBooksTransactions={peakBooksTransactions}
                    onFinish={() => setView('select_account')}
                />
            );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-800">Bank Reconciliation</h1>
                    <p className="text-slate-600 mt-2">Match your bank transactions with your books to ensure perfect accuracy.</p>
                </header>
                {renderContent()}
            </div>
        </div>
    );
}