/**
 * Client-side security utilities for production deployment
 */

export class SecurityService {
  
  /**
   * Encrypt sensitive data before storing locally
   */
  static encryptLocalData(data, key = 'peakbooks_key') {
    try {
      // Simple XOR encryption for client-side (not cryptographically secure)
      const encrypted = btoa(JSON.stringify(data)).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt locally stored data
   */
  static decryptLocalData(encryptedData, key = 'peakbooks_key') {
    try {
      const decrypted = atob(encryptedData).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      
      return JSON.parse(atob(decrypted));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate user session
   */
  static validateSession() {
    const sessionId = sessionStorage.getItem('peakbooks_session');
    const timestamp = sessionStorage.getItem('peakbooks_session_time');
    
    if (!sessionId || !timestamp) return false;
    
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionAge < maxAge;
  }

  /**
   * Clear sensitive data from memory/storage
   */
  static clearSensitiveData() {
    // Clear sensitive items from localStorage/sessionStorage
    const sensitiveKeys = [
      'peakbooks_session',
      'peakbooks_session_time',
      'audit_session_id',
      'cached_financial_data'
    ];
    
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Log security events
   */
  static logSecurityEvent(event, details = {}) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, this would be sent to a security monitoring service
    console.log('Security Event:', securityLog);
    
    // Store locally for potential investigation
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(securityLog);
    
    // Keep only last 100 security events
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(logs));
  }

  /**
   * Check for potential security threats
   */
  static performSecurityCheck() {
    const threats = [];
    
    // Check for console access (potential script injection)
    if (typeof window.console !== 'undefined') {
      threats.push('Console access detected');
    }
    
    // Check for suspicious URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams) {
      if (value.includes('<script>') || value.includes('javascript:')) {
        threats.push(`Suspicious URL parameter: ${key}`);
      }
    }
    
    // Check for local storage manipulation
    try {
      localStorage.setItem('security_test', 'test');
      localStorage.removeItem('security_test');
    } catch (error) {
      threats.push('Local storage access restricted');
    }
    
    if (threats.length > 0) {
      this.logSecurityEvent('security_threats_detected', { threats });
    }
    
    return threats;
  }

  /**
   * Initialize security measures
   */
  static initializeSecurity() {
    // Set up session management
    if (!this.validateSession()) {
      const sessionId = this.generateSessionId();
      sessionStorage.setItem('peakbooks_session', sessionId);
      sessionStorage.setItem('peakbooks_session_time', Date.now().toString());
    }
    
    // Perform initial security check
    this.performSecurityCheck();
    
    // Set up periodic security checks
    setInterval(() => {
      this.performSecurityCheck();
      
      // Clear expired security logs
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const filteredLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneDayAgo);
      localStorage.setItem('security_logs', JSON.stringify(filteredLogs));
      
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Log initialization
    this.logSecurityEvent('security_initialized');
  }
}

// Initialize security on module load
if (typeof window !== 'undefined') {
  SecurityService.initializeSecurity();
}