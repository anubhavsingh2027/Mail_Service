import { claimDueJob, returnJobToPending } from "../controller/email-jobs.js";
import { publishToQueue } from "./rabbitmq.js";

let schedulerTimer;

export function startScheduler(queue) {
  if (schedulerTimer) return;
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS || 5000);
  const tick = async () => {
    try {
      let job;
      while ((job = await claimDueJob())) {
        try {
          await publishToQueue({ jobId: job._id.toString() }, queue);
        } catch (error) {
          await returnJobToPending(job._id, error);
          console.error("Scheduled job publish failed:", error.message);
        }
      }
    } catch (error) {
      console.error("Scheduler error:", error.message);
    }
  };
  schedulerTimer = setInterval(tick, interval);
  schedulerTimer.unref();
  void tick();
}
