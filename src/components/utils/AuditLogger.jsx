import { AuditLog } from "@/api/entities";
import { User } from "@/api/entities";

class AuditLogger {
  static async log(action, entityType, entityId = null, entityName = null, options = {}) {
    try {
      // Get current user info
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (error) {
        // User might not be logged in for some actions - fail silently
        console.warn("Could not get current user for audit log:", error.message);
        return false; // Return false but don't throw
      }

      // Determine severity based on action and entity type, or use provided option
      const severity = options.severity || this.getSeverity(action, entityType);

      // Create audit log entry
      const auditEntry = {
        user_email: currentUser?.email || 'system',
        user_name: currentUser?.full_name || 'System',
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        old_values: options.oldValues || null,
        new_values: options.newValues || null,
        ip_address: this.getClientIP(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        session_id: this.getSessionId(),
        severity,
        description: options.description || this.generateDescription(action, entityType, entityName),
        metadata: options.metadata || {}
      };

      await AuditLog.create(auditEntry);
      return true;
    } catch (error) {
      // Silently handle audit failures - don't break the main application flow
      console.warn("Failed to create audit log entry:", error.message);
      
      // Only log to browser console in development or if it's a critical error
      if (error.message.includes('ServerSelectionTimeoutError') || error.message.includes('No replica set members')) {
        console.warn("Audit logging temporarily unavailable due to database connectivity issues");
      } else {
        console.error("Unexpected audit logging error:", error);
      }
      
      return false; // Return false but don't throw - this prevents breaking the main operation
    }
  }

  static getSeverity(action, entityType) {
    // Critical actions
    if (action === 'deleted' || action === 'written_off' || action === 'logout') {
      return 'critical';
    }
    
    // High severity for financial records
    if (['Invoice', 'Expense', 'PayrollRun', 'Transaction'].includes(entityType) && 
        ['approved', 'paid', 'posted'].includes(action)) {
      return 'high';
    }
    
    // Medium severity for creates and updates
    if (['created', 'updated'].includes(action)) {
      return 'medium';
    }
    
    return 'low';
  }

  static generateDescription(action, entityType, entityName) {
    const entityDisplay = entityName ? `"${entityName}"` : entityType;
    
    switch (action) {
      case 'created':
        return `Created new ${entityType} ${entityDisplay}`;
      case 'updated':
        return `Updated ${entityType} ${entityDisplay}`;
      case 'deleted':
        return `Deleted ${entityType} ${entityDisplay}`;
      case 'login':
        return `User logged in`;
      case 'logout':
        return `User logged out`;
      case 'approved':
        return `Approved ${entityType} ${entityDisplay}`;
      case 'sent':
        return `Sent ${entityType} ${entityDisplay}`;
      case 'paid':
        return `Marked ${entityType} ${entityDisplay} as paid`;
      case 'cancelled':
        return `Cancelled ${entityType} ${entityDisplay}`;
      case 'written_off':
        return `Wrote off ${entityType} ${entityDisplay}`;
      default:
        return `Performed action "${action}" on ${entityType} ${entityDisplay}`;
    }
  }

  static getClientIP() {
    // This is limited in browser environment, but we can try
    return 'client'; // Placeholder - real IP would come from server
  }

  static getSessionId() {
    try {
      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem('audit_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('audit_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      // Fallback if sessionStorage is not available
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Convenience methods for common actions with enhanced error handling
  static async logLogin() {
    return this.log('login', 'User', null, null, { 
      description: 'User logged into the system',
      severity: 'medium'
    });
  }

  static async logLogout() {
    return this.log('logout', 'User', null, null, { 
      description: 'User logged out of the system',
      severity: 'high'
    });
  }

  static async logCreate(entityType, entity) {
    return this.log('created', entityType, entity.id, 
      this.getEntityDisplayName(entityType, entity), {
        newValues: entity
      });
  }

  static async logUpdate(entityType, entityId, oldValues, newValues, entityName = null) {
    return this.log('updated', entityType, entityId, entityName, {
      oldValues,
      newValues
    });
  }

  static async logDelete(entityType, entityId, entityName = null) {
    return this.log('deleted', entityType, entityId, entityName);
  }

  static async logMerge(entityType, primaryRecord, mergedRecords) {
    const mergedRecordNames = mergedRecords.map(r => this.getEntityDisplayName(entityType, r)).join(', ');
    const description = `Merged ${mergedRecords.length} ${entityType}(s) (${mergedRecordNames}) into ${this.getEntityDisplayName(entityType, primaryRecord)}.`;
    
    return this.log('merged', entityType, primaryRecord.id, this.getEntityDisplayName(entityType, primaryRecord), {
      description,
      severity: 'critical',
      newValues: {
        primary: primaryRecord,
        merged_ids: mergedRecords.map(r => r.id)
      }
    });
  }

  static getEntityDisplayName(entityType, entity) {
    if (!entity) return `${entityType} (unknown)`;
    
    switch (entityType) {
      case 'Invoice':
        return entity.invoice_number || `Invoice ${entity.id}`;
      case 'Customer':
        return entity.customer_name || `Customer ${entity.id}`;
      case 'Expense':
        return entity.description || `Expense ${entity.id}`;
      case 'Employee':
        return entity.full_name || `Employee ${entity.id}`;
      case 'Transaction':
        return entity.reference_number || `Transaction ${entity.id}`;
      case 'Supplier':
        return entity.supplier_name || `Supplier ${entity.id}`;
      case 'CreditNote':
        return entity.credit_note_number || `Credit Note ${entity.id}`;
      default:
        return `${entityType} ${entity.id || 'unknown'}`;
    }
  }

  // Optional: Method to check if audit logging is currently available
  static async isAuditingAvailable() {
    try {
      // Try to get current user as a connectivity test
      await User.me();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Enhanced logging method that batches logs when connectivity is restored
  static async logWithRetry(action, entityType, entityId = null, entityName = null, options = {}, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      const success = await this.log(action, entityType, entityId, entityName, options);
      if (success) {
        return true;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
    
    console.warn(`Failed to log audit entry after ${maxRetries} attempts:`, { action, entityType, entityId });
    return false;
  }
}

export default AuditLogger;