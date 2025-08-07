import React, { useState, useEffect } from 'react';
import { Transaction } from '@/api/entities';
import { Customer } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

export default function CustomerStatementPage() {
    const [customer, setCustomer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('customerId');

        if (customerId) {
            const fetchData = async () => {
                setLoading(true);
                const [customerData, transactionData] = await Promise.all([
                    Customer.get(customerId),
                    Transaction.filter({ client_id: customerId }, '-transaction_date')
                ]);
                setCustomer(customerData);
                setTransactions(transactionData);
                setLoading(false);
            };
            fetchData();
        }
    }, []);

    const statementData = React.useMemo(() => {
        let balance = 0;
        const statementLines = transactions.map(t => {
            const isInvoice = t.transaction_type === 'sale';
            const isPayment = t.transaction_type === 'receipt';
            const amount = t.total_amount;
            
            balance += isInvoice ? amount : -amount;
            
            return {
                date: new Date(t.transaction_date).toLocaleDateString(),
                description: t.description,
                invoice: isInvoice ? Math.round(amount).toLocaleString() : '-',
                payment: isPayment ? Math.round(amount).toLocaleString() : '-',
                balance: Math.round(balance).toLocaleString()
            };
        });
        return { lines: statementLines.reverse(), finalBalance: balance };
    }, [transactions]);


    if (loading) {
        return <div className="p-8 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!customer) {
        return <div className="p-8 text-center">Customer not found.</div>;
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
                    </Button>
                     <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Customer Statement</CardTitle>
                        <CardDescription>
                            <p className="font-bold text-lg">{customer.customer_name}</p>
                            <p>{customer.address}</p>
                            <p>{customer.contact_email}</p>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Invoice</TableHead>
                                    <TableHead className="text-right">Payment</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.lines.map((line, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{line.date}</TableCell>
                                        <TableCell>{line.description}</TableCell>
                                        <TableCell className="text-right">{line.invoice}</TableCell>
                                        <TableCell className="text-right">{line.payment}</TableCell>
                                        <TableCell className="text-right font-medium">{line.balance}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-slate-100">
                                    <TableCell colSpan={4} className="text-right">Total Balance Due</TableCell>
                                    <TableCell className="text-right text-lg">KES {Math.round(statementData.finalBalance).toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}