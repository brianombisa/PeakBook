
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Pencil, Trash2, MoreHorizontal, RefreshCw, Landmark, CreditCard, Clock, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MarkAsPaidModal from './MarkAsPaidModal';

const categoryColors = {
  transport: "bg-blue-100 text-blue-800",
  utilities: "bg-purple-100 text-purple-800",
  office_supplies: "bg-green-100 text-green-800",
  marketing: "bg-pink-100 text-pink-800",
  meals: "bg-orange-100 text-orange-800",
  travel: "bg-indigo-100 text-indigo-800",
  equipment: "bg-red-100 text-red-800",
  software: "bg-cyan-100 text-cyan-800",
  rent: "bg-yellow-100 text-yellow-800",
  insurance: "bg-teal-100 text-teal-800",
  professional_services: "bg-violet-100 text-violet-800",
  other: "bg-gray-100 text-gray-800"
};

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200",
  unpaid: "bg-amber-100 text-amber-800 border-amber-200"
};

export default function ExpenseList({ 
    expenses = [], 
    isLoading = false, 
    onEdit = () => {}, 
    onDelete = () => {}, 
    onRefresh = () => {} 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Ensure expenses is always an array before filtering
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const filteredExpenses = safeExpenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleMarkAsPaidClick = (expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handlePaidSuccess = () => {
    setIsModalOpen(false);
    onRefresh();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              Expenses ({filteredExpenses.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="office_supplies">Office Supplies</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
            <Table style={{ minWidth: '900px' }}>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due/Paid Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(expense.expense_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{expense.vendor_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${categoryColors[expense.category]} capitalize`}>
                        {expense.category?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      KES {expense.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusColors[expense.status]} capitalize`}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.status === 'paid' && expense.payment_date ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">
                            {format(new Date(expense.payment_date), "MMM dd, yyyy")}
                          </span>
                        </div>
                      ) : expense.status === 'unpaid' && expense.due_date ? (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            Due: {format(new Date(expense.due_date), "MMM dd, yyyy")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(expense.receipt_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-slate-400">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {expense.status === 'unpaid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs md:text-sm"
                          onClick={() => handleMarkAsPaidClick(expense)}
                        >
                          <Landmark className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Mark Paid
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {expense.status === 'unpaid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaidClick(expense)}>
                              <Landmark className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {expense.receipt_url && (
                            <DropdownMenuItem onClick={() => window.open(expense.receipt_url, '_blank')}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onDelete(expense)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedExpense && (
        <MarkAsPaidModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          expense={selectedExpense}
          onPaid={handlePaidSuccess}
        />
      )}
    </>
  );
}
