import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import CreditNoteForm from './CreditNoteForm';

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  issued: "bg-blue-100 text-blue-800 border-blue-200",
  applied: "bg-green-100 text-green-800 border-green-200",
  void: "bg-red-100 text-red-800 border-red-200"
};

const reasonLabels = {
  goods_returned: "Goods Returned",
  pricing_error: "Pricing Error", 
  damaged_goods: "Damaged Goods",
  cancellation: "Cancellation",
  discount_adjustment: "Discount Adjustment",
  other: "Other"
};

export default function CreditNoteList({ creditNotes, isLoading, onEdit, onDelete, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState(null);

  const handleCreate = () => {
    setEditingCreditNote(null);
    setShowForm(true);
  };

  const handleEdit = (creditNote) => {
    setEditingCreditNote(creditNote);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCreditNote(null);
    onRefresh();
  };

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Credit Notes ({creditNotes.length})
            </CardTitle>
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Credit Note
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="p-8 space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit Note #</TableHead>
                    <TableHead>Original Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.length > 0 ? creditNotes.map((cn) => (
                    <TableRow key={cn.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {cn.credit_note_number}
                      </TableCell>
                      <TableCell>{cn.original_invoice_number}</TableCell>
                      <TableCell className="max-w-xs truncate">{cn.customer_name}</TableCell>
                      <TableCell>
                        {format(new Date(cn.credit_note_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {reasonLabels[cn.reason] || cn.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        KES {cn.total_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${statusColors[cn.status]} capitalize`}
                        >
                          {cn.status}
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
                            <DropdownMenuItem onClick={() => handleEdit(cn)}>
                              <Edit className="mr-2 h-4 w-4" /> 
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(cn)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> 
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-12 h-12 text-slate-300" />
                          <div>
                            <p className="text-slate-500 font-medium">No credit notes found</p>
                            <p className="text-slate-400 text-sm">Create your first credit note to get started</p>
                          </div>
                          <Button onClick={handleCreate} className="mt-2">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Credit Note
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreditNoteForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        creditNote={editingCreditNote}
      />
    </>
  );
}