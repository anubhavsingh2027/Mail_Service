import "dotenv/config";
import { Resend } from "resend";
import { emailJobs, websiteAccess } from "../utils/mongodb.js";
import {
  createEmailJob,
  markJobFailed,
  markJobProcessing,
  markJobSent,
  returnJobToPending,
  toObjectId,
} from "./email-jobs.js";
import { createWebsiteAccessData } from "../model/mailData.js";
import { makeJobData, validateRequest } from "../utils/mailUtils.js";
import { publishToQueue } from "../utils/rabbitmq.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_QUEUE = process.env.MAIL_QUEUE || "mail_queue";

export async function sendMail(req, res) {
  let job;
  try {
    const files = req.files || [];
    const validationError = validateRequest(req.body, files);
    if (validationError)
      return res.status(400).json({ success: false, error: validationError });
    const websiteName = req.body.websiteName.trim();
    const access = await websiteAccess().findOneAndUpdate(
      { websiteName },
      { $setOnInsert: createWebsiteAccessData(websiteName) },
      { upsert: true, returnDocument: "after" },
    );
    if (access.sentAccess !== "access")
      return res.status(403).json({ success: false, error: "NOT ACCESS" });
    job = await createEmailJob(makeJobData(req.body, files));
    const jobId = job._id.toString();
    if (job.scheduledAt)
      return res.status(202).json({
        success: true,
        queued: true,
        scheduled: true,
        jobId,
        scheduledAt: job.scheduledAt.toISOString(),
        message: "Email scheduled successfully.",
      });
    await publishToQueue({ jobId }, MAIL_QUEUE);
    return res.status(202).json({
      success: true,
      queued: true,
      queue: MAIL_QUEUE,
      message: "Email request queued for delivery.",
    });
  } catch (error) {
    if (job?._id)
      job.scheduledAt
        ? await returnJobToPending(job._id, error)
        : await markJobFailed(job._id, error);
    console.error("Error queueing email:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMail(req, res) {
  const id = toObjectId(req.params.jobId);
  if (!id)
    return res
      .status(404)
      .json({ success: false, error: "Mail job not found" });
  const job = await emailJobs().findOne({ _id: id });
  if (!job)
    return res
      .status(404)
      .json({ success: false, error: "Mail job not found" });
  return res.json({
    success: true,
    job: {
      id: job._id.toString(),
      status: job.status === "pending" ? "scheduled" : job.status,
      scheduledAt: job.scheduledAt,
      createdAt: job.createdAt,
      sentAt: job.sentAt,
    },
  });
}

export async function handleMailJob(message) {
  if (!message.jobId) {
    await resend.emails.send(message);
    return;
  }
  const id = toObjectId(message.jobId);
  if (!id) throw new Error("Invalid mail job ID");
  const job = await emailJobs().findOne({ _id: id });
  if (!job || job.status === "sent") return;
  const processingJob = await markJobProcessing(id);
  if (!processingJob) return;
  try {
    const response = await resend.emails.send({
      from: job.from,
      to: job.to,
      subject: job.subject,
      html: job.html,
      attachments: job.attachments?.map(
        ({ filename, content, contentType }) => ({
          filename,
          content,
          contentType,
        }),
      ),
    });
    await markJobSent(id, response?.data?.id || null);
  } catch (error) {
    await markJobFailed(id, error);
    throw error;
  }
}
