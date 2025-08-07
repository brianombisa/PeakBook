
// PeakBooks API documentation and integration examples for mobile developers
import InvoiceAPI from './InvoiceAPI';
import ExpenseAPI from './ExpenseAPI';
import DashboardAPI from './DashboardAPI';

// PeakBooks API Documentation for mobile developers
export const API_DOCUMENTATION = {
    version: "1.0.0",
    baseUrl: "/api/v1",
    authentication: "Bearer token required",
    endpoints: {
        // Invoice endpoints
        "InvoiceAPI.getInvoices()": {
            description: "Get all invoices",
            parameters: { status: "optional", customer_id: "optional" },
            response: "Array of invoice objects"
        },
        "InvoiceAPI.getInvoiceById(id)": {
            description: "Get specific invoice",
            response: "Single invoice object"
        },
        "InvoiceAPI.createInvoice(data)": {
            description: "Create new invoice",
            body: "Invoice object",
            response: "Created invoice object"
        },
        "InvoiceAPI.updateInvoice(id, data)": {
            description: "Update invoice",
            body: "Invoice object",
            response: "Updated invoice object"
        },
        "InvoiceAPI.deleteInvoice(id)": {
            description: "Delete invoice",
            response: "Success message"
        },
        
        // Expense endpoints
        "ExpenseAPI.getExpenses()": {
            description: "Get all expenses",
            parameters: { category: "optional", status: "optional" },
            response: "Array of expense objects"
        },
        "ExpenseAPI.createExpense(data)": {
            description: "Create new expense",
            body: "Expense object",
            response: "Created expense object"
        },
        
        // Dashboard endpoints
        "DashboardAPI.getDashboardData(period)": {
            description: "Get dashboard data",
            parameters: { period: "ytd|this_month|last_month" },
            response: "Dashboard metrics and charts"
        }
    },
    responseFormat: {
        success: {
            success: true,
            data: "object|array",
            meta: "optional metadata object"
        },
        error: {
            success: false,
            error: "Error message",
            code: "ERROR_CODE"
        }
    }
};

// Sample usage for mobile developers
export const MOBILE_INTEGRATION_EXAMPLES = {
    login: `
        // Authentication (handled by base44 platform)
        const user = await User.me();
        // User is now authenticated
    `,
    
    getInvoices: `
        const response = await InvoiceAPI.getInvoices({ status: 'sent' });
        if (response.success) {
            setInvoices(response.data);
        } else {
            showError(response.error);
        }
    `,
    
    createInvoice: `
        const invoiceData = {
            customer_id: '123',
            client_name: 'Acme Corp',
            client_email: 'billing@acme.com',
            invoice_date: '2024-01-15',
            due_date: '2024-02-14',
            line_items: [
                { description: 'Web Development', quantity: 1, unit_price: 50000, total: 50000 }
            ],
            subtotal: 50000,
            tax_amount: 8000,
            total_amount: 58000
        };
        
        const response = await InvoiceAPI.createInvoice(invoiceData);
        if (response.success) {
            showSuccess('Invoice created successfully!');
            navigateToInvoiceList();
        } else {
            showError(response.error);
        }
    `,
    
    getDashboard: `
        const response = await DashboardAPI.getDashboardData('this_month');
        if (response.success) {
            updateDashboardUI(response.data);
        } else {
            showError(response.error);
        }
    `
};

// Export all APIs
export {
    InvoiceAPI,
    ExpenseAPI,
    DashboardAPI
};
