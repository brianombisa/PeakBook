import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, Users, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils';

const actions = {
    retail: [{ label: 'New POS Sale', icon: FileText, url: createPageUrl('Invoicing') }, { label: 'Add Inventory', icon: CreditCard, url: createPageUrl('Inventory') }, { label: 'View Customers', icon: Users, url: createPageUrl('Invoicing') + '?tab=customers' }],
    professional_services: [{ label: 'New Invoice', icon: FileText, url: createPageUrl('Invoicing') }, { label: 'Track Expense', icon: CreditCard, url: createPageUrl('Expenses') }, { label: 'Manage Clients', icon: Users, url: createPageUrl('Invoicing') + '?tab=customers' }],
    default: [{ label: 'New Invoice', icon: FileText, url: createPageUrl('Invoicing') }, { label: 'New Expense', icon: CreditCard, url: createPageUrl('Expenses') }, { label: 'View Reports', icon: Users, url: createPageUrl('Reports') }],
};

export default function QuickActions({ companyProfile }) {
    const sector = companyProfile?.business_sector || 'default';
    const sectorActions = actions[sector] || actions.default;
    
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <Zap className="w-6 h-6 text-blue-600" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3">
                    {sectorActions.map(action => (
                        <Button key={action.label} variant="outline" className="w-full justify-start h-12 text-base" onClick={() => window.location.href = action.url}>
                            <action.icon className="w-5 h-5 mr-3" />
                            {action.label}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    );
}