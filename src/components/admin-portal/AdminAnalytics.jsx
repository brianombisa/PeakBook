import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminAnalytics({ users, subscriptions, payments, metrics }) {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 11); // Last 12 months
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const newUsers = users.filter(user => 
        new Date(user.created_date) >= monthStart &&
        new Date(user.created_date) <= monthEnd
      ).length;

      const newSubscriptions = subscriptions.filter(sub => 
        new Date(sub.created_date) >= monthStart &&
        new Date(sub.created_date) <= monthEnd
      ).length;

      const monthlyRevenue = payments.filter(payment => 
        payment.status === 'completed' &&
        payment.payment_date &&
        new Date(payment.payment_date) >= monthStart &&
        new Date(payment.payment_date) <= monthEnd
      ).reduce((sum, payment) => sum + (payment.amount || 0), 0);

      const churnedUsers = subscriptions.filter(sub => 
        sub.status === 'cancelled' &&
        sub.updated_date &&
        new Date(sub.updated_date) >= monthStart &&
        new Date(sub.updated_date) <= monthEnd
      ).length;

      return {
        month: format(month, 'MMM yyyy'),
        newUsers,
        newSubscriptions,
        revenue: monthlyRevenue,
        churned: churnedUsers
      };
    });
  }, [users, subscriptions, payments]);

  const planDistribution = useMemo(() => {
    const distribution = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((acc, sub) => {
        acc[sub.plan_name] = (acc[sub.plan_name] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(distribution).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [subscriptions]);

  const revenueGrowth = useMemo(() => {
    const current = chartData[chartData.length - 1]?.revenue || 0;
    const previous = chartData[chartData.length - 2]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;
  }, [chartData]);

  const userGrowth = useMemo(() => {
    const current = chartData[chartData.length - 1]?.newUsers || 0;
    const previous = chartData[chartData.length - 2]?.newUsers || 0;
    return previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Revenue Growth</p>
                <p className="text-2xl font-bold text-white">{revenueGrowth}%</p>
                <p className="text-xs text-green-400 mt-1">Month over month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">User Growth</p>
                <p className="text-2xl font-bold text-white">{userGrowth}%</p>
                <p className="text-xs text-blue-400 mt-1">New signups</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">ARPU</p>
                <p className="text-2xl font-bold text-white">
                  KES {metrics.activeSubscriptions > 0 ? Math.round(metrics.totalMRR / metrics.activeSubscriptions).toLocaleString() : 0}
                </p>
                <p className="text-xs text-purple-400 mt-1">Avg revenue per user</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & User Growth Chart */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Growth Trends (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="newUsers" stroke="#3B82F6" strokeWidth={3} name="New Users" />
                <Line type="monotone" dataKey="newSubscriptions" stroke="#10B981" strokeWidth={3} name="New Subscriptions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Active Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Monthly Revenue & User Acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value, name) => [
                  name === 'revenue' ? `KES ${value.toLocaleString()}` : value,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue (KES)" />
              <Bar dataKey="newUsers" fill="#3B82F6" name="New Users" />
              <Bar dataKey="churned" fill="#EF4444" name="Churned Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}