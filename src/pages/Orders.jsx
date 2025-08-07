import React, { useState, useEffect } from 'react';
import { OnlineOrder } from '@/api/entities';
import { DeliveryRequest } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Package, Truck, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const [ordersData, deliveriesData] = await Promise.all([
        OnlineOrder.list('-created_date'),
        DeliveryRequest.list('-created_date')
      ]);

      setOrders(ordersData);
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error('Error loading order data:', error);
      toast({
        title: 'Error',
        description: 'Could not load order data.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleProcessOrder = async (order, newStatus) => {
    try {
      await OnlineOrder.update(order.id, { order_status: newStatus });

      // Auto-create invoice for confirmed orders
      if (newStatus === 'confirmed') {
        await Invoice.create({
          client_name: order.customer_name,
          client_email: order.customer_email,
          client_address: order.delivery_address,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          line_items: order.line_items,
          subtotal: order.subtotal,
          total_amount: order.total_amount,
          status: 'sent',
          payment_terms: 'Due on receipt'
        });
      }

      // Create delivery request for dispatched orders
      if (newStatus === 'dispatched') {
        await DeliveryRequest.create({
          order_id: order.id,
          pickup_address: "Your business address", // This would come from company profile
          delivery_address: order.delivery_address,
          recipient_name: order.customer_name,
          recipient_phone: order.customer_phone,
          package_description: `Order #${order.order_number}`,
          delivery_fee: order.delivery_fee || 200,
          delivery_partner: 'sendy',
          status: 'pending'
        });
      }

      await loadOrderData();
      toast({
        title: 'Success',
        description: `Order ${newStatus} successfully.`
      });
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: 'Error',
        description: 'Could not process order.',
        variant: 'destructive'
      });
    }
  };

  const initiateSTKPush = async (order) => {
    try {
      // Simulate STK Push initiation
      toast({
        title: 'M-Pesa Payment Initiated',
        description: `STK push sent to ${order.customer_phone}. Customer will receive a prompt to enter their M-Pesa PIN.`,
      });

      // Update order status to show payment is pending
      await OnlineOrder.update(order.id, { payment_status: 'pending' });
      await loadOrderData();
    } catch (error) {
      console.error('Error initiating STK push:', error);
      toast({
        title: 'Error',
        description: 'Could not initiate M-Pesa payment.',
        variant: 'destructive'
      });
    }
  };

  const statusColors = {
    'new': 'bg-blue-100 text-blue-800',
    'confirmed': 'bg-yellow-100 text-yellow-800',
    'preparing': 'bg-orange-100 text-orange-800',
    'dispatched': 'bg-purple-100 text-purple-800',
    'delivered': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  const paymentStatusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              Orders Management
            </h1>
            <p className="text-slate-600 mt-2">Manage online orders and deliveries</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending</p>
                  <p className="text-3xl font-bold">
                    {orders.filter(o => o.order_status === 'new' || o.order_status === 'confirmed').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">In Transit</p>
                  <p className="text-3xl font-bold">
                    {orders.filter(o => o.order_status === 'dispatched').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Delivered</p>
                  <p className="text-3xl font-bold">
                    {orders.filter(o => o.order_status === 'delivered').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                            <Badge className={statusColors[order.order_status]}>
                              {order.order_status.replace('_', ' ')}
                            </Badge>
                            <Badge className={paymentStatusColors[order.payment_status]}>
                              {order.payment_status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div>
                              <p><strong>Customer:</strong> {order.customer_name}</p>
                              <p><strong>Phone:</strong> {order.customer_phone}</p>
                            </div>
                            <div>
                              <p><strong>Amount:</strong> KES {order.total_amount.toLocaleString()}</p>
                              <p><strong>Items:</strong> {order.line_items?.length || 0}</p>
                            </div>
                            <div>
                              <p><strong>Delivery:</strong> {order.delivery_address}</p>
                              <p><strong>Method:</strong> {order.payment_method}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.order_status === 'new' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleProcessOrder(order, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm Order
                            </Button>
                            {order.payment_method === 'mpesa' && order.payment_status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => initiateSTKPush(order)}
                              >
                                <Smartphone className="w-4 h-4 mr-1" />
                                Send M-Pesa Prompt
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProcessOrder(order, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        
                        {order.order_status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleProcessOrder(order, 'preparing')}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Start Preparing
                          </Button>
                        )}
                        
                        {order.order_status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleProcessOrder(order, 'dispatched')}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Mark as Dispatched
                          </Button>
                        )}
                        
                        {order.order_status === 'dispatched' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleProcessOrder(order, 'delivered')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Delivered
                          </Button>
                        )}
                      </div>

                      {/* Order Items */}
                      {order.line_items && order.line_items.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <p className="font-semibold text-sm mb-2">Order Items:</p>
                          <div className="space-y-1">
                            {order.line_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.item_name} x {item.quantity}</span>
                                <span>KES {item.total.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No orders yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Delivery Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{delivery.recipient_name}</h3>
                          <p className="text-sm text-slate-600">{delivery.delivery_address}</p>
                          <p className="text-sm text-slate-500">
                            Partner: {delivery.delivery_partner} | Fee: KES {delivery.delivery_fee}
                          </p>
                        </div>
                        <Badge className={statusColors[delivery.status] || 'bg-gray-100 text-gray-800'}>
                          {delivery.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {deliveries.length === 0 && (
                    <div className="text-center py-8">
                      <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No deliveries yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}