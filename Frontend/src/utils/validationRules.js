/**
 * Shared Validation Rules for Password and PIN
 * Used by both Frontend and Backend
 */

export const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "password@123",
  "qwerty",
  "qwerty123",
  "qwerty@123",
  "admin123",
  "welcome123",
  "letmein123",
  "abc@123",
  "12345678",
  "123456789",
  "1234567890",
]);

export const COMMON_PINS = new Set([
  // Repeating digits
  "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  // Forward sequences
  "0123", "1234", "2345", "3456", "4567", "5678", "6789",
  // Reverse sequences
  "9876", "8765", "7654", "6543", "5432", "4321", "3210",
  // Alternating patterns
  "0101", "1010", "2020", "0202", "1212", "2121", "1313", "3131",
  // Other common patterns
  "0001", "0010", "0100", "1000",
  // Sequential repeating pairs
  "0011", "1100", "1122", "2211", "2233", "3322", "3344", "4433",
  // Common years/dates
  "1984", "1990", "2000", "2020", "2021", "2022", "2023", "2024", "2025",
]);

const normalize = (value) => String(value || "");

export const toComparable = (value) => normalize(value).toLowerCase().replace(/[^a-z0-9]/g, "");

export const hasPasswordSequentialPattern = (value) => {
  const input = toComparable(value);
  if (!input) return false;

  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiopasdfghjklzxcvbnm",
  ];

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i += 1) {
      const piece = seq.slice(i, i + 4);
      const rev = piece.split("").reverse().join("");
      if (input.includes(piece) || input.includes(rev)) {
        return true;
      }
    }
  }

  return false;
};

export const hasPINSequentialPattern = (pin) => {
  const trimmedPin = normalize(pin).trim();
  
  // Check for any 3+ consecutive digit sequences (both forward and backward)
  // e.g., 012, 123, 234, ..., 789 and 210, 321, 432, ..., 987
  for (let i = 0; i <= 7; i++) {
    const forward = String(i) + String(i + 1) + String(i + 2);
    const backward = String(i + 2) + String(i + 1) + String(i);
    if (trimmedPin.includes(forward) || trimmedPin.includes(backward)) {
      return true;
    }
  }
  
  // Check for repeating patterns like 111, 222, 333, etc. (3 or more of same digit)
  if (/(\d)\1{2,}/.test(trimmedPin)) {
    return true;
  }
  
  // Check for alternating patterns like 0101, 1010, 1212, 2121 (at least 4 digits)
  // Only flag if the entire PIN starts with a clear alternating pattern
  if (/^(\d)(\d)\1\2/.test(trimmedPin)) {
    return true;
  }
  
  return false;
};

/**
 * Validate PIN
 * @param {string} pin - PIN to validate
 * @returns {string} - Empty string if valid, error message if invalid
 */
export const validatePINInput = (pin) => {
  const raw = normalize(pin);
  const trimmed = raw.trim();

  if (!trimmed) return "PIN is required";
  if (raw !== trimmed) return "PIN must not include leading or trailing spaces";
  if (!/^\d+$/.test(trimmed)) return "PIN must contain only numbers";
  if (trimmed.length < 4) return "PIN must be at least 4 digits";
  if (trimmed.length > 10) return "PIN must not exceed 10 digits";
  if (COMMON_PINS.has(trimmed)) return "PIN is too common";
  if (hasPINSequentialPattern(trimmed)) return "PIN must not include easy sequential or repeating patterns";

  return "";
};

/**
 * Validate Password
 * @param {string} password - Password to validate
 * @param {Array<string>} identities - User identities (username, email, name) to check against
 * @returns {string} - Empty string if valid, error message if invalid
 */
export const validatePasswordInput = (password, identities = []) => {
  const raw = normalize(password);
  const trimmed = raw.trim();

  if (!trimmed) return "Password is required";
  if (raw !== trimmed) return "Password must not include leading or trailing spaces";
  if (/\s/.test(trimmed)) return "Password must not contain spaces";
  if (trimmed.length < 8) return "Password must be at least 8 characters";
  if (trimmed.length > 128) return "Password must not exceed 128 characters";
  if (!/[A-Z]/.test(trimmed)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(trimmed)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(trimmed)) return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(trimmed)) return "Password must contain at least one special character";
  if (COMMON_PASSWORDS.has(toComparable(trimmed))) return "Password is too common";
  if (hasPasswordSequentialPattern(trimmed)) return "Password must not include easy sequential patterns";
  if (/(.)\1{3,}/.test(trimmed)) return "Password must not include repeated characters like aaaa or 1111";

  const comparablePwd = toComparable(trimmed);
  const includesIdentity = identities.some((identity) => {
    const normalized = toComparable(identity);
    return normalized.length >= 3 && comparablePwd.includes(normalized);
  });
  if (includesIdentity) return "Password must not contain username/email name";

  return "";
};
