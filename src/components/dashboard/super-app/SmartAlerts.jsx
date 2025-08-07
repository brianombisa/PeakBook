import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lightbulb, TrendingUp, Info } from 'lucide-react';

const insightIcons = {
    revenue_alert: <TrendingUp className="w-5 h-5 text-green-500" />,
    expense_warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    customer_trend: <Info className="w-5 h-5 text-blue-500" />,
    cash_flow_prediction: <Lightbulb className="w-5 h-5 text-purple-500" />,
    default: <Lightbulb className="w-5 h-5 text-purple-500" />,
};

export default function SmartAlerts({ insights }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                        <Lightbulb className="w-7 h-7 text-purple-500" />
                        Your AI Co-founder Says...
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {insights.length > 0 ? (
                        insights.map((insight, index) => (
                            <div key={insight.id} className="p-4 bg-slate-50 rounded-lg flex items-start gap-4 hover:bg-slate-100 transition-colors">
                                <div className="flex-shrink-0 mt-1">
                                    {insightIcons[insight.insight_type] || insightIcons.default}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                                    <p className="text-sm text-slate-600">{insight.message}</p>
                                    {insight.suggested_action && (
                                        <button className="text-sm text-blue-600 hover:underline mt-2 font-medium">
                                            {insight.suggested_action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <p>No new insights at the moment. Keep your books updated!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}