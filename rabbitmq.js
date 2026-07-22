import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const DEFAULT_QUEUE = process.env.MAIL_QUEUE || "mail_queue";

let connection;
let channel;

export async function connectRabbitMQ() {
  if (connection && channel) {
    return { connection, channel };
  }

  connection = await amqplib.connect(RABBITMQ_URL);
  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
  });
  connection.on("close", () => {
    console.warn("RabbitMQ connection closed");
  });

  channel = await connection.createChannel();
  await channel.assertQueue(DEFAULT_QUEUE, { durable: true });

  return { connection, channel };
}

export async function publishToQueue(payload, queue = DEFAULT_QUEUE) {
  const { channel } = await connectRabbitMQ();
  const buffer = Buffer.from(JSON.stringify(payload));
  return channel.sendToQueue(queue, buffer, { persistent: true });
}

export async function consumeQueue(onMessage, queue = DEFAULT_QUEUE) {
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const payload = JSON.parse(msg.content.toString());
        await onMessage(payload);
        channel.ack(msg);
      } catch (error) {
        console.error("RabbitMQ consumer error:", error);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}

export async function closeRabbitMQ() {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
}
