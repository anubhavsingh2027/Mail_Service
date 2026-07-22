import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Resend } from "resend";
import { connectRabbitMQ, consumeQueue, publishToQueue } from "./rabbitmq.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAIL_QUEUE = process.env.MAIL_QUEUE || "mail_queue";

// ✅ Allow all origins (anyone can access)
app.use(cors());

// ✅ Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Health check route
app.get("/", (req, res) =>
  res.send("🚀 Server is running and ready to send emails!"),
);

// ✅ Email sending route
app.post("/sendMail", async (req, res) => {
  try {
    const { to, websiteName, subject, message } = req.body;

    if (!to || !websiteName || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: req.body,
      });
    }

    await publishToQueue(
      {
        from: `${websiteName} <noreply@anubhav-mail.nav-code.com>`,
        to,
        subject,
        html: message,
      },
      MAIL_QUEUE,
    );

    return res.status(202).json({
      success: true,
      queued: true,
      queue: MAIL_QUEUE,
      message: "Email request queued for delivery.",
    });
  } catch (error) {
    console.error("❌ Error queueing email:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

async function handleMailJob(job) {
  const { from, to, subject, html } = job;

  if (!from || !to || !subject || !html) {
    throw new Error("Invalid mail job payload");
  }

  const response = await resend.emails.send({ from, to, subject, html });
  console.log("✅ Email sent from queue:", response?.data?.id || "unknown id");
}

connectRabbitMQ()
  .then(() => consumeQueue(handleMailJob, MAIL_QUEUE))
  .catch((error) => {
    console.error("❌ RabbitMQ startup failed:", error);
    process.exit(1);
  });

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
