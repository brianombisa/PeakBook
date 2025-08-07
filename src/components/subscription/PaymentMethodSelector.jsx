import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Globe, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PaymentMethodSelector = ({ amount, currency = 'KES', onPaymentSuccess, userCountry = 'KE' }) => {
  const [selectedMethod, setSelectedMethod] = useState(userCountry === 'KE' ? 'mpesa' : 'card');
  const [paymentData, setPaymentData] = useState({
    mpesa_phone: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_name: '',
    email: '',
    country: userCountry
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: <Smartphone className="w-5 h-5 text-green-600" />,
      description: 'Pay with M-Pesa STK Push',
      available: userCountry === 'KE',
      badge: 'Instant'
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      description: 'Visa, Mastercard, American Express',
      available: true,
      badge: 'Global'
    }
  ];

  const formatAmount = (amt) => {
    if (currency === 'KES') return `KES ${amt.toLocaleString()}`;
    if (currency === 'USD') return `$${amt.toFixed(2)}`;
    return `${currency} ${amt.toLocaleString()}`;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (selectedMethod === 'mpesa') {
        await processMpesaPayment();
      } else {
        await processCardPayment();
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processMpesaPayment = async () => {
    // This would integrate with Flutterwave or Daraja API
    toast({
      title: 'STK Push Sent',
      description: `Please check your phone ${paymentData.mpesa_phone} and enter your M-Pesa PIN`,
    });
    
    // Simulate payment process
    setTimeout(() => {
      onPaymentSuccess({
        method: 'mpesa',
        transaction_id: 'MPX' + Date.now(),
        amount,
        currency
      });
    }, 10000);
  };

  const processCardPayment = async () => {
    // This would integrate with Flutterwave/Stripe
    toast({
      title: 'Processing Payment',
      description: 'Please wait while we process your card payment...',
    });
    
    // Simulate payment process
    setTimeout(() => {
      onPaymentSuccess({
        method: 'card',
        transaction_id: 'CRD' + Date.now(),
        amount,
        currency
      });
    }, 5000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            {formatAmount(amount)}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            {paymentMethods
              .filter(method => method.available)
              .map(method => (
                <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                      {method.icon}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {method.name}
                          <Badge variant="secondary">{method.badge}</Badge>
                        </div>
                        <div className="text-sm text-slate-600">{method.description}</div>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedMethod === 'mpesa' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              M-Pesa Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
              <Input
                id="mpesa-phone"
                placeholder="254722123456"
                value={paymentData.mpesa_phone}
                onChange={(e) => setPaymentData({...paymentData, mpesa_phone: e.target.value})}
              />
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">How it works:</p>
              <ol className="text-green-700 text-sm mt-2 space-y-1">
                <li>1. Enter your M-Pesa registered phone number</li>
                <li>2. Click "Pay Now" to send STK push to your phone</li>
                <li>3. Enter your M-Pesa PIN when prompted</li>
                <li>4. Payment confirmation will appear instantly</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Card Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={paymentData.card_number}
                onChange={(e) => setPaymentData({...paymentData, card_number: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-expiry">Expiry Date</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={paymentData.card_expiry}
                  onChange={(e) => setPaymentData({...paymentData, card_expiry: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  placeholder="123"
                  value={paymentData.card_cvv}
                  onChange={(e) => setPaymentData({...paymentData, card_cvv: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="John Doe"
                value={paymentData.card_name}
                onChange={(e) => setPaymentData({...paymentData, card_name: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Globe className="w-4 h-4" />
              Secure payment powered by 256-bit SSL encryption
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full py-3 text-lg"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Pay {formatAmount(amount)}
          </>
        )}
      </Button>
    </div>
  );
};

export default PaymentMethodSelector;