# Mail Service API

A robust, scalable email delivery service built with Node.js, Express, MongoDB, and RabbitMQ. This service provides a RESTful API for sending emails with support for attachments, scheduled delivery, email tracking, and access control.

## Features

- **Email Delivery**: Send emails with HTML/text content and file attachments via Resend API
- **Queue-based Processing**: Asynchronous email processing using RabbitMQ
- **Scheduled Emails**: Schedule emails for future delivery
- **Job Tracking**: Track email delivery status with job IDs
- **Website Access Control**: Manage email sending permissions by website
- **Email History**: Store and retrieve email job history from MongoDB
- **Health Monitoring**: Built-in health check endpoint
- **File Upload Support**: Handle email attachments using Multer
- **CORS Support**: Cross-origin request handling
- **Environment Configuration**: Easy configuration via environment variables

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Message Queue**: RabbitMQ with amqplib
- **Email Service**: Resend API
- **File Upload**: Multer
- **Environment Management**: dotenv
- **Containerization**: Docker

## Prerequisites

- Node.js 20.x or higher
- MongoDB instance (local or cloud)
- RabbitMQ instance (local or cloud)
- Resend API key

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Mail_Service
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

4. Update `.env` with your configuration values:

```
PORT=3000
RESEND_API_KEY=your_resend_api_key
RABBITMQ_URL=your_rabbitmq_connection_url
MONGO_URL=your_mongodb_connection_url
MAIL_QUEUE=mail_queue
```

## Environment Variables

| Variable         | Description                      | Example                                              |
| ---------------- | -------------------------------- | ---------------------------------------------------- |
| `PORT`           | Server port                      | `3000`                                               |
| `RESEND_API_KEY` | API key for Resend email service | `re_xxxxx`                                           |
| `RABBITMQ_URL`   | RabbitMQ connection URL          | `amqps://user:pass@host/vhost`                       |
| `MONGO_URL`      | MongoDB connection URL           | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `MAIL_QUEUE`     | RabbitMQ queue name for emails   | `mail_queue`                                         |

## Running the Application

### Development Mode

```bash
npm run dev
```

Uses nodemon for automatic restart on file changes.

### Production Mode

```bash
npm start
```

### Using Docker

```bash
docker build -t mail-service .
docker run -p 3000:3000 --env-file .env mail-service
```

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns service status
  - Response: `{ success: true, status: "ok", service: "mail-api", timestamp: "..." }`

### Server Status

- **GET** `/`
  - Returns a simple status message

### Authentication

- **GET** `/anubhav`
  - Login page (HTML form)

- **POST** `/auth/login`
  - User login endpoint
  - Request body: username, password

### Access Control

- **GET** `/api/access-page`
  - Get access control page (requires authentication)

- **GET** `/api/website-access`
  - List website access permissions (requires authentication)
  - Returns: Array of website access records

- **PUT** `/api/website-access/:websiteName`
  - Update website access permissions (requires authentication)
  - Parameters: `websiteName` (URL param)

### Email Operations

- **POST** `/sendMail`
  - Send an email
  - Request body (form-data):
    - `websiteName`: Name of the website sending the email
    - `to`: Recipient email address
    - `subject`: Email subject
    - `html`: HTML content
    - `attachments`: File attachments (optional, array)
  - Response: Job ID and status

- **GET** `/mail/:jobId`
  - Retrieve email job details
  - Parameters: `jobId` (email job ID)
  - Returns: Job status, delivery info, and history

## Project Structure

```
Mail_Service/
├── api.js                  # Main application entry point
├── package.json            # Dependencies and scripts
├── Dockerfile              # Docker configuration
├── fly.toml               # Fly.io deployment config
├── .env.example           # Example environment variables
├── .env                   # Environment variables (keep secret)
│
├── controller/            # Route handlers and business logic
│   ├── mailController.js  # Email sending and retrieval
│   ├── authController.js  # Authentication logic
│   ├── accessController.js # Access control logic
│   └── email-jobs.js      # Email job management
│
├── model/                 # Data models
│   ├── mailData.js        # Email data structures
│   └── user.js            # User model
│
├── router/                # API route definitions
│   └── index.js           # Route configuration
│
└── utils/                 # Utility functions
    ├── mongodb.js         # MongoDB connection and queries
    ├── rabbitmq.js        # RabbitMQ connection and messaging
    ├── mailUtils.js       # Email validation and utilities
    ├── authUtils.js       # Authentication utilities
    └── scheduler.js       # Email scheduling
```

## Key Concepts

### Job Queue Processing

Emails are processed asynchronously through RabbitMQ:

1. User sends email via `/sendMail` endpoint
2. Job is created in MongoDB with "pending" status
3. Job ID is published to RabbitMQ queue
4. Consumer service processes the job
5. Job status is updated to "sent" or "failed"

### Access Control

- Each website must be registered in the system
- Access level determines if emails can be sent from that website
- Access is managed through the `/api/website-access` endpoints

### Scheduled Emails

- Emails can be scheduled for future delivery
- The scheduler checks pending jobs and publishes them to the queue at scheduled time
- Scheduled jobs return HTTP 202 with `scheduled: true` in response

## Error Handling

The API provides detailed error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

Common HTTP status codes:

- `200`: Success
- `202`: Accepted (queued for processing)
- `400`: Bad request (validation error)
- `403`: Forbidden (no access)
- `500`: Server error

## Deployment

The application is configured for deployment on Fly.io. See `fly.toml` for configuration details.

To deploy:

```bash
flyctl deploy
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is proprietary. All rights reserved.

## Support

For issues or questions, please contact the development team.
