import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const statusConfig = {
  trial: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    label: 'Free Trial'
  },
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Active'
  },
  inactive: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
    label: 'Inactive'
  },
  suspended: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'Suspended'
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
    label: 'Cancelled'
  }
};

export default function SubscriptionStatus({ subscription, user, onUpdate }) {
  if (!subscription) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to PeakBooks!</h3>
          <p className="text-slate-600 mb-4">Choose a subscription plan to get started with full access to all features.</p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Choose Your Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[subscription.status] || statusConfig.inactive;
  const StatusIcon = status.icon;
  
  const trialEndDate = subscription.trial_end_date ? new Date(subscription.trial_end_date) : null;
  const nextBillingDate = subscription.next_billing_date ? new Date(subscription.next_billing_date) : null;
  const daysRemaining = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;
  
  const isTrialExpiring = subscription.status === 'trial' && daysRemaining <= 3;
  const isOverdue = nextBillingDate && isPast(nextBillingDate) && subscription.status === 'active';

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardTitle className="text-2xl">Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <StatusIcon className="w-8 h-8 text-slate-600 mr-2" />
                <Badge className={`${status.color} border px-3 py-1 text-sm font-semibold`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-lg font-bold text-slate-800 capitalize">
                {subscription.plan_name} Plan
              </p>
              <p className="text-slate-600">
                KES {subscription.plan_price?.toLocaleString()}/month
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Started</p>
              <p className="font-semibold text-slate-800">
                {format(new Date(subscription.start_date), 'MMM dd, yyyy')}
              </p>
              {subscription.status === 'trial' && trialEndDate && (
                <>
                  <p className="text-sm text-slate-600 mb-1 mt-3">Trial Ends</p>
                  <p className="font-semibold text-slate-800">
                    {format(trialEndDate, 'MMM dd, yyyy')}
                  </p>
                </>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                KES {(subscription.total_paid || 0).toLocaleString()}
              </p>
              {nextBillingDate && (
                <>
                  <p className="text-sm text-slate-600 mb-1 mt-3">Next Billing</p>
                  <p className="font-semibold text-slate-800">
                    {format(nextBillingDate, 'MMM dd, yyyy')}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {isTrialExpiring && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Trial Expiring Soon!</strong> Your free trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
            Please make a payment to continue using PeakBooks without interruption.
          </AlertDescription>
        </Alert>
      )}

      {isOverdue && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Payment Overdue!</strong> Your subscription payment was due on {format(nextBillingDate, 'MMM dd, yyyy')}. 
            Please make a payment to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {subscription.status === 'active' && !isOverdue && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>All Good!</strong> Your subscription is active and up to date. 
            Thank you for being a valued PeakBooks customer!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}