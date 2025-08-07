import { KRATaxReturn } from '@/api/entities';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';

class KRATaxService {
  /**
   * Main function to generate a KRA tax return from financial data
   */
  static async generateTaxReturn({
    returnType,
    startDate,
    endDate,
    transactions = [],
    invoices = [],
    expenses = [],
    userEmail
  }) {
    try {
      console.log(`Generating ${returnType} return for period ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

      let taxReturnData;

      switch (returnType) {
        case 'vat':
          taxReturnData = this.calculateVATReturn({ startDate, endDate, invoices, expenses });
          break;
        case 'withholding_tax':
          taxReturnData = this.calculateWithholdingTaxReturn({ startDate, endDate, expenses });
          break;
        case 'paye':
          taxReturnData = this.calculatePAYEReturn({ startDate, endDate, transactions });
          break;
        default:
          throw new Error(`Unsupported return type: ${returnType}`);
      }

      // Calculate due date (20th of the following month for VAT)
      const dueDate = returnType === 'vat' ? 
        new Date(endDate.getFullYear(), endDate.getMonth() + 1, 20) :
        addDays(endDate, 30);

      // Create the tax return record
      const taxReturn = await KRATaxReturn.create({
        business_id: userEmail, // Using email as business identifier
        return_type: returnType,
        period: format(startDate, 'MMMM yyyy'),
        period_start_date: format(startDate, 'yyyy-MM-dd'),
        period_end_date: format(endDate, 'yyyy-MM-dd'),
        due_date: format(dueDate, 'yyyy-MM-dd'),
        status: 'generated',
        itax_file_url: `#generated-${returnType}-${format(startDate, 'yyyy-MM')}`, // Placeholder for file download
        ...taxReturnData
      });

      return {
        success: true,
        taxReturn,
        message: `${returnType.toUpperCase()} return generated successfully`
      };

    } catch (error) {
      console.error('Error generating tax return:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate VAT return from invoices and expenses
   */
  static calculateVATReturn({ startDate, endDate, invoices, expenses }) {
    console.log(`Calculating VAT for period ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // Filter transactions within the period
    const periodInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate >= startDate && invDate <= endDate;
    });

    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate >= startDate && expDate <= endDate;
    });

    console.log(`Found ${periodInvoices.length} invoices and ${periodExpenses.length} expenses in period`);

    // Calculate output VAT (VAT on sales)
    const totalSales = periodInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const vatableSales = totalSales; // Assuming all sales are vatable (16%)
    const exemptSales = 0; // Assuming no exempt sales for simplicity
    const outputVAT = vatableSales * 0.16 / 1.16; // Extract VAT from VAT-inclusive amount

    // Calculate input VAT (VAT on purchases)
    const totalPurchases = periodExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const inputVAT = totalPurchases * 0.16 / 1.16; // Extract VAT from VAT-inclusive amount

    // Net VAT due (Output VAT - Input VAT)
    const netVAT = Math.max(0, outputVAT - inputVAT);

    console.log(`VAT Calculation: Sales=${totalSales}, Output VAT=${outputVAT}, Input VAT=${inputVAT}, Net VAT=${netVAT}`);

    return {
      total_sales: Math.round(totalSales),
      vatable_sales: Math.round(vatableSales),
      exempt_sales: Math.round(exemptSales),
      output_vat: Math.round(outputVAT),
      input_vat: Math.round(inputVAT),
      net_vat: Math.round(netVAT)
    };
  }

  /**
   * Calculate Withholding Tax return from expenses
   */
  static calculateWithholdingTaxReturn({ startDate, endDate, expenses }) {
    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate >= startDate && expDate <= endDate;
    });

    // Calculate withholding tax on professional services (5% of gross amount)
    const professionalServiceExpenses = periodExpenses.filter(exp => 
      exp.category === 'professional_services'
    );

    const withholdingTaxDeducted = professionalServiceExpenses.reduce((sum, exp) => {
      return sum + (exp.amount * 0.05); // 5% withholding tax
    }, 0);

    return {
      withholding_tax_deducted: Math.round(withholdingTaxDeducted)
    };
  }

  /**
   * Calculate PAYE return from payroll transactions
   */
  static calculatePAYEReturn({ startDate, endDate, transactions }) {
    // Filter payroll transactions (assuming they have a specific type or pattern)
    const payrollTransactions = transactions.filter(trans => {
      const transDate = new Date(trans.transaction_date);
      return transDate >= startDate && 
             transDate <= endDate && 
             trans.transaction_type === 'expense' &&
             trans.description?.toLowerCase().includes('payroll');
    });

    // Estimate PAYE (this would be more sophisticated in a real implementation)
    const totalPayroll = payrollTransactions.reduce((sum, trans) => sum + trans.total_amount, 0);
    const estimatedPAYE = totalPayroll * 0.15; // Rough estimate

    return {
      paye_deducted: Math.round(estimatedPAYE)
    };
  }

  /**
   * Generate the actual Excel file for iTax upload
   * (This would be implemented as a backend function in a real system)
   */
  static async generateITaxFile(taxReturn) {
    // In a real implementation, this would:
    // 1. Create an Excel workbook with KRA-compliant formatting
    // 2. Populate it with the tax return data
    // 3. Save it to cloud storage
    // 4. Return the download URL

    // For now, we'll simulate this
    return {
      success: true,
      fileUrl: `https://example.com/downloads/vat-return-${taxReturn.period.replace(' ', '-')}.xlsx`,
      fileName: `VAT-Return-${taxReturn.period.replace(' ', '-')}.xlsx`
    };
  }
}

export default KRATaxService;