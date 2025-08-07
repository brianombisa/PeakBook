
import { ScheduledTransaction } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Expense } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { format } from "date-fns";

class ScheduledTransactionService {
  static async processScheduledTransactions() {
    try {
      console.log("Checking for scheduled transactions to execute...");
      
      // Get all scheduled transactions that are due
      const now = new Date();
      const scheduledTransactions = await ScheduledTransaction.filter({
        status: 'scheduled'
      });

      const dueTransactions = scheduledTransactions.filter(st => {
        const scheduledTime = new Date(st.scheduled_date);
        return scheduledTime <= now;
      });

      console.log(`Found ${dueTransactions.length} transactions ready for execution`);

      for (const scheduledTx of dueTransactions) {
        await this.executeScheduledTransaction(scheduledTx);
      }
    } catch (error) {
      console.error("Error processing scheduled transactions:", error);
    }
  }

  static async executeScheduledTransaction(scheduledTx) {
    try {
      console.log(`Executing scheduled ${scheduledTx.transaction_type} - ID: ${scheduledTx.id}`);
      
      // Update attempts
      await ScheduledTransaction.update(scheduledTx.id, {
        execution_attempts: (scheduledTx.execution_attempts || 0) + 1,
        last_attempt_date: new Date().toISOString()
      });

      let createdTransaction = null;

      // Create the actual transaction based on type
      switch (scheduledTx.transaction_type) {
        case 'invoice':
          createdTransaction = await this.createScheduledInvoice(scheduledTx);
          break;
        case 'expense':
          createdTransaction = await this.createScheduledExpense(scheduledTx);
          break;
        case 'payment':
        case 'receipt':
          createdTransaction = await this.createScheduledPayment(scheduledTx);
          break;
        default:
          throw new Error(`Unsupported transaction type: ${scheduledTx.transaction_type}`);
      }

      // Send email if required
      if (scheduledTx.delivery_method === 'email' || scheduledTx.delivery_method === 'both') {
        await this.sendTransactionEmail(scheduledTx, createdTransaction);
      }

      // Mark as delivered
      await ScheduledTransaction.update(scheduledTx.id, {
        status: 'delivered',
        created_transaction_id: createdTransaction?.id
      });

      console.log(`Successfully executed scheduled transaction ${scheduledTx.id}`);
    } catch (error) {
      console.error(`Error executing scheduled transaction ${scheduledTx.id}:`, error);
      
      // Mark as failed
      await ScheduledTransaction.update(scheduledTx.id, {
        status: 'failed',
        error_message: error.message
      });
    }
  }

  static async createScheduledInvoice(scheduledTx) {
    const invoiceData = {
      ...scheduledTx.transaction_data,
      status: 'sent', // Auto-send scheduled invoices
      created_date: new Date().toISOString()
    };

    // Generate sequential invoice number
    const allInvoices = await Invoice.list("-invoice_number");
    let nextInvoiceNumber = 101;
    
    if (allInvoices.length > 0) {
      const lastInvoiceNumber = Math.max(
        ...allInvoices.map(inv => parseInt(inv.invoice_number)).filter(n => !isNaN(n)), 
        100
      );
      nextInvoiceNumber = lastInvoiceNumber + 1;
    }

    invoiceData.invoice_number = nextInvoiceNumber.toString();

    return await Invoice.create(invoiceData);
  }

  static async createScheduledExpense(scheduledTx) {
    const expenseData = {
      ...scheduledTx.transaction_data,
      status: 'approved', // Auto-approve scheduled expenses
      created_date: new Date().toISOString()
    };

    return await Expense.create(expenseData);
  }

  static async createScheduledPayment(scheduledTx) {
    const transactionData = {
      ...scheduledTx.transaction_data,
      status: 'posted',
      created_date: new Date().toISOString()
    };

    return await Transaction.create(transactionData);
  }

  static async sendTransactionEmail(scheduledTx, createdTransaction) {
    const transactionType = scheduledTx.transaction_type;
    const recipientEmail = scheduledTx.recipient_email;

    let subject = '';
    let body = '';

    switch (transactionType) {
      case 'invoice':
        subject = `Invoice ${createdTransaction.invoice_number} from PeakBooks`;
        body = `Dear Valued Customer,

Please find your scheduled invoice attached.

Invoice Number: ${createdTransaction.invoice_number}
Total Amount: KES ${createdTransaction.total_amount?.toLocaleString()}
Due Date: ${format(new Date(createdTransaction.due_date), 'PPP')}

This invoice was automatically generated and delivered as scheduled.

Thank you for your business.

Best regards,
PeakBooks Team`;
        break;

      case 'expense':
        subject = `Scheduled Expense Notification`;
        body = `A scheduled expense has been automatically created and approved:

Description: ${createdTransaction.description}
Amount: KES ${createdTransaction.amount?.toLocaleString()}
Date: ${format(new Date(createdTransaction.expense_date), 'PPP')}

This expense was processed as scheduled.`;
        break;

      default:
        subject = `Scheduled ${transactionType} processed`;
        body = `Your scheduled ${transactionType} has been automatically processed.`;
    }

    // Note: Email sending to external clients is simulated
    console.log(`Email prepared for ${recipientEmail}: ${subject}`);
    
    // In a real implementation, you would uncomment the following:
    // await SendEmail({
    //   from_name: "PeakBooks",
    //   to: recipientEmail,
    //   subject: subject,
    //   body: body
    // });
  }

  // Initialize the service to run periodically
  static startScheduler() {
    console.log("Starting scheduled transaction service...");
    
    // Check every 5 minutes
    setInterval(() => {
      this.processScheduledTransactions();
    }, 5 * 60 * 1000);

    // Run immediately on start
    this.processScheduledTransactions();
  }
}

export default ScheduledTransactionService;
