# Salesforce Chat API

A Node.js Express API for handling Salesforce chat integration with external systems.

## Features

- Real-time chat messaging
- Bot response integration
- Conversation management
- Message history
- Health check endpoint

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with required environment variables
4. Run the development server:

```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/conversations` - Create new conversation
- `POST /api/messages` - Send message
- `GET /api/conversations/:conversationId/messages` - Get conversation messages
- `POST /api/chat/bot-response` - Get bot response

## Environment Variables

```
PORT=3000
NODE_ENV=development
BOT_RESPONSE_DELAY_MS=1000
BOT_NAME=Chat Assistant
```
