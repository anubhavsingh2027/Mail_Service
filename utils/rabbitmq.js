import amqp from "amqplib";

let connection;
let channel;

export async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  if (!rabbitmqUrl) throw new Error("RABBITMQ_URL is required");
  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createConfirmChannel();
  return channel;
}

export async function publishToQueue(message, queue) {
  if (!channel) throw new Error("RabbitMQ is not connected");
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    contentType: "application/json",
  });
  await channel.waitForConfirms();
}

export async function consumeQueue(handler, queue) {
  if (!channel) throw new Error("RabbitMQ is not connected");
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(1);
  await channel.consume(queue, async (message) => {
    if (!message) return;
    try {
      await handler(JSON.parse(message.content.toString()));
      channel.ack(message);
    } catch (error) {
      console.error("Error processing mail job:", error);
      channel.nack(message, false, false);
    }
  });
}
