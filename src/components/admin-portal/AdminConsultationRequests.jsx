import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LifeBuoy, Mail, UserSearch } from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationRequest } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function AdminConsultationRequests({ requests, onRefresh }) {
  const { toast } = useToast();

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await ConsultationRequest.update(requestId, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Request status changed to ${newStatus}.`,
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update status', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update the request status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-500 text-black',
      contacted: 'bg-blue-600 text-white',
      completed: 'bg-green-600 text-white',
      cancelled: 'bg-gray-600 text-gray-200',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <LifeBuoy className="w-5 h-5" />
          Consultation Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800/60">
                <TableHead className="text-gray-300">Company</TableHead>
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Requested On</TableHead>
                <TableHead className="text-gray-300 w-[40%]">Message</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? requests.map((req) => (
                <TableRow key={req.id} className="border-gray-700 hover:bg-gray-800/60">
                  <TableCell className="text-white font-medium">{req.company_name}</TableCell>
                  <TableCell>
                     <Link to={createPageUrl(`AdminPortal?tab=users&email_filter=${req.user_email}`)} className="text-white hover:underline">
                        <p>{req.user_name}</p>
                     </Link>
                    <p className="text-sm text-gray-400">{req.user_email}</p>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {format(new Date(req.created_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm whitespace-pre-wrap">
                    {req.request_message}
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                        <Select
                            value={req.status}
                            onValueChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                        >
                            <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button asChild variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                           <a href={`mailto:${req.user_email}`} title="Reply via Email">
                                <Mail className="w-4 h-4" />
                           </a>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                           <Link to={createPageUrl(`AdminPortal?tab=users&email_filter=${req.user_email}`)} title="View User Profile">
                               <UserSearch className="w-4 h-4" />
                           </Link>
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                        No consultation requests yet.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}