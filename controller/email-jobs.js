import { ObjectId } from "mongodb";
import { emailJobs, websiteAccess } from "../utils/mongodb.js";
import { createMailData, validateMailData } from "../model/mailData.js";

export async function createEmailJob(data) {
  const job = validateMailData(createMailData(data));
  const result = await emailJobs().insertOne(job);
  return { ...job, _id: result.insertedId };
}

export function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function claimDueJob() {
  return emailJobs().findOneAndUpdate(
    { status: "pending", scheduledAt: { $lte: new Date() } },
    { $set: { status: "queued", queuedAt: new Date() } },
    { sort: { scheduledAt: 1 }, returnDocument: "after" },
  );
}

export async function markJobProcessing(id) {
  return emailJobs().findOneAndUpdate(
    { _id: id, status: "queued" },
    { $set: { status: "processing", processingAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function markJobSent(id, resendEmailId) {
  const job = await emailJobs().findOneAndUpdate(
    { _id: id, status: "processing" },
    { $set: { status: "sent", resendEmailId, sentAt: new Date() } },
    { returnDocument: "after" },
  );
  if (job?.websiteName)
    await websiteAccess().updateOne(
      { websiteName: job.websiteName },
      { $inc: { noOfEmailSend: 1 } },
    );
}

export async function markJobFailed(id, error) {
  await emailJobs().updateOne(
    { _id: id },
    {
      $set: {
        status: "failed",
        lastError: error.message,
        failedAt: new Date(),
      },
      $inc: { attempts: 1 },
    },
  );
}

export async function returnJobToPending(id, error) {
  await emailJobs().updateOne(
    { _id: id, status: "queued" },
    { $set: { status: "pending", queuedAt: null, lastError: error.message } },
  );
}
