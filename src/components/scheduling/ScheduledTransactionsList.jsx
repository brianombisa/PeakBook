import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Clock, MoreHorizontal, Eye, X, RefreshCw } from "lucide-react";
import { ScheduledTransaction } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export default function ScheduledTransactionsList() {
  const [scheduledTransactions, setScheduledTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionToCancel, setTransactionToCancel] = useState(null);
  const { toast } = useToast();

  const loadScheduledTransactions = async () => {
    setIsLoading(true);
    try {
      const transactions = await ScheduledTransaction.list('-scheduled_date');
      setScheduledTransactions(transactions);
    } catch (error) {
      console.error("Error loading scheduled transactions:", error);
      toast({
        title: "Error",
        description: "Could not load scheduled transactions.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadScheduledTransactions();
  }, []);

  const handleCancel = async () => {
    if (!transactionToCancel) return;
    
    try {
      await ScheduledTransaction.update(transactionToCancel.id, { status: 'cancelled' });
      toast({
        title: "Transaction Cancelled",
        description: "Scheduled transaction has been cancelled."
      });
      loadScheduledTransactions();
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      toast({
        title: "Error",
        description: "Could not cancel the scheduled transaction.",
        variant: "destructive"
      });
    }
    setTransactionToCancel(null);
  };

  const handleRetry = async (transaction) => {
    try {
      await ScheduledTransaction.update(transaction.id, { 
        status: 'scheduled',
        execution_attempts: 0,
        error_message: null
      });
      toast({
        title: "Retry Scheduled",
        description: "Transaction will be retried at the next scheduled run."
      });
      loadScheduledTransactions();
    } catch (error) {
      console.error("Error scheduling retry:", error);
      toast({
        title: "Error",
        description: "Could not schedule retry.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Scheduled Transactions ({scheduledTransactions.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadScheduledTransactions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Delivery Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading scheduled transactions...
                  </TableCell>
                </TableRow>
              ) : scheduledTransactions.length > 0 ? (
                scheduledTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium capitalize">
                      {transaction.transaction_type}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.scheduled_date), "MMM dd, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>{transaction.recipient_email}</TableCell>
                    <TableCell className="capitalize">
                      {transaction.delivery_method.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[transaction.status]}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {transaction.status === 'failed' && (
                            <DropdownMenuItem onClick={() => handleRetry(transaction)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry
                            </DropdownMenuItem>
                          )}
                          {transaction.status === 'scheduled' && (
                            <DropdownMenuItem 
                              onClick={() => setTransactionToCancel(transaction)}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No scheduled transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!transactionToCancel} onOpenChange={() => setTransactionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled {transactionToCancel?.transaction_type}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              Cancel Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}