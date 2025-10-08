require('dotenv').config();

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_RESPONSE_DELAY = process.env.BOT_RESPONSE_DELAY_MS || 1000;
const BOT_NAME = process.env.BOT_NAME || 'Chat Assistant';

// Middleware
app.use(express.json());

// In-memory database (Replace with real database in production)
let conversations = new Map();
let messages = new Map();

// API Routes

// 1. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Salesforce Chat API is running!',
    timestamp: new Date().toISOString()
  });
});

// 2. CREATE CONVERSATION
app.post('/api/conversations', (req, res) => {
  try {
    const { salesforceUserId, userName, platform = 'salesforce' } = req.body;
    
    if (!salesforceUserId) {
      return res.status(400).json({ error: 'salesforceUserId is required' });
    }

    // Fix the conversation ID template literal
    const conversationId = `sf_conv_${salesforceUserId}_${Date.now()}`;
    
    const conversation = {
      id: conversationId,
      salesforceUserId,
      userName: userName || 'Salesforce User',
      platform,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    conversations.set(conversationId, conversation);
    messages.set(conversationId, []);

    console.log('✅ Conversation created:', conversationId);
    
    res.status(201).json({
      success: true,
      conversationId: conversationId,
      message: 'Conversation created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. SEND MESSAGE
app.post('/api/messages', (req, res) => {
  try {
    const { conversationId, messageText, senderType = 'user', salesforceUserId, userName } = req.body;
    
    if (!conversationId || !messageText) {
      return res.status(400).json({ error: 'conversationId and messageText are required' });
    }

    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fix the message ID template literal
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userMessage = {
      id: messageId,
      conversationId,
      messageText,
      senderType,
      salesforceUserId: salesforceUserId || 'unknown',
      userName: userName || 'User',
      timestamp: new Date(),
      isRead: false
    };

    // Store user message
    messages.get(conversationId).push(userMessage);
    
    // Update conversation timestamp
    const conversation = conversations.get(conversationId);
    conversation.updatedAt = new Date();

    console.log('💬 User message stored:', { conversationId, messageText });

    // Generate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(messageText);
      // Fix the bot message ID template literal
      const botMessageId = `bot_${messageId}`;
      
      const botMessage = {
        id: botMessageId,
        conversationId,
        messageText: botResponse,
        senderType: 'bot',
        salesforceUserId: 'bot',
        userName: 'Chat Assistant',
        timestamp: new Date(),
        isRead: false
      };

      messages.get(conversationId).push(botMessage);
      console.log('🤖 Bot response generated:', botResponse);
    }, BOT_RESPONSE_DELAY);

    res.json({
      success: true,
      messageId: messageId,
      storedIn: 'external_database',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET MESSAGES
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversationMessages = messages.get(conversationId) || [];
    
    console.log('📨 Retrieved messages:', conversationMessages.length);
    
    res.json({
      success: true,
      conversationId,
      messages: conversationMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      totalCount: conversationMessages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. BOT RESPONSE ENDPOINT
app.post('/api/chat/bot-response', (req, res) => {
  try {
    const { conversationId, userMessage } = req.body;
    
    const botResponse = generateBotResponse(userMessage);
    
    res.json({
      success: true,
      botResponse: botResponse,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating bot response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BOT LOGIC
function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
  const responses = {
    greeting: [
      "Hello! 👋 I'm your external chat assistant. Your message is stored in our external database!",
      "Hi there! 🌟 I can see your message in our external system. How can I help?",
      "Welcome! 🎉 This message came from our external API and is stored securely."
    ],
    question: [
      "That's a great question! I'm processing this through our external system.",
      "Interesting question! Let me check our external database for the best answer.",
      "I understand your query. Our external system is analyzing this for you."
    ],
    help: [
      "I can help you with: External data storage, Real-time messaging, Salesforce integration!",
      "I'm here to demonstrate two-way data transfer between Salesforce and external systems.",
      "This chat shows how messages flow between Salesforce and external databases in real-time!"
    ],
    default: [
      "Thanks for your message! This is stored externally and synced with Salesforce.",
      "I received your message in our external system. Everything is working perfectly!",
      "Your message is now in our external database and visible in Salesforce. 🚀"
    ]
  };

  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  } else if (message.includes('?')) {
    return responses.question[Math.floor(Math.random() * responses.question.length)];
  } else if (message.includes('help')) {
    return responses.help[Math.floor(Math.random() * responses.help.length)];
  } else {
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  }
}

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 External Chat API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Ready for Salesforce integration!`);
});


// Export for testing
module.exports = app;