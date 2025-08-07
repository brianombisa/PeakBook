import { subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

class BenchmarkingService {

  /**
   * Main function to get user metrics and compare them to simulated industry data.
   */
  static getIndustryBenchmarks({ invoices, expenses, customers, companyProfile }) {
    if (!companyProfile || !companyProfile.business_sector) {
      return null;
    }

    const userMetrics = this.calculateUserMetrics({ invoices, expenses });
    const industryData = this.getSimulatedIndustryData(companyProfile.business_sector);

    return {
      metrics: {
        grossProfitMargin: {
          user: userMetrics.grossProfitMargin,
          industry: industryData.grossProfitMargin,
        },
        revenueGrowth: {
          user: userMetrics.revenueGrowth,
          industry: industryData.revenueGrowth,
        },
        avgInvoiceValue: {
          user: userMetrics.avgInvoiceValue,
          industry: industryData.avgInvoiceValue,
        },
        avgCollectionPeriod: {
          user: userMetrics.avgCollectionPeriod,
          industry: industryData.avgCollectionPeriod,
        },
      },
      sector: companyProfile.business_sector.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };
  }

  /**
   * Calculates key performance indicators for the current user.
   */
  static calculateUserMetrics({ invoices, expenses }) {
    // --- Gross Profit Margin ---
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const cogs = expenses
      .filter(exp => exp.category === 'cost_of_sales')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const grossProfit = totalRevenue - cogs;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // --- Revenue Growth (Month-over-Month) ---
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    const thisMonthRevenue = invoices
      .filter(inv => new Date(inv.invoice_date) >= thisMonthStart)
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const lastMonthRevenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= lastMonthStart && invDate <= lastMonthEnd;
      })
      .reduce((sum, inv) => sum + inv.total_amount, 0);
      
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    
    // --- Average Invoice Value ---
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // --- Average Collection Period ---
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    let avgCollectionPeriod = 0;
    if (paidInvoices.length > 0) {
        const totalCollectionDays = paidInvoices.reduce((sum, inv) => {
            const days = differenceInDays(new Date(inv.updated_date), new Date(inv.invoice_date));
            return sum + Math.max(0, days);
        }, 0);
        avgCollectionPeriod = totalCollectionDays / paidInvoices.length;
    }

    return {
      grossProfitMargin,
      revenueGrowth,
      avgInvoiceValue,
      avgCollectionPeriod
    };
  }

  /**
   * Generates mock industry data for a given sector.
   * In a real app, this would be fetched from a secure backend aggregation service.
   */
  static getSimulatedIndustryData(sector) {
    // Base data
    const baseData = {
      grossProfitMargin: 35,
      revenueGrowth: 5,
      avgInvoiceValue: 50000,
      avgCollectionPeriod: 45,
    };

    // Modifiers by sector
    switch (sector) {
      case 'retail':
        baseData.grossProfitMargin = 25;
        baseData.avgInvoiceValue = 5000;
        baseData.avgCollectionPeriod = 5;
        break;
      case 'wholesale':
        baseData.grossProfitMargin = 18;
        baseData.avgInvoiceValue = 150000;
        baseData.avgCollectionPeriod = 60;
        break;
      case 'professional_services':
        baseData.grossProfitMargin = 60;
        baseData.revenueGrowth = 8;
        baseData.avgInvoiceValue = 250000;
        baseData.avgCollectionPeriod = 55;
        break;
      case 'manufacturing':
        baseData.grossProfitMargin = 30;
        baseData.revenueGrowth = 3;
        baseData.avgInvoiceValue = 500000;
        baseData.avgCollectionPeriod = 75;
        break;
      case 'hospitality':
        baseData.grossProfitMargin = 45;
        baseData.revenueGrowth = 10;
        baseData.avgInvoiceValue = 15000;
        baseData.avgCollectionPeriod = 10;
        break;
      default: // General Trading / Other
        break;
    }

    return baseData;
  }
}

export default BenchmarkingService;