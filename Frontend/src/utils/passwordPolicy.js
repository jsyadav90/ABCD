const COMMON_PASSWORDS = new Set([
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

const toComparable = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const hasSequentialPattern = (value) => {
  const input = toComparable(value);
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiopasdfghjklzxcvbnm",
  ];
  return sequences.some((seq) => {
    for (let i = 0; i <= seq.length - 4; i += 1) {
      const part = seq.slice(i, i + 4);
      const reverse = part.split("").reverse().join("");
      if (input.includes(part) || input.includes(reverse)) return true;
    }
    return false;
  });
};

export const validatePasswordInput = (password, identities = []) => {
  const raw = String(password || "");
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
  if (hasSequentialPattern(trimmed)) return "Password must not include easy sequential patterns";
  if (/(.)\1{3,}/.test(trimmed)) return "Password must not include repeated characters like aaaa or 1111";

  const comparablePwd = toComparable(trimmed);
  const includesIdentity = identities.some((identity) => {
    const normalized = toComparable(identity);
    return normalized.length >= 3 && comparablePwd.includes(normalized);
  });
  if (includesIdentity) return "Password must not contain username/email name";

  return "";
};

