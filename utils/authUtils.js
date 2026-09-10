import { users } from "./mongodb.js";
import { verifyPassword } from "../model/user.js";

export function getAuthCredentials(req) {
  return {
    email: String(req.headers["x-auth-email"] || "")
      .trim()
      .toLowerCase(),
    password: String(req.headers["x-auth-password"] || ""),
  };
}

export async function requireAuth(req, res, next) {
  const { email, password } = getAuthCredentials(req);
  if (!email || !password)
    return res.status(401).json({ success: false, error: "LOGIN_REQUIRED" });
  const user = await users().findOne({ email });
  if (!user || !verifyPassword(password, user.password))
    return res.status(401).json({ success: false, error: "INVALID_LOGIN" });
  req.user = user;
  return next();
}
