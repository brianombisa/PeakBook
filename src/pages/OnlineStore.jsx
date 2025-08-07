import React, { useState, useEffect } from 'react';
import { OnlineStore } from '@/api/entities';
import { OnlineOrder } from '@/api/entities';
import { InventoryItem } from '@/api/entities/InventoryItem';
import { Invoice } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Store, Package, ShoppingCart, TrendingUp, Smartphone, Globe, Settings } from 'lucide-react';

export default function OnlineStorePage() {
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      
      // Load store data
      const stores = await OnlineStore.filter({ business_id: user.email });
      if (stores.length > 0) {
        setStore(stores[0]);
      }

      // Load orders and inventory
      const [ordersData, inventoryData] = await Promise.all([
        OnlineOrder.list('-created_date'),
        InventoryItem.filter({ created_by: user.email })
      ]);

      setOrders(ordersData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading store data:', error);
      toast({
        title: 'Error',
        description: 'Could not load store data.',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const handleCreateStore = async (storeData) => {
    try {
      const user = await User.me();
      const newStore = await OnlineStore.create({
        ...storeData,
        business_id: user.email,
        store_slug: storeData.store_name.toLowerCase().replace(/\s+/g, '-')
      });
      
      setStore(newStore);
      toast({
        title: 'Success',
        description: 'Your online store has been created!'
      });
    } catch (error) {
      console.error('Error creating store:', error);
      toast({
        title: 'Error',
        description: 'Could not create store.',
        variant: 'destructive'
      });
    }
  };

  const handleProcessOrder = async (order, status) => {
    try {
      await OnlineOrder.update(order.id, { order_status: status });
      
      // If confirming order, create invoice
      if (status === 'confirmed') {
        await Invoice.create({
          client_name: order.customer_name,
          client_email: order.customer_email,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          line_items: order.line_items,
          subtotal: order.subtotal,
          total_amount: order.total_amount,
          status: 'sent'
        });
      }

      await loadStoreData();
      toast({
        title: 'Success',
        description: `Order ${status} successfully.`
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

  if (!store) {
    return <StoreSetup onCreateStore={handleCreateStore} />;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 flex items-center gap-3">
              <Store className="w-8 h-8 text-blue-600" />
              {store.store_name}
            </h1>
            <p className="text-slate-600 mt-2">Your online storefront powered by PeakBooks</p>
            <div className="flex items-center gap-4 mt-3">
              <Badge className="bg-green-100 text-green-800">
                <Globe className="w-3 h-3 mr-1" />
                Live at peakbooks.app/store/{store.store_slug}
              </Badge>
            </div>
          </div>
          <Button onClick={() => window.open(`/store/${store.store_slug}`, '_blank')}>
            <Globe className="w-4 h-4 mr-2" />
            View Store
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <StoreOverview store={store} orders={orders} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersManagement orders={orders} onProcessOrder={handleProcessOrder} />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductsManagement inventory={inventory} store={store} onRefresh={loadStoreData} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <StoreSettings store={store} onUpdate={loadStoreData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Store Setup Component
const StoreSetup = ({ onCreateStore }) => {
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    delivery_areas: ['Nairobi CBD', 'Westlands', 'Karen'],
    minimum_order: 500,
    delivery_fee: 200
  });

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Launch Your Online Store</h1>
          <p className="text-slate-600 text-lg">
            Set up your online storefront in minutes and start selling to customers across Kenya
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Store Name *
                </label>
                <Input
                  value={formData.store_name}
                  onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                  placeholder="e.g., John's Electronics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Phone *
                </label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="e.g., +254 700 123 456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Store Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what you sell and what makes your business special..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Minimum Order (KES)
                </label>
                <Input
                  type="number"
                  value={formData.minimum_order}
                  onChange={(e) => setFormData({...formData, minimum_order: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Delivery Fee (KES)
                </label>
                <Input
                  type="number"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({...formData, delivery_fee: Number(e.target.value)})}
                />
              </div>
            </div>

            <Button 
              onClick={() => onCreateStore(formData)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!formData.store_name || !formData.contact_phone}
            >
              <Store className="w-4 h-4 mr-2" />
              Launch My Store
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Store Overview Component
const StoreOverview = ({ store, orders }) => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.order_status === 'new').length;
  const totalRevenue = orders
    .filter(o => o.order_status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold">{pendingOrders}</p>
            </div>
            <Package className="w-8 h-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold">KES {totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Orders Management Component  
const OrdersManagement = ({ orders, onProcessOrder }) => {
  const statusColors = {
    'new': 'bg-blue-100 text-blue-800',
    'confirmed': 'bg-yellow-100 text-yellow-800',
    'preparing': 'bg-orange-100 text-orange-800',
    'dispatched': 'bg-purple-100 text-purple-800',
    'delivered': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-slate-600">{order.customer_phone}</p>
                  </div>
                  <Badge className={statusColors[order.order_status]}>
                    {order.order_status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {order.line_items?.length} items • KES {order.total_amount.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {order.order_status === 'new' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => onProcessOrder(order, 'confirmed')}
                    >
                      Confirm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onProcessOrder(order, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.order_status === 'confirmed' && (
                  <Button 
                    size="sm" 
                    onClick={() => onProcessOrder(order, 'preparing')}
                  >
                    Start Preparing
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Products Management Component
const ProductsManagement = ({ inventory, store, onRefresh }) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Online Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.filter(item => item.is_active).map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{item.item_name}</h3>
              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="font-bold">KES {item.selling_price.toLocaleString()}</span>
                <Badge variant="outline">
                  Stock: {item.current_stock}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Store Settings Component
const StoreSettings = ({ store, onUpdate }) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Store Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Accept M-Pesa Payments</h3>
            <p className="text-sm text-slate-600">Allow customers to pay via M-Pesa</p>
          </div>
          <Switch checked={store.accepts_mpesa} />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Cash on Delivery</h3>
            <p className="text-sm text-slate-600">Accept cash payments on delivery</p>
          </div>
          <Switch checked={store.accepts_cash_on_delivery} />
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">Store URL</h3>
          <div className="bg-slate-50 p-3 rounded-lg">
            <code className="text-blue-600">
              https://peakbooks.app/store/{store.store_slug}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};