
import React, { useState, useEffect } from "react";
import DataService from '../components/services/DataService';
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import AccountsList from "../components/transactions/AccountsList";
import AuditLogger from "../components/utils/AuditLogger";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    const result = await DataService.loadTransactionData();
    if(result.success) {
      setTransactions(result.transactions);
      setAccounts(result.accounts);
    } else {
      console.error("Error loading transaction data:", result.error);
      toast({ title: "Error", description: "Could not load transaction data.", variant: "destructive" });
      // Although error state is removed, keep console.error for debugging purposes
    }
    setIsLoading(false);
  };

  const handleFormSubmit = async (transactionData) => {
    try {
      if (editingTransaction) {
        await Transaction.update(editingTransaction.id, transactionData);
      } else {
        await Transaction.create(transactionData);
      }
      setShowForm(false);
      setEditingTransaction(null);
      loadAllData(); // Reload data after successful submission
      toast({ title: "Success", description: "Transaction saved successfully.", variant: "default" });
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({ title: "Error", description: `Failed to save transaction: ${error.message || "Unknown error."}`, variant: "destructive" });
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || transaction.transaction_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Transactions & Accounts
            </h1>
            <p className="text-slate-600">Manage financial transactions and chart of accounts</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            {/* Search and Filter */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="sale">Sales</option>
                    <option value="purchase">Purchases</option>
                    <option value="expense">Expenses</option>
                    <option value="payment">Payments</option>
                    <option value="receipt">Receipts</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {showForm && (
              <TransactionForm
                transaction={editingTransaction}
                accounts={accounts}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTransaction(null);
                }}
              />
            )}

            <TransactionList
              transactions={filteredTransactions}
              isLoading={isLoading}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsList
              accounts={accounts}
              isLoading={isLoading}
              onRefresh={loadAllData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
