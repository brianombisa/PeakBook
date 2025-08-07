import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AccountsReceivableService from '../services/AccountsReceivableService';

export default function OutstandingInvoices({ invoices = [], customers = [], transactions = [] }) {
  const [calculatedData, setCalculatedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const calculateData = async () => {
      setIsLoading(true);
      try {
        const outstandingByCustomer = await AccountsReceivableService.getOutstandingByCustomer(invoices, customers, transactions);
        
        const customersWithBalance = outstandingByCustomer
          .filter(customer => customer.outstandingAmount > 0)
          .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
          .slice(0, 5); // Top 5 customers

        setCalculatedData({
          customersWithBalance
        });
      } catch (error) {
        console.error('Error calculating outstanding invoices data:', error);
        setCalculatedData({
          customersWithBalance: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateData();
  }, [invoices, customers, transactions]);

  if (isLoading || !calculatedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Customers with Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading customer balances...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { customersWithBalance } = calculatedData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          Top Customers with Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customersWithBalance.length > 0 ? (
          <div className="space-y-3">
            {customersWithBalance.map((customer) => (
              <div key={customer.customerId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex-1">
                  <p className="font-medium text-sm">{customer.customerName}</p>
                  <p className="text-xs text-gray-600">
                    {customer.invoices.length} outstanding invoice{customer.invoices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">
                    KES {Math.round(customer.outstandingAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <Link 
              to={createPageUrl('Reports')} 
              className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium mt-4"
            >
              View Full Aged Receivables Report →
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">All payments up to date!</h3>
            <p className="text-gray-500">No customers have outstanding balances.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}