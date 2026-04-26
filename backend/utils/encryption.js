const crypto = require("crypto");
const config = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

const deriveKey = () => crypto.createHash("sha256").update(String(config.encryptionKey)).digest();

const isEncryptedFormat = (value) =>
  typeof value === "string" && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(value);

const encryptValue = (value) => {
  if (!value || typeof value !== "string") return value;
  if (isEncryptedFormat(value)) return value;

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

const decryptValue = (value) => {
  if (!value || typeof value !== "string") return value;
  if (!isEncryptedFormat(value)) return value;

  try {
    const [ivHex, authTagHex, encryptedHex] = value.split(":");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      deriveKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    return value;
  }
};

module.exports = {
  encryptValue,
  decryptValue,
};
