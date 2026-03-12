/**
 * Security Middlewares
 * - setSecurityHeaders: basic hardening headers
 * - issueCsrfToken: sets csrfToken cookie for browsers
 * - csrfGuard: double-submit cookie check for cookie-based state-changing requests
 * - createRateLimiter: simple in-memory IP rate limiter (for auth endpoints)
 */

import crypto from "crypto";

export const setSecurityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0");
  if (process.env.NODE_ENV === "production") {
    // 30 days HSTS
    res.setHeader("Strict-Transport-Security", "max-age=2592000; includeSubDomains");
  }
  next();
};

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";

export const issueCsrfToken = (req, res, next) => {
  // For idempotent methods, ensure a CSRF token cookie exists for browsers
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = crypto.randomBytes(24).toString("hex");
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
  }
  next();
};

export const csrfGuard = (req, res, next) => {
  const method = String(req.method || "GET").toUpperCase();
  const path = String(req.path || "");
  // Auth endpoints should not be blocked by CSRF guard (keeps login error messages correct)
  if (path.startsWith("/api/v1/auth/login")) return next();
  if (path.startsWith("/api/v1/auth/refresh")) return next();
  if (path.startsWith("/api/v1/auth/register")) return next();
  // Only guard state-changing methods when request relies on cookies (no Authorization header)
  const hasAuthHeader = Boolean(req.headers?.authorization);
  if (hasAuthHeader) return next();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();
  // If no cookies present, skip (header-based flows unaffected)
  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  if (!csrfCookie) return next();
  const csrfHeader = req.headers?.[CSRF_HEADER] || req.headers?.[CSRF_HEADER.toLowerCase()];
  if (!csrfHeader || String(csrfHeader) !== String(csrfCookie)) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "CSRF validation failed",
    });
  }
  return next();
};

export const createRateLimiter = ({ windowMs = 60_000, max = 10 } = {}) => {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip || "unknown"}:${req.path}`;
    const entry = buckets.get(key) || { count: 0, ts: now };
    if (now - entry.ts > windowMs) {
      entry.count = 0;
      entry.ts = now;
    }
    entry.count += 1;
    buckets.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
      });
    }
    next();
  };
};

