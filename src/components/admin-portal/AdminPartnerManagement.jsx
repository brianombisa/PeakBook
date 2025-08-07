import React, { useState, useEffect } from 'react';
import { AccountantPartner } from '@/api/entities';
import { PartnerClientRelationship } from '@/api/entities';
import { PartnerCommission } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
    Users, DollarSign, TrendingUp, Clock, 
    CheckCircle, XCircle, Eye, Settings,
    AlertTriangle, Award, FileText, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPartnerManagement() {
    const [partners, setPartners] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPartner, setSelectedPartner] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        loadPartnerData();
    }, []);

    const loadPartnerData = async () => {
        setIsLoading(true);
        try {
            const [partnersData, relationshipsData, commissionsData] = await Promise.all([
                AccountantPartner.list('-created_date'),
                PartnerClientRelationship.list('-created_date'),
                PartnerCommission.list('-created_date', 100)
            ]);
            
            setPartners(partnersData);
            setRelationships(relationshipsData);
            setCommissions(commissionsData);
        } catch (error) {
            console.error('Error loading partner data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load partner data.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprovePartner = async (partnerId) => {
        try {
            await AccountantPartner.update(partnerId, { 
                status: 'active',
                joined_date: new Date().toISOString().split('T')[0]
            });
            toast({
                title: 'Partner Approved',
                description: 'Partner has been activated and notified.',
            });
            loadPartnerData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve partner.',
                variant: 'destructive'
            });
        }
    };

    const handleRejectPartner = async (partnerId) => {
        try {
            await AccountantPartner.update(partnerId, { status: 'terminated' });
            toast({
                title: 'Partner Rejected',
                description: 'Partner application has been rejected.',
            });
            loadPartnerData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to reject partner.',
                variant: 'destructive'
            });
        }
    };

    const handleApproveCommission = async (commissionId) => {
        try {
            await PartnerCommission.update(commissionId, { 
                status: 'approved',
                payment_date: new Date().toISOString().split('T')[0]
            });
            toast({
                title: 'Commission Approved',
                description: 'Commission has been approved for payment.',
            });
            loadPartnerData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve commission.',
                variant: 'destructive'
            });
        }
    };

    const filteredPartners = partners.filter(partner => 
        statusFilter === 'all' || partner.status === statusFilter
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
            case 'terminated': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'bronze': return 'bg-amber-100 text-amber-800';
            case 'silver': return 'bg-slate-100 text-slate-800';
            case 'gold': return 'bg-yellow-100 text-yellow-800';
            case 'platinum': return 'bg-purple-100 text-purple-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const pendingPartners = partners.filter(p => p.status === 'pending').length;
    const activePartners = partners.filter(p => p.status === 'active').length;
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    const totalPendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading partner data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Total Partners</p>
                                <p className="text-3xl font-bold text-white">{partners.length}</p>
                                <p className="text-xs text-blue-400">{activePartners} active</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Pending Applications</p>
                                <p className="text-3xl font-bold text-yellow-400">{pendingPartners}</p>
                                <p className="text-xs text-yellow-300">Need review</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Pending Payments</p>
                                <p className="text-3xl font-bold text-green-400">
                                    KES {totalPendingAmount.toLocaleString()}
                                </p>
                                <p className="text-xs text-green-300">{pendingCommissions.length} payments</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Total Clients Managed</p>
                                <p className="text-3xl font-bold text-purple-400">
                                    {relationships.filter(r => r.status === 'active').length}
                                </p>
                                <p className="text-xs text-purple-300">Active relationships</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="partners" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-gray-700">
                    <TabsTrigger value="partners" className="text-white data-[state=active]:bg-purple-600">
                        Partners ({partners.length})
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="text-white data-[state=active]:bg-purple-600">
                        Applications ({pendingPartners})
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="text-white data-[state=active]:bg-purple-600">
                        Commissions ({pendingCommissions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="partners" className="mt-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-white">All Partners</CardTitle>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-700">
                                            <TableHead className="text-gray-300">Partner</TableHead>
                                            <TableHead className="text-gray-300">Clients</TableHead>
                                            <TableHead className="text-gray-300">Tier</TableHead>
                                            <TableHead className="text-gray-300">Total Earnings</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300">Joined</TableHead>
                                            <TableHead className="text-right text-gray-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPartners.map((partner) => (
                                            <TableRow key={partner.id} className="border-gray-700">
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-white">{partner.firm_name}</p>
                                                        <p className="text-sm text-gray-400">{partner.contact_person}</p>
                                                        <p className="text-xs text-gray-500">{partner.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-white font-medium">
                                                        {partner.total_clients_managed || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getTierColor(partner.commission_tier)}>
                                                        {partner.commission_tier?.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-green-400 font-medium">
                                                        KES {(partner.total_earnings || 0).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(partner.status)}>
                                                        {partner.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-300">
                                                        {partner.joined_date 
                                                            ? format(new Date(partner.joined_date), 'MMM dd, yyyy')
                                                            : 'Not set'
                                                        }
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-gray-300 border-gray-600">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-white">
                                                                    {partner.firm_name} - Partner Details
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4 text-gray-300">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p><strong>Contact:</strong> {partner.contact_person}</p>
                                                                        <p><strong>Email:</strong> {partner.email}</p>
                                                                        <p><strong>Phone:</strong> {partner.phone}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p><strong>Business Reg:</strong> {partner.business_registration}</p>
                                                                        <p><strong>CPA License:</strong> {partner.cpa_license || 'N/A'}</p>
                                                                        <p><strong>Commission Rate:</strong> {(partner.commission_rate * 100).toFixed(0)}%</p>
                                                                    </div>
                                                                </div>
                                                                {partner.specializations && (
                                                                    <div>
                                                                        <p><strong>Specializations:</strong></p>
                                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                                            {partner.specializations.map(spec => (
                                                                                <Badge key={spec} variant="outline" className="text-xs">
                                                                                    {spec.replace('_', ' ')}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="applications" className="mt-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                Pending Applications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {partners.filter(p => p.status === 'pending').map((partner) => (
                                    <Card key={partner.id} className="bg-gray-700/50 border-gray-600">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {partner.firm_name}
                                                    </h3>
                                                    <p className="text-gray-300">{partner.contact_person} • {partner.email}</p>
                                                    <div className="flex gap-2">
                                                        {partner.specializations?.map(spec => (
                                                            <Badge key={spec} variant="outline" className="text-xs">
                                                                {spec.replace('_', ' ')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    {partner.why_partner && (
                                                        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                                                            "{partner.why_partner}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprovePartner(partner.id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        onClick={() => handleRejectPartner(partner.id)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {partners.filter(p => p.status === 'pending').length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        No pending applications
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="commissions" className="mt-6">
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                Commission Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-700">
                                            <TableHead className="text-gray-300">Partner</TableHead>
                                            <TableHead className="text-gray-300">Type</TableHead>
                                            <TableHead className="text-gray-300">Amount</TableHead>
                                            <TableHead className="text-gray-300">Period</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-right text-gray-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {commissions.slice(0, 20).map((commission) => {
                                            const partner = partners.find(p => p.id === commission.partner_id);
                                            return (
                                                <TableRow key={commission.id} className="border-gray-700">
                                                    <TableCell>
                                                        <span className="text-white font-medium">
                                                            {partner?.firm_name || 'Unknown Partner'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {commission.commission_type.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-green-400 font-medium">
                                                            KES {commission.amount.toLocaleString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-gray-300">
                                                            {commission.commission_period || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(commission.status)}>
                                                            {commission.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {commission.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleApproveCommission(commission.id)}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}