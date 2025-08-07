import React, { useState, useEffect } from 'react';
import { BusinessInsight } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { Expense } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, X, Eye, Sparkles } from 'lucide-react';
import { format, subMonths, isAfter } from 'date-fns';

export default function BusinessInsights() {
  const [insights, setInsights] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userInsights = await BusinessInsight.filter(
        { business_id: user.email, is_dismissed: false }, 
        '-generated_date'
      );
      setInsights(userInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
    setIsLoading(false);
  };

  const generateNewInsights = async () => {
    setIsGenerating(true);
    try {
      const user = await User.me();
      
      // Get business data for analysis
      const [invoices, expenses] = await Promise.all([
        Invoice.filter({ created_by: user.email }, '-invoice_date'),
        Expense.filter({ created_by: user.email }, '-expense_date')
      ]);

      // Calculate key metrics
      const currentMonth = new Date();
      const lastMonth = subMonths(currentMonth, 1);
      
      const currentMonthRevenue = invoices
        .filter(inv => 
          inv.status === 'paid' && 
          isAfter(new Date(inv.invoice_date), lastMonth)
        )
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const lastMonthRevenue = invoices
        .filter(inv => 
          inv.status === 'paid' && 
          isAfter(new Date(inv.invoice_date), subMonths(lastMonth, 1)) &&
          !isAfter(new Date(inv.invoice_date), lastMonth)
        )
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      const currentMonthExpenses = expenses
        .filter(exp => isAfter(new Date(exp.expense_date), lastMonth))
        .reduce((sum, exp) => sum + exp.amount, 0);

      const overdueInvoices = invoices.filter(inv => 
        inv.status !== 'paid' && 
        inv.status !== 'cancelled' &&
        isAfter(new Date(), new Date(inv.due_date))
      );

      // Prepare data for AI analysis
      const businessData = {
        current_month_revenue: currentMonthRevenue,
        last_month_revenue: lastMonthRevenue,
        current_month_expenses: currentMonthExpenses,
        total_outstanding: invoices
          .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
          .reduce((sum, inv) => sum + inv.balance_due, 0),
        overdue_invoices_count: overdueInvoices.length,
        overdue_amount: overdueInvoices.reduce((sum, inv) => sum + inv.balance_due, 0),
        top_expense_categories: getTopExpenseCategories(expenses),
        customer_count: [...new Set(invoices.map(inv => inv.customer_id))].length,
        average_invoice_value: invoices.length > 0 ? 
          invoices.reduce((sum, inv) => sum + inv.total_amount, 0) / invoices.length : 0
      };

      // Generate AI insights
      const aiInsights = await InvokeLLM({
        prompt: `As a business financial advisor, analyze this Kenyan SME's financial data and provide 3-5 actionable insights. Focus on:
        1. Revenue trends and growth opportunities
        2. Cash flow optimization
        3. Expense management
        4. Outstanding receivables management
        5. Business growth recommendations

        Business Data: ${JSON.stringify(businessData, null, 2)}

        Provide insights in this exact JSON format:
        {
          "insights": [
            {
              "type": "revenue_alert|expense_warning|customer_trend|cash_flow_prediction|growth_opportunity",
              "title": "Short impactful title",
              "message": "Detailed actionable insight with specific numbers",
              "priority": "low|medium|high|urgent",
              "suggested_action": "Specific action to take",
              "action_url": "Relevant PeakBooks page like 'Invoicing' or 'Expenses'"
            }
          ]
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  message: { type: "string" },
                  priority: { type: "string" },
                  suggested_action: { type: "string" },
                  action_url: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Save insights to database
      for (const insight of aiInsights.insights) {
        await BusinessInsight.create({
          business_id: user.email,
          insight_type: insight.type,
          title: insight.title,
          message: insight.message,
          priority: insight.priority,
          suggested_action: insight.suggested_action,
          action_url: insight.action_url,
          data_points: businessData,
          generated_date: new Date().toISOString(),
          expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
      }

      await loadInsights();
      toast({
        title: 'Success',
        description: `Generated ${aiInsights.insights.length} new business insights.`
      });

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Error',
        description: 'Could not generate business insights.',
        variant: 'destructive'
      });
    }
    setIsGenerating(false);
  };

  const getTopExpenseCategories = (expenses) => {
    const categories = {};
    expenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  };

  const markAsRead = async (insightId) => {
    try {
      await BusinessInsight.update(insightId, { is_read: true });
      await loadInsights();
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const dismissInsight = async (insightId) => {
    try {
      await BusinessInsight.update(insightId, { is_dismissed: true });
      await loadInsights();
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  };

  const typeIcons = {
    revenue_alert: TrendingUp,
    expense_warning: AlertTriangle,
    customer_trend: Brain,
    cash_flow_prediction: Sparkles,
    growth_opportunity: Lightbulb
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-800">Business Insights</h2>
        </div>
        <Button 
          onClick={generateNewInsights}
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-200" />
            <h3 className="text-xl font-bold mb-2">AI-Powered Business Intelligence</h3>
            <p className="text-purple-100 mb-4">
              Get personalized insights based on your business data to optimize performance and growth.
            </p>
            <Button 
              onClick={generateNewInsights}
              disabled={isGenerating}
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              {isGenerating ? 'Generating...' : 'Get My First Insights'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {insights.map((insight) => {
            const IconComponent = typeIcons[insight.insight_type] || Lightbulb;
            return (
              <Card 
                key={insight.id} 
                className={`border-l-4 ${
                  insight.priority === 'urgent' ? 'border-l-red-500' :
                  insight.priority === 'high' ? 'border-l-orange-500' :
                  insight.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                } ${!insight.is_read ? 'bg-blue-50' : 'bg-white'}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-full bg-purple-100">
                        <IconComponent className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                          <Badge className={`${priorityColors[insight.priority]} border text-xs`}>
                            {insight.priority}
                          </Badge>
                          {!insight.is_read && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-slate-600 mb-3">{insight.message}</p>
                        <div className="bg-slate-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-slate-700">Recommended Action:</p>
                          <p className="text-sm text-slate-600">{insight.suggested_action}</p>
                        </div>
                        <div className="flex gap-2">
                          {insight.action_url && (
                            <Button 
                              size="sm" 
                              onClick={() => window.location.href = `/pages/${insight.action_url}`}
                            >
                              Take Action
                            </Button>
                          )}
                          {!insight.is_read && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsRead(insight.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissInsight(insight.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Generated {format(new Date(insight.generated_date), 'PPP')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}