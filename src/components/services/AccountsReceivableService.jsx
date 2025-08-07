
import { Invoice } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Customer } from '@/api/entities';
import { differenceInDays } from 'date-fns';

/**
 * AccountsReceivableService - Single Source of Truth for all AR calculations
 * This service ensures that Outstanding Receivables figures are consistent
 * across Dashboard, Invoicing, Balance Sheet, and Aged Receivables reports.
 */
class AccountsReceivableService {
  
  /**
   * Calculate outstanding receivables using ONLY invoice-based method
   * This ensures consistency across all parts of the application
   */
  static async calculateOutstandingReceivables(invoices = [], transactions = []) {
    try {
      // ONLY use invoice-based calculation for consistency
      let outstandingAmount = 0;
      
      invoices.forEach(invoice => {
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'written_off') {
          // Calculate payments received for this invoice
          const paymentsReceived = (invoice.payments_received || [])
            .reduce((sum, payment) => sum + (payment.base_currency_amount || payment.amount || 0), 0);
          
          // Use the correct currency conversion
          const invoiceAmountInBaseCurrency = invoice.base_currency_total || 
            (invoice.currency !== 'KES' && invoice.exchange_rate ? 
              invoice.total_amount * invoice.exchange_rate : 
              invoice.total_amount) || 0;
          
          const balanceDue = Math.max(0, invoiceAmountInBaseCurrency - paymentsReceived);
          outstandingAmount += balanceDue;
        }
      });

      return {
        outstandingAmount: Math.round(outstandingAmount),
        calculationMethod: 'invoice-based'
      };

    } catch (error) {
      console.error('Error calculating outstanding receivables:', error);
      return {
        outstandingAmount: 0,
        calculationMethod: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get aged receivables analysis with customer breakdown
   * This method is used by the AgedReceivables component
   */
  static async getAgedReceivables(invoices = [], customers = [], transactions = []) {
    try {
      const customerAging = new Map();
      const today = new Date();

      // Initialize aging totals
      const totals = {
        totalBalance: 0,
        current: 0,      // 0-30 days
        days31to60: 0,   // 31-60 days  
        days61to90: 0,   // 61-90 days
        over90: 0        // 91+ days
      };

      // Process each invoice for aging analysis
      invoices.forEach(invoice => {
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'written_off') {
          const customer = customers.find(c => c.id === invoice.customer_id);
          const customerName = customer?.customer_name || invoice.client_name || 'Unknown Customer';
          
          // Calculate balance due
          const paymentsReceived = (invoice.payments_received || [])
            .reduce((sum, payment) => sum + (payment.base_currency_amount || payment.amount || 0), 0);
          
          const invoiceAmountInBaseCurrency = invoice.base_currency_total || 
            (invoice.currency !== 'KES' && invoice.exchange_rate ? 
              invoice.total_amount * invoice.exchange_rate : 
              invoice.total_amount) || 0;
          
          const balanceDue = Math.max(0, invoiceAmountInBaseCurrency - paymentsReceived);
          
          if (balanceDue > 0) {
            // Initialize customer aging if not exists
            if (!customerAging.has(invoice.customer_id)) {
              customerAging.set(invoice.customer_id, {
                customerId: invoice.customer_id,
                customerName: customerName,
                totalBalance: 0,
                current: 0,
                days31to60: 0,
                days61to90: 0,
                over90: 0,
                invoices: []
              });
            }

            const customerData = customerAging.get(invoice.customer_id);
            
            // Calculate aging based on due date
            let agingBucket = 'current';
            if (invoice.due_date) {
              const daysPastDue = Math.max(0, Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
              
              if (daysPastDue > 90) {
                agingBucket = 'over90';
              } else if (daysPastDue > 60) {
                agingBucket = 'days61to90';
              } else if (daysPastDue > 30) {
                agingBucket = 'days31to60';
              } else {
                agingBucket = 'current';
              }
            }

            // Add to customer aging
            customerData.totalBalance += balanceDue;
            customerData[agingBucket] += balanceDue;
            customerData.invoices.push({
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date,
              total_amount: invoiceAmountInBaseCurrency,
              balance_due: balanceDue,
              status: invoice.status,
              daysPastDue: invoice.due_date ? Math.max(0, Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0
            });

            // Add to totals
            totals.totalBalance += balanceDue;
            totals[agingBucket] += balanceDue;
          }
        }
      });

      // Convert to array and sort by total balance descending
      const agedData = Array.from(customerAging.values())
        .sort((a, b) => b.totalBalance - a.totalBalance);

      // Round all amounts
      Object.keys(totals).forEach(key => {
        totals[key] = Math.round(totals[key]);
      });

      agedData.forEach(customer => {
        customer.totalBalance = Math.round(customer.totalBalance);
        customer.current = Math.round(customer.current);
        customer.days31to60 = Math.round(customer.days31to60);
        customer.days61to90 = Math.round(customer.days61to90);
        customer.over90 = Math.round(customer.over90);
      });

      return {
        agedData,
        totals,
        success: true
      };

    } catch (error) {
      console.error('Error calculating aged receivables:', error);
      return {
        agedData: [],
        totals: {
          totalBalance: 0,
          current: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0
        },
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate data consistency between invoices and transactions
   */
  static async validateDataConsistency(invoices = [], transactions = []) {
    try {
      // Since calculateOutstandingReceivables now only uses invoice-based,
      // this method's "consistency" checks will be redefined.
      // We will now primarily check for discrepancies like missing transactions or orphaned transactions
      // rather than comparing two different calculation methods for AR.

      const issues = [];
      
      const invoiceBasedARResult = await this.calculateOutstandingReceivables(invoices, transactions);
      const invoiceBasedARAmount = invoiceBasedARResult.outstandingAmount;

      // Re-implement a transaction-based AR calculation here for comparison if desired,
      // or simply rely on other consistency checks. For now, let's just make sure
      // that transaction-based AR is also computed for comparison.
      let transactionBasedAR = 0;
      const processedTransactions = new Set();
      const validInvoiceIds = new Set(invoices.map(inv => inv.id));

      transactions.forEach(transaction => {
        if (!transaction.invoice_id || !validInvoiceIds.has(transaction.invoice_id)) {
            return;
        }

        if (processedTransactions.has(transaction.id)) return;
        processedTransactions.add(transaction.id);

        if (transaction.journal_entries) {
          transaction.journal_entries.forEach(entry => {
            if (entry.account_code === '1200' || entry.account_name === 'Accounts Receivable') {
              const amount = (entry.debit_amount || 0) - (entry.credit_amount || 0);
              transactionBasedAR += amount;
            }
          });
        }
      });
      transactionBasedAR = Math.max(0, transactionBasedAR); // Clean up negative AR

      const difference = Math.abs(invoiceBasedARAmount - transactionBasedAR);
      const isConsistentCalculation = difference < 100; // Allow for small rounding differences

      if (!isConsistentCalculation) {
        issues.push({
          type: 'calculation_mismatch',
          severity: 'medium',
          message: `Invoice-based AR (KES ${invoiceBasedARAmount.toLocaleString()}) differs significantly from transaction-based AR (KES ${Math.round(transactionBasedAR).toLocaleString()}) by KES ${Math.round(difference).toLocaleString()}`,
          recommendation: 'Review transactions for unlinked or duplicate entries. Consider running data reconciliation.'
        });
      }


      // Check for invoices without corresponding transactions
      let invoicesWithoutTransactions = 0;
      invoices.forEach(invoice => {
        // Only check for invoices that should have transactions (e.g., non-draft, non-paid/cancelled/written_off)
        if (invoice.status !== 'draft' && invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'written_off') {
            const hasTransaction = transactions.some(t => t.invoice_id === invoice.id);
            if (!hasTransaction) {
                invoicesWithoutTransactions++;
            }
        }
      });

      if (invoicesWithoutTransactions > 0) {
        issues.push({
          type: 'missing_transactions',
          severity: 'high',
          message: `${invoicesWithoutTransactions} active invoices don't have corresponding accounting transactions.`,
          recommendation: 'These invoices may need to have their accounting entries regenerated.'
        });
      }

      // Check for orphaned AR transactions
      let orphanedTransactions = 0;
      transactions.forEach(transaction => {
        if (transaction.transaction_type === 'sale' && transaction.invoice_id) {
          const invoiceExists = invoices.some(inv => inv.id === transaction.invoice_id);
          if (!invoiceExists) {
            // Further check if it's an AR relevant transaction (journal entry to AR account)
            const isARTransaction = transaction.journal_entries?.some(entry => entry.account_code === '1200' || entry.account_name === 'Accounts Receivable');
            if (isARTransaction) {
                orphanedTransactions++;
            }
          }
        }
      });

      if (orphanedTransactions > 0) {
        issues.push({
          type: 'orphaned_transactions',
          severity: 'medium',
          message: `${orphanedTransactions} transactions reference non-existent or deleted invoices that still impact AR.`,
          recommendation: 'Consider cleaning up or reconciling these transactions to a suspense account.'
        });
      }

      const overallIsConsistent = issues.length === 0;

      return {
        isConsistent: overallIsConsistent,
        issues,
        invoiceBasedAR: invoiceBasedARAmount,
        transactionBasedAR: Math.round(transactionBasedAR),
        difference: Math.round(difference),
        recommendation: overallIsConsistent ?
          'Data appears consistent based on various checks.' :
          'Review the identified issues for potential data discrepancies.'
      };

    } catch (error) {
      return {
        isConsistent: false,
        issues: [{
          type: 'validation_error',
          severity: 'high',
          message: `Error validating data consistency: ${error.message}`,
          recommendation: 'Check application logs for more details'
        }],
        error: error.message
      };
    }
  }

  /**
   * Get detailed breakdown of outstanding receivables by customer
   * Fixed to prevent NaN errors
   */
  static async getOutstandingByCustomer(invoices = [], customers = [], transactions = []) {
    const customerBalances = new Map();

    // Initialize customer balances
    customers.forEach(customer => {
      customerBalances.set(customer.id, {
        customerId: customer.id,
        customerName: customer.customer_name || 'Unknown Customer',
        outstandingAmount: 0,
        invoices: []
      });
    });

    // Calculate from invoices (most reliable method)
    invoices.forEach(invoice => {
      if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'written_off') {
        let customer = customerBalances.get(invoice.customer_id);
        
        // Handle cases where customer might not exist in customers array
        if (!customer) {
          customer = {
            customerId: invoice.customer_id,
            customerName: invoice.client_name || 'Unknown Customer',
            outstandingAmount: 0,
            invoices: []
          };
          customerBalances.set(invoice.customer_id, customer);
        }

        // Calculate payments received - FIXED to prevent NaN
        const paymentsReceived = (invoice.payments_received || [])
          .reduce((sum, payment) => {
            const paymentAmount = payment.base_currency_amount || payment.amount || 0;
            return sum + (isNaN(paymentAmount) ? 0 : paymentAmount);
          }, 0);
        
        // Calculate invoice amount in base currency - FIXED to prevent NaN
        const totalAmount = invoice.total_amount || 0;
        const exchangeRate = invoice.exchange_rate || 1;
        const invoiceAmountInBaseCurrency = invoice.base_currency_total || 
          (invoice.currency !== 'KES' && !isNaN(exchangeRate) ? 
            totalAmount * exchangeRate : 
            totalAmount);
        
        // Calculate balance due - FIXED to prevent NaN
        const balanceDue = Math.max(0, (invoiceAmountInBaseCurrency || 0) - paymentsReceived);
        
        if (!isNaN(balanceDue) && balanceDue > 0) {
          customer.outstandingAmount += balanceDue;
          customer.invoices.push({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            total_amount: invoiceAmountInBaseCurrency,
            balance_due: balanceDue,
            status: invoice.status
          });
        }
      }
    });

    // Convert to array and clean up NaN values
    const result = Array.from(customerBalances.values())
      .map(customer => ({
        ...customer,
        outstandingAmount: isNaN(customer.outstandingAmount) ? 0 : Math.round(customer.outstandingAmount)
      }))
      .filter(customer => customer.outstandingAmount > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    return result;
  }

  /**
   * Get aging analysis of receivables (simplified version)
   * This is an alias for backward compatibility
   */
  static async getAgingAnalysis(invoices = [], customers = []) {
    const result = await this.getAgedReceivables(invoices, customers, []);
    return {
      current: result.totals.current,
      thirtyDays: result.totals.days31to60,
      sixtyDays: result.totals.days61to90,
      ninetyDays: result.totals.over90,
      total: result.totals.totalBalance
    };
  }
}

export default AccountsReceivableService;
