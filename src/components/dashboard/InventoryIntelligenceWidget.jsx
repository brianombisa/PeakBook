import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  Clock,
  Target,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react';
import InventoryIntelligenceService from '../services/InventoryIntelligenceService';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const StockRiskMeter = ({ risk, type = 'stockout' }) => {
  const getColor = (risk, type) => {
    if (type === 'overstock') {
      if (risk >= 70) return 'text-orange-600';
      if (risk >= 40) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (risk >= 70) return 'text-red-600';
      if (risk >= 40) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getBackgroundColor = (risk, type) => {
    if (type === 'overstock') {
      if (risk >= 70) return 'bg-orange-100';
      if (risk >= 40) return 'bg-yellow-100';
      return 'bg-green-100';
    } else {
      if (risk >= 70) return 'bg-red-100';
      if (risk >= 40) return 'bg-yellow-100';
      return 'bg-green-100';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`rounded-full px-2 py-1 ${getBackgroundColor(risk, type)}`}>
        <span className={`font-bold ${getColor(risk, type)}`}>{Math.round(risk)}%</span>
      </div>
      <span className="text-xs text-slate-500">
        {type === 'overstock' ? 'overstock risk' : 'stockout risk'}
      </span>
    </div>
  );
};

const ItemOptimizationCard = ({ optimization, onViewDetails }) => {
  const getRiskColor = (risk) => {
    if (risk >= 70) return 'border-red-500 bg-red-50';
    if (risk >= 40) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'emergency_order': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'reorder_now': return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      case 'reduce_stock': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default: return <Target className="w-4 h-4 text-green-600" />;
    }
  };

  const primaryRisk = Math.max(optimization.stockoutRisk || 0, optimization.overStockRisk || 0);

  return (
    <Card className={`${getRiskColor(primaryRisk)} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">{optimization.itemName}</h4>
            <p className="text-sm text-slate-600">
              Current Stock: {optimization.currentStock} units
            </p>
          </div>
          <div className="text-right space-y-1">
            <StockRiskMeter risk={optimization.stockoutRisk || 0} type="stockout" />
            {optimization.overStockRisk > 40 && (
              <StockRiskMeter risk={optimization.overStockRisk} type="overstock" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {optimization.recommendation && (
          <div className="bg-white/60 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              {getActionIcon(optimization.recommendation.action)}
              <span className="font-medium text-sm">{optimization.recommendation.message}</span>
            </div>
            {optimization.recommendation.quantity > 0 && (
              <p className="text-sm text-slate-600">
                Recommended order: {optimization.recommendation.quantity} units
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Timeframe: {optimization.recommendation.timeframe}
            </p>
          </div>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onViewDetails(optimization)}
          className="w-full"
        >
          <Eye className="w-3 h-3 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

const InventoryAlertCard = ({ alert }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Package className="w-5 h-5 text-yellow-600" />;
      default: return <BarChart3 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <Card className={`${getSeverityColor(alert.severity)} border-l-4`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getSeverityIcon(alert.severity)}
          <div>
            <CardTitle className="text-lg">{alert.itemName}</CardTitle>
            <p className="text-sm text-slate-600">{alert.message}</p>
          </div>
          <Badge className={`${
            alert.severity === 'critical' ? 'bg-red-600' :
            alert.severity === 'high' ? 'bg-orange-600' :
            alert.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
          } text-white text-xs px-2 py-1`}>
            {alert.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-700">Recommended Action:</p>
            <p className="text-sm text-slate-600">{alert.action}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Business Impact:</p>
            <p className="text-sm text-slate-600">{alert.impact}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PurchaseRecommendationCard = ({ recommendation }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={`${getPriorityColor(recommendation.priority)} border-l-4`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">{recommendation.itemName}</h4>
            <p className="text-sm text-slate-600">{recommendation.reason}</p>
          </div>
          <Badge className={`${
            recommendation.priority === 'critical' ? 'bg-red-600' :
            recommendation.priority === 'high' ? 'bg-orange-600' :
            'bg-blue-600'
          } text-white`}>
            {recommendation.priority.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500">Current Stock</p>
            <p className="font-semibold">{recommendation.currentStock} units</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Recommended Order</p>
            <p className="font-semibold text-green-600">{recommendation.recommendedQuantity} units</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm"><strong>Urgency:</strong> {recommendation.urgency}</p>
          <p className="text-sm"><strong>Estimated Cost:</strong> KES {Math.round(recommendation.estimatedCost).toLocaleString()}</p>
          <p className="text-sm"><strong>Expected Revenue:</strong> KES {Math.round(recommendation.expectedRevenue).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function InventoryIntelligenceWidget({ 
  items = [], 
  invoices = [], 
  transactions = [],
  expenses = [],
  companyProfile = null
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { toast } = useToast();

  const trackableItems = useMemo(() => 
    items.filter(item => item.is_trackable), 
    [items]
  );

  const runAnalysis = async () => {
    if (trackableItems.length === 0) {
      toast({
        title: "No Trackable Items",
        description: "Add inventory items with stock tracking enabled to see optimization insights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await InventoryIntelligenceService.analyzeInventoryOptimization({
        items,
        invoices,
        transactions,
        expenses,
        companyProfile
      });

      if (result.success) {
        setAnalysis(result);
        setLastUpdated(new Date());
        toast({
          title: "Inventory Intelligence Updated",
          description: `Analyzed ${trackableItems.length} items and generated optimization recommendations.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Inventory intelligence error:', error);
      toast({
        title: "Analysis Error",
        description: "Could not analyze inventory optimization. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackableItems.length > 0 && invoices.length > 0) {
      runAnalysis();
    }
  }, [trackableItems.length, invoices.length]);

  if (!analysis && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventory Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Ready to Optimize</h3>
            <p className="text-slate-500 mb-4">
              Get AI-powered inventory optimization and demand forecasting
            </p>
            <Button onClick={runAnalysis} className="bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Analyze Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventory Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Analyzing inventory patterns...</p>
              <p className="text-slate-500 text-sm">Forecasting demand and optimizing stock levels</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const { stockOptimizations, purchaseRecommendations, inventoryAlerts, summary } = analysis;
  const criticalItems = stockOptimizations.filter(opt => 
    opt.stockoutRisk >= 90 || opt.recommendation?.action === 'emergency_order'
  );

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            Inventory Intelligence
            <Badge className="bg-white/20 text-white border-white/30">AI-Powered</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={runAnalysis}
            disabled={isLoading}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-green-100 text-sm">
          AI-powered demand forecasting and stock optimization
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-slate-800">{summary.totalItems}</div>
            <div className="text-sm text-slate-600">Tracked Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{summary.criticalItems}</div>
            <div className="text-sm text-slate-600">Critical Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{summary.lowStockItems}</div>
            <div className="text-sm text-slate-600">Low Stock Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{summary.healthyStockItems}</div>
            <div className="text-sm text-slate-600">Healthy Stock</div>
          </div>
        </div>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
            <TabsTrigger value="recommendations">Purchase Orders</TabsTrigger>
            <TabsTrigger value="optimization">Stock Optimization</TabsTrigger>
            <TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {inventoryAlerts.length > 0 ? (
              inventoryAlerts.slice(0, 5).map((alert, index) => (
                <InventoryAlertCard key={index} alert={alert} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No critical inventory alerts.</p>
                <p className="text-sm">Your inventory levels look healthy!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {purchaseRecommendations.length > 0 ? (
              purchaseRecommendations.slice(0, 5).map((rec, index) => (
                <PurchaseRecommendationCard key={index} recommendation={rec} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No immediate purchase recommendations.</p>
                <p className="text-sm">Your inventory levels are well-managed!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            {stockOptimizations.slice(0, 6).map((optimization, index) => (
              <ItemOptimizationCard 
                key={optimization.itemId} 
                optimization={optimization} 
                onViewDetails={setSelectedItem}
              />
            ))}
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-4">
            <div className="text-center py-8 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Demand forecasting charts coming soon!</p>
              <p className="text-sm">Visual demand predictions and trend analysis</p>
            </div>
          </TabsContent>
        </Tabs>

        {lastUpdated && (
          <div className="text-center pt-4 border-t border-slate-200 mt-6">
            <p className="text-xs text-slate-500">
              Last analyzed: {format(lastUpdated, 'PPpp')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}