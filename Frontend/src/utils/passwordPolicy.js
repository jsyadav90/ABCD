// Import from shared validation rules
// Note: This uses relative path that works in development/build setup
// In production, adjust the import path based on your build configuration
import {
  COMMON_PASSWORDS,
  COMMON_PINS,
  toComparable,
  hasPasswordSequentialPattern,
  hasPINSequentialPattern,
  validatePINInput as validatePINInputShared,
  validatePasswordInput as validatePasswordInputShared,
} from "./validationRules.js";

// Re-export for use in Frontend components
export const validatePasswordInput = validatePasswordInputShared;
export const validatePINInput = validatePINInputShared;

