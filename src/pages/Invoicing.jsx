
import React, { useState, useEffect, useCallback } from "react";
import DataService from '../components/services/DataService';
import TransactionService from '../components/services/TransactionService';
import { Invoice } from "@/api/entities";
import { Customer } from "@/api/entities";
import { Item } from "@/api/entities";
import { RecurringInvoice } from "@/api/entities";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, WifiOff, AlertTriangle, Loader2, RefreshCw, FileText, Users, CreditCard, Repeat, FileMinus, Sparkles, Zap, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { format, isAfter, subDays, startOfYear, isWithinInterval } from 'date-fns';
import { CreditNote } from "@/api/entities";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import InvoiceList from "../components/invoicing/InvoiceList";
import InvoiceStats from "../components/invoicing/InvoiceStats";
import CustomersTab from "../components/invoicing/CustomersTab";
import PaymentsTab from "../components/invoicing/PaymentsTab";
import RecurringTab from "../components/invoicing/RecurringTab";
import AuditLogger from "../components/utils/AuditLogger";
import CreditNoteList from "../components/invoicing/CreditNoteList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PointService } from "../components/services/PointService";
import { BankAccount } from "@/api/entities";
import ValidationService from '../components/utils/ValidationService';

// Enhanced function to ensure invoice transactions are created for accrual accounting
const ensureInvoiceTransaction = async (invoice) => {
  try {
    if (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue') {
      const transaction = await TransactionService.createInvoiceSaleTransaction(invoice);
      if (transaction && transaction.id && invoice.sale_transaction_id !== transaction.id) {
        await Invoice.update(invoice.id, { sale_transaction_id: transaction.id });
      }
    }
  } catch (error) {
    console.error(`Error ensuring IFRS-compliant transaction for invoice ${invoice.invoice_number}:`, error);
    await AuditLogger.log('transaction_error', 'Invoice', invoice.id, invoice.invoice_number, {
      description: `Failed to ensure IFRS-compliant transaction for invoice ${invoice.invoice_number}: ${error.message}`,
      severity: 'high'
    });
  }
};

// Automated Reminder Logic
const checkAndSendReminders = async (invoices, currentUser) => {
  try {
    const today = new Date();
    const overdueInvoices = invoices.filter(invoice => 
      invoice.status === 'sent' && 
      isAfter(today, new Date(invoice.due_date)) && 
      (!invoice.last_reminder_sent || isAfter(today, subDays(new Date(invoice.last_reminder_sent), 7)))
    );

    for (const invoice of overdueInvoices) {
      if (invoice.client_email) {
        const reminderEmailBody = `
          Dear ${invoice.client_name},
          
          This is a gentle reminder that Invoice ${invoice.invoice_number} for KES ${invoice.total_amount.toLocaleString()} is now overdue.
          
          Due Date: ${format(new Date(invoice.due_date), 'PPP')}
          Amount Due: KES ${invoice.total_amount.toLocaleString()}
          
          Please arrange payment at your earliest convenience.
          
          Best regards,
          ${currentUser?.full_name || 'PeakBooks'}
        `;

        await SendEmail({
          to: invoice.client_email,
          subject: `Payment Reminder - Invoice ${invoice.invoice_number}`,
          body: reminderEmailBody,
          from_name: currentUser?.full_name || 'PeakBooks'
        });

        await Invoice.update(invoice.id, { 
          last_reminder_sent: today.toISOString(),
          status: 'overdue'
        });
      }
    }

    if (overdueInvoices.length > 0) {
      return { success: true, count: overdueInvoices.length };
    }
    return { success: true, count: 0 };
  } catch (error) {
    console.error('Error sending automated reminders:', error);
    return { success: false, error };
  }
};

// Simple ItemsTab component
const ItemsTab = ({ items, onRefresh }) => {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Items & Services</h2>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-gray-500">No items or services found. Add new items to get started.</p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="p-3 border rounded-md flex justify-between items-center bg-gray-50">
                <span>{item.name}</span>
                <span className="font-semibold text-right">KES {item.unit_price.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};


export default function InvoicingPage() {
  const [data, setData] = useState({ invoices: [], customers: [], items: [], recurringInvoices: [], creditNotes: [], transactions: [], bankAccounts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const loadAllData = useCallback(async (showToastError = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DataService.loadInvoicingData();
      const bankResult = await BankAccount.list();

      if (result.success) {
        const user = result.user;
        setCurrentUser(user);

        // Process all invoices to ensure IFRS-compliant transactions
        const invoicesWithTransactions = await Promise.all(
          result.invoices.map(async (invoice) => {
            await ensureInvoiceTransaction(invoice);
            return invoice;
          })
        );

        setData({
          invoices: invoicesWithTransactions,
          customers: result.customers,
          items: result.items,
          recurringInvoices: result.recurringInvoices,
          creditNotes: result.creditNotes,
          transactions: result.transactions,
          bankAccounts: bankResult
        });

        // Send automated reminders if enabled
        const reminderResult = await checkAndSendReminders(invoicesWithTransactions, user);
        if (reminderResult.success && reminderResult.count > 0) {
          toast({
            title: "Automated Reminders Sent",
            description: `${reminderResult.count} overdue invoice reminder(s) sent successfully.`,
            className: "bg-blue-50 border-blue-200 text-blue-800"
          });
        }
      } else {
        throw new Error(result.error?.message || 'Failed to load invoicing data');
      }
    } catch (error) {
      console.error('Unexpected error in loadAllData:', error);
      setError(error);
      if (showToastError) {
        toast({
          title: "Loading Error",
          description: "Could not load invoicing data. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, retryCount]);

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {Array(50).fill(0).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center z-10"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin animation-delay-300 mx-auto"></div>
            <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-pink-400 rounded-full animate-spin animation-delay-600 mx-auto"></div>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-bold text-white mb-3">
              PeakBooks
              <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent ml-2">
                Invoicing
              </span>
            </h2>
            <p className="text-white/80 text-lg">Initializing your revenue engine...</p>
            
            <div className="flex justify-center mt-6 space-x-1">
              {Array(3).fill(0).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-600 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Connection Issue</h3>
                <p className="text-white/90">We're having trouble connecting to your data</p>
              </div>
              
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-6 leading-relaxed">{error.message}</p>
                <Button 
                  onClick={() => { setRetryCount(prev => prev + 1); loadAllData(); }} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <InvoiceStats 
            invoices={data.invoices} 
            transactions={data.transactions}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Tabs defaultValue="invoices" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full grid-cols-4 gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
                <TabsTrigger 
                    value="invoices" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-4 py-3 font-medium"
                >
                    Bills & Revenue
                </TabsTrigger>
                <TabsTrigger 
                    value="customers" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-4 py-3 font-medium"
                >
                    Customers
                </TabsTrigger>
                <TabsTrigger 
                    value="items" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-4 py-3 font-medium"
                >
                    Items & Services
                </TabsTrigger>
                <TabsTrigger 
                    value="automation" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-4 py-3 font-medium"
                >
                    Automation
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="invoices" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Sub-tabs for Bills & Revenue */}
                  <Tabs defaultValue="all-invoices" className="w-full">
                    <div className="flex justify-center mb-6">
                      <TabsList className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 p-1 shadow-lg">
                        <TabsTrigger value="all-invoices" className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                          All Invoices
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                          Payments
                        </TabsTrigger>
                        <TabsTrigger value="credit-notes" className="rounded-xl px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                          Credit Notes
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="all-invoices">
                      <InvoiceList
                        invoices={data.invoices}
                        customers={data.customers}
                        items={data.items}
                        onRefresh={loadAllData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="payments">
                      <PaymentsTab 
                        transactions={data.transactions} 
                        invoices={data.invoices} 
                        customers={data.customers} 
                        bankAccounts={data.bankAccounts}
                        onRefresh={loadAllData}
                      />
                    </TabsContent>
                    
                    <TabsContent value="credit-notes">
                      <CreditNoteList
                        creditNotes={data.creditNotes}
                        customers={data.customers}
                        onRefresh={loadAllData}
                      />
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </TabsContent>

              <TabsContent value="customers" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CustomersTab
                    customers={data.customers}
                    invoices={data.invoices}
                    transactions={data.transactions}
                    currentUser={currentUser}
                    isLoading={isLoading}
                    onRefresh={loadAllData}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="items" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ItemsTab
                    items={data.items}
                    onRefresh={loadAllData}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="automation" className="mt-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RecurringTab
                    recurringInvoices={data.recurringInvoices}
                    customers={data.customers}
                    items={data.items}
                    onRefresh={loadAllData}
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
