
import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Subscription } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, UserCheck, UserX, Mail, CalendarPlus } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function UserManagementAdmin({ users, subscriptions, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const getUserSubscription = (userId) => {
    return subscriptions.find(sub => sub.user_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const subscription = getUserSubscription(user.id);
    return subscription?.status === statusFilter;
  });

  const handleToggleUserStatus = async (user) => {
    try {
      const subscription = getUserSubscription(user.id);
      if (subscription) {
        const newStatus = subscription.status === 'active' ? 'suspended' : 'active';
        await Subscription.update(subscription.id, { status: newStatus });
        
        toast({
          title: 'Success',
          description: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not update user status.',
        variant: 'destructive'
      });
    }
  };

  const handleExtendTrial = async (user) => {
    try {
      const subscription = getUserSubscription(user.id);
      if (subscription && subscription.status === 'trial') {
        const newTrialEndDate = addDays(new Date(subscription.trial_end_date), 14);
        await Subscription.update(subscription.id, { 
          trial_end_date: newTrialEndDate.toISOString().split('T')[0],
          end_date: newTrialEndDate.toISOString().split('T')[0],
          next_billing_date: newTrialEndDate.toISOString().split('T')[0]
        });
        
        toast({
          title: 'Trial Extended',
          description: `${user.full_name}'s trial has been extended by 14 days.`
        });
        onRefresh();
      } else {
        toast({
          title: 'Cannot Extend',
          description: 'This user is not currently on a trial subscription.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not extend the trial period.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (subscription) => {
    if (!subscription) {
      return <Badge className="bg-gray-100 text-gray-800">No Subscription</Badge>;
    }

    const statusColors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={statusColors[subscription.status] || 'bg-gray-100 text-gray-800'}>
        {subscription.status}
      </Badge>
    );
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined / Trial Ends</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const subscription = getUserSubscription(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription ? (
                        <div>
                          <p className="font-medium capitalize">{subscription.plan_name} Plan</p>
                          <p className="text-sm text-slate-500">
                            KES {subscription.plan_price?.toLocaleString()}/month
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No subscription</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(new Date(user.created_date), 'MMM dd, yyyy')}</p>
                        {subscription?.status === 'trial' && (
                          <p className="text-sm text-blue-600 font-medium">
                            Ends {format(new Date(subscription.trial_end_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription?.last_payment_date ? 
                        format(new Date(subscription.last_payment_date), 'MMM dd, yyyy') : 
                        'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Send Email"
                          onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        {subscription?.status === 'trial' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Extend Trial by 14 Days"
                            onClick={() => handleExtendTrial(user)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </Button>
                        )}
                        {subscription && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={subscription.status === 'active' ? 'Suspend User' : 'Activate User'}
                            onClick={() => handleToggleUserStatus(user)}
                            className={
                              subscription.status === 'active' 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-green-600 hover:text-green-700'
                            }
                          >
                            {subscription.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
