import "dotenv/config";
import multer from "multer";

const maxAttachments = Number(process.env.MAX_ATTACHMENTS || 5);
const maxAttachmentSize =
  Number(process.env.MAX_ATTACHMENT_SIZE_MB || 5) * 1024 * 1024;
const maxTotalAttachmentSize =
  Number(process.env.MAX_TOTAL_ATTACHMENT_SIZE_MB || 10) * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: maxAttachments, fileSize: maxAttachmentSize },
});

export function validateRequest(body, files = []) {
  const { to, websiteName, subject, message, scheduledAt } = body;
  if (!to || !websiteName || !subject || !message)
    return "Missing required fields";
  for (const file of files) {
    if (
      !file.originalname ||
      file.originalname.includes("\\") ||
      file.originalname.includes("/")
    )
      return "Invalid attachment filename";
  }
  if (
    files.reduce((total, file) => total + file.size, 0) > maxTotalAttachmentSize
  )
    return "Total attachment size exceeds the configured limit";
  if (scheduledAt) {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime()))
      return "scheduledAt must be a valid ISO-8601 date";
    if (date <= new Date()) return "scheduledAt must be in the future";
  }
  return null;
}

export function makeJobData(body, files = []) {
  const websiteName = body.websiteName.trim();
  return {
    websiteName,
    from: `${websiteName} <noreply@anubhav-mail.nav-code.com>`,
    to: body.to,
    subject: body.subject,
    html: body.message,
    attachments: files.map((file) => ({
      filename: file.originalname,
      content: file.buffer.toString("base64"),
      contentType: file.mimetype,
      size: file.size,
    })),
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
  };
}

export function multerErrorHandler(error, req, res, next) {
  if (
    error instanceof multer.MulterError ||
    error?.code === "LIMIT_FILE_SIZE" ||
    error?.code === "LIMIT_FILE_COUNT"
  )
    return res
      .status(400)
      .json({ success: false, error: "Attachment limits exceeded" });
  console.error("Request error:", error.message);
  return res.status(500).json({ success: false, error: error.message });
}
