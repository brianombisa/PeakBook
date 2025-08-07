import { InvokeLLM } from '@/api/integrations';
import { format, subDays, addDays, differenceInDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

class InventoryIntelligenceService {
  /**
   * Main inventory intelligence engine that predicts demand and optimizes stock levels
   */
  static async analyzeInventoryOptimization({
    items = [],
    invoices = [],
    transactions = [],
    expenses = [],
    companyProfile = null
  }) {
    try {
      // Only analyze trackable items
      const trackableItems = items.filter(item => item.is_trackable);
      
      if (trackableItems.length === 0) {
        return {
          success: false,
          error: 'No trackable items found. Please enable stock tracking for your inventory items.',
          stockOptimizations: [],
          purchaseRecommendations: [],
          inventoryAlerts: [],
          demandForecasts: [],
          summary: null
        };
      }

      // 1. Analyze each trackable item's performance
      const itemAnalyses = trackableItems.map(item => 
        this.analyzeItemPerformance(item, invoices, expenses)
      );

      // 2. Generate demand forecasts using AI
      const demandForecasts = await this.generateDemandForecasts(itemAnalyses, companyProfile);

      // 3. Calculate optimal stock levels
      const stockOptimizations = demandForecasts.map(forecast => 
        this.calculateOptimalStock(forecast)
      );

      // 4. Generate purchase recommendations
      const purchaseRecommendations = this.generatePurchaseRecommendations(stockOptimizations);

      // 5. Identify critical inventory issues
      const inventoryAlerts = this.generateInventoryAlerts(stockOptimizations);

      // 6. Calculate financial impact
      const financialImpact = this.calculateFinancialImpact(stockOptimizations);

      return {
        success: true,
        itemAnalyses: itemAnalyses.sort((a, b) => b.totalRevenue - a.totalRevenue),
        demandForecasts,
        stockOptimizations: stockOptimizations.sort((a, b) => b.stockoutRisk - a.stockoutRisk),
        purchaseRecommendations: purchaseRecommendations.sort((a, b) => {
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
        inventoryAlerts: inventoryAlerts.sort((a, b) => {
          const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
        financialImpact,
        summary: this.generateInventorySummary(stockOptimizations, financialImpact)
      };

    } catch (error) {
      console.error('Error in inventory intelligence analysis:', error);
      return {
        success: false,
        error: error.message,
        stockOptimizations: [],
        purchaseRecommendations: [],
        inventoryAlerts: [],
        demandForecasts: [],
        summary: null
      };
    }
  }

  /**
   * Analyze individual item performance and sales patterns
   */
  static analyzeItemPerformance(item, invoices, expenses) {
    // Get all sales of this item
    const itemSales = [];
    invoices.forEach(invoice => {
      const lineItems = invoice.line_items || [];
      lineItems.forEach(lineItem => {
        if (lineItem.item_id === item.id) {
          itemSales.push({
            date: new Date(invoice.invoice_date),
            quantity: lineItem.quantity,
            revenue: lineItem.total,
            unitPrice: lineItem.unit_price,
            costPrice: lineItem.cost_price || item.unit_cost || 0
          });
        }
      });
    });

    // Get purchases/restocks from expenses
    const itemPurchases = [];
    expenses.forEach(expense => {
      if (expense.description && expense.description.toLowerCase().includes(item.item_name.toLowerCase())) {
        itemPurchases.push({
          date: new Date(expense.expense_date),
          amount: expense.amount,
          estimatedQuantity: Math.floor(expense.amount / (item.unit_cost || 1))
        });
      }
    });

    // Calculate key metrics
    const totalQuantitySold = itemSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = itemSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalCost = itemSales.reduce((sum, sale) => sum + (sale.quantity * sale.costPrice), 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate velocity metrics
    const salesDates = itemSales.map(sale => sale.date).sort((a, b) => a - b);
    const firstSale = salesDates.length > 0 ? salesDates[0] : null;
    const lastSale = salesDates.length > 0 ? salesDates[salesDates.length - 1] : null;
    const daysBetweenFirstAndLast = firstSale && lastSale ? 
      Math.max(1, differenceInDays(lastSale, firstSale)) : 1;
    
    const dailyVelocity = totalQuantitySold / daysBetweenFirstAndLast;
    const weeklyVelocity = dailyVelocity * 7;
    const monthlyVelocity = dailyVelocity * 30;

    // Analyze seasonal patterns
    const monthlySales = this.analyzeMonthlySalesPattern(itemSales);
    
    // Stock status analysis
    const currentStock = item.current_stock || 0;
    const reorderLevel = item.reorder_level || 0;
    const daysOfStockRemaining = dailyVelocity > 0 ? currentStock / dailyVelocity : 999;

    return {
      itemId: item.id,
      itemName: item.item_name,
      currentStock,
      reorderLevel,
      unitCost: item.unit_cost || 0,
      unitPrice: item.unit_price,
      totalQuantitySold,
      totalRevenue,
      grossProfit,
      profitMargin,
      dailyVelocity,
      weeklyVelocity,
      monthlyVelocity,
      daysOfStockRemaining,
      monthlySales,
      itemPurchases,
      lastSale,
      salesTrend: this.calculateSalesTrend(itemSales),
      stockTurnover: totalQuantitySold > 0 ? totalQuantitySold / Math.max(1, currentStock) : 0
    };
  }

  /**
   * Generate AI-powered demand forecasts
   */
  static async generateDemandForecasts(itemAnalyses, companyProfile) {
    const forecasts = [];

    for (const analysis of itemAnalyses.slice(0, 10)) { // Limit to top 10 items for performance
      try {
        const prompt = `You are an inventory demand forecasting AI for a ${companyProfile?.business_sector || 'general'} business in Kenya.

Analyze this product's sales data and forecast demand:

Product: ${analysis.itemName}
Current Stock: ${analysis.currentStock} units
Daily Sales Velocity: ${analysis.dailyVelocity.toFixed(2)} units/day
Weekly Sales: ${analysis.weeklyVelocity.toFixed(1)} units/week
Monthly Sales: ${analysis.monthlyVelocity.toFixed(1)} units/month
Profit Margin: ${analysis.profitMargin.toFixed(1)}%
Stock Turnover: ${analysis.stockTurnover.toFixed(2)}x
Days of Stock Remaining: ${analysis.daysOfStockRemaining.toFixed(1)} days
Sales Trend: ${analysis.salesTrend}

Monthly Sales Pattern: ${JSON.stringify(analysis.monthlySales)}

Provide a demand forecast in JSON format:

{
  "next30DaysDemand": number,
  "next60DaysDemand": number,
  "next90DaysDemand": number,
  "seasonalAdjustment": number (1.0 = no adjustment, >1.0 = higher demand expected),
  "confidenceLevel": number (0-100),
  "demandVariability": "low" | "medium" | "high",
  "forecastReasoning": "string explaining the forecast logic"
}

Consider:
- Seasonal trends for Kenyan market
- Recent sales velocity
- Stock turnover patterns
- Business sector context`;

        const response = await InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              next30DaysDemand: { type: "number" },
              next60DaysDemand: { type: "number" },
              next90DaysDemand: { type: "number" },
              seasonalAdjustment: { type: "number" },
              confidenceLevel: { type: "number" },
              demandVariability: { type: "string" },
              forecastReasoning: { type: "string" }
            }
          }
        });

        forecasts.push({
          ...analysis,
          ...response,
          forecastDate: new Date()
        });

      } catch (error) {
        console.error(`Error forecasting demand for ${analysis.itemName}:`, error);
        
        // Fallback: Simple mathematical forecast
        const avgDemand = analysis.monthlyVelocity || 0;
        forecasts.push({
          ...analysis,
          next30DaysDemand: avgDemand,
          next60DaysDemand: avgDemand * 2,
          next90DaysDemand: avgDemand * 3,
          seasonalAdjustment: 1.0,
          confidenceLevel: 60,
          demandVariability: 'medium',
          forecastReasoning: 'Based on historical average due to AI unavailability',
          forecastDate: new Date()
        });
      }
    }

    return forecasts;
  }

  /**
   * Calculate optimal stock levels based on demand forecasts
   */
  static calculateOptimalStock(forecast) {
    const {
      itemId,
      itemName,
      currentStock,
      reorderLevel,
      dailyVelocity,
      next30DaysDemand,
      next60DaysDemand,
      demandVariability,
      confidenceLevel
    } = forecast;

    // Calculate safety stock based on demand variability
    const safetyStockMultiplier = {
      'low': 1.2,
      'medium': 1.5,
      'high': 2.0
    }[demandVariability] || 1.5;

    const recommendedSafetyStock = Math.ceil(next30DaysDemand * 0.2 * safetyStockMultiplier);
    const optimalStock = Math.ceil(next30DaysDemand + recommendedSafetyStock);

    // Calculate risks
    const stockoutRisk = this.calculateStockoutRisk(currentStock, next30DaysDemand, demandVariability);
    const overStockRisk = this.calculateOverstockRisk(currentStock, next30DaysDemand, dailyVelocity);

    // Generate recommendation
    const recommendation = this.generateStockRecommendation({
      currentStock,
      optimalStock,
      stockoutRisk,
      overStockRisk,
      reorderLevel,
      next30DaysDemand
    });

    return {
      ...forecast,
      recommendedSafetyStock,
      optimalStock,
      stockoutRisk,
      overStockRisk,
      recommendation,
      stockGap: optimalStock - currentStock,
      daysUntilStockout: dailyVelocity > 0 ? Math.max(0, currentStock / dailyVelocity) : 999
    };
  }

  /**
   * Calculate stockout risk percentage
   */
  static calculateStockoutRisk(currentStock, demandForecast, demandVariability) {
    if (demandForecast === 0) return 0;

    const demandRatio = currentStock / demandForecast;
    const variabilityMultiplier = {
      'low': 1.0,
      'medium': 1.2,
      'high': 1.5
    }[demandVariability] || 1.2;

    const adjustedRatio = demandRatio / variabilityMultiplier;

    if (adjustedRatio >= 1.5) return 5;   // Very low risk
    if (adjustedRatio >= 1.0) return 15;  // Low risk
    if (adjustedRatio >= 0.7) return 35;  // Medium risk
    if (adjustedRatio >= 0.4) return 65;  // High risk
    if (adjustedRatio >= 0.2) return 85;  // Very high risk
    return 95; // Critical risk
  }

  /**
   * Calculate overstock risk percentage
   */
  static calculateOverstockRisk(currentStock, demandForecast, dailyVelocity) {
    if (dailyVelocity === 0 || demandForecast === 0) return 0;

    const monthsOfStock = currentStock / Math.max(1, demandForecast);

    if (monthsOfStock <= 1.5) return 0;   // No overstock
    if (monthsOfStock <= 2.5) return 20;  // Slight overstock
    if (monthsOfStock <= 4.0) return 45;  // Moderate overstock
    if (monthsOfStock <= 6.0) return 70;  // High overstock
    return 90; // Severe overstock
  }

  /**
   * Generate stock recommendation
   */
  static generateStockRecommendation({
    currentStock,
    optimalStock,
    stockoutRisk,
    overStockRisk,
    reorderLevel,
    next30DaysDemand
  }) {
    if (stockoutRisk >= 90) {
      return {
        action: 'emergency_order',
        message: 'URGENT: Emergency reorder required immediately!',
        quantity: Math.max(optimalStock - currentStock, next30DaysDemand),
        timeframe: 'Immediate - within 24 hours',
        priority: 'critical'
      };
    }

    if (stockoutRisk >= 65) {
      return {
        action: 'reorder_now',
        message: 'Reorder now to prevent stockout',
        quantity: optimalStock - currentStock,
        timeframe: 'Within 3-5 days',
        priority: 'high'
      };
    }

    if (currentStock <= reorderLevel) {
      return {
        action: 'reorder_soon',
        message: 'Below reorder level - order when convenient',
        quantity: optimalStock - currentStock,
        timeframe: 'Within 1-2 weeks',
        priority: 'medium'
      };
    }

    if (overStockRisk >= 70) {
      return {
        action: 'reduce_stock',
        message: 'Consider promotional pricing to reduce excess stock',
        quantity: 0,
        timeframe: 'Plan promotion within 30 days',
        priority: 'low'
      };
    }

    return {
      action: 'maintain',
      message: 'Stock levels are optimal',
      quantity: 0,
      timeframe: 'Monitor regularly',
      priority: 'low'
    };
  }

  /**
   * Generate purchase recommendations
   */
  static generatePurchaseRecommendations(stockOptimizations) {
    return stockOptimizations
      .filter(opt => opt.recommendation.quantity > 0)
      .map(opt => ({
        itemId: opt.itemId,
        itemName: opt.itemName,
        currentStock: opt.currentStock,
        recommendedQuantity: opt.recommendation.quantity,
        urgency: opt.recommendation.timeframe,
        priority: opt.recommendation.priority,
        reason: opt.recommendation.message,
        potentialLostSales: this.calculatePotentialLostSales(opt),
        estimatedCost: opt.recommendation.quantity * opt.unitCost,
        expectedRevenue: opt.recommendation.quantity * opt.unitPrice
      }));
  }

  /**
   * Generate inventory alerts
   */
  static generateInventoryAlerts(stockOptimizations) {
    const alerts = [];

    stockOptimizations.forEach(opt => {
      const { itemName, stockoutRisk, overStockRisk, recommendation, daysUntilStockout } = opt;

      // Critical stockout alerts
      if (stockoutRisk >= 90) {
        alerts.push({
          severity: 'critical',
          itemName,
          message: `Critical: ${itemName} will stock out in ${Math.floor(daysUntilStockout)} days`,
          action: 'Place emergency order immediately',
          impact: 'Lost sales, disappointed customers, revenue loss'
        });
      }

      // High stockout risk
      if (stockoutRisk >= 65 && stockoutRisk < 90) {
        alerts.push({
          severity: 'high',
          itemName,
          message: `High stockout risk for ${itemName} (${stockoutRisk}% risk)`,
          action: 'Reorder within 3-5 days',
          impact: 'Potential lost sales and customer dissatisfaction'
        });
      }

      // Overstock alerts
      if (overStockRisk >= 70) {
        alerts.push({
          severity: 'medium',
          itemName,
          message: `Excess stock detected for ${itemName}`,
          action: 'Consider promotional pricing or bundling',
          impact: 'Capital tied up, potential obsolescence'
        });
      }

      // Slow-moving stock
      if (opt.stockTurnover < 2 && opt.currentStock > 0) {
        alerts.push({
          severity: 'low',
          itemName,
          message: `${itemName} is slow-moving (${opt.stockTurnover.toFixed(1)}x turnover)`,
          action: 'Review pricing strategy or discontinue',
          impact: 'Capital efficiency, storage costs'
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate financial impact of inventory optimization
   */
  static calculateFinancialImpact(stockOptimizations) {
    let totalPotentialRevenueLoss = 0;
    let totalCapitalTiedUp = 0;
    let totalOptimizationOpportunity = 0;
    let totalReorderCost = 0;

    stockOptimizations.forEach(opt => {
      // Revenue loss from stockouts
      if (opt.stockoutRisk >= 50) {
        const potentialLoss = opt.next30DaysDemand * opt.unitPrice * (opt.stockoutRisk / 100) * 0.5;
        totalPotentialRevenueLoss += potentialLoss;
      }

      // Capital tied up in excess stock
      if (opt.overStockRisk >= 50) {
        const excessStock = Math.max(0, opt.currentStock - opt.next30DaysDemand);
        totalCapitalTiedUp += excessStock * opt.unitCost;
      }

      // Optimization opportunity
      if (opt.recommendation.quantity > 0) {
        const expectedProfit = opt.recommendation.quantity * (opt.unitPrice - opt.unitCost);
        totalOptimizationOpportunity += expectedProfit;
        totalReorderCost += opt.recommendation.quantity * opt.unitCost;
      }
    });

    return {
      totalPotentialRevenueLoss,
      totalCapitalTiedUp,
      totalOptimizationOpportunity,
      totalReorderCost,
      netBenefit: totalOptimizationOpportunity - totalPotentialRevenueLoss,
      roiProjection: totalReorderCost > 0 ? ((totalOptimizationOpportunity / totalReorderCost) * 100) : 0
    };
  }

  /**
   * Generate inventory summary
   */
  static generateInventorySummary(stockOptimizations, financialImpact) {
    const totalItems = stockOptimizations.length;
    const criticalItems = stockOptimizations.filter(opt => opt.stockoutRisk >= 90).length;
    const lowStockItems = stockOptimizations.filter(opt => opt.stockoutRisk >= 50).length;
    const healthyStockItems = stockOptimizations.filter(opt => opt.stockoutRisk < 30 && opt.overStockRisk < 30).length;
    const overstockItems = stockOptimizations.filter(opt => opt.overStockRisk >= 70).length;

    let keyInsight = "Your inventory levels are well-balanced.";
    
    if (criticalItems > 0) {
      keyInsight = `${criticalItems} items need immediate attention to prevent stockouts.`;
    } else if (lowStockItems > totalItems * 0.3) {
      keyInsight = `${lowStockItems} items have low stock levels. Consider bulk reordering.`;
    } else if (overstockItems > totalItems * 0.2) {
      keyInsight = `${overstockItems} items are overstocked. Consider promotional strategies.`;
    }

    return {
      totalItems,
      criticalItems,
      lowStockItems,
      healthyStockItems,
      overstockItems,
      keyInsight,
      financialImpact
    };
  }

  // Helper methods
  static analyzeMonthlySalesPattern(itemSales) {
    const monthlyData = {};
    itemSales.forEach(sale => {
      const month = format(sale.date, 'MMM');
      monthlyData[month] = (monthlyData[month] || 0) + sale.quantity;
    });
    return monthlyData;
  }

  static calculateSalesTrend(itemSales) {
    if (itemSales.length < 4) return 'insufficient_data';
    
    const sortedSales = itemSales.sort((a, b) => a.date - b.date);
    const firstHalf = sortedSales.slice(0, Math.floor(sortedSales.length / 2));
    const secondHalf = sortedSales.slice(Math.floor(sortedSales.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, sale) => sum + sale.quantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, sale) => sum + sale.quantity, 0) / secondHalf.length;
    
    const growthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (growthRate > 20) return 'growing';
    if (growthRate < -20) return 'declining';
    return 'stable';
  }

  static calculatePotentialLostSales(optimization) {
    const { stockoutRisk, next30DaysDemand, unitPrice } = optimization;
    return (stockoutRisk / 100) * next30DaysDemand * unitPrice * 0.7; // 70% likelihood of actual loss
  }
}

export default InventoryIntelligenceService;