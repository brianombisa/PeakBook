import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export default function RevenueChart({ payments, subscriptions }) {
  const chartData = useMemo(() => {
    // Get last 6 months
    const endDate = new Date();
    const startDate = subMonths(endDate, 5);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Calculate revenue for this month
      const monthlyRevenue = payments
        .filter(payment => 
          payment.status === 'completed' &&
          payment.payment_date &&
          new Date(payment.payment_date) >= monthStart &&
          new Date(payment.payment_date) <= monthEnd
        )
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Count new subscriptions this month
      const newSubscriptions = subscriptions
        .filter(sub => 
          new Date(sub.created_date) >= monthStart &&
          new Date(sub.created_date) <= monthEnd
        ).length;

      // Count active subscriptions at end of month
      const activeSubscriptions = subscriptions
        .filter(sub => 
          sub.status === 'active' &&
          new Date(sub.created_date) <= monthEnd
        ).length;

      return {
        month: format(month, 'MMM yyyy'),
        revenue: monthlyRevenue,
        newSubscriptions,
        activeSubscriptions
      };
    });
  }, [payments, subscriptions]);

  const totalRevenue = chartData.reduce((sum, data) => sum + data.revenue, 0);
  const averageMonthlyRevenue = totalRevenue / chartData.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">6-Month Revenue</p>
                <p className="text-3xl font-bold text-slate-800">
                  KES {totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Monthly Revenue</p>
                <p className="text-3xl font-bold text-slate-800">
                  KES {Math.round(averageMonthlyRevenue).toLocaleString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subscription Growth Chart */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Subscription Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newSubscriptions" fill="#3b82f6" name="New Subscriptions" />
              <Bar dataKey="activeSubscriptions" fill="#10b981" name="Active Subscriptions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}