import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./router/index.js";
import { connectMongoDB } from "./utils/mongodb.js";
import { connectRabbitMQ, consumeQueue } from "./utils/rabbitmq.js";
import { startScheduler } from "./utils/scheduler.js";
import { handleMailJob } from "./controller/mailController.js";
import { multerErrorHandler, validateRequest } from "./utils/mailUtils.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAIL_QUEUE = process.env.MAIL_QUEUE || "mail_queue";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);
app.use(multerErrorHandler);

async function start() {
  await connectMongoDB();
  await connectRabbitMQ();
  await consumeQueue(handleMailJob, MAIL_QUEUE);
  startScheduler(MAIL_QUEUE);
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server running on port ${PORT}`),
  );
}

start().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});

export { app, handleMailJob, validateRequest };
