import bcryptjs from "bcryptjs";

const DEFAULT_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  allowSpaces: false,
  passwordHistoryCount: 5,
  minimumChangeCooldownMinutes: 5,
};

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

const normalize = (value) => String(value || "");

const toComparable = (value) => normalize(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const hasSequentialPattern = (value) => {
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

const hasRepeatedPattern = (value) => {
  const input = normalize(value);
  return /(.)\1{3,}/.test(input);
};

const extractEmailLocalPart = (email) => {
  const raw = normalize(email).trim().toLowerCase();
  const atIndex = raw.indexOf("@");
  if (atIndex <= 0) return "";
  return raw.slice(0, atIndex);
};

const containsSensitiveIdentity = (password, identities = []) => {
  const pwd = toComparable(password);
  if (!pwd) return false;

  return identities.some((identity) => {
    const candidate = toComparable(identity);
    return candidate.length >= 3 && pwd.includes(candidate);
  });
};

const buildEffectivePolicy = (orgPolicy = {}) => {
  const merged = {
    ...DEFAULT_POLICY,
    ...(orgPolicy || {}),
  };

  merged.minLength = Math.max(DEFAULT_POLICY.minLength, Number(merged.minLength) || DEFAULT_POLICY.minLength);
  merged.maxLength = Math.min(256, Math.max(merged.minLength, Number(merged.maxLength) || DEFAULT_POLICY.maxLength));
  merged.passwordHistoryCount = Math.max(3, Number(merged.passwordHistoryCount) || DEFAULT_POLICY.passwordHistoryCount);
  merged.minimumChangeCooldownMinutes = Math.max(
    1,
    Number(merged.minimumChangeCooldownMinutes) || DEFAULT_POLICY.minimumChangeCooldownMinutes,
  );
  merged.allowSpaces = Boolean(merged.allowSpaces);

  return merged;
};

export const validatePasswordPolicy = async ({
  password,
  user = null,
  userLogin = null,
  orgPolicy = null,
  enforceCooldown = false,
}) => {
  const policy = buildEffectivePolicy(orgPolicy);
  const rawPassword = normalize(password);
  const trimmedPassword = rawPassword.trim();

  if (rawPassword !== trimmedPassword) {
    throw new Error("Password must not include leading or trailing spaces");
  }

  if (!policy.allowSpaces && /\s/.test(trimmedPassword)) {
    throw new Error("Password must not contain spaces");
  }

  if (trimmedPassword.length < policy.minLength) {
    throw new Error(`Password must be at least ${policy.minLength} characters long`);
  }

  if (trimmedPassword.length > policy.maxLength) {
    throw new Error(`Password must not exceed ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(trimmedPassword)) {
    throw new Error("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(trimmedPassword)) {
    throw new Error("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumber && !/[0-9]/.test(trimmedPassword)) {
    throw new Error("Password must contain at least one number");
  }

  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(trimmedPassword)) {
    throw new Error("Password must contain at least one special character");
  }

  if (COMMON_PASSWORDS.has(toComparable(trimmedPassword))) {
    throw new Error("Password is too common. Please choose a stronger password");
  }

  if (hasSequentialPattern(trimmedPassword)) {
    throw new Error("Password must not include easy sequential patterns");
  }

  if (hasRepeatedPattern(trimmedPassword)) {
    throw new Error("Password must not include repeated characters like aaaa or 1111");
  }

  const identityCandidates = [
    user?.userId,
    user?.name,
    userLogin?.username,
    extractEmailLocalPart(user?.email),
    extractEmailLocalPart(user?.personalEmail),
  ].filter(Boolean);

  if (containsSensitiveIdentity(trimmedPassword, identityCandidates)) {
    throw new Error("Password must not contain your username, name, or email local part");
  }

  if (userLogin) {
    // Case-insensitive username blocking is implicitly handled by normalized comparison above.
    if (userLogin.password) {
      const matchesCurrent = await bcryptjs.compare(trimmedPassword, userLogin.password);
      if (matchesCurrent) {
        throw new Error("New password cannot be same as current password");
      }
    }

    const history = Array.isArray(userLogin.lastPasswordChange) ? userLogin.lastPasswordChange : [];
    const recentHistory = history.slice(-policy.passwordHistoryCount);
    for (const entry of recentHistory) {
      if (!entry?.previousPasswordHash) continue;
      const matched = await bcryptjs.compare(trimmedPassword, entry.previousPasswordHash);
      if (matched) {
        throw new Error(`Password reuse is not allowed for last ${policy.passwordHistoryCount} passwords`);
      }
    }

    if (enforceCooldown) {
      const lastChangedAt = history.length > 0 ? history[history.length - 1]?.changedAt : null;
      if (lastChangedAt) {
        const minGapMs = policy.minimumChangeCooldownMinutes * 60 * 1000;
        const elapsedMs = Date.now() - new Date(lastChangedAt).getTime();
        if (elapsedMs < minGapMs) {
          const remainingMin = Math.ceil((minGapMs - elapsedMs) / (60 * 1000));
          throw new Error(`Please wait ${remainingMin} minute(s) before changing password again`);
        }
      }
    }
  }

  return {
    normalizedPassword: trimmedPassword,
    policy,
    breachedCheckProvider: "common-passwords-local-list",
  };
};

