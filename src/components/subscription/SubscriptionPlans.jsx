
import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/api/entities';
import { Subscription } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Loader2, Smartphone, Users, TrendingUp, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addDays } from 'date-fns';

const PlanIcon = ({ planName }) => {
  const icons = {
    'Starter': <Smartphone className="w-6 h-6" />,
    'Business': <TrendingUp className="w-6 h-6" />,
    'Enterprise': <Shield className="w-6 h-6" />
  };
  return icons[planName] || <Star className="w-6 h-6" />;
};

const PlanCard = ({ plan, isCurrentPlan, onChoose, isProcessing }) => {
  const planColors = {
    'Starter': 'from-green-500 to-emerald-600',
    'Business': 'from-blue-500 to-indigo-600',
    'Enterprise': 'from-purple-500 to-violet-600'
  };

  const backgroundGradient = planColors[plan.name] || 'from-gray-500 to-slate-600';

  return (
    <Card className={`relative flex flex-col h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
      plan.is_featured 
        ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200' 
        : 'border border-gray-200 hover:border-gray-300'
    }`}>
      {plan.is_featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-sm font-bold shadow-lg">
            MOST POPULAR
          </Badge>
        </div>
      )}

      <CardHeader className={`text-center bg-gradient-to-br ${backgroundGradient} text-white rounded-t-lg`}>
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-white/20 rounded-full">
            <PlanIcon planName={plan.name} />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-white/90 text-sm">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow p-6">
        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-gray-900">KES {plan.price_monthly.toLocaleString()}</span>
            <span className="text-gray-500">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            or KES {plan.price_annual.toLocaleString()}/year (save KES {((plan.price_monthly * 12) - plan.price_annual).toLocaleString()})
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-auto">
          <Button
            onClick={() => onChoose(plan)}
            disabled={isCurrentPlan || isProcessing === plan.id}
            className={`w-full h-12 font-semibold transition-all duration-200 ${
              isCurrentPlan
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : plan.is_featured
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                : `bg-gradient-to-r ${backgroundGradient} hover:opacity-90 text-white`
            }`}
          >
            {isProcessing === plan.id ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : isCurrentPlan ? (
              'Current Plan'
            ) : (
              `Start ${plan.name} Plan`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SubscriptionPlans({ currentSubscription, onSubscriptionChange }) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const activePlans = await SubscriptionPlan.filter({ is_active: true });
      setPlans(activePlans.sort((a, b) => a.price_monthly - b.price_monthly));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Could not load subscription plans. Please try again.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleChoosePlan = async (plan) => {
    setIsProcessing(plan.id);
    try {
      const user = await User.me();
      
      if (currentSubscription) {
        // Upgrading/Downgrading existing subscription
        await Subscription.update(currentSubscription.id, {
          plan_id: plan.id,
          plan_name: plan.name.toLowerCase(),
          plan_price: plan.price_monthly,
          status: 'active',
        });
        toast({ 
          title: 'Plan Updated!', 
          description: `Successfully switched to the ${plan.name} plan.`,
          duration: 5000
        });
      } else {
        // Creating new subscription
        const today = new Date();
        const trialEndDate = addDays(today, 14);
        
        await Subscription.create({
          user_id: user.id,
          user_email: user.email,
          plan_id: plan.id,
          plan_name: plan.name.toLowerCase(),
          plan_price: plan.price_monthly,
          status: 'trial',
          start_date: today.toISOString().split('T')[0],
          trial_end_date: trialEndDate.toISOString().split('T')[0],
          next_billing_date: trialEndDate.toISOString().split('T')[0],
          company_name: user.full_name,
          auto_renew: true
        });
        
        toast({ 
          title: 'Free Trial Started!', 
          description: `You have started a 14-day free trial of the ${plan.name} plan. No payment required during trial.`,
          duration: 8000
        });
      }
      
      onSubscriptionChange();
    } catch (error) {
      console.error('Error choosing plan:', error);
      toast({ 
        title: 'Error', 
        description: 'Could not update your subscription. Please try again.', 
        variant: 'destructive' 
      });
    }
    setIsProcessing(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Perfect Plan</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          All plans include M-Pesa integration, KRA compliance, and are designed specifically for Kenyan businesses.
          Start with a 14-day free trial.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan}
              onChoose={handleChoosePlan}
              isProcessing={isProcessing}
            />
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">M-Pesa Ready</h3>
            <p className="text-sm text-gray-600">Seamless integration with Kenya's mobile money</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">KRA Compliant</h3>
            <p className="text-sm text-gray-600">Automated tax reports that meet KRA requirements</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Local Support</h3>
            <p className="text-sm text-gray-600">Kenyan-based customer support team</p>
          </div>
        </div>
      </div>
    </div>
  );
}
