
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
            startDate = new Date(2020, 0, 1); // A reasonable arbitrary start date for 'all time' data
            endDate = now;
            break;
    }
    
    // Ensure dates are set to start/end of day to include full period
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { start: startDate, end: endDate };
};

export default function SalesByItem({ data = {}, period = 'this_year' }) {
  const { invoices = [] } = data;
  const dateRange = getDateRangeFromPeriod(period);

  const salesData = useMemo(() => {
    const filteredInvoices = invoices.filter(inv => {
          const invoiceDate = new Date(inv.invoice_date);
          return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
        });

    const itemSales = {};

    // Process invoice line items
    filteredInvoices.forEach(invoice => {
      if (invoice.line_items && Array.isArray(invoice.line_items)) {
        invoice.line_items.forEach(item => {
          const itemName = item.description || 'Unnamed Item';
          const quantity = Math.round(item.quantity || 0);
          const total = Math.round(item.total || 0);
          // const unitPrice = Math.round(item.unit_price || 0); // Not used in current logic, can be removed if not needed elsewhere

          if (!itemSales[itemName]) {
            itemSales[itemName] = {
              name: itemName,
              quantity: 0,
              revenue: 0,
              averagePrice: 0,
              timesOrdered: 0
            };
          }

          itemSales[itemName].quantity += quantity;
          itemSales[itemName].revenue += total;
          itemSales[itemName].timesOrdered += 1;
        });
      }
    });

    // Calculate average prices and convert to array
    const itemsArray = Object.values(itemSales).map(item => ({
      ...item,
      averagePrice: item.quantity > 0 ? Math.round(item.revenue / item.quantity) : 0,
      quantity: Math.round(item.quantity),
      revenue: Math.round(item.revenue)
    }));

    // Sort by revenue descending
    itemsArray.sort((a, b) => b.revenue - a.revenue);

    return itemsArray;
  }, [invoices, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalQuantity = salesData.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Sales by Item/Service</h2>
        <p className="text-slate-600">Product and service performance analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Products/Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{salesData.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Items by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Sales Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item/Service</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.averagePrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
