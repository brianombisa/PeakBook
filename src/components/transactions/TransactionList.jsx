import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, ArrowUpRight, ArrowDownRight } from "lucide-react";

const transactionTypeColors = {
  sale: "bg-green-100 text-green-800 border-green-200",
  purchase: "bg-blue-100 text-blue-800 border-blue-200",
  expense: "bg-red-100 text-red-800 border-red-200",
  payment: "bg-purple-100 text-purple-800 border-purple-200",
  receipt: "bg-emerald-100 text-emerald-800 border-emerald-200",
  adjustment: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  posted: "bg-green-100 text-green-800 border-green-200",
  reversed: "bg-red-100 text-red-800 border-red-200"
};

export default function TransactionList({ transactions, isLoading, onEdit }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">
          All Transactions ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {transaction.reference_number || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {transaction.transaction_type === 'sale' || transaction.transaction_type === 'receipt' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          transaction.transaction_type === 'sale' || transaction.transaction_type === 'receipt' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          ${transaction.total_amount?.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`${transactionTypeColors[transaction.transaction_type]} border font-medium`}
                      >
                        {transaction.transaction_type?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`${statusColors[transaction.status]} border font-medium`}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}