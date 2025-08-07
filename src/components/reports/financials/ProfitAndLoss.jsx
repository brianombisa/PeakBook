import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears, subQuarters } from 'date-fns';
import ChartOfAccountsService from '../../services/ChartOfAccountsService';

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
      startDate = new Date(2020, 0, 1);
      endDate = now;
      break;
  }
  
  return { startDate, endDate };
};

export default function ProfitAndLoss({ transactions = [], invoices = [], period = 'this_year', isLoading }) {
  
  const pnlData = useMemo(() => {
    if (!transactions || !invoices) {
      return { hasData: false, message: 'No transaction or invoice data available.' };
    }

    const { startDate, endDate } = getDateRangeFromPeriod(period);
    
    const data = ChartOfAccountsService.generateProfitLossData(
      transactions, 
      invoices, 
      startDate, 
      endDate
    );

    return {
      ...data,
      hasData: data.revenue > 0 || data.costOfSales > 0 || data.operatingExpenses > 0,
      startDate,
      endDate
    };
  }, [transactions, invoices, period]);

  const formatCurrency = (value) => {
    const absValue = Math.abs(value || 0);
    const result = `KES ${absValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return value < 0 ? `(${result})` : result;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profit and Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading financial data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pnlData.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profit and Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No financial data available</p>
            <p className="text-sm">No transactions or invoices found for the selected period</p>
            <p className="text-xs mt-2">Period: {pnlData.startDate?.toLocaleDateString()} to {pnlData.endDate?.toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    revenue, 
    costOfSales, 
    grossProfit, 
    operatingExpenses, 
    operatingProfit, 
    otherIncome, 
    financeCosts, 
    profitBeforeTax, 
    netProfit,
    grossMargin,
    netMargin
  } = pnlData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Profit and Loss Statement (IFRS Compliant)
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>For the period: {pnlData.startDate.toLocaleDateString()} to {pnlData.endDate.toLocaleDateString()}</p>
          <p className="text-xs text-blue-600 mt-1">Revenue from invoices • Expenses from journal entries</p>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {/* REVENUE SECTION */}
            <TableRow className="font-bold text-lg bg-blue-50 border-t-2 border-blue-200">
              <TableCell className="font-bold">REVENUE</TableCell>
              <TableCell className="text-right font-bold text-blue-700">{formatCurrency(revenue)}</TableCell>
            </TableRow>
            
            {/* COST OF SALES */}
            <TableRow>
              <TableCell className="pl-8">Cost of Sales</TableCell>
              <TableCell className="text-right text-red-600">{formatCurrency(-costOfSales)}</TableCell>
            </TableRow>

            {/* GROSS PROFIT */}
            <TableRow className="font-bold text-lg bg-green-50 border-y-2 border-green-200">
              <TableCell className="font-bold">GROSS PROFIT</TableCell>
              <TableCell className="text-right font-bold text-green-700">
                {formatCurrency(grossProfit)}
                <span className="text-xs text-gray-500 ml-2">({grossMargin.toFixed(1)}%)</span>
              </TableCell>
            </TableRow>

            {/* SPACER */}
            <TableRow><TableCell className="h-4" colSpan={2}></TableCell></TableRow>

            {/* OPERATING EXPENSES */}
            <TableRow>
              <TableCell className="font-semibold">Operating Expenses</TableCell>
              <TableCell className="text-right text-red-600">{formatCurrency(-operatingExpenses)}</TableCell>
            </TableRow>

            {/* OPERATING PROFIT */}
            <TableRow className="font-bold text-lg bg-yellow-50 border-y-2 border-yellow-200">
              <TableCell className="font-bold">OPERATING PROFIT</TableCell>
              <TableCell className="text-right font-bold text-yellow-700">{formatCurrency(operatingProfit)}</TableCell>
            </TableRow>
            
            {/* SPACER */}
            <TableRow><TableCell className="h-4" colSpan={2}></TableCell></TableRow>
            
            {/* OTHER INCOME & FINANCE COSTS */}
            {otherIncome !== 0 && (
              <TableRow>
                <TableCell className="pl-8">Other Income</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(otherIncome)}</TableCell>
              </TableRow>
            )}
            
            {financeCosts !== 0 && (
              <TableRow>
                <TableCell className="pl-8">Finance Costs</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(-financeCosts)}</TableCell>
              </TableRow>
            )}

            {/* PROFIT BEFORE TAX */}
            <TableRow className="font-bold bg-purple-50 border-y border-purple-200">
              <TableCell className="font-bold">PROFIT BEFORE TAX</TableCell>
              <TableCell className="text-right font-bold text-purple-700">{formatCurrency(profitBeforeTax)}</TableCell>
            </TableRow>

            {/* NET PROFIT */}
            <TableRow className="font-bold text-xl bg-slate-100 border-y-4 border-slate-400">
              <TableCell className="font-bold text-slate-800">NET PROFIT / (LOSS)</TableCell>
              <TableCell className={`text-right font-bold text-xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
                <span className="text-sm text-gray-500 ml-2">({netMargin.toFixed(1)}%)</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">Gross Margin</p>
            <p className="font-bold text-lg">{grossMargin.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Net Margin</p>
            <p className="font-bold text-lg">{netMargin.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Operating Margin</p>
            <p className="font-bold text-lg">{revenue > 0 ? ((operatingProfit / revenue) * 100).toFixed(1) : 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="font-bold text-lg">{formatCurrency(revenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}