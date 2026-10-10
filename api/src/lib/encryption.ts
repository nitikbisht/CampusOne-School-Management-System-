import crypto from "crypto";

/**
 * Encryption utilities for integration configs
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment or derive from master key
 */
function getEncryptionKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey) {
    throw new Error("ENCRYPTION_MASTER_KEY environment variable is required");
  }
  // Derive a 32-byte key from master key using PBKDF2
  const salt = crypto.createHash("sha256").update("campusone-integration-config").digest().subarray(0, SALT_LENGTH);
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Encrypt a JSON object for storage
 */
export function encryptConfig(config: Record<string, unknown>): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(config);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: salt(32) + iv(16) + authTag(16) + encrypted
  const combined = Buffer.concat([
    Buffer.from("v1", "utf8"), // version marker
    iv,
    authTag,
    encrypted,
  ]);

  return combined.toString("base64");
}

/**
 * Decrypt a stored config
 */
export function decryptConfig(encryptedData: string): Record<string, unknown> {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");

  // Check version marker
  if (combined.subarray(0, 2).toString("utf8") !== "v1") {
    throw new Error("Invalid encryption format or version");
  }

  const iv = combined.subarray(2, 2 + IV_LENGTH);
  const authTag = combined.subarray(2 + IV_LENGTH, 2 + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(2 + IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Mask sensitive fields in config for display
 */
export function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "secret",
    "key",
    "token",
    "api_key",
    "apiKey",
    "access_token",
    "accessToken",
    "private_key",
    "privateKey",
    "client_secret",
    "clientSecret",
    "auth_token",
    "authToken",
  ];

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

    if (isSensitive && typeof value === "string" && value.length > 0) {
      // Show first 4 and last 4 characters
      if (value.length > 8) {
        masked[key] = `${value.substring(0, 4)}***${value.substring(value.length - 4)}`;
      } else {
        masked[key] = "****";
      }
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      masked[key] = maskConfig(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}