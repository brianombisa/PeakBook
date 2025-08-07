import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function PartnerDashboard({ partner, clients, commissions }) {
    const activeClients = clients.filter(c => c.status === 'active');
    const thisMonthCommissions = commissions.filter(c => 
        new Date(c.created_date).getMonth() === new Date().getMonth() &&
        new Date(c.created_date).getFullYear() === new Date().getFullYear()
    );
    
    const lastMonthCommissions = commissions.filter(c => {
        const lastMonth = subMonths(new Date(), 1);
        return new Date(c.created_date).getMonth() === lastMonth.getMonth() &&
               new Date(c.created_date).getFullYear() === lastMonth.getFullYear();
    });

    const thisMonthEarnings = thisMonthCommissions.reduce((sum, c) => sum + c.amount, 0);
    const lastMonthEarnings = lastMonthCommissions.reduce((sum, c) => sum + c.amount, 0);
    const growthRate = lastMonthEarnings > 0 ? 
        ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1) : 0;

    const recentActivities = [
        ...commissions.slice(0, 5).map(c => ({
            type: 'commission',
            date: c.created_date,
            description: `Commission earned: KES ${c.amount.toLocaleString()}`,
            amount: c.amount
        })),
        ...clients.filter(c => c.status === 'active').slice(0, 3).map(c => ({
            type: 'client',
            date: c.onboarding_date,
            description: `New client onboarded: ${c.client_company_name}`,
            amount: null
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    const getNextCommissionTier = () => {
        const currentClients = partner.total_clients_managed;
        if (currentClients < 5) return { tier: 'silver', clients: 5, rate: '20%' };
        if (currentClients < 15) return { tier: 'gold', clients: 15, rate: '25%' };
        if (currentClients < 30) return { tier: 'platinum', clients: 30, rate: '30%' };
        return null;
    };

    const nextTier = getNextCommissionTier();

    return (
        <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Monthly Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-green-700">
                                {growthRate > 0 ? '+' : ''}{growthRate}%
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            vs last month (KES {lastMonthEarnings.toLocaleString()})
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Average per Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-blue-700">
                                KES {activeClients.length > 0 ? 
                                    Math.round(thisMonthEarnings / activeClients.length).toLocaleString() : '0'}
                            </div>
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                            Monthly commission per client
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">Pending Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-purple-700">
                                KES {commissions
                                    .filter(c => c.status === 'pending')
                                    .reduce((sum, c) => sum + c.amount, 0)
                                    .toLocaleString()}
                            </div>
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                            Awaiting payment approval
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tier Progress */}
            {nextTier && (
                <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Tier Progression
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-indigo-700">
                                    Progress to {nextTier.tier.toUpperCase()} ({nextTier.rate} commission rate)
                                </span>
                                <Badge variant="outline" className="text-indigo-700 border-indigo-300">
                                    {partner.total_clients_managed}/{nextTier.clients} clients
                                </Badge>
                            </div>
                            <div className="w-full bg-indigo-200 rounded-full h-2">
                                <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${Math.min((partner.total_clients_managed / nextTier.clients) * 100, 100)}%` 
                                    }}
                                />
                            </div>
                            <p className="text-xs text-indigo-600">
                                {nextTier.clients - partner.total_clients_managed} more clients to unlock higher commission rate
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity & Top Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                    <div>
                                        <p className="text-sm font-medium">{activity.description}</p>
                                        <p className="text-xs text-slate-500">
                                            {format(new Date(activity.date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    {activity.amount && (
                                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                                            +KES {activity.amount.toLocaleString()}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Top Performing Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeClients
                                .sort((a, b) => (b.commission_earned_monthly || 0) - (a.commission_earned_monthly || 0))
                                .slice(0, 5)
                                .map((client, index) => (
                                <div key={client.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                    <div>
                                        <p className="text-sm font-medium">{client.client_company_name}</p>
                                        <p className="text-xs text-slate-500 capitalize">
                                            {client.relationship_type} • {client.access_level.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        KES {(client.commission_earned_monthly || 0).toLocaleString()}/mo
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}