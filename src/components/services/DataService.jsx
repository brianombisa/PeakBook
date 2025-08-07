
/**
 * Centralized data loading service with robust error handling
 * for database connectivity issues
 */

import { User } from '@/api/entities';
import { Invoice } from '@/api/entities';
import { Expense } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Customer } from '@/api/entities';
import { CompanyProfile } from '@/api/entities';
import { Account } from '@/api/entities';
import { BusinessGoal } from '@/api/entities';
import { Item } from '@/api/entities';
import { RecurringInvoice } from '@/api/entities';
import { CreditNote } from '@/api/entities';
import { Supplier } from '@/api/entities';
import { ConsultationRequest } from '@/api/entities';
import { PurchaseOrder } from '@/api/entities'; // New import

class DataService {
  constructor() {
    this.retryDelay = 1000; // Start with 1 second delay
    this.maxRetries = 3;
  }

  /**
   * Generic entity loader with exponential backoff retry
   */
  async loadEntityWithRetry(entityLoader, entityName, retries = 0) {
    try {
      return await entityLoader();
    } catch (error) {
      console.warn(`Failed to load ${entityName} (attempt ${retries + 1}):`, error.message);
      
      // Check if this is a database connectivity error
      const isConnectivityError = 
        error.message?.includes('ServerSelectionTimeoutError') ||
        error.message?.includes('No replica set members') ||
        error.message?.includes('status code 500') ||
        error.message?.includes('Request failed');

      if (isConnectivityError && retries < this.maxRetries) {
        // Wait with exponential backoff before retry
        const delay = this.retryDelay * Math.pow(2, retries);
        console.log(`Retrying ${entityName} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.loadEntityWithRetry(entityLoader, entityName, retries + 1);
      }
      
      // If all retries failed or it's not a connectivity error, return empty array
      console.error(`Final failure loading ${entityName}:`, error.message);
      return [];
    }
  }

  /**
   * Load all dashboard data with comprehensive error handling
   */
  async loadDashboardData() {
    try {
      // Get current user first
      const user = await User.me();
      const userEmail = user.email;

      // Load all entities with individual retry logic
      const [
        companyProfiles,
        invoices,
        expenses,
        transactions,
        customers,
        items // REMOVED: consultationRequests - this is admin only
      ] = await Promise.all([
        this.loadEntityWithRetry(
          () => CompanyProfile.filter({ created_by: userEmail }),
          'CompanyProfile'
        ),
        this.loadEntityWithRetry(
          () => Invoice.filter({ created_by: userEmail }, "-invoice_date"), // Get all for correct AR breakdown
          'Invoice'
        ),
        this.loadEntityWithRetry(
          () => Expense.filter({ created_by: userEmail }, "-expense_date"), // Get all for correct expense charts
          'Expense'
        ),
        this.loadEntityWithRetry(
          () => Transaction.filter({ created_by: userEmail }, "-transaction_date"), // Load ALL transactions
          'Transaction'
        ),
        this.loadEntityWithRetry(
          () => Customer.filter({ created_by: userEmail }),
          'Customer'
        ),
        this.loadEntityWithRetry(
          () => Item.filter({ created_by: userEmail }),
          'Item'
        )
        // REMOVED: consultationRequests loading
      ]);

      return {
        success: true,
        user,
        companyProfile: companyProfiles.length > 0 ? companyProfiles[0] : null,
        invoices,
        expenses,
        transactions,
        customers,
        items,
        totalRecords: invoices.length + expenses.length + transactions.length + customers.length + items.length
      };

    } catch (error) {
      console.error('Critical error in loadDashboardData:', error);
      return {
        success: false,
        error,
        user: null,
        companyProfile: null,
        invoices: [],
        expenses: [],
        transactions: [],
        customers: [],
        items: [],
        consultationRequests: [], // Keeping this for backward compatibility if other parts of the app rely on this being present, though it will be empty.
        totalRecords: 0
      };
    }
  }

  /**
   * Load transaction page data
   */
  async loadTransactionData() {
    try {
      const user = await User.me();
      const userFilter = { created_by: user.email };

      const [transactions, accounts] = await Promise.all([
        this.loadEntityWithRetry(
          () => Transaction.filter(userFilter, "-transaction_date"),
          'Transaction'
        ),
        this.loadEntityWithRetry(
          () => Account.filter(userFilter),
          'Account'
        )
      ]);

      return {
        success: true,
        transactions,
        accounts
      };
    } catch (error) {
      return {
        success: false,
        error,
        transactions: [],
        accounts: []
      };
    }
  }

  /**
   * Load reports data
   */
  async loadReportsData() {
    try {
      const user = await User.me();
      const userEmail = user.email;

      const [
        transactions,
        accounts,
        invoices,
        expenses,
        customers,
        goals,
        items,
        suppliers,
        companyProfile
      ] = await Promise.all([
        this.loadEntityWithRetry(
          () => Transaction.filter({ created_by: userEmail }),
          'Transaction'
        ),
        this.loadEntityWithRetry(
          () => Account.filter({ created_by: userEmail }),
          'Account'
        ),
        this.loadEntityWithRetry(
          () => Invoice.filter({ created_by: userEmail }),
          'Invoice'
        ),
        this.loadEntityWithRetry(
          () => Expense.filter({ created_by: userEmail }),
          'Expense'
        ),
        this.loadEntityWithRetry(
          () => Customer.filter({ created_by: userEmail }),
          'Customer'
        ),
        this.loadEntityWithRetry(
          () => BusinessGoal.filter({ created_by: userEmail }),
          'BusinessGoal'
        ),
        this.loadEntityWithRetry(
          () => Item.filter({ created_by: userEmail }),
          'Item'
        ),
        this.loadEntityWithRetry(
          () => Supplier.filter({ created_by: userEmail }),
          'Supplier'
        ),
        this.loadEntityWithRetry(
          () => CompanyProfile.filter({ created_by: userEmail }),
          'CompanyProfile'
        ),
      ]);

      return {
        success: true,
        transactions,
        accounts,
        invoices,
        expenses,
        customers,
        goals,
        items,
        suppliers,
        companyProfile: companyProfile.length > 0 ? companyProfile[0] : null,
        totalRecords: transactions.length + invoices.length + expenses.length
      };
    } catch (error) {
      return {
        success: false,
        error,
        transactions: [],
        accounts: [],
        invoices: [],
        expenses: [],
        customers: [],
        goals: [],
        items: [],
        suppliers: [],
        companyProfile: null,
        totalRecords: 0
      };
    }
  }

  /**
   * Load invoicing page data
   */
  async loadInvoicingData() {
    try {
      const user = await User.me();
      const userEmail = user.email;

      const [invoices, customers, items, recurringInvoices, creditNotes, transactions] = await Promise.all([
        this.loadEntityWithRetry(() => Invoice.filter({ created_by: userEmail }, "-invoice_date"), 'Invoices'),
        this.loadEntityWithRetry(() => Customer.filter({ created_by: userEmail }), 'Customers'),
        this.loadEntityWithRetry(() => Item.filter({ created_by: userEmail }), 'Items'),
        this.loadEntityWithRetry(() => RecurringInvoice.filter({ created_by: userEmail }), 'RecurringInvoices'),
        this.loadEntityWithRetry(() => CreditNote.filter({ created_by: userEmail }), 'CreditNotes'),
        this.loadEntityWithRetry(() => Transaction.filter({ created_by: userEmail, transaction_type: 'receipt' }), 'Transactions')
      ]);

      return {
        success: true,
        user,
        invoices,
        customers,
        items,
        recurringInvoices,
        creditNotes,
        transactions
      };
    } catch (error) {
      return {
        success: false,
        error,
        user: null, invoices: [], customers: [], items: [], recurringInvoices: [], creditNotes: [], transactions: []
      };
    }
  }

  /**
   * Load expense page data
   */
  async loadExpensePageData() {
    try {
      const user = await User.me();
      const userEmail = user.email;
      const userFilter = { created_by: userEmail };

      const [expenses, suppliers, items, purchaseOrders] = await Promise.all([
        this.loadEntityWithRetry(() => Expense.filter(userFilter, "-expense_date"), 'Expenses'),
        this.loadEntityWithRetry(() => Supplier.filter(userFilter), 'Suppliers'),
        this.loadEntityWithRetry(() => Item.filter(userFilter), 'Items'),
        this.loadEntityWithRetry(() => PurchaseOrder.filter(userFilter, "-order_date"), 'PurchaseOrders')
      ]);

      return { success: true, expenses, suppliers, items, purchaseOrders };
    } catch (error) {
      return { success: false, error, expenses: [], suppliers: [], items: [], purchaseOrders: [] };
    }
  }

  /**
   * Load inventory page data
   */
  async loadInventoryData() {
    try {
      const user = await User.me();
      const userEmail = user.email;
      const userFilter = { created_by: userEmail };

      const [
        items, 
        suppliers, 
        purchaseOrders,
        invoices, // For intelligence widget
        transactions, // For intelligence widget
        expenses, // For intelligence widget
        companyProfile // For intelligence widget
      ] = await Promise.all([
        this.loadEntityWithRetry(() => Item.filter(userFilter), 'Items'),
        this.loadEntityWithRetry(() => Supplier.filter(userFilter), 'Suppliers'),
        this.loadEntityWithRetry(() => PurchaseOrder.filter(userFilter, "-order_date"), 'PurchaseOrders'),
        this.loadEntityWithRetry(() => Invoice.filter(userFilter), 'Invoices'),
        this.loadEntityWithRetry(() => Transaction.filter(userFilter), 'Transactions'),
        this.loadEntityWithRetry(() => Expense.filter(userFilter), 'Expenses'),
        this.loadEntityWithRetry(() => CompanyProfile.filter(userFilter), 'CompanyProfile')
      ]);

      return { 
        success: true, 
        items, 
        suppliers, 
        purchaseOrders, 
        invoices, 
        transactions, 
        expenses, 
        companyProfile: companyProfile.length > 0 ? companyProfile[0] : null
      };
    } catch (error) {
      return { 
        success: false, 
        error, 
        items: [], 
        suppliers: [], 
        purchaseOrders: [],
        invoices: [], 
        transactions: [], 
        expenses: [], 
        companyProfile: null 
      };
    }
  }
}

// Export singleton instance
export default new DataService();
