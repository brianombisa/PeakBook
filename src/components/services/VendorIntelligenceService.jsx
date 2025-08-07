import { InventoryIntelligenceService } from './InventoryIntelligenceService';

class VendorIntelligenceService {
  /**
   * Generates smart purchasing suggestions based on inventory levels and supplier data.
   */
  static async generatePurchaseSuggestions({ items = [], suppliers = [] }) {
    const suggestions = [];

    // For now, let's create a placeholder analysis.
    // A real implementation would use InventoryIntelligenceService to find low-stock items.
    const lowStockItems = items.filter(item => item.is_trackable && (item.current_stock || 0) <= (item.reorder_level || 5));

    for (const item of lowStockItems) {
      const bestSupplier = this.findBestSupplierForItem(item, suppliers);
      const reorderQty = (item.reorder_level || 5) * 2; // Simple reorder logic

      if (bestSupplier) {
        suggestions.push({
          title: `Restock ${item.item_name}`,
          description: `You are low on ${item.item_name} (${item.current_stock} units remaining). Order now to avoid stockouts.`,
          bestSupplier: {
            id: bestSupplier.id,
            name: bestSupplier.supplier_name,
          },
          itemToOrder: {
            id: item.id,
            name: item.item_name,
            quantity: reorderQty,
            unitCost: item.unit_cost || 0
          },
          estimatedCost: reorderQty * (item.unit_cost || 0),
        });
      }
    }

    return suggestions;
  }

  /**
   * Finds the best supplier for a given item.
   * "Best" can be defined by price, rating, etc.
   * For now, it's a placeholder.
   */
  static findBestSupplierForItem(item, suppliers) {
    // In a real scenario, you'd check which suppliers sell this item
    // and compare their prices and ratings.
    // For now, just return the highest-rated supplier if any exist.
    if (suppliers.length > 0) {
      return suppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    }
    return null;
  }
}

export default VendorIntelligenceService;