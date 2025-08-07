
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerProfitability({ invoices = [], customers = [], transactions = [], dateRange }) {
  const customerData = useMemo(() => {
    const filteredInvoices = dateRange && dateRange.start && dateRange.end
      ? invoices.filter(inv => {
          const invoiceDate = new Date(inv.invoice_date);
          return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
        })
      : invoices;

    if (!filteredInvoices || filteredInvoices.length === 0) {
        return {
            customersArray: [],
            topCustomers: [],
            totalRevenue: 0,
            totalProfit: 0,
            avgCustomerValue: 0,
            customerCount: 0,
            paretoPercentage: 0
        };
    }

    const customerProfitability = {};

    // Process invoices for revenue
    filteredInvoices.forEach(invoice => {
      const customerId = invoice.customer_id;
      const customer = customers.find(c => c.id === customerId);
      const customerName = customer ? customer.customer_name : (invoice.client_name || 'Unknown Customer');
      const revenue = Math.round(invoice.total_amount || 0);

      if (!customerProfitability[customerName]) {
        customerProfitability[customerName] = {
          name: customerName,
          revenue: 0,
          invoiceCount: 0,
          averageInvoice: 0,
          lastInvoiceDate: null,
          customerSince: null,
          profitMargin: 25, // Estimated profit margin
          estimatedProfit: 0
        };
      }

      customerProfitability[customerName].revenue += revenue;
      customerProfitability[customerName].invoiceCount += 1;
      
      const invoiceDate = new Date(invoice.invoice_date);
      if (!customerProfitability[customerName].lastInvoiceDate || invoiceDate > customerProfitability[customerName].lastInvoiceDate) {
        customerProfitability[customerName].lastInvoiceDate = invoiceDate;
      }
      
      if (!customerProfitability[customerName].customerSince || invoiceDate < customerProfitability[customerName].customerSince) {
        customerProfitability[customerName].customerSince = invoiceDate;
      }
    });

    // Calculate metrics for each customer
    const customersArray = Object.values(customerProfitability).map(customer => {
      customer.averageInvoice = customer.invoiceCount > 0 ? Math.round(customer.revenue / customer.invoiceCount) : 0;
      customer.estimatedProfit = Math.round(customer.revenue * (customer.profitMargin / 100));
      
      // Calculate customer lifetime (in months)
      if (customer.customerSince && customer.lastInvoiceDate) {
        const lifetimeMonths = Math.round((customer.lastInvoiceDate - customer.customerSince) / (1000 * 60 * 60 * 24 * 30));
        customer.lifetimeMonths = Math.max(1, lifetimeMonths);
        customer.monthlyRevenue = Math.round(customer.revenue / customer.lifetimeMonths);
      } else {
        customer.lifetimeMonths = 1;
        customer.monthlyRevenue = customer.revenue;
      }

      return {
        ...customer,
        revenue: Math.round(customer.revenue),
        estimatedProfit: Math.round(customer.estimatedProfit)
      };
    });

    // Sort by revenue descending
    customersArray.sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalRevenue = customersArray.reduce((sum, c) => sum + c.revenue, 0);
    const totalProfit = customersArray.reduce((sum, c) => sum + c.estimatedProfit, 0);
    const avgCustomerValue = customersArray.length > 0 ? Math.round(totalRevenue / customersArray.length) : 0;

    // Customer segments
    const topCustomers = customersArray.slice(0, 10);
    const top20Percent = Math.ceil(customersArray.length * 0.2);
    const top20Revenue = customersArray.slice(0, top20Percent).reduce((sum, c) => sum + c.revenue, 0);
    const pareto = totalRevenue > 0 ? Math.round((top20Revenue / totalRevenue) * 100) : 0;

    return {
      customersArray,
      topCustomers,
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
      avgCustomerValue,
      customerCount: customersArray.length,
      paretoPercentage: pareto
    };
  }, [invoices, customers, dateRange]);

  const formatCurrency = (amount) => `KES ${Math.round(amount).toLocaleString()}`;

  if (customerData.customersArray.length === 0) {
      return (
        <Card>
            <CardContent className="p-6 text-center text-slate-500">
                <p>No customer sales data available for the selected period.</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Customer Profitability Analysis</h2>
        <p className="text-slate-600">Revenue and profit analysis by customer</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(customerData.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(customerData.totalProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(customerData.avgCustomerValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pareto Rule (80/20)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{customerData.paretoPercentage}%</p>
            <p className="text-xs text-gray-500">Top 20% customers contribute</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData.topCustomers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `KES ${(value / 1000)}k`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="font-medium">Most Valuable Customer</span>
                <div className="text-right">
                  <p className="font-bold">{customerData.topCustomers[0]?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(customerData.topCustomers[0]?.revenue || 0)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="font-medium">Highest Frequency</span>
                <div className="text-right">
                  <p className="font-bold">
                    {customerData.customersArray.sort((a, b) => b.invoiceCount - a.invoiceCount)[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {customerData.customersArray.sort((a, b) => b.invoiceCount - a.invoiceCount)[0]?.invoiceCount || 0} invoices
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="font-medium">Largest Single Sale</span>
                <div className="text-right">
                  <p className="font-bold">
                    {customerData.customersArray.sort((a, b) => b.averageInvoice - a.averageInvoice)[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(customerData.customersArray.sort((a, b) => b.averageInvoice - a.averageInvoice)[0]?.averageInvoice || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Customer Profitability</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Avg Invoice</TableHead>
                  <TableHead className="text-right">Est. Profit</TableHead>
                  <TableHead className="text-right">Monthly Revenue</TableHead>
                  <TableHead>Last Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.customersArray.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(customer.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.averageInvoice)}</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(customer.estimatedProfit)}
                    </TableCell>
                    <TableCell className="text-right text-purple-600">
                      {formatCurrency(customer.monthlyRevenue)}
                    </TableCell>
                    <TableCell>
                      {customer.lastInvoiceDate ? customer.lastInvoiceDate.toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
