import crypto from "node:crypto";
import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, select: false },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = String(storedPassword).split(":");
  if (!salt || !storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(storedHash, "hex"),
  );
}

export function validateUserInput({ fullName, email, password }) {
  if (!fullName?.trim() || !email?.trim() || !password)
    return "fullName, email, and password are required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address";
  return null;
}
