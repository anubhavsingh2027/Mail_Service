import express from "express";
import {
  login,
  loginPage,
} from "../controller/authController.js";
import {
  accessPage,
  listWebsiteAccess,
  updateWebsiteAccess,
} from "../controller/accessController.js";
import { getMail, sendMail } from "../controller/mailController.js";
import { requireAuth } from "../utils/authUtils.js";
import { upload } from "../utils/mailUtils.js";

const router = express.Router();

router.get("/", (req, res) =>
  res.send("Server is running and ready to send emails!"),
);
router.get("/health", (req, res) =>
  res.status(200).json({
    success: true,
    status: "ok",
    service: "mail-api",
    timestamp: new Date().toISOString(),
  }),
);
router.get("/anubhav", loginPage);
router.post("/auth/login", login);
router.get("/api/access-page", requireAuth, accessPage);
router.get("/api/website-access", requireAuth, listWebsiteAccess);
router.put(
  "/api/website-access/:websiteName",
  requireAuth,
  updateWebsiteAccess,
);
router.post("/sendMail", upload.array("attachments"), sendMail);
router.get("/mail/:jobId", getMail);

export default router;
