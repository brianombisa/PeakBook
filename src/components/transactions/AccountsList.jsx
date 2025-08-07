import React, { useState } from "react";
import { Account } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Save, X } from "lucide-react";

const accountTypeColors = {
  asset: "bg-blue-100 text-blue-800 border-blue-200",
  liability: "bg-red-100 text-red-800 border-red-200",
  equity: "bg-purple-100 text-purple-800 border-purple-200",
  revenue: "bg-green-100 text-green-800 border-green-200",
  expense: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function AccountsList({ accounts, isLoading, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "asset",
    currency: "USD",
    is_active: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await Account.update(editingAccount.id, formData);
      } else {
        await Account.create(formData);
      }
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        account_code: "",
        account_name: "",
        account_type: "asset",
        currency: "USD",
        is_active: true
      });
      onRefresh();
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      currency: account.currency || "USD",
      is_active: account.is_active
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "asset",
      currency: "USD",
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Account Form */}
      {showForm && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              {editingAccount ? 'Edit Account' : 'New Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_code">Account Code</Label>
                  <Input
                    id="account_code"
                    value={formData.account_code}
                    onChange={(e) => setFormData(prev => ({...prev, account_code: e.target.value}))}
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value) => setFormData(prev => ({...prev, account_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({...prev, account_name: e.target.value}))}
                  placeholder="e.g., Cash"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editingAccount ? 'Update' : 'Create'} Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-slate-800">
              Chart of Accounts ({accounts.length})
            </CardTitle>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length > 0 ? accounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono font-medium">
                        {account.account_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.account_name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${accountTypeColors[account.account_type]} border font-medium`}
                        >
                          {account.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          account.balance > 0 ? 'text-green-600' : 
                          account.balance < 0 ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          ${(account.balance || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={account.is_active ? "default" : "secondary"}
                          className={account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}