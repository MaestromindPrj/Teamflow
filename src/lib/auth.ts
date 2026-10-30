import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "maestrominds-teamflow-secret-key-2026";

/**
 * Hashes a plaintext password using crypto.scryptSync with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  try {
    if (storedHash.includes(":")) {
      const [salt, originalHash] = storedHash.split(":");
      const originalBuffer = Buffer.from(originalHash, "hex");
      const derivedKey = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(originalBuffer, derivedKey);
    }
    // Fallback comparison if stored as plain text
    return password === storedHash;
  } catch (err) {
    console.error("verifyPassword error:", err);
    return false;
  }
}

/**
 * Generates a clean, readable, secure temporary password (Option 1).
 * Example: MM-9aK2!8xW
 */
export function generateInitialPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const specials = "!@#$%&*";

  let result = "MM-";
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  result += specials.charAt(Math.floor(Math.random() * specials.length));
  result += letters.charAt(Math.floor(Math.random() * letters.length));

  return result;
}

/**
 * Signs a session payload into a tamper-proof session token.
 */
export function signSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, issuedAt: Date.now() });
  const b64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(b64)
    .digest("base64url");
  return `${b64}.${signature}`;
}

/**
 * Verifies a session token and extracts the userId.
 */
export function verifySessionToken(token: string): { userId: string } | null {
  if (!token || !token.includes(".")) return null;
  const [b64, signature] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(b64)
    .digest("base64url");

  if (signature !== expectedSig) return null;

  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

