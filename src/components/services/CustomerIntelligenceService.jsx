import { InvokeLLM } from "@/api/integrations";

class CustomerIntelligenceService {
  static async analyzeCustomers(data) {
    const { customers, invoices } = data;

    if (customers.length === 0) {
      return { success: true, insights: { segments: [], actions: [] } };
    }

    const customerData = customers.map(c => {
        const customerInvoices = invoices.filter(inv => inv.customer_id === c.id || inv.client_name === c.customer_name);
        const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const lastPurchaseDate = customerInvoices.length > 0 ? customerInvoices.sort((a,b) => new Date(b.invoice_date) - new Date(a.invoice_date))[0].invoice_date : null;
        return {
            id: c.id,
            name: c.customer_name,
            totalSpent: Math.round(totalSpent),
            invoiceCount: customerInvoices.length,
            lastPurchaseDate
        };
    }).sort((a, b) => b.totalSpent - a.totalSpent);


    const prompt = `
      You are a customer relationship management (CRM) expert for a Kenyan SME. Analyze the following customer data and provide actionable insights.

      Customer Data:
      ${JSON.stringify(customerData.slice(0, 20), null, 2)} 

      Based on this data:
      1.  Segment the customers into three groups: 'High Value', 'Needs Attention' (e.g., high past value but not recent purchases), and 'New & Promising'. Provide a short reason for each customer's segmentation. List up to 2 customers per segment.
      2.  Suggest two specific, actionable recommendations to improve customer relationships or sales. For example, "Suggest a follow-up call to [Customer Name] as they haven't purchased in a while."
    `;

    const responseSchema = {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              segment_name: { type: "string", enum: ['High Value', 'Needs Attention', 'New & Promising'] },
              customers: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        reason: { type: "string" }
                    },
                    required: ["name", "reason"]
                }
              }
            },
            required: ["segment_name", "customers"],
          },
        },
        actions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" }
                },
                required: ["title", "description"]
            }
        }
      },
      required: ["segments", "actions"],
    };

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: responseSchema,
      });
      return { success: true, insights: response };
    } catch (error) {
      console.error("Customer Intelligence LLM Error:", error);
      return { success: false, error: "Failed to generate customer insights." };
    }
  }
}

export default CustomerIntelligenceService;