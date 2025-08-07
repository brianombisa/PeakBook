import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Subscription } from '@/api/entities';
import { Payment } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';

import AdminUsersList from '../components/admin-portal/AdminUsersList';
import AdminAnalytics from '../components/admin-portal/AdminAnalytics';
import PlatformSettings from '../components/admin-portal/PlatformSettings';
import AdminSubscriptionManager from '../components/admin-portal/AdminSubscriptionManager';
import AdminPaymentOverview from '../components/admin-portal/AdminPaymentOverview';

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Only allow platform admins
      if (user.role !== 'admin') {
        return;
      }

      // Load platform statistics
      const [users, subscriptions, payments] = await Promise.all([
        User.list(),
        Subscription.list(),
        Payment.list()
      ]);

      const activeSubscriptions = subscriptions.filter(sub => 
        sub.status === 'active' || sub.status === 'trial'
      );

      const totalRevenue = payments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return payment.status === 'completed' &&
                 paymentDate.getMonth() === currentMonth &&
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      setStats({
        totalUsers: users.length,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRevenue,
        totalRevenue
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setIsLoading(false);
  };

  // Redirect non-admin users
  if (!isLoading && (!currentUser || currentUser.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-white mb-2">PeakBooks Admin Portal</h2>
          <p className="text-slate-400">Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">PeakBooks Admin Portal</h1>
                  <p className="text-red-100">Platform Management & Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-red-100">
                <Badge className="bg-white/20 text-white border-white/30">
                  Platform Administrator
                </Badge>
                <span>{currentUser?.full_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-4 pb-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">Active Subscriptions</p>
                  <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold">KES {stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">KES {stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20">
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Activity className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Platform Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUsersList onRefresh={loadAdminData} />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6">
            <AdminSubscriptionManager onRefresh={loadAdminData} />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <AdminPaymentOverview onRefresh={loadAdminData} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}