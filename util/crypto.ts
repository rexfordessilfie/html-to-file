import * as crypto from "crypto";

const algorithm = "aes-256-ctr";

const ENCODING: crypto.Encoding = "hex";

// Later idea: the encryption keys could be versioned to allow updating at anytime for security reasons without breaking existing links
const secretKey =
  process.env.ENCRYPTION_KEY || "a06ecr3tThatIL1ke7oKee9Unkn0wn5l";
const hashSeparator = "_";

export const serializeHash = (hash: { iv: string; content: string }) => {
  return hash.iv + hashSeparator + hash.content;
};

export const deserializeHash = (hashString: string) => {
  const hashSplit = hashString.split(hashSeparator);
  return {
    iv: hashSplit[0],
    content: hashSplit[1],
  };
};

export const encryptAndSerialize = (str: string) => {
  return serializeHash(encrypt(str));
};

export const encrypt = (str: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(str), cipher.final()]);

  return {
    iv: iv.toString(ENCODING),
    content: encrypted.toString(ENCODING),
  };
};

export const decrypt = (hash: { iv: string; content: string }) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, ENCODING)
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, ENCODING)),
    decipher.final(),
  ]);

  return decrypted.toString();
};

/* Functions, encrypt and decrypt adapted from : https://attacomsian.com/blog/nodejs-encrypt-decrypt-data */
