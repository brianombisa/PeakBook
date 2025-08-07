import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionAnalytics({ subscriptions, onRefresh }) {
  const getStatusStats = () => {
    const stats = subscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const getPlanStats = () => {
    const stats = subscriptions.reduce((acc, sub) => {
      acc[sub.plan_name] = (acc[sub.plan_name] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const statusStats = getStatusStats();
  const planStats = getPlanStats();

  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    trial: 'bg-blue-100 text-blue-800 border-blue-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const planColors = {
    basic: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusStats).map(([status, count]) => (
          <Card key={status} className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{count}</div>
              <Badge className={`${statusColors[status]} border font-medium mt-2`}>
                {status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Plan Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(planStats).map(([plan, count]) => (
              <div key={plan} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-800">{count}</div>
                <Badge className={`${planColors[plan]} mt-2`}>
                  {plan} Plan
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptions
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .slice(0, 10)
              .map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{subscription.user_email}</p>
                    <p className="text-sm text-slate-500">
                      {subscription.plan_name} - KES {subscription.plan_price?.toLocaleString()}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[subscription.status]}>
                      {subscription.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(subscription.created_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}