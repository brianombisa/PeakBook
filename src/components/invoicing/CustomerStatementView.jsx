import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Transaction } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { CompanyProfile } from '@/api/entities';
import { User } from '@/api/entities';
import { FileText, Download, Mail, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

export default function CustomerStatementView({ customer, open, onClose }) {
    const [dateRange, setDateRange] = useState({
        start_date: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Start of year
        end_date: format(new Date(), 'yyyy-MM-dd') // Today
    });
    const [statementData, setStatementData] = useState(null);
    const [companyProfile, setCompanyProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open && customer) {
            loadCompanyProfile();
        }
    }, [open, customer]);

    const loadCompanyProfile = async () => {
        try {
            const user = await User.me();
            const profiles = await CompanyProfile.filter({ created_by: user.email });
            if (profiles.length > 0) {
                setCompanyProfile(profiles[0]);
            }
        } catch (error) {
            console.error("Error loading company profile:", error);
        }
    };

    const generateStatement = async () => {
        if (!customer || !dateRange.start_date || !dateRange.end_date) {
            toast({ title: "Error", description: "Please select a valid date range.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            // Get all transactions related to this customer within the date range
            const allTransactions = await Transaction.list('-transaction_date');
            const customerTransactions = allTransactions.filter(t => 
                t.client_id === customer.id &&
                t.transaction_date >= dateRange.start_date &&
                t.transaction_date <= dateRange.end_date
            );

            // Get all invoices for this customer to get invoice numbers and details
            const allInvoices = await Invoice.list();
            const customerInvoices = allInvoices.filter(inv => 
                inv.customer_id === customer.id &&
                inv.invoice_date >= dateRange.start_date &&
                inv.invoice_date <= dateRange.end_date
            );

            // Calculate opening balance (transactions before the start date)
            const openingTransactions = allTransactions.filter(t => 
                t.client_id === customer.id &&
                t.transaction_date < dateRange.start_date
            );

            let openingBalance = 0;
            openingTransactions.forEach(t => {
                if (t.transaction_type === 'sale') openingBalance += t.total_amount;
                if (t.transaction_type === 'receipt') openingBalance -= t.total_amount;
            });

            // Process transactions for the statement period
            const statementEntries = [];
            let runningBalance = openingBalance;

            // Combine and sort all relevant transactions and invoices by date
            const allEntries = [
                ...customerTransactions.map(t => ({
                    date: t.transaction_date,
                    type: 'transaction',
                    data: t
                })),
                ...customerInvoices.map(inv => ({
                    date: inv.invoice_date,
                    type: 'invoice',
                    data: inv
                }))
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            // Process entries to build statement
            allEntries.forEach(entry => {
                if (entry.type === 'transaction') {
                    const t = entry.data;
                    let debit = 0, credit = 0, description = '';

                    if (t.transaction_type === 'sale') {
                        debit = t.total_amount;
                        runningBalance += debit;
                        description = `Invoice ${t.reference_number || 'N/A'} - ${t.description}`;
                    } else if (t.transaction_type === 'receipt') {
                        credit = t.total_amount;
                        runningBalance -= credit;
                        description = `Payment received - ${t.description}`;
                    }

                    if (debit > 0 || credit > 0) {
                        statementEntries.push({
                            date: t.transaction_date,
                            reference: t.reference_number,
                            description,
                            debit,
                            credit,
                            balance: runningBalance
                        });
                    }
                } else if (entry.type === 'invoice') {
                    // We've already captured this through the sale transaction
                    // but we can add additional invoice-specific details if needed
                }
            });

            setStatementData({
                customer,
                dateRange,
                openingBalance,
                closingBalance: runningBalance,
                entries: statementEntries,
                totalDebits: statementEntries.reduce((sum, e) => sum + e.debit, 0),
                totalCredits: statementEntries.reduce((sum, e) => sum + e.credit, 0)
            });

        } catch (error) {
            console.error("Error generating statement:", error);
            toast({ title: "Error", description: "Could not generate statement.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('statement-content');
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Statement of Account - ${customer?.customer_name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Statement of Account - {customer?.customer_name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Date Range Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Select Period</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <Label>From Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRange.start_date}
                                        onChange={(e) => setDateRange(prev => ({...prev, start_date: e.target.value}))}
                                    />
                                </div>
                                <div>
                                    <Label>To Date</Label>
                                    <Input
                                        type="date"
                                        value={dateRange.end_date}
                                        onChange={(e) => setDateRange(prev => ({...prev, end_date: e.target.value}))}
                                    />
                                </div>
                                <Button onClick={generateStatement} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                    {isLoading ? 'Generating...' : 'Generate Statement'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statement Content */}
                    {statementData && (
                        <>
                            <div className="flex justify-end gap-2 mb-4">
                                <Button onClick={handlePrint} variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Print Statement
                                </Button>
                            </div>

                            <div id="statement-content" className="bg-white p-8 rounded-lg border">
                                {/* Header */}
                                <div className="header mb-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-800">{companyProfile?.company_name || 'Your Company'}</h1>
                                            <p className="text-gray-600">{companyProfile?.address}</p>
                                            <p className="text-gray-600">{companyProfile?.phone} | {companyProfile?.email}</p>
                                            {companyProfile?.kra_pin && <p className="text-gray-600">PIN: {companyProfile.kra_pin}</p>}
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-xl font-semibold text-gray-800">STATEMENT OF ACCOUNT</h2>
                                            <p className="text-gray-600">Generated: {format(new Date(), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3>
                                        <p><strong>Name:</strong> {statementData.customer.customer_name}</p>
                                        <p><strong>Email:</strong> {statementData.customer.contact_email}</p>
                                        {statementData.customer.phone_number && <p><strong>Phone:</strong> {statementData.customer.phone_number}</p>}
                                        <p><strong>Statement Period:</strong> {format(parseISO(dateRange.start_date), 'dd/MM/yyyy')} to {format(parseISO(dateRange.end_date), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="summary grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Opening Balance</p>
                                        <p className="text-lg font-semibold">KES {statementData.openingBalance.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Total Charges</p>
                                        <p className="text-lg font-semibold text-red-600">KES {statementData.totalDebits.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Total Payments</p>
                                        <p className="text-lg font-semibold text-green-600">KES {statementData.totalCredits.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Closing Balance</p>
                                        <p className="text-lg font-bold">KES {statementData.closingBalance.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Reference</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Charges (KES)</TableHead>
                                                <TableHead className="text-right">Payments (KES)</TableHead>
                                                <TableHead className="text-right">Balance (KES)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Opening Balance Row */}
                                            <TableRow className="bg-gray-50">
                                                <TableCell>{format(parseISO(dateRange.start_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell className="font-medium">Opening Balance</TableCell>
                                                <TableCell className="text-right">-</TableCell>
                                                <TableCell className="text-right">-</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {statementData.openingBalance.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {statementData.entries.map((entry, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{format(parseISO(entry.date), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell>{entry.reference || '-'}</TableCell>
                                                    <TableCell>{entry.description}</TableCell>
                                                    <TableCell className="text-right">
                                                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {entry.balance.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            This statement is computer generated and does not require a signature.
                                        </p>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                Amount Due: KES {Math.max(0, statementData.closingBalance).toLocaleString()}
                                            </p>
                                            {statementData.closingBalance > 0 && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    Please settle your outstanding balance at your earliest convenience.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}