// A more sophisticated forecasting service
class ForecastingService {
    static generateCashFlowForecast(transactions, invoices, expenses, periodDays) {
        let historicalData = this.getHistoricalMonthlyNetFlow(transactions, invoices, expenses);
        
        // Calculate growth trend and seasonality (simplified)
        const growthRate = this.calculateGrowthRate(historicalData);
        
        let forecast = [];
        let lastBalance = historicalData[historicalData.length - 1]?.balance || 250000; // Start with current balance

        for (let i = 1; i <= periodDays; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            const dailyInflow = this.getScheduledInflows(invoices, date);
            const dailyOutflow = this.getScheduledOutflows(expenses, date);
            
            // Add baseline flow based on historical trend
            const baselineFlow = (historicalData[historicalData.length - 1]?.netFlow / 30) * (1 + growthRate);
            
            const netChange = dailyInflow - dailyOutflow + baselineFlow;
            lastBalance += netChange;
            
            forecast.push({
                date: date.toISOString().split('T')[0],
                balance: lastBalance,
                // For confidence interval
                upperBound: lastBalance * 1.15,
                lowerBound: lastBalance * 0.85
            });
        }
        
        return forecast;
    }

    static getHistoricalMonthlyNetFlow(transactions, invoices, expenses) {
        // This is a simplified version. A real one would be more detailed.
        let data = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const inflows = (invoices || [])
                .filter(inv => new Date(inv.invoice_date).getMonth() === date.getMonth())
                .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            const outflows = (expenses || [])
                .filter(exp => new Date(exp.expense_date).getMonth() === date.getMonth())
                .reduce((sum, exp) => sum + (exp.amount || 0), 0);
            
            data.push({
                month: date.toLocaleString('default', { month: 'short' }),
                netFlow: inflows - outflows,
                balance: (data[data.length - 1]?.balance || 250000) + (inflows - outflows)
            });
        }
        return data;
    }

    static calculateGrowthRate(data) {
        if (data.length < 2) return 0.05; // Default 5% growth
        const first = data[0].netFlow;
        const last = data[data.length - 1].netFlow;
        if (first === 0) return 0.05;
        return ((last - first) / first) / data.length;
    }

    static getScheduledInflows(invoices, date) {
        return (invoices || [])
            .filter(inv => inv.status !== 'paid' && new Date(inv.due_date).toISOString().split('T')[0] === date.toISOString().split('T')[0])
            .reduce((sum, inv) => sum + inv.total_amount, 0);
    }

    static getScheduledOutflows(expenses, date) {
        return (expenses || [])
            .filter(exp => exp.status === 'unpaid' && exp.due_date && new Date(exp.due_date).toISOString().split('T')[0] === date.toISOString().split('T')[0])
            .reduce((sum, exp) => sum + exp.amount, 0);
    }
}

export default ForecastingService;