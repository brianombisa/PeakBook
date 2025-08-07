
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CheckCircle, Eye, Calendar } from "lucide-react";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function PayrollRunList({ payrollRuns, isLoading, onApprove, onViewPayslip }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Payroll Runs ({payrollRuns.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Period</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Gross</TableHead>
                  <TableHead>Total Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.length > 0 ? payrollRuns.map((payrollRun) => (
                  <TableRow key={payrollRun.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{payrollRun.payroll_period}</p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(payrollRun.start_date), 'dd MMM')} - {format(new Date(payrollRun.end_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payrollRun.payslips?.length || 0} employees
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      KES {payrollRun.total_gross_pay?.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      KES {payrollRun.total_net_pay?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`${statusColors[payrollRun.status]} border font-medium capitalize`}
                      >
                        {payrollRun.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {payrollRun.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApprove(payrollRun)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPayslip(payrollRun)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No payroll runs found. Run your first payroll to get started.
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
