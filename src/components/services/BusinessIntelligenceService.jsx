import { InvokeLLM } from "@/api/integrations";
import { format, subMonths, startOfMonth } from 'date-fns';

class BusinessIntelligenceService {
  static async analyzeFinancials(data) {
    const { invoices, expenses } = data;

    // --- Data Preparation ---
    const now = new Date();
    const threeMonthsAgo = startOfMonth(subMonths(now, 2));

    const recentInvoices = invoices.filter(inv => new Date(inv.invoice_date) >= threeMonthsAgo);
    const recentExpenses = expenses.filter(exp => new Date(exp.expense_date) >= threeMonthsAgo);

    const monthlyRevenue = {};
    const monthlyExpenses = {};

    for (let i = 0; i < 3; i++) {
        const month = format(subMonths(now, i), 'yyyy-MM');
        monthlyRevenue[month] = 0;
        monthlyExpenses[month] = 0;
    }

    recentInvoices.forEach(inv => {
        const month = format(new Date(inv.invoice_date), 'yyyy-MM');
        if (monthlyRevenue.hasOwnProperty(month)) {
            monthlyRevenue[month] += inv.total_amount || 0;
        }
    });

    recentExpenses.forEach(exp => {
        const month = format(new Date(exp.expense_date), 'yyyy-MM');
        if (monthlyExpenses.hasOwnProperty(month)) {
            monthlyExpenses[month] += exp.amount || 0;
        }
    });
    
    const totalRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);

    const expenseCategories = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    const top5Expenses = Object.entries(expenseCategories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => `${name}: KES ${Math.round(amount).toLocaleString()}`)
        .join(', ');

    const prompt = `
      You are an expert financial analyst for a small to medium-sized enterprise in Kenya. Your task is to analyze the following financial data for the last 3 months and provide 3-4 actionable business insights. Be concise, direct, and focus on what matters most for a business owner.

      Financial Data Snapshot:
      - Total Revenue (3 mo): KES ${Math.round(totalRevenue).toLocaleString()}
      - Total Expenses (3 mo): KES ${Math.round(totalExpenses).toLocaleString()}
      - Monthly Revenue Data: ${JSON.stringify(monthlyRevenue)}
      - Monthly Expense Data: ${JSON.stringify(monthlyExpenses)}
      - Top 5 Expense Categories (All Time): ${top5Expenses}

      Based on this data, provide a list of the most critical insights. For each insight, provide a title, a short message (max 2 sentences), a severity level ('Low', 'Medium', 'High', 'Critical'), and a concrete suggested_action.
    `;

    const responseSchema = {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              message: { type: "string" },
              severity: { type: "string", enum: ['Low', 'Medium', 'High', 'Critical'] },
              suggested_action: { type: "string" },
            },
            required: ["title", "message", "severity", "suggested_action"],
          },
        },
      },
      required: ["insights"],
    };

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: responseSchema,
      });
      return { success: true, insights: response.insights };
    } catch (error) {
      console.error("Business Intelligence LLM Error:", error);
      return { success: false, error: "Failed to generate AI insights." };
    }
  }
}

export default BusinessIntelligenceService;