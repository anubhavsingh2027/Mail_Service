# 📬 Mail API Service (Resend + Express)

This is a lightweight and fast **Mail Sending API** built using **Node.js**, **Express**, and **Resend**.
It allows you to send transactional or notification emails from any application — frontend or backend.

✅ Works with **React, Vue, Angular, Mobile Apps, Node, Python, PHP, etc.**
✅ Perfect for sending OTPs, account verification, booking confirmations, and contact form messages.

---

## 🚀 Live Status

Server running and ready to send emails! ✔

yaml
Copy code

You can test the API using **Postman**, **Thunder Client**, or directly from your frontend.

---

## 🛠️ Tech Stack

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| Node.js    | Runtime environment                  |
| Express.js | API server framework                 |
| Resend API | Email sending service                |
| RabbitMQ   | Message queue for email jobs         |
| CORS       | Allows cross-origin requests         |
| dotenv     | Secure environment variable handling |

---

## ⚙️ Environment Setup

Create a `.env` file and add:

```env
RESEND_API_KEY=your_resend_api_key_here
PORT=3000
RABBITMQ_URL=amqp://localhost
MAIL_QUEUE=mail_queue
```

Get your API Key here → https://resend.com

📦 Installation & Run

````bash
# Clone
```git clone <repo-url>

# Install dependencies
npm install

# Start server
npm start
The API will run at:

```bash
http://localhost:3000
````

## 🔥 API Endpoints

### Health Check

```http
GET /
```

Response:

```json
{
  "message": "🚀 Server is running and ready to send emails!"
}
```

### Send Email

```http
POST /sendMail
Content-Type: application/json
```

Request body:

```json
{
  "to": "recipient@example.com",
  "websiteName": "My Site",
  "subject": "Welcome!",
  "message": "Hello from the RabbitMQ-backed mail API."
}
```

Response:

```json
{
  "success": true,
  "queued": true,
  "queue": "mail_queue",
  "message": "Email request queued for delivery."
}
```

This service now enqueues email jobs to RabbitMQ and processes them in the background using the configured queue.
