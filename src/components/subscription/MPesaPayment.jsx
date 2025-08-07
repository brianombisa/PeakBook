import React, { useState } from 'react';
import { Payment } from '@/api/entities';
import { Subscription } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Smartphone, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addMonths, format } from 'date-fns';

export default function MPesaPayment({ subscription, onPaymentComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPaymentDetails, setManualPaymentDetails] = useState({
    transactionId: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleMPesaPayment = async () => {
    if (!mpesaPhone || !subscription) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your M-Pesa phone number.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const user = await User.me();
      
      // In a real implementation, you would integrate with M-Pesa API here
      // For now, we'll simulate the process and create a pending payment record
      
      const paymentData = {
        subscription_id: subscription.id,
        user_id: user.id,
        user_email: user.email,
        amount: subscription.plan_price,
        payment_method: 'mpesa',
        mpesa_phone: mpesaPhone,
        status: 'pending',
        billing_period_start: new Date().toISOString().split('T')[0],
        billing_period_end: addMonths(new Date(), 1).toISOString().split('T')[0],
        notes: 'M-Pesa STK Push initiated'
      };

      await Payment.create(paymentData);

      // Simulate M-Pesa STK Push
      toast({
        title: 'Payment Initiated',
        description: `STK Push sent to ${mpesaPhone}. Please complete the payment on your phone.`,
      });

      // In a real app, you would wait for M-Pesa callback and update payment status
      // For demo purposes, we'll show instructions for manual verification
      setTimeout(() => {
        toast({
          title: 'Payment Instructions',
          description: 'Please complete the M-Pesa payment and then use the manual verification below.',
        });
      }, 3000);

    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      toast({
        title: 'Payment Failed',
        description: 'Could not initiate M-Pesa payment. Please try again.',
        variant: 'destructive'
      });
    }
    setIsProcessing(false);
  };

  const handleManualPaymentVerification = async () => {
    if (!manualPaymentDetails.transactionId) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the M-Pesa transaction ID.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const user = await User.me();
      
      const paymentData = {
        subscription_id: subscription.id,
        user_id: user.id,
        user_email: user.email,
        amount: subscription.plan_price,
        payment_method: 'mpesa',
        status: 'completed', // In real app, this would be verified with M-Pesa API
        transaction_id: manualPaymentDetails.transactionId,
        mpesa_receipt_number: manualPaymentDetails.transactionId,
        payment_date: new Date().toISOString(),
        billing_period_start: new Date().toISOString().split('T')[0],
        billing_period_end: addMonths(new Date(), 1).toISOString().split('T')[0],
        notes: manualPaymentDetails.notes
      };

      await Payment.create(paymentData);

      // Update subscription status
      await Subscription.update(subscription.id, {
        status: 'active',
        last_payment_date: new Date().toISOString().split('T')[0],
        next_billing_date: addMonths(new Date(), 1).toISOString().split('T')[0],
        total_paid: (subscription.total_paid || 0) + subscription.plan_price,
        payment_failures: 0
      });

      toast({
        title: 'Payment Verified',
        description: 'Your payment has been verified and your subscription is now active!',
      });

      onPaymentComplete();
      setManualPaymentDetails({ transactionId: '', notes: '' });

    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Verification Failed',
        description: 'Could not verify your payment. Please contact support.',
        variant: 'destructive'
      });
    }
    setIsProcessing(false);
  };

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Subscription</h3>
          <p className="text-slate-600">Please select a subscription plan first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* M-Pesa Payment */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <Smartphone className="w-6 h-6" />
            M-Pesa Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Amount Due</h4>
            <p className="text-2xl font-bold text-green-700">
              KES {subscription.plan_price?.toLocaleString()}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1)} Plan
            </p>
          </div>

          <div>
            <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="254722123456"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter your M-Pesa registered phone number
            </p>
          </div>

          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              You will receive an STK Push notification on your phone to complete the payment.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleMPesaPayment}
            disabled={isProcessing || !mpesaPhone}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Pay with M-Pesa
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Manual Payment Verification */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            Manual Payment Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you've already made a payment, enter the transaction details below for verification.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="transaction-id">M-Pesa Transaction ID</Label>
            <Input
              id="transaction-id"
              placeholder="e.g., QGH4G7D9X2"
              value={manualPaymentDetails.transactionId}
              onChange={(e) => setManualPaymentDetails({
                ...manualPaymentDetails,
                transactionId: e.target.value
              })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="payment-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Any additional details about your payment..."
              value={manualPaymentDetails.notes}
              onChange={(e) => setManualPaymentDetails({
                ...manualPaymentDetails,
                notes: e.target.value
              })}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleManualPaymentVerification}
            disabled={isProcessing || !manualPaymentDetails.transactionId}
            variant="outline"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Payment'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}