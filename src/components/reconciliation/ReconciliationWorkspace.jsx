import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Plus, ArrowRight, AlertCircle, Banknote, BookOpen, Scale } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ReconciliationWorkspace = ({ bankAccount, bankTransactions, peakBooksTransactions, onFinish }) => {
    const [matches, setMatches] = useState([]); // Array of { bankTxIndex, peakBooksTxId }
    const { toast } = useToast();

    const unmatchedBankTxs = useMemo(() => 
        bankTransactions.filter((_, index) => !matches.some(m => m.bankTxIndex === index)),
    [bankTransactions, matches]);

    const unmatchedPeakBooksTxs = useMemo(() => 
        peakBooksTransactions.filter(tx => !matches.some(m => m.peakBooksTxId === tx.id)),
    [peakBooksTransactions, matches]);

    const findSuggestions = (bankTx) => {
        const amount = parseFloat(bankTx.amount);
        return unmatchedPeakBooksTxs.filter(pbTx => 
            Math.abs(parseFloat(pbTx.total_amount) - amount) < 1 // Allow for small differences
        ).slice(0, 3); // Return top 3 suggestions
    };

    const handleMatch = (bankTxIndex, peakBooksTxId) => {
        setMatches([...matches, { bankTxIndex, peakBooksTxId }]);
        toast({
            title: "Matched!",
            description: "Transaction successfully matched.",
            className: "bg-green-100 border-green-300"
        });
    };
    
    // Summary calculations
    const reconciledBalance = matches.reduce((sum, match) => {
        const bankTx = bankTransactions[match.bankTxIndex];
        return sum + parseFloat(bankTx.amount);
    }, 0);
    const bankStatementBalance = bankTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const bookBalance = peakBooksTransactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount), 0);
    const difference = bankStatementBalance - reconciledBalance;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reconciliation Summary: {bankAccount.account_name}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">Bank Statement Balance</p>
                        <p className="text-2xl font-bold text-blue-900">KES {bankStatementBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">Reconciled Balance</p>
                        <p className="text-2xl font-bold text-green-900">KES {reconciledBalance.toLocaleString()}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${difference === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium ${difference === 0 ? 'text-green-800' : 'text-red-800'}`}>Difference</p>
                        <p className={`text-2xl font-bold ${difference === 0 ? 'text-green-900' : 'text-red-900'}`}>
                            KES {difference.toLocaleString()}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {unmatchedBankTxs.map((bankTx, index) => {
                const suggestions = findSuggestions(bankTx);
                return (
                    <Card key={index} className="border-l-4 border-blue-500">
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Banknote /> Bank Transaction</CardTitle>
                                <p className="font-bold text-xl mt-1">KES {parseFloat(bankTx.amount).toLocaleString()}</p>
                                <p className="text-sm text-gray-600">{bankTx.description}</p>
                                <p className="text-xs text-gray-500">Date: {new Date(bankTx.date).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline">Unmatched</Badge>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2">Matching Suggestions in PeakBooks:</h4>
                            {suggestions.length > 0 ? (
                                <ul className="space-y-2">
                                    {suggestions.map(pbTx => (
                                        <li key={pbTx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">KES {pbTx.total_amount.toLocaleString()}</p>
                                                <p className="text-sm text-gray-600">{pbTx.description}</p>
                                                <p className="text-xs text-gray-500">Date: {new Date(pbTx.transaction_date).toLocaleDateString()}</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleMatch(bankTransactions.findIndex(t => t.description === bankTx.description), pbTx.id)}>
                                                <Check className="w-4 h-4 mr-2" /> Match
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No strong matches found.</p>
                            )}
                            <div className="mt-4 border-t pt-4">
                                <Button variant="outline">
                                    <Plus className="w-4 h-4 mr-2" /> Create New Transaction in PeakBooks
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
            
            <div className="flex justify-end mt-8">
                <Button onClick={onFinish} size="lg">Finish Reconciliation</Button>
            </div>
        </div>
    );
};

export default ReconciliationWorkspace;