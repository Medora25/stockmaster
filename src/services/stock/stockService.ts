import { storageService } from '../storage/storageService';
import { Product, StockMovement, StockMovementType, DocumentStatus } from '@/core/types';

class StockService {
  /**
   * Processes stock movement for a document (Purchase, Delivery, etc.)
   * @param documentType The type of document ('PURCHASE', 'DELIVERY', etc.)
   * @param documentId The ID of the document
   * @param lines The document lines (products and quantities)
   * @param currentStatus The new status of the document
   * @param previousStatus The previous status of the document (if any)
   * @param referenceNumber The document number for reference
   */
  processDocumentStock(
    documentType: 'PURCHASE' | 'DELIVERY' | 'SALE',
    documentId: string,
    lines: Array<{ productId: string; quantity: number }>,
    currentStatus: DocumentStatus,
    previousStatus?: DocumentStatus,
    referenceNumber?: string
  ) {
    // Only process if status has changed to or from 'validated'
    if (currentStatus === previousStatus) return;

    const isValidating = currentStatus === 'validated';
    const isCancelling = (previousStatus === 'validated' && (currentStatus === 'cancelled' || currentStatus === 'draft'));

    if (!isValidating && !isCancelling) return;

    const products = storageService.loadCollection('products');
    const stockMovements = storageService.loadCollection('stockMovements') || [];

    lines.forEach(line => {
      const productIndex = products.findIndex(p => p.id === line.productId);
      if (productIndex === -1) return;

      const product = products[productIndex];
      const quantity = line.quantity;
      
      let movementType: StockMovementType;
      let quantityChange = 0;

      if (documentType === 'PURCHASE') {
        movementType = 'PURCHASE_IN';
        quantityChange = isValidating ? quantity : -quantity;
      } else if (documentType === 'DELIVERY' || documentType === 'SALE') {
        movementType = documentType === 'DELIVERY' ? 'DELIVERY_OUT' : 'SALE_OUT';
        quantityChange = isValidating ? -quantity : quantity;
      } else {
        return;
      }

      const previousStock = product.stockQuantity;
      const newStock = previousStock + quantityChange;

      // Update product stock
      products[productIndex] = {
        ...product,
        stockQuantity: newStock,
        updatedAt: new Date().toISOString()
      };

      // Record movement
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        type: movementType,
        productId: product.id,
        productName: product.name,
        quantity: quantityChange,
        previousStock,
        newStock,
        referenceType: documentType,
        referenceId: documentId,
        notes: `Document ${referenceNumber || documentId} ${isValidating ? 'validation' : 'cancellation'}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      stockMovements.push(movement);
    });

    storageService.saveCollection('products', products);
    storageService.saveCollection('stockMovements', stockMovements);
  }

  /**
   * Get stock history for a specific product
   */
  getProductHistory(productId: string): StockMovement[] {
    const movements = storageService.loadCollection('stockMovements') || [];
    return movements
      .filter(m => m.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const stockService = new StockService();
export default stockService;
