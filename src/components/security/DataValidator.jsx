/**
 * Utilitaires de validation et sanitisation des données
 * Prévient les injections et valide les formats
 */

export const DataValidator = {
  // Nettoyer les inputs HTML
  sanitizeHTML: (input) => {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Valider email
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valider téléphone (format Côte d'Ivoire)
  validatePhone: (phone) => {
    const phoneRegex = /^(\+225)?[0-9]{8,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Valider numéro CMU
  validateCMU: (cmu) => {
    if (!cmu) return true; // optionnel
    return /^[0-9]{10,15}$/.test(cmu);
  },

  // Valider date de naissance (pas dans le futur, pas trop vieux)
  validateBirthDate: (date) => {
    const birthDate = new Date(date);
    const now = new Date();
    const maxAge = new Date();
    maxAge.setFullYear(now.getFullYear() - 120);
    
    return birthDate < now && birthDate > maxAge;
  },

  // Valider date de grossesse
  validatePregnancyDate: (dpa) => {
    const dpaDate = new Date(dpa);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setMonth(now.getMonth() + 12); // Max 12 mois dans le futur
    
    return dpaDate > now && dpaDate < maxDate;
  },

  // Valider longueur de texte
  validateLength: (text, min = 0, max = 10000) => {
    if (!text) return min === 0;
    return text.length >= min && text.length <= max;
  },

  // Valider fichier uploadé
  validateFile: (file, maxSizeMB = 5, allowedTypes = ['image/*', 'application/pdf']) => {
    if (!file) return false;
    
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `Fichier trop volumineux (max ${maxSizeMB}MB)` };
    }

    const fileType = file.type;
    const typeMatch = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!typeMatch) {
      return { valid: false, error: 'Type de fichier non autorisé' };
    }

    return { valid: true };
  },

  // Valider URL
  validateURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Détecter contenu suspect
  detectSuspiciousContent: (text) => {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /data:text\/html/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  },

  // Valider objet complet
  validateObject: (obj, schema) => {
    const errors = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      if (rules.required && !value) {
        errors[key] = 'Ce champ est requis';
        continue;
      }

      if (value && rules.type === 'email' && !DataValidator.validateEmail(value)) {
        errors[key] = 'Email invalide';
      }

      if (value && rules.type === 'phone' && !DataValidator.validatePhone(value)) {
        errors[key] = 'Numéro de téléphone invalide';
      }

      if (value && rules.minLength && value.length < rules.minLength) {
        errors[key] = `Minimum ${rules.minLength} caractères`;
      }

      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors[key] = `Maximum ${rules.maxLength} caractères`;
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors[key] = 'Format invalide';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default DataValidator;