class ValidationService {
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters and scripts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    // Kenyan phone number validation
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validateKRAPin(pin) {
    if (!pin) return false;
    // KRA PIN format: A123456789Z
    const kraRegex = /^[A-Z]\d{9}[A-Z]$/;
    return kraRegex.test(pin.toUpperCase());
  }

  static validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  }

  static sanitizeFormData(formData) {
    const sanitized = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export { ValidationService };
export default ValidationService;