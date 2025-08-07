
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';

const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'this_month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'last_month':
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
        case 'this_quarter':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
        case 'last_quarter':
            startDate = startOfQuarter(subQuarters(now, 1));
            endDate = endOfQuarter(subQuarters(now, 1));
            break;
        case 'this_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        case 'last_year':
            startDate = startOfYear(subYears(now, 1));
            endDate = endOfYear(subYears(now, 1));
            break;
        default: // all_time
            startDate = new Date(2020, 0, 1); // A reasonable arbitrary start date for "all time"
            endDate = now;
            break;
    }
    
    return { start: startDate, end: endDate };
};


export default function CashFlowStatement({ data = {}, period = 'this_year' }) {
    const { transactions = [] } = data;
    const dateRange = getDateRangeFromPeriod(period);

    const cashFlowData = useMemo(() => {
        if (!transactions) { // transactions can be an empty array, but not null/undefined
            return {
                operations: { items: [], total: 0 },
                investing: { items: [], total: 0 },
                financing: { items: [], total: 0 },
                netChange: 0,
                startCash: 0,
                endCash: 0
            };
        }

        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            return txDate >= dateRange.start && txDate <= dateRange.end;
        });

        // Simplified logic: Categorize transactions based on type
        let ops = 0, inv = 0, fin = 0;
        const opsItems = [], invItems = [], finItems = [];

        for (const transaction of filteredTransactions) {
            // This is a simplified model. A true IFRS cash flow requires analyzing changes in balance sheet accounts.
            // For now, we'll categorize based on transaction type for a direct-method-like report.
            
            // Assuming cash transactions hit a cash account (10xx)
            const cashMovement = transaction.journal_entries.reduce((acc, entry) => {
                if (entry.account_code.startsWith('10')) { // Cash accounts
                    return acc + (entry.debit_amount || 0) - (entry.credit_amount || 0);
                }
                return acc;
            }, 0);

            if(cashMovement === 0) continue;

            const description = transaction.description;

            if (['sale', 'expense', 'receipt', 'payment'].includes(transaction.transaction_type)) {
                ops += cashMovement;
                opsItems.push({ name: description, amount: cashMovement });
            } else if (transaction.description.toLowerCase().includes('asset purchase') || transaction.description.toLowerCase().includes('asset sale')) {
                inv += cashMovement;
                invItems.push({ name: description, amount: cashMovement });
            } else if (transaction.description.toLowerCase().includes('loan') || transaction.description.toLowerCase().includes('equity')) {
                fin += cashMovement;
                finItems.push({ name: description, amount: cashMovement });
            } else {
                 // Default to operations for adjustments etc.
                 ops += cashMovement;
                 opsItems.push({ name: description, amount: cashMovement });
            }
        }

        // For start and end cash, a full balance sheet calculation is needed
        // This is a placeholder/simplification
        const startCash = 0; 
        const endCash = startCash + ops + inv + fin;

        return {
            operations: { items: opsItems, total: ops },
            investing: { items: invItems, total: inv },
            financing: { items: finItems, total: fin },
            netChange: ops + inv + fin,
            startCash,
            endCash
        };

    }, [transactions, dateRange]);

    const renderSection = (title, data) => (
        <div className="mb-4">
            <h4 className="font-semibold text-slate-700 mb-2">{title}</h4>
            <div className="pl-4 border-l-2 border-slate-300">
                {data.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-1.5 text-slate-600">
                        <span>{item.name}</span>
                        <span>{Math.round(item.amount).toLocaleString()}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between font-bold py-2 border-t mt-2 text-slate-800">
                <span>Total from {title}</span>
                <span>{Math.round(data.total).toLocaleString()}</span>
            </div>
        </div>
    );

    return (
        <Card className="shadow-none border-0">
            <CardHeader>
                <CardTitle className="text-xl">Cash Flow Statement</CardTitle>
                 <p className="text-sm text-slate-500">
                    For the period of {dateRange ? `${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`: 'all time'}
                </p>
            </CardHeader>
            <CardContent>
                {renderSection("Cash Flow from Operations", cashFlowData.operations)}
                {renderSection("Cash Flow from Investing", cashFlowData.investing)}
                {renderSection("Cash Flow from Financing", cashFlowData.financing)}
                
                <div className="flex justify-between font-extrabold text-lg py-3 border-y-2 border-slate-800 my-4">
                    <span>Net Change in Cash</span>
                    <span>{Math.round(cashFlowData.netChange).toLocaleString()}</span>
                </div>

                 <div className="space-y-2 text-slate-700">
                     <div className="flex justify-between">
                        <span>Cash at beginning of period</span>
                        <span>{Math.round(cashFlowData.startCash).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Cash at end of period</span>
                        <span>{Math.round(cashFlowData.endCash).toLocaleString()}</span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}
