import { Transaction } from '@/api/entities';
import { Account } from '@/api/entities';
import AuditLogger from '../utils/AuditLogger';

/**
 * TransactionService - The Single Source of Truth for all Accounting Entries.
 * This service ensures that every financial event in the application is correctly
 * recorded as a balanced, double-entry transaction in the General Ledger,
 * adhering to IFRS principles.
 */
class TransactionService {

  /**
   * Creates a transaction for a new invoice sale.
   * Debits Accounts Receivable, Credits Sales Revenue.
   * If inventory is tracked, Debits COGS and Credits Inventory.
   */
  static async createInvoiceSaleTransaction(invoice) {
    const baseCurrency = invoice.base_currency || 'KES';
    const exchangeRate = invoice.exchange_rate || 1;

    const totalAmountInBaseCurrency = invoice.currency !== baseCurrency
      ? invoice.total_amount * exchangeRate
      : invoice.total_amount;
    const subtotalInBaseCurrency = invoice.currency !== baseCurrency
      ? invoice.subtotal * exchangeRate
      : invoice.subtotal;
    const taxAmountInBaseCurrency = invoice.currency !== baseCurrency
      ? invoice.tax_amount * exchangeRate
      : invoice.tax_amount;

    const journal_entries = [
      // Entry 1: Record the sale (always in base currency for GL)
      {
        account_code: '1200',
        account_name: 'Accounts Receivable',
        debit_amount: totalAmountInBaseCurrency,
        credit_amount: 0
      },
      {
        account_code: '4000',
        account_name: 'Sales Revenue',
        debit_amount: 0,
        credit_amount: subtotalInBaseCurrency
      },
    ];

    if (taxAmountInBaseCurrency > 0) {
      journal_entries.push({
        account_code: '2210',
        account_name: 'VAT Payable',
        debit_amount: 0,
        credit_amount: taxAmountInBaseCurrency
      });
    }

    // Entry 2: Record Cost of Goods Sold (COGS) if applicable
    const cogs_amount = invoice.line_items?.reduce((sum, item) => {
      const itemCogs = (item.cost_price || 0) * item.quantity;
      return sum + (invoice.currency !== baseCurrency
        ? itemCogs * exchangeRate
        : itemCogs);
    }, 0) || 0;

    if (cogs_amount > 0) {
      journal_entries.push({
        account_code: '5000',
        account_name: 'Cost of Goods Sold',
        debit_amount: cogs_amount,
        credit_amount: 0
      });
      journal_entries.push({
        account_code: '1300',
        account_name: 'Inventory',
        debit_amount: 0,
        credit_amount: cogs_amount
      });
    }

    const transactionData = {
      transaction_date: invoice.invoice_date,
      reference_number: `INV-${invoice.invoice_number}`,
      description: `Sale recorded for Invoice #${invoice.invoice_number}${invoice.currency !== baseCurrency ? ` (${invoice.currency} converted at rate ${exchangeRate})` : ''}`,
      total_amount: totalAmountInBaseCurrency,
      currency: baseCurrency, // GL always in base currency
      transaction_type: 'sale',
      journal_entries,
      client_id: invoice.customer_id,
      invoice_id: invoice.id,
      status: 'posted'
    };

    const transaction = await Transaction.create(transactionData);
    await AuditLogger.log('created', 'Transaction', transaction.id, `Created multi-currency transaction for Invoice ${invoice.id}`);
    return transaction;
  }

  // Keep the old method name for backward compatibility
  static async createInvoiceTransaction(invoice) {
    return this.createInvoiceSaleTransaction(invoice);
  }

  /**
   * Creates a transaction for a payment received against an invoice.
   * Debits Cash/Bank, Credits Accounts Receivable.
   */
  static async createPaymentReceiptTransaction(payment, invoice, customer) {
    const baseCurrency = invoice.base_currency || 'KES'; // Assume invoice holds the base_currency
    const exchangeRate = payment.exchange_rate || 1; // Payment might have its own rate
    const paymentAmountInBaseCurrency = payment.currency !== baseCurrency
      ? payment.amount * exchangeRate
      : payment.amount;

    const transactionData = {
      transaction_date: payment.payment_date,
      reference_number: `PAY-${invoice.invoice_number}`,
      description: `Payment received for Invoice #${invoice.invoice_number} from ${customer.customer_name}` +
        `${payment.currency && payment.currency !== baseCurrency ? ` (${payment.currency} converted at rate ${exchangeRate})` : ''}`,
      total_amount: paymentAmountInBaseCurrency,
      currency: baseCurrency, // GL always in base currency
      transaction_type: 'receipt',
      journal_entries: [
        { account_code: '1010', account_name: 'Cash and Bank', debit_amount: paymentAmountInBaseCurrency, credit_amount: 0 },
        { account_code: '1200', account_name: 'Accounts Receivable', debit_amount: 0, credit_amount: paymentAmountInBaseCurrency },
      ],
      client_id: invoice.customer_id,
      invoice_id: invoice.id,
      status: 'posted'
    };
    const transaction = await Transaction.create(transactionData);
    await AuditLogger.log('created', 'Transaction', transaction.id, `Created multi-currency transaction for Payment on Invoice ${invoice.id}`);
    return transaction;
  }

  /**
   * Creates a transaction for a new expense.
   * Debits an Expense account, Credits Accounts Payable (if unpaid) or Cash/Bank (if paid).
   */
  static async createExpenseTransaction(expense) {
    const baseCurrency = expense.base_currency || 'KES';
    const exchangeRate = expense.exchange_rate || 1;

    const expenseAmountInBaseCurrency = expense.currency !== baseCurrency
      ? expense.amount * exchangeRate
      : expense.amount;
    const baseAmountInBaseCurrency = expense.currency !== baseCurrency
      ? (expense.base_amount || expense.amount) * exchangeRate
      : (expense.base_amount || expense.amount);
    const taxAmountInBaseCurrency = expense.currency !== baseCurrency
      ? expense.tax_amount * exchangeRate
      : expense.tax_amount;

    const expenseAccountCode = expense.account_code || '6100'; // Default to General Expenses
    const expenseAccountName = (await Account.filter({ account_code: expenseAccountCode }))[0]?.account_name || 'General & Administrative Expenses';

    const journal_entries = [
      { account_code: expenseAccountCode, account_name: expenseAccountName, debit_amount: baseAmountInBaseCurrency, credit_amount: 0 },
    ];

    if (taxAmountInBaseCurrency > 0) {
      journal_entries.push({ account_code: '1310', account_name: 'Input VAT', debit_amount: taxAmountInBaseCurrency, credit_amount: 0 });
    }

    if (expense.status === 'paid') {
      journal_entries.push({ account_code: '1010', account_name: 'Cash and Bank', debit_amount: 0, credit_amount: expenseAmountInBaseCurrency });
    } else {
      journal_entries.push({ account_code: '2100', account_name: 'Accounts Payable', debit_amount: 0, credit_amount: expenseAmountInBaseCurrency });
    }

    const transactionData = {
      transaction_date: expense.expense_date,
      reference_number: `EXP-${Date.now()}`,
      description: `Expense: ${expense.description}` +
        `${expense.currency && expense.currency !== baseCurrency ? ` (${expense.currency} converted at rate ${exchangeRate})` : ''}`,
      total_amount: expenseAmountInBaseCurrency,
      currency: baseCurrency, // GL always in base currency
      transaction_type: 'expense',
      journal_entries,
      supplier_id: expense.supplier_id,
      expense_id: expense.id,
      status: 'posted'
    };
    const transaction = await Transaction.create(transactionData);
    await AuditLogger.log('created', 'Transaction', transaction.id, `Created multi-currency transaction for Expense ${expense.id}`);
    return transaction;
  }

  /**
   * Creates a transaction when a credit note is issued.
   * Debits Sales Returns & Allowances, Debits VAT Payable (to reverse it), Credits Accounts Receivable.
   */
  static async createCreditNoteTransaction(creditNote, originalInvoice) {
    const baseCurrency = creditNote.base_currency || 'KES';
    const exchangeRate = creditNote.exchange_rate || 1;

    const subtotalInBaseCurrency = creditNote.currency !== baseCurrency
      ? creditNote.subtotal * exchangeRate
      : creditNote.subtotal;
    const totalAmountInBaseCurrency = creditNote.currency !== baseCurrency
      ? creditNote.total_amount * exchangeRate
      : creditNote.total_amount;
    const taxAmountInBaseCurrency = creditNote.currency !== baseCurrency
      ? creditNote.tax_amount * exchangeRate
      : creditNote.tax_amount;

    const journal_entries = [
      { account_code: '4100', account_name: 'Sales Returns and Allowances', debit_amount: subtotalInBaseCurrency, credit_amount: 0 },
      { account_code: '1200', account_name: 'Accounts Receivable', debit_amount: 0, credit_amount: totalAmountInBaseCurrency },
    ];

    if (taxAmountInBaseCurrency > 0) {
      journal_entries.push({ account_code: '2210', account_name: 'VAT Payable', debit_amount: taxAmountInBaseCurrency, credit_amount: 0 });
    }

    const transactionData = {
      transaction_date: creditNote.credit_note_date,
      reference_number: `CN-${creditNote.credit_note_number}`,
      description: `Credit Note issued for Invoice #${originalInvoice.invoice_number}` +
        `${creditNote.currency && creditNote.currency !== baseCurrency ? ` (${creditNote.currency} converted at rate ${exchangeRate})` : ''}`,
      total_amount: totalAmountInBaseCurrency,
      currency: baseCurrency, // GL always in base currency
      transaction_type: 'adjustment',
      journal_entries,
      client_id: creditNote.customer_id,
      invoice_id: creditNote.original_invoice_id,
      status: 'posted'
    };
    const transaction = await Transaction.create(transactionData);
    await AuditLogger.log('created', 'Transaction', transaction.id, `Created multi-currency transaction for Credit Note ${creditNote.id}`);
    return transaction;
  }

  /**
   * Creates the master journal entry for an entire payroll run.
   * Debits Salaries Expense, Debits various allowance expenses.
   * Credits Bank, Credits various statutory payable accounts (PAYE, NSSF, NHIF).
   */
  static async createPayrollTransaction(payrollRun) {
    // Assuming payroll is always in the base currency of the company for simplicity.
    // If multi-currency payroll is needed, the payrollRun object would need
    // currency and exchange_rate properties, and amounts would be converted.
    const journal_entries = [
      // Credit the total Net Pay to the bank/liability account
      { account_code: '1010', account_name: 'Cash and Bank', debit_amount: 0, credit_amount: payrollRun.total_net_pay },

      // Credit all statutory deductions to their respective payable accounts
      { account_code: '2220', account_name: 'PAYE Payable', debit_amount: 0, credit_amount: payrollRun.payslips.reduce((sum, p) => sum + (p.deductions?.paye_tax || 0), 0) },
      { account_code: '2230', account_name: 'NSSF Payable', debit_amount: 0, credit_amount: payrollRun.payslips.reduce((sum, p) => sum + (p.deductions?.nssf || 0), 0) },
      { account_code: '2240', account_name: 'NHIF/SHIF Payable', debit_amount: 0, credit_amount: payrollRun.payslips.reduce((sum, p) => sum + (p.deductions?.shif || 0), 0) },
      { account_code: '2250', account_name: 'Housing Levy Payable', debit_amount: 0, credit_amount: payrollRun.payslips.reduce((sum, p) => sum + (p.deductions?.housing_levy || 0), 0) },

      // Debit the total Gross Pay to the Salaries & Wages Expense account
      { account_code: '6000', account_name: 'Salaries and Wages Expense', debit_amount: payrollRun.total_gross_pay, credit_amount: 0 },
    ];

    const transactionData = {
      transaction_date: payrollRun.end_date,
      reference_number: `PAYROLL-${payrollRun.payroll_period.replace(' ', '-')}`,
      description: `Payroll for period ${payrollRun.payroll_period}`,
      total_amount: payrollRun.total_gross_pay,
      transaction_type: 'journal',
      journal_entries,
      status: 'posted'
    };

    const transaction = await Transaction.create(transactionData);
    await AuditLogger.log('created', 'Transaction', transaction.id, `Created master transaction for Payroll Run ${payrollRun.id}`);
    return transaction;
  }
}

export default TransactionService;