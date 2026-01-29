import { storageService } from '../storage/storageService';
import { AuditLog } from '@/core/types';

class AuditService {
  /**
   * Log an action in the audit logs
   * @param action Description of the action (e.g., 'CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'CANCEL')
   * @param entityType The type of entity being acted upon (e.g., 'SALE', 'PURCHASE', 'PRODUCT', etc.)
   * @param entityId The ID of the entity
   * @param details Additional details about the action
   * @param userName Optional user name (defaults to 'System' if not provided)
   */
  log(
    action: string,
    entityType: string,
    entityId?: string,
    details?: string,
    userName: string = 'Admin'
  ) {
    const auditLogs = storageService.loadCollection('auditLogs') || [];
    
    const logEntry: AuditLog = {
      id: crypto.randomUUID(),
      action,
      entityType,
      entityId,
      details,
      userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    auditLogs.push(logEntry);
    
    // Keep only the last 1000 logs to prevent LocalStorage bloat
    const limitedLogs = auditLogs.slice(-1000);
    
    storageService.saveCollection('auditLogs', limitedLogs);
  }

  /**
   * Get logs for a specific entity
   */
  getEntityLogs(entityType: string, entityId: string): AuditLog[] {
    const logs = storageService.loadCollection('auditLogs') || [];
    return logs
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all logs sorted by date (newest first)
   */
  getAllLogs(): AuditLog[] {
    const logs = storageService.loadCollection('auditLogs') || [];
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Clear all audit logs
   */
  clearLogs(): void {
    storageService.saveCollection('auditLogs', []);
  }
}

export const auditService = new AuditService();
export default auditService;
