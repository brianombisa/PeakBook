
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Subscription } from '@/api/entities';
import { Payment } from '@/api/entities';
import { ConsultationRequest } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  BarChart3,
  Shield,
  CreditCard,
  Building2,
  Activity,
  AlertCircle,
  LifeBuoy
} from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import AdminUsersList from '../components/admin-portal/AdminUsersList';
import AdminAnalytics from '../components/admin-portal/AdminAnalytics';
import PlatformSettings from '../components/admin-portal/PlatformSettings';
import AdminSubscriptionManager from '../components/admin-portal/AdminSubscriptionManager';
import AdminPaymentOverview from '../components/admin-portal/AdminPaymentOverview';
import AdminConsultationRequests from '../components/admin-portal/AdminConsultationRequests';

export default function AdminPortalPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubscriptions: 0,
    monthlyRevenue: 0,
    activeTrials: 0,
    totalMRR: 0,
    pendingConsultations: 0,
  });
  const { toast } = useToast();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'users';
  const emailFilter = searchParams.get('email_filter') || '';

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Check if current user is platform admin
      const user = await User.me();
      setCurrentUser(user);

      // Only platform admins should access this
      if (user.email !== 'admin@peakbooks.app' && user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin portal.',
          variant: 'destructive'
        });
        return;
      }

      // Load platform statistics
      const [usersData, subscriptionsData, paymentsData, requestsData] = await Promise.all([
        User.list(),
        Subscription.list(),
        Payment.list(),
        ConsultationRequest.list('-created_date')
      ]);

      // Store the data in state
      setUsers(usersData);
      setSubscriptions(subscriptionsData);
      setPayments(paymentsData);
      setConsultationRequests(requestsData);

      // Calculate stats
      const activeSubscriptions = subscriptionsData.filter(sub => sub.status === 'active');
      const currentMonth = new Date().getMonth();
      const monthlyPayments = paymentsData.filter(payment =>
        new Date(payment.payment_date).getMonth() === currentMonth &&
        payment.status === 'completed'
      );
      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const activeTrials = subscriptionsData.filter(sub => sub.status === 'trial').length;

      // Calculate additional metrics for analytics
      const totalMRR = activeSubscriptions.reduce((sum, sub) => sum + sub.plan_price, 0);

      setStats({
        totalUsers: usersData.length,
        totalSubscriptions: activeSubscriptions.length,
        monthlyRevenue,
        activeTrials,
        activeSubscriptions: activeSubscriptions.length,
        totalMRR,
        pendingConsultations: requestsData.filter(r => r.status === 'pending').length,
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  // Redirect non-admin users
  if (!isLoading && currentUser && currentUser.email !== 'admin@peakbooks.app' && currentUser.role !== 'admin') {
    return <Navigate to={createPageUrl('Dashboard')} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Admin Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">PeakBooks Admin Portal</h1>
                <p className="text-purple-200">Platform Management & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                Platform Admin
              </Badge>
              <Button
                variant="outline"
                onClick={() => window.open(createPageUrl('Dashboard'), '_blank')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Open Business App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-purple-300">Platform-wide</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Active Subs</CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalSubscriptions}</div>
              <p className="text-xs text-green-300">Paying customers</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Revenue (MTD)</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">KES {stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-blue-300">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-200">Active Trials</CardTitle>
              <Activity className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeTrials}</div>
              <p className="text-xs text-orange-300">Trial users</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-200">Consultations</CardTitle>
              <LifeBuoy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingConsultations}</div>
              <p className="text-xs text-yellow-300">Pending requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-black/40 border-white/10">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">Users</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-white data-[state=active]:bg-purple-600">Subscriptions</TabsTrigger>
            <TabsTrigger value="consultations" className="text-white data-[state=active]:bg-purple-600">Consultations</TabsTrigger>
            <TabsTrigger value="payments" className="text-white data-[state=active]:bg-purple-600">Payments</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <AdminUsersList
              users={users}
              subscriptions={subscriptions}
              onRefresh={loadAdminData}
              emailFilter={emailFilter}
            />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6">
            <AdminSubscriptionManager
              subscriptions={subscriptions}
              users={users}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="consultations" className="mt-6">
            <AdminConsultationRequests
              requests={consultationRequests}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <AdminPaymentOverview
              payments={payments}
              subscriptions={subscriptions}
              onRefresh={loadAdminData}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdminAnalytics
              users={users}
              subscriptions={subscriptions}
              payments={payments}
              metrics={stats}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
