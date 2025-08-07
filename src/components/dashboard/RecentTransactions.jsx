import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const transactionTypeColors = {
  sale: "bg-green-100 text-green-800 border-green-200",
  purchase: "bg-blue-100 text-blue-800 border-blue-200",
  expense: "bg-red-100 text-red-800 border-red-200",
  payment: "bg-purple-100 text-purple-800 border-purple-200",
  receipt: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function RecentTransactions({ transactions, isLoading }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(transaction.transaction_date), "MMM dd")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
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
                          KES {transaction.total_amount?.toLocaleString()}
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
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No transactions yet
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