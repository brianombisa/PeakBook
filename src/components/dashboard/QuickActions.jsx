import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { AlertCircle, FileWarning, Archive, ChevronRight } from 'lucide-react'; // Removed LifeBuoy
import { isBefore, addDays, startOfDay } from 'date-fns';

export default function QuickActions({ invoices = [], expenses = [], items = [] }) { // Removed consultationRequests from props

  const getActionableItems = () => {
    const actions = [];
    const today = startOfDay(new Date());

    // 1. Overdue Invoices
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    if (overdueInvoices.length > 0) {
      actions.push({
        type: 'warning',
        icon: FileWarning,
        title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`,
        description: `Follow up on payments to improve your cash flow.`,
        link: createPageUrl('Invoicing?status=overdue'),
        linkText: 'View Invoices'
      });
    }

    // 2. Upcoming Bills
    const upcomingBills = expenses.filter(exp => 
      exp.status === 'unpaid' && 
      exp.due_date &&
      isBefore(new Date(exp.due_date), addDays(today, 7)) &&
      !isBefore(new Date(exp.due_date), today)
    );
    if (upcomingBills.length > 0) {
      actions.push({
        type: 'info',
        icon: AlertCircle,
        title: `${upcomingBills.length} Bill${upcomingBills.length > 1 ? 's' : ''} Due Soon`,
        description: `Prepare for payments to manage your payables.`,
        link: createPageUrl('Expenses?status=unpaid'),
        linkText: 'View Expenses'
      });
    }

    // 3. Low Stock Items
    const lowStockItems = items.filter(item => 
      item.is_trackable && 
      item.current_stock <= (item.reorder_level || 0)
    );
    if (lowStockItems.length > 0) {
      actions.push({
        type: 'info',
        icon: Archive,
        title: `${lowStockItems.length} Item${lowStockItems.length > 1 ? 's' : ''} at Low Stock`,
        description: 'Restock soon to avoid losing sales.',
        link: createPageUrl('Inventory?filter=low_stock'),
        linkText: 'View Items'
      });
    }

    // REMOVED: Consultation Requests section (this is admin-only)

    return actions;
  };

  const actions = getActionableItems();

  if (actions.length === 0) {
    return null; // Don't render the component if there's nothing to do
  }
  
  const typeStyles = {
    warning: 'border-amber-500 bg-amber-50',
    info: 'border-blue-500 bg-blue-50',
    critical: 'border-red-500 bg-red-50',
  };
  const iconStyles = {
    warning: 'text-amber-600',
    info: 'text-blue-600',
    critical: 'text-red-600',
  };

  return (
    <Card className="w-full shadow-lg border-t-4 border-indigo-600">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800">Your Action Items</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 flex flex-col justify-between ${typeStyles[action.type]}`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <action.icon className={`w-6 h-6 ${iconStyles[action.type]}`} />
                <h3 className="font-bold text-lg text-slate-900">{action.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">{action.description}</p>
            </div>
            <Button asChild variant="ghost" className="justify-start p-0 h-auto text-indigo-600 hover:text-indigo-800">
              <Link to={action.link}>
                {action.linkText}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}