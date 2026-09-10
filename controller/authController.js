import { users } from "../utils/mongodb.js";
import {
  hashPassword,
  validateUserInput,
  verifyPassword,
} from "../model/user.js";

export function loginPage(req, res) {
  res
    .type("html")
    .send(
      `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login</title><style>body{font-family:Arial;background:#f4f6f9;padding:32px}main{max-width:420px;margin:auto;background:#fff;padding:28px;border-radius:10px}input,button{box-sizing:border-box;width:100%;padding:11px;margin:8px 0}button{background:#2563eb;color:#fff;border:0;border-radius:5px;cursor:pointer}.error{color:#b91c1c}</style></head><body><main><h1>Website Email Access</h1><form id="login"><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button>Login</button></form><p></p><p id="error" class="error"></p></main><script>document.querySelector('#login').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target),c={email:f.get('email'),password:f.get('password')};const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)}),j=await r.json();if(!r.ok){document.querySelector('#error').textContent=j.error;return}const p=await fetch('/api/access-page',{headers:{'x-auth-email':c.email,'x-auth-password':c.password}});document.open();document.write(await p.text());document.close()})</script></body></html>`,
    );
}



export async function register(req, res, next) {
  try {
    const validationError = validateUserInput(req.body);
    if (validationError)
      return res.status(400).json({ success: false, error: validationError });
    const email = req.body.email.trim().toLowerCase();
    if (await users().findOne({ email }))
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    await users().insertOne({
      fullName: req.body.fullName.trim(),
      email,
      password: hashPassword(req.body.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res
      .status(201)
      .json({ success: true, message: "Registration successful" });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await users().findOne({ email });
    if (
      !user ||
      !verifyPassword(String(req.body.password || ""), user.password)
    )
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}
