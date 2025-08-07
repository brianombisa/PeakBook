import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
    Eye, ExternalLink, Search, Filter, Plus, 
    Users, Building2, Calendar, DollarSign,
    Settings, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

export default function ClientManagement({ partner, clients, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedClient, setSelectedClient] = useState(null);
    const { toast } = useToast();

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.client_company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.client_email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAccessClient = async (client) => {
        try {
            // In a real implementation, you would create a temporary access token
            // and redirect to the client's PeakBooks account with partner access
            toast({
                title: 'Accessing Client Account',
                description: `Opening ${client.client_company_name}'s PeakBooks account...`,
            });
            
            // Simulate client account access
            // In reality, this would redirect to the main app with special partner permissions
            const clientUrl = `${window.location.origin}${createPageUrl('Dashboard')}?partner_access=${partner.id}&client=${client.client_user_id}`;
            window.open(clientUrl, '_blank');
            
        } catch (error) {
            toast({
                title: 'Access Error',
                description: 'Could not access client account. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'terminated': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getAccessLevelColor = (level) => {
        switch (level) {
            case 'read_only': return 'bg-blue-100 text-blue-800';
            case 'transactions': return 'bg-indigo-100 text-indigo-800';
            case 'full_access': return 'bg-purple-100 text-purple-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Client Management</h2>
                    <p className="text-slate-600">Manage your {clients.length} client relationships</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite New Client
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Client Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Active Clients</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {clients.filter(c => c.status === 'active').length}
                                </p>
                            </div>
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">This Month's Revenue</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    KES {clients
                                        .reduce((sum, c) => sum + (c.commission_earned_monthly || 0), 0)
                                        .toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Full Access Clients</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {clients.filter(c => c.access_level === 'full_access').length}
                                </p>
                            </div>
                            <Settings className="w-6 h-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">New This Month</p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {clients.filter(c => 
                                        new Date(c.onboarding_date).getMonth() === new Date().getMonth()
                                    ).length}
                                </p>
                            </div>
                            <UserPlus className="w-6 h-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Client Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Clients ({filteredClients.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Relationship</TableHead>
                                    <TableHead>Access Level</TableHead>
                                    <TableHead>Monthly Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {client.client_company_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium">{client.client_email}</p>
                                                <p className="text-xs text-slate-500">
                                                    Joined {format(new Date(client.onboarding_date), 'MMM yyyy')}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {client.relationship_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getAccessLevelColor(client.access_level)}>
                                                {client.access_level.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-green-600">
                                                KES {(client.commission_earned_monthly || 0).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(client.status)}>
                                                {client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-500">
                                                {client.last_activity_date 
                                                    ? format(new Date(client.last_activity_date), 'MMM dd')
                                                    : 'Never'
                                                }
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAccessClient(client)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Access
                                                </Button>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>{client.client_company_name}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p><strong>Email:</strong> {client.client_email}</p>
                                                                <p><strong>Relationship:</strong> {client.relationship_type}</p>
                                                                <p><strong>Access Level:</strong> {client.access_level}</p>
                                                                <p><strong>Status:</strong> {client.status}</p>
                                                                <p><strong>Monthly Fee:</strong> KES {(client.monthly_fee || 0).toLocaleString()}</p>
                                                                <p><strong>Commission:</strong> KES {(client.commission_earned_monthly || 0).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        {filteredClients.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                No clients found matching your criteria.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}