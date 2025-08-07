import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { AccountantPartner } from '@/api/entities';
import { PartnerClientRelationship } from '@/api/entities';
import { PartnerCommission } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
    Users, DollarSign, TrendingUp, Calendar, 
    Building2, Eye, Settings, Plus,
    Award, Briefcase, FileText, BarChart
} from 'lucide-react';
import PartnerDashboard from '../components/partner/PartnerDashboard';
import ClientManagement from '../components/partner/ClientManagement';
import CommissionTracker from '../components/partner/CommissionTracker';
import PartnerSettings from '../components/partner/PartnerSettings';

export default function PartnerPortal() {
    const [partnerData, setPartnerData] = useState(null);
    const [clients, setClients] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        loadPartnerData();
    }, []);

    const loadPartnerData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            // Find partner record for this user
            const partners = await AccountantPartner.filter({ email: currentUser.email });
            if (partners.length === 0) {
                toast({
                    title: 'Access Denied',
                    description: 'You are not registered as a partner. Please contact support.',
                    variant: 'destructive'
                });
                return;
            }

            const partner = partners[0];
            setPartnerData(partner);

            // Load client relationships
            const clientRelationships = await PartnerClientRelationship.filter({ 
                partner_id: partner.id 
            });
            setClients(clientRelationships);

            // Load commission history
            const commissionHistory = await PartnerCommission.filter({ 
                partner_id: partner.id 
            }, '-created_date', 50);
            setCommissions(commissionHistory);

        } catch (error) {
            console.error('Error loading partner data:', error);
            toast({
                title: 'Error',
                description: 'Could not load partner information.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-slate-700">Loading Partner Portal...</h2>
                </div>
            </div>
        );
    }

    if (!partnerData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-800">Access Restricted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-700 mb-4">
                            You need to be registered as an accountant partner to access this portal.
                        </p>
                        <Button onClick={() => window.location.href = '/contact'} className="w-full">
                            Contact Us to Become a Partner
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-800">Partner Portal</h1>
                            <p className="text-indigo-600 mt-2">
                                Welcome back, {partnerData.contact_person} from {partnerData.firm_name}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                                <Award className="w-4 h-4 mr-1" />
                                {partnerData.commission_tier?.toUpperCase()} Partner
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 px-3 py-1">
                                {partnerData.total_clients_managed} Clients
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Active Clients</p>
                                    <p className="text-3xl font-bold text-slate-800">
                                        {clients.filter(c => c.status === 'active').length}
                                    </p>
                                </div>
                                <Users className="w-8 h-8 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">This Month's Earnings</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        KES {commissions
                                            .filter(c => c.status === 'approved' && 
                                                new Date(c.created_date).getMonth() === new Date().getMonth())
                                            .reduce((sum, c) => sum + c.amount, 0)
                                            .toLocaleString()}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Total Lifetime Earnings</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        KES {partnerData.total_earnings?.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Commission Rate</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {(partnerData.commission_rate * 100).toFixed(0)}%
                                    </p>
                                </div>
                                <BarChart className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <BarChart className="w-4 h-4" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> My Clients
                        </TabsTrigger>
                        <TabsTrigger value="commissions" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Commissions
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        <PartnerDashboard 
                            partner={partnerData}
                            clients={clients}
                            commissions={commissions}
                        />
                    </TabsContent>

                    <TabsContent value="clients" className="space-y-6">
                        <ClientManagement 
                            partner={partnerData}
                            clients={clients}
                            onRefresh={loadPartnerData}
                        />
                    </TabsContent>

                    <TabsContent value="commissions" className="space-y-6">
                        <CommissionTracker 
                            partner={partnerData}
                            commissions={commissions}
                            clients={clients}
                        />
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <PartnerSettings 
                            partner={partnerData}
                            onUpdate={loadPartnerData}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}