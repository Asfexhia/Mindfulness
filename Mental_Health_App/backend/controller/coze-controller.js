import axios from 'axios';

const COZE_API_TOKEN = 'pat_4wMiaXeC0PQaQbzZ3mZl4oADqDPytW0qlGrgqN1IEQHwefoQaqu4nEbqHrzN9KOf';
const COZE_API_BASE = 'https://api.coze.cn';
const BOT_ID = '7517945743194734630';

// New API credentials for Test therapist
const TEST_API_TOKEN = 'pat_k4m2Uj9g2T4yFH3HzI5DEeAB0L8QLANxpY9wlXzNJO135EvUdIFcbH3MLyfHfPU3';
const TEST_BOT_ID = '7541689670422511631';

// AI Therapist chat with Coze
export const chatWithTherapist = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    // Build the prompt with conversation context
    let contextPrompt = '';
    if (conversationHistory && conversationHistory.length > 0) {
      contextPrompt = conversationHistory.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Therapist'}: ${msg.text}`
      ).join('\n') + '\n';
    }
    
    const fullPrompt = `${contextPrompt}Analyse the user's input and give suggestions or talk with them and provide an answer in paragraphs with spaces between paragraphs and points. Respond as if you are talking to the user in the first person, not the third person:\n\nUser: ${message}\nTherapist:`;
    
    // 调用 Coze API
    const response = await axios.post(`${COZE_API_BASE}/open_api/v2/chat`, {
      bot_id: BOT_ID,
      user: req.user?.id || 'anonymous_user_' + Date.now(),
      query: fullPrompt,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract the AI response
    console.log('Coze API Response:', JSON.stringify(response.data, null, 2));
    
    let aiResponse = 'No response received';
    
    if (response.data && response.data.messages && response.data.messages.length > 0) {
      // Find the assistant's answer message
      const answerMessage = response.data.messages.find(msg => 
        msg.role === 'assistant' && msg.type === 'answer'
      );
      
      if (answerMessage && answerMessage.content) {
        aiResponse = answerMessage.content;
      } else {
        // Fallback to last assistant message
        const lastAssistantMessage = response.data.messages
          .filter(msg => msg.role === 'assistant')
          .pop();
        
        if (lastAssistantMessage && lastAssistantMessage.content) {
          aiResponse = lastAssistantMessage.content;
        }
      }
    } else if (response.data && response.data.reply) {
      aiResponse = response.data.reply;
    } else if (response.data && response.data.answer) {
      aiResponse = response.data.answer;
    }

    res.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Error with Coze API (Therapist):', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating the response.',
      error: error.message
    });
  }
};

// Test AI Therapist chat with different Coze API
export const chatWithTestTherapist = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    // Build additional messages array
    const additionalMessages = [];
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        additionalMessages.push({
          content: msg.text,
          content_type: "text",
          role: msg.sender === 'user' ? 'user' : 'assistant',
          type: msg.sender === 'user' ? 'question' : 'answer'
        });
      });
    }
    
    // Add current message
    additionalMessages.push({
      content: message,
      content_type: "text",
      role: "user",
      type: "question"
    });
    
    // 调用新的 Coze API (v3)
    const response = await axios.post(`${COZE_API_BASE}/v3/chat`, {
      bot_id: TEST_BOT_ID,
      user_id: req.user?.id || 'user_' + Date.now(),
      stream: false,
      additional_messages: additionalMessages,
      parameters: {}
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Test Coze API Response:', JSON.stringify(response.data, null, 2));
    
    let aiResponse = 'No response received';
    
    if (response.data && response.data.messages && response.data.messages.length > 0) {
      // Find the assistant's answer message
      const answerMessage = response.data.messages.find(msg => 
        msg.role === 'assistant' && (msg.type === 'answer' || msg.type === 'text')
      );
      
      if (answerMessage && answerMessage.content) {
        aiResponse = answerMessage.content;
      } else {
        // Fallback to last assistant message
        const lastAssistantMessage = response.data.messages
          .filter(msg => msg.role === 'assistant')
          .pop();
        
        if (lastAssistantMessage && lastAssistantMessage.content) {
          aiResponse = lastAssistantMessage.content;
        }
      }
    } else if (response.data && response.data.reply) {
      aiResponse = response.data.reply;
    } else if (response.data && response.data.answer) {
      aiResponse = response.data.answer;
    }

    res.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Error with Test Coze API:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating the response.',
      error: error.message,
      details: error.response?.data
    });
  }
};

// Quiz analysis with Coze (existing function)
export const analyzeWithCoze = async (req, res) => {
  try {
    const { questions, answers } = req.body;
    
    // 构建prompt
    const prompt = `Analyze the following mental health quiz answers and generate a short summary regarding the persons mental health and what can he do, use points and headings and generate answer separated by paragraphs, also give a space between different paragraphs:\n\n${questions.map((q, i) => `${i+1}. ${q} ${answers[i]}`).join('\n')}`;
    
    // 调用 Coze API
    const response = await axios.post(`${COZE_API_BASE}/open_api/v2/chat`, {
      bot_id: BOT_ID,
      user: req.user?.id || 'anonymous_user_' + Date.now(),
      query: prompt,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Coze API Response (Quiz):', JSON.stringify(response.data, null, 2));
    
    let result = 'No response received';
    if (response.data && response.data.messages && response.data.messages.length > 0) {
      // Find the assistant's answer message
      const answerMessage = response.data.messages.find(msg => 
        msg.role === 'assistant' && msg.type === 'answer'
      );
      
      if (answerMessage && answerMessage.content) {
        result = answerMessage.content;
      } else {
        // Fallback to last assistant message
        const lastAssistantMessage = response.data.messages
          .filter(msg => msg.role === 'assistant')
          .pop();
        
        if (lastAssistantMessage && lastAssistantMessage.content) {
          result = lastAssistantMessage.content;
        }
      }
    } else if (response.data && response.data.reply) {
      result = response.data.reply;
    } else if (response.data && response.data.answer) {
      result = response.data.answer;
    }

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('Error with Coze API:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'An error occurred while analyzing the answers.',
      error: error.message
    });
  }
};