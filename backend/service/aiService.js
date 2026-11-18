const axios = require("axios");

const generateAIResponse = async (message) => {
  try {
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: process.env.NVIDIA_MODEL,

        messages: [
          {
            role: "system",
            content: `
You are Routine AI, a friendly health and fitness assistant.

Help users with:
- General health and wellness education
- Fitness and workout guidance
- Nutrition and meal suggestions
- BMI and BMR explanations
- Protein intake guidance
- Healthy lifestyle habits

Rules:
- Give simple, practical answers.
- Never diagnose medical conditions.
- Never prescribe medicines.
- Do not invent user health information.
- Recommend professional medical advice for concerning symptoms.
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],

        temperature: 0.5,
        max_tokens: 700,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 60000,
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("NVIDIA API ERROR:", error.response?.data || error.message);

    throw new Error("Unable to generate AI response");
  }
};

module.exports = { generateAIResponse };
