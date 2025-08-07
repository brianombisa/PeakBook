import { Invoice } from '@/api/entities';
import { Customer } from '@/api/entities';
import { Item } from '@/api/entities';
import { User } from '@/api/entities';
import { Transaction } from '@/api/entities';
import AuditLogger from '../utils/AuditLogger';

class InvoiceAPI {
    static async getInvoices(filters = {}) {
        try {
            const user = await User.me();
            const userFilter = { created_by: user.email, ...filters };
            
            const invoices = await Invoice.filter(userFilter, "-invoice_date");
            
            return {
                success: true,
                data: invoices,
                meta: {
                    total: invoices.length,
                    currency: 'KES'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'FETCH_INVOICES_ERROR'
            };
        }
    }

    static async getInvoiceById(invoiceId) {
        try {
            const user = await User.me();
            const invoices = await Invoice.filter({ 
                id: invoiceId, 
                created_by: user.email 
            });
            
            if (invoices.length === 0) {
                return {
                    success: false,
                    error: 'Invoice not found',
                    code: 'INVOICE_NOT_FOUND'
                };
            }

            return {
                success: true,
                data: invoices[0]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'FETCH_INVOICE_ERROR'
            };
        }
    }

    static async createInvoice(invoiceData) {
        try {
            const user = await User.me();
            
            // Generate invoice number
            const latestInvoice = await Invoice.filter({ created_by: user.email }, "-invoice_number", 1);
            const nextInvoiceNumber = latestInvoice.length > 0 
                ? `INV-${parseInt(latestInvoice[0].invoice_number.split('-')[1] || 1000) + 1}` 
                : "INV-1001";

            // Credit limit check
            if (invoiceData.customer_id) {
                const customers = await Customer.filter({ id: invoiceData.customer_id, created_by: user.email });
                if (customers.length > 0 && customers[0].credit_limit > 0) {
                    const outstandingInvoices = await Invoice.filter({
                        customer_id: invoiceData.customer_id,
                        created_by: user.email
                    });
                    
                    const outstandingAmount = outstandingInvoices
                        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off')
                        .reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

                    if ((outstandingAmount + invoiceData.total_amount) > customers[0].credit_limit) {
                        return {
                            success: false,
                            error: `Credit limit exceeded. Customer limit: KES ${customers[0].credit_limit.toLocaleString()}`,
                            code: 'CREDIT_LIMIT_EXCEEDED'
                        };
                    }
                }
            }

            const savedInvoice = await Invoice.create({
                ...invoiceData,
                invoice_number: nextInvoiceNumber,
                status: invoiceData.status || 'draft',
                balance_due: invoiceData.total_amount - (invoiceData.paid_amount || 0),
                currency: 'KES',
                created_by: user.email
            });

            // Create accounting transaction if needed
            if (savedInvoice.status === 'sent' || savedInvoice.status === 'paid') {
                await this.createInvoiceTransaction(savedInvoice, user);
            }

            await AuditLogger.logCreate('Invoice', savedInvoice);

            return {
                success: true,
                data: savedInvoice,
                message: 'Invoice created successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'CREATE_INVOICE_ERROR'
            };
        }
    }

    static async updateInvoice(invoiceId, updateData) {
        try {
            const user = await User.me();
            
            // Get existing invoice
            const existingInvoices = await Invoice.filter({ 
                id: invoiceId, 
                created_by: user.email 
            });
            
            if (existingInvoices.length === 0) {
                return {
                    success: false,
                    error: 'Invoice not found',
                    code: 'INVOICE_NOT_FOUND'
                };
            }

            const oldInvoice = existingInvoices[0];
            const updatedInvoice = await Invoice.update(invoiceId, {
                ...updateData,
                balance_due: updateData.total_amount - (updateData.paid_amount || 0)
            });

            // Create transaction if status changed to sent/paid
            if ((updateData.status === 'sent' || updateData.status === 'paid') && 
                oldInvoice.status === 'draft') {
                await this.createInvoiceTransaction(updatedInvoice, user);
            }

            await AuditLogger.logUpdate('Invoice', invoiceId, oldInvoice, updatedInvoice, updatedInvoice.invoice_number);

            return {
                success: true,
                data: updatedInvoice,
                message: 'Invoice updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'UPDATE_INVOICE_ERROR'
            };
        }
    }

    static async deleteInvoice(invoiceId) {
        try {
            const user = await User.me();
            
            const invoices = await Invoice.filter({ 
                id: invoiceId, 
                created_by: user.email 
            });
            
            if (invoices.length === 0) {
                return {
                    success: false,
                    error: 'Invoice not found',
                    code: 'INVOICE_NOT_FOUND'
                };
            }

            await AuditLogger.logDelete('Invoice', invoiceId, invoices[0].invoice_number);
            await Invoice.delete(invoiceId);

            return {
                success: true,
                message: 'Invoice deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'DELETE_INVOICE_ERROR'
            };
        }
    }

    static async getInvoiceStats() {
        try {
            const user = await User.me();
            const invoices = await Invoice.filter({ created_by: user.email });
            
            const stats = {
                total_invoices: invoices.length,
                draft_invoices: invoices.filter(inv => inv.status === 'draft').length,
                sent_invoices: invoices.filter(inv => inv.status === 'sent').length,
                paid_invoices: invoices.filter(inv => inv.status === 'paid').length,
                overdue_invoices: invoices.filter(inv => inv.status === 'overdue').length,
                total_outstanding: invoices
                    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'written_off')
                    .reduce((sum, inv) => sum + (inv.balance_due || 0), 0),
                total_revenue: invoices
                    .filter(inv => inv.status === 'paid')
                    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
            };

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: 'GET_STATS_ERROR'
            };
        }
    }

    static async createInvoiceTransaction(invoice, user) {
        try {
            // Check if transaction already exists
            const existingTransactions = await Transaction.filter({
                created_by: user.email,
                invoice_id: invoice.id,
                transaction_type: 'sale'
            });

            if (existingTransactions.length === 0) {
                await Transaction.create({
                    transaction_date: invoice.invoice_date,
                    reference_number: `INV-${invoice.invoice_number}`,
                    description: `Sale from invoice ${invoice.invoice_number} - ${invoice.client_name}`,
                    total_amount: invoice.total_amount,
                    currency: invoice.currency || 'KES',
                    transaction_type: 'sale',
                    invoice_id: invoice.id,
                    client_id: invoice.customer_id,
                    journal_entries: [
                        {
                            account_code: "1100",
                            account_name: "Accounts Receivable",
                            debit_amount: invoice.total_amount,
                            credit_amount: 0,
                            description: `Invoice ${invoice.invoice_number} - ${invoice.client_name}`
                        },
                        {
                            account_code: "4000",
                            account_name: "Sales Revenue",
                            debit_amount: 0,
                            credit_amount: invoice.total_amount,
                            description: `Sale - Invoice ${invoice.invoice_number}`
                        }
                    ],
                    status: 'posted',
                    created_by: user.email
                });
            }
        } catch (error) {
            console.error('Error creating invoice transaction:', error);
        }
    }
}

export default InvoiceAPI;