import mongoose from "mongoose";

export const MAIL_STATUSES = Object.freeze([
  "pending",
  "queued",
  "processing",
  "sent",
  "failed",
]);

export const ACCESS_STATUSES = Object.freeze(["access", "not access"]);

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export const mailDataSchema = new mongoose.Schema(
  {
    websiteName: { type: String, required: true, trim: true, index: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    html: { type: String, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    scheduledAt: { type: Date, default: null },
    status: { type: String, enum: MAIL_STATUSES, default: "queued" },
    attempts: { type: Number, default: 0, min: 0 },
    resendEmailId: { type: String, default: null },
    lastError: { type: String, default: null },
    queuedAt: { type: Date, default: null },
    processingAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const MailData =
  mongoose.models.MailData || mongoose.model("MailData", mailDataSchema);

export const websiteAccessSchema = new mongoose.Schema(
  {
    websiteName: { type: String, required: true, unique: true, trim: true },
    sentAccess: {
      type: String,
      enum: ACCESS_STATUSES,
      default: "access",
    },
    noOfEmailSend: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const WebsiteAccess =
  mongoose.models.WebsiteAccess ||
  mongoose.model("WebsiteAccess", websiteAccessSchema);

export function createMailData(data) {
  const scheduled = data.scheduledAt instanceof Date ? data.scheduledAt : null;
  const mailData = new MailData({
    websiteName: data.websiteName,
    from: data.from,
    to: data.to,
    subject: data.subject,
    html: data.html,
    attachments: data.attachments || [],
    scheduledAt: scheduled,
    status: scheduled ? "pending" : "queued",
    queuedAt: scheduled ? null : new Date(),
  });
  return mailData.toObject({ depopulate: true });
}

export function validateMailData(data) {
  if (
    !data.websiteName ||
    !data.from ||
    !data.to ||
    !data.subject ||
    !data.html
  )
    throw new Error(
      "Invalid mail data: websiteName, from, to, subject, and html are required",
    );
  if (!MAIL_STATUSES.includes(data.status))
    throw new Error(`Invalid mail status: ${data.status}`);
  if (!Array.isArray(data.attachments))
    throw new Error("Invalid mail data: attachments must be an array");
  return data;
}

export function createWebsiteAccessData(websiteName) {
  return {
    websiteName,
    sentAccess: "access",
    noOfEmailSend: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function validateAccessStatus(sentAccess) {
  if (!ACCESS_STATUSES.includes(sentAccess))
    throw new Error("sentAccess must be access or not access");
  return sentAccess;
}
