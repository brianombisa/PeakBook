import React, { useState } from 'react';
import { Subscription } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search, Edit, Eye, ShieldCheck, Calendar, XCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSubscriptionManager({ subscriptions, users, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateStatus = async (subscription, newStatus) => {
        try {
            await Subscription.update(subscription.id, { status: newStatus });
            toast({ title: 'Success', description: `Subscription status updated to ${newStatus}.` });
            onRefresh();
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
        }
    };

    const statusColors = {
        active: 'bg-green-600 text-white',
        trial: 'bg-blue-600 text-white',
        inactive: 'bg-gray-600 text-gray-200',
        suspended: 'bg-yellow-600 text-black',
        cancelled: 'bg-red-600 text-white'
    };

    return (
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-white">All User Subscriptions</CardTitle>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search by user email or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-700 hover:bg-gray-800">
                                <TableHead className="text-gray-300">User / Company</TableHead>
                                <TableHead className="text-gray-300">Plan</TableHead>
                                <TableHead className="text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-300">Billing Period</TableHead>
                                <TableHead className="text-gray-300 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscriptions.map(sub => (
                                <TableRow key={sub.id} className="border-gray-700">
                                    <TableCell>
                                        <p className="font-medium text-white">{sub.company_name || 'N/A'}</p>
                                        <p className="text-sm text-gray-400">{sub.user_email}</p>
                                    </TableCell>
                                    <TableCell className="text-white">{sub.plan_name}</TableCell>
                                    <TableCell><Badge className={statusColors[sub.status]}>{sub.status}</Badge></TableCell>
                                    <TableCell className="text-sm text-gray-400">
                                        {sub.next_billing_date ? `Renews on ${format(new Date(sub.next_billing_date), 'MMM dd, yyyy')}` : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-300 hover:bg-gray-700" onClick={() => handleUpdateStatus(sub, 'active')} title="Activate">
                                            <CheckCircle className="w-4 h-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-gray-700" onClick={() => handleUpdateStatus(sub, 'cancelled')} title="Cancel">
                                            <XCircle className="w-4 h-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}