
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreHorizontal, Search, X, Send, FileText, Plus } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import InvoiceForm from "./InvoiceForm";
import InvoiceView from "./InvoiceView";
import { User } from '@/api/entities'; // Import User entity

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-600",
  written_off: "bg-orange-100 text-orange-800"
};

export default function InvoiceList({ invoices = [], customers = [], items = [], onRefresh, isLoading = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Added state for currentUser
  const { toast } = useToast();

  // Fetch current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    fetchUser();
  }, []);

  const handleCreate = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleView = (invoice) => {
    setViewingInvoice(invoice);
    setShowView(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingInvoice(null);
    onRefresh();
  };

  const handleResendInvoice = (invoice) => {
    toast({
      title: "Invoice Resent",
      description: `Invoice ${invoice.invoice_number} has been resent to ${invoice.client_email || 'client'}`
    });
  };

  const handleViewPDF = (invoice) => {
    toast({
      title: "PDF Generation",
      description: "PDF viewing functionality will be available soon."
    });
  };

  const getInvoiceStatus = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft' || invoice.status === 'written_off') return invoice.status;
    if (isAfter(new Date(), new Date(invoice.due_date))) return 'overdue';
    return invoice.status;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || getInvoiceStatus(invoice) === statusFilter;

    // Permission check for Account Manager
    if (currentUser && currentUser.app_role === 'Account Manager') {
      const customer = customers.find(c => c.id === invoice.customer_id);
      const isAssigned = customer && customer.account_manager_email === currentUser.email;
      return matchesSearch && matchesStatus && isAssigned;
    }

    return matchesSearch && matchesStatus;
  });

  // Display skeleton loading state if data is loading or user is not yet fetched
  if (isLoading || !currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
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

  // Determine if the current user has permission to delete invoices
  const canDelete = currentUser.app_role !== 'Account Manager';

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              Invoices ({filteredInvoices.length})
            </CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead> {/* New column */}
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead> {/* Updated text */}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);

                  return (
                    <TableRow key={invoice.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium max-w-xs truncate">{invoice.client_name}</TableCell> {/* Moved to first column */}
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell> {/* Moved to second column */}
                      <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className={status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.total_amount?.toLocaleString()} {/* Removed KES prefix and specific formatting */}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${statusColors[status]} capitalize`}>
                          {status.replace('_', ' ').toUpperCase()} {/* Added toUpperCase */}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"> {/* Changed to size="icon" */}
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => handleResendInvoice(invoice)}>
                                <Send className="mr-2 h-4 w-4" />
                                Resend Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleViewPDF(invoice)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View PDF
                            </DropdownMenuItem>
                            {canDelete && ( // Conditionally render delete based on user role
                              <DropdownMenuItem
                                onClick={() => console.log('Delete invoice:', invoice.id)}
                                className="text-red-600"
                                // disabled prop removed as per outline
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500"> {/* colSpan adjusted to 7 */}
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Form Modal */}
      {showForm && ( // Conditionally render modal
        <InvoiceForm
          invoice={editingInvoice}
          customers={customers}
          items={items}
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Invoice View Modal */}
      {showView && ( // Conditionally render modal
        <InvoiceView
          invoice={viewingInvoice}
          isOpen={showView}
          onClose={() => setShowView(false)}
          onEdit={() => {
            setShowView(false); // Close view modal before opening edit
            handleEdit(viewingInvoice); // Corrected to use viewingInvoice
          }}
        />
      )}
    </>
  );
}
