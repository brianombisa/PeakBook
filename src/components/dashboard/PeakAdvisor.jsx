
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvokeLLM } from '@/api/integrations';
import { ConsultationRequest } from '@/api/entities';
import { 
    Bot, 
    TrendingUp, 
    AlertTriangle, 
    Lightbulb, 
    Target, 
    RefreshCw,
    ChevronRight,
    DollarSign,
    BarChart3,
    Users,
    Zap,
    LifeBuoy,
    Send
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PeakAdvisor({ 
    user,
    invoices = [], 
    expenses = [], 
    transactions = [], 
    customers = [],
    companyProfile = null 
}) {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [consultationMessage, setConsultationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (invoices.length > 0 || expenses.length > 0) {
            generateInsights();
        }
    }, [invoices.length, expenses.length, transactions.length]);

    const getBusinessDataSnapshot = () => ({
        company_name: companyProfile?.company_name || "Your Business",
        business_sector: companyProfile?.business_sector || "general",
        total_invoices: invoices.length,
        total_revenue: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        paid_revenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        overdue_invoices: invoices.filter(inv => inv.status === 'overdue').length,
        total_expenses: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        total_customers: customers.length,
        recent_transactions: transactions.slice(0, 10),
        expense_categories: expenses.reduce((cats, exp) => {
            cats[exp.category] = (cats[exp.category] || 0) + exp.amount;
            return cats;
        }, {}),
        avg_invoice_value: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total_amount, 0) / invoices.length : 0,
        payment_terms_analysis: invoices.reduce((terms, inv) => {
            const daysToPay = inv.status === 'paid' ? 
                Math.floor((new Date(inv.updated_date) - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24)) : null;
            if (daysToPay !== null) terms.push(daysToPay);
            return terms;
        }, [])
    });

    const handleRequestConsultation = async () => {
        if (!consultationMessage) {
            toast({ title: "Message required", description: "Please tell us what you'd like to discuss.", variant: "destructive" });
            return;
        }
        if (!user || !companyProfile) {
            toast({ title: "Error", description: "User or company profile not available. Cannot send request.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Save the consultation request to the database
            await ConsultationRequest.create({
                company_id: companyProfile.id,
                company_name: companyProfile.company_name,
                user_id: user.id,
                user_name: user.full_name,
                user_email: user.email,
                request_message: consultationMessage,
            });

            // Show success message
            toast({
                title: "Request Sent!",
                description: "Your consultation request has been submitted successfully. Our team will review it and contact you shortly.",
                className: "bg-green-100 border-green-300 text-green-800"
            });
            
            setConsultationMessage("");
        } catch (error) {
            console.error("Failed to save consultation request", error);
            toast({ 
                title: "Submission Failed", 
                description: "Could not save your request. Please check your connection and try again.", 
                variant: "destructive" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateInsights = async () => {
        setIsLoading(true);
        try {
            // Prepare business data for AI analysis
            const businessData = getBusinessDataSnapshot();

            const prompt = `You are PeakAdvisor, an expert business consultant and financial advisor for Kenyan SMEs. 

Analyze this business data and provide 4-5 strategic insights and actionable recommendations:

Business: ${businessData.company_name}
Sector: ${businessData.business_sector}
Total Revenue: KES ${businessData.total_revenue.toLocaleString()}
Paid Revenue: KES ${businessData.paid_revenue.toLocaleString()}
Total Expenses: KES ${businessData.total_expenses.toLocaleString()}
Customers: ${businessData.total_customers}
Overdue Invoices: ${businessData.overdue_invoices}
Average Invoice: KES ${businessData.avg_invoice_value.toLocaleString()}

Top Expense Categories: ${Object.entries(businessData.expense_categories).slice(0, 3).map(([cat, amt]) => `${cat}: KES ${amt.toLocaleString()}`).join(', ')}

Provide insights in this exact JSON format - be direct, actionable, and Kenya-focused:

{
  "insights": [
    {
      "type": "opportunity|warning|trend|action",
      "priority": "high|medium|low",
      "title": "Short insight title",
      "message": "Detailed explanation with specific numbers",
      "action": "Specific action to take",
      "impact": "Expected business impact"
    }
  ]
}

Focus on: cash flow, profitability, customer management, expense optimization, growth opportunities. Use Kenyan business context.`;

            const response = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        insights: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    priority: { type: "string" },
                                    title: { type: "string" },
                                    message: { type: "string" },
                                    action: { type: "string" },
                                    impact: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (response?.insights) {
                setInsights(response.insights);
                setLastUpdated(new Date());
                toast({
                    title: "PeakAdvisor Updated",
                    description: `Generated ${response.insights.length} new business insights.`,
                    className: "bg-blue-50 border-blue-200 text-blue-800"
                });
            }

        } catch (error) {
            console.error('Error generating business insights:', error);
            toast({
                title: "PeakAdvisor Error",
                description: "Could not generate insights. Please try again.",
                variant: "destructive"
            });
            
            // Fallback insights using current data
            const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
            
            setInsights([
                {
                    type: "trend",
                    priority: "medium",
                    title: "Revenue Analysis",
                    message: `Your business has generated KES ${paidRevenue.toLocaleString()} in confirmed revenue from ${invoices.length} invoices.`,
                    action: "Review your pricing strategy and consider upselling to existing customers.",
                    impact: "Could increase average transaction value by 15-25%"
                },
                {
                    type: "warning",
                    priority: overdueCount > 3 ? "high" : "low",
                    title: "Payment Collection",
                    message: `You have ${overdueCount} overdue invoices that need attention.`,
                    action: "Implement automated payment reminders and follow up on overdue accounts.",
                    impact: "Improve cash flow and reduce bad debt losses"
                }
            ]);
        }
        setIsLoading(false);
    };

    const getInsightIcon = (type) => {
        switch(type) {
            case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'trend': return <BarChart3 className="w-5 h-5 text-blue-600" />;
            case 'action': return <Target className="w-5 h-5 text-purple-600" />;
            default: return <Lightbulb className="w-5 h-5 text-amber-600" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getInsightColor = (type) => {
        switch(type) {
            case 'opportunity': return 'border-green-200 bg-green-50';
            case 'warning': return 'border-red-200 bg-red-50';
            case 'trend': return 'border-blue-200 bg-blue-50';
            case 'action': return 'border-purple-200 bg-purple-50';
            default: return 'border-amber-220 bg-amber-50';
        }
    };

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                        <Bot className="w-6 h-6" />
                        PeakAdvisor
                        <Badge className="bg-white/20 text-white border-white/30">AI-Powered</Badge>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={generateInsights}
                        disabled={isLoading}
                        className="text-white hover:bg-white/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <p className="text-indigo-100 text-sm">
                    Your AI business consultant & direct line to expert help
                </p>
            </CardHeader>
            
            <Tabs defaultValue="insights" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-indigo-500/10 rounded-none">
                    <TabsTrigger value="insights" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                        <Bot className="w-4 h-4 mr-2" /> AI Insights
                    </TabsTrigger>
                    <TabsTrigger value="consultant" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                        <LifeBuoy className="w-4 h-4 mr-2" /> Expert Help
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-600 font-medium">Analyzing your business...</p>
                                <p className="text-slate-500 text-sm">PeakAdvisor is generating insights</p>
                            </div>
                        </div>
                    ) : insights.length === 0 ? (
                        <div className="text-center py-12">
                            <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Welcome to PeakAdvisor</h3>
                            <p className="text-slate-500 mb-6">
                                Your AI business consultant is ready to analyze your financial data and provide strategic insights.
                            </p>
                            <Button onClick={generateInsights} className="bg-indigo-600 hover:bg-indigo-700">
                                <Zap className="w-4 h-4 mr-2" />
                                Generate Business Insights
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {insights.map((insight, index) => (
                                <Card 
                                    key={index} 
                                    className={`border-l-4 ${getInsightColor(insight.type)} hover:shadow-md transition-shadow`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getInsightIcon(insight.type)}
                                                <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                                            </div>
                                            <Badge className={`${getPriorityColor(insight.priority)} border text-xs`}>
                                                {insight.priority} priority
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-slate-700 mb-3 text-sm leading-relaxed">
                                            {insight.message}
                                        </p>
                                        
                                        <div className="bg-white/60 rounded-lg p-3 mb-3">
                                            <p className="text-xs font-medium text-slate-600 mb-1">RECOMMENDED ACTION:</p>
                                            <p className="text-sm text-slate-800 flex items-start gap-2">
                                                <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                                {insight.action}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <DollarSign className="w-3 h-3" />
                                            <span className="font-medium">Expected Impact:</span>
                                            <span>{insight.impact}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            
                            {lastUpdated && (
                                <div className="text-center pt-4 border-t border-indigo-200">
                                    <p className="text-xs text-slate-500">
                                        Last updated: {lastUpdated.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="consultant" className="p-6">
                    <Card className="bg-white/80 border border-slate-200 shadow-inner">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <LifeBuoy className="w-6 h-6 text-indigo-600" />
                                Request a Free Consultation
                            </CardTitle>
                            <CardDescription>
                                Based on your performance, you may need to speak to one of our consultants. Get personalized advice to accelerate your growth.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Tell us what's on your mind. (e.g., 'I need help with my cash flow planning', 'How can I improve my profit margins?')"
                                value={consultationMessage}
                                onChange={(e) => setConsultationMessage(e.target.value)}
                                className="h-28"
                            />
                            <Button 
                                onClick={handleRequestConsultation} 
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Request to Consultant
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
