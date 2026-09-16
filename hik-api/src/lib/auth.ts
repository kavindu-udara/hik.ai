import { jwtVerify, SignJWT } from "jose";
import { createHash, randomBytes } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Password hashing using bun's native
export const hashPassword = async (password: string) => {
  return await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
};

export const verifyPassword = async (password: string, hash: string) => {
  return await Bun.password.verify(password, hash);
};

// JWT Management
export const generateJWT = async (userId: string) => {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey);
};

export const verifyJWT = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { userId: string };
  } catch (error) {
    return null;
  }
};

// API Key Generation
export const generateApiKey = () => {
  // generate a key like hik_ + 32 random bytes in hex
  return `hik_${randomBytes(32).toString("hex")}`;
};

export const verifyApiKey = async (rawKey: string, hash: string) => {
  return await Bun.password.verify(rawKey, hash, 'bcrypt');
};

export const hashApiKey = (key: string) => {
  return createHash('sha256').update(key).digest('hex');
};