import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { User, Shield, Search, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserSDK } from '@/api/entities';

export default function AdminUsersList({ users, subscriptions, onRefresh, emailFilter = '' }) {
  const [searchTerm, setSearchTerm] = useState(emailFilter);
  const { toast } = useToast();

  const handleRoleChange = async (userId, newRole) => {
    try {
      await UserSDK.update(userId, { role: newRole });
      toast({
        title: 'Role Updated',
        description: 'User role has been successfully changed.',
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update role', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update user role.',
        variant: 'destructive',
      });
    }
  };

  const getSubscriptionStatus = (userEmail) => {
    const userSub = subscriptions.find(sub => sub.user_email === userEmail);
    if (!userSub) return <Badge variant="secondary" className="bg-gray-600 text-gray-200">No Sub</Badge>;
    
    const statusColors = {
      active: 'bg-green-600 text-white',
      trial: 'bg-blue-600 text-white',
      cancelled: 'bg-red-600 text-white',
      suspended: 'bg-yellow-600 text-black',
    };
    
    return (
        <Badge className={`${statusColors[userSub.status] || 'bg-gray-500'}`}>
            {userSub.plan_name} - {userSub.status}
        </Badge>
    );
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          User Management ({filteredUsers.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by name or email..."
            className="w-full md:w-1/3 bg-gray-700 border-gray-600 text-white pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800/60">
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Joined</TableHead>
                <TableHead className="text-gray-300">Subscription</TableHead>
                <TableHead className="text-gray-300">Platform Role</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-gray-700 hover:bg-gray-800/60">
                  <TableCell>
                    <p className="text-white font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {format(new Date(user.created_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {getSubscriptionStatus(user.email)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-green-400' : 'text-gray-400'}`} />
                       <span className={`font-medium ${user.role === 'admin' ? 'text-green-400' : 'text-gray-300'}`}>
                           {user.role}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
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