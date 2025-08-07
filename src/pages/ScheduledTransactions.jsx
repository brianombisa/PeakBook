
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ScheduledTransactionsList from '../components/scheduling/ScheduledTransactionsList';

export default function ScheduledTransactionsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* The max-w-7xl mx-auto wrapper div has been removed as per the outline. 
          Its content is now directly under the main page div. */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
          Scheduled Transactions
        </h1>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-2">Automated Transaction Delivery</h2>
        <p className="text-purple-100">
          Schedule invoices, expenses, and other transactions to be automatically created and delivered at specific dates and times. 
          Perfect for recurring billing, payment reminders, and time-sensitive communications.
        </p>
      </div>

      <ScheduledTransactionsList />
    </div>
  );
}
