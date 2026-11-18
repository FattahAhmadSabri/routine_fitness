
const { generateAIResponse } = require("../service/aiService");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    const aiResponse = await generateAIResponse(message);

    return res.status(200).json({
      success: true,
      response: aiResponse,
    });

  } catch (error) {
    console.error("AI Controller:", error.message);

    return res.status(502).json({
      success: false,
      message: "Routine AI is temporarily unavailable",
    });
  }
};

module.exports = { chatWithAI };
