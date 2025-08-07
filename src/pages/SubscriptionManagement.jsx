
import React, { useState, useEffect } from 'react';
import { Subscription } from '@/api/entities';
import { SubscriptionPlan } from '@/api/entities'; // Added this import
import { Payment } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Smartphone, Users, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import PaymentHistory from '../components/subscription/PaymentHistory';
import MPesaPayment from '../components/subscription/MPesaPayment';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import PricingPDF from '../components/subscription/PricingPDF';

export default function SubscriptionManagementPage() {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Get user's subscription
      const userSubscriptions = await Subscription.filter({ user_id: currentUser.id });
      if (userSubscriptions.length > 0) {
        setSubscription(userSubscriptions[0]);
        
        // Get payment history
        const userPayments = await Payment.filter({ user_id: currentUser.id }, '-payment_date');
        setPayments(userPayments);
      }

      // Load all active plans for PDF generation
      const activePlans = await SubscriptionPlan.filter({ is_active: true });
      setPlans(activePlans.sort((a, b) => a.price_monthly - b.price_monthly));
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Could not load subscription information.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleSubscriptionUpdate = () => {
    loadSubscriptionData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Subscription Management</h1>
          <p className="text-slate-600">Manage your PeakBooks subscription and billing</p>
        </div>

        {/* Current Status Overview */}
        <SubscriptionStatus 
          subscription={subscription} 
          user={user}
          onUpdate={handleSubscriptionUpdate}
        />

        <Tabs defaultValue="plans" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="payment">Make Payment</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="pricing">Download Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="mt-6">
            <SubscriptionPlans 
              currentSubscription={subscription}
              onSubscriptionChange={handleSubscriptionUpdate}
            />
          </TabsContent>
          
          <TabsContent value="payment" className="mt-6">
            <MPesaPayment 
              subscription={subscription}
              onPaymentComplete={handleSubscriptionUpdate}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <PaymentHistory payments={payments} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Download Pricing Information</CardTitle>
                <p className="text-gray-600">
                  Get a comprehensive PDF with all our subscription plans and pricing details
                </p>
              </CardHeader>
              <CardContent>
                <PricingPDF plans={plans} />
                
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">What's Included in the PDF:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Complete feature comparison across all plans</li>
                    <li>• Detailed pricing for monthly and annual subscriptions</li>
                    <li>• Contact information and support details</li>
                    <li>• Information about free trial and M-Pesa payment options</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
