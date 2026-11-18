const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");

const AI_API_URL = `${API_BASE_URL}/chat`;

// Submit message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();

  if (!text) return;

  sendMessage(text);
});

// Suggestion buttons
function sendSuggestion(text) {
  sendMessage(text);
}

// Send message to backend
async function sendMessage(text) {
  if (!text || sendBtn.disabled) return;

  welcome.style.display = "none";

  // Display user message
  addMessage(text, "user");

  userInput.value = "";

  // Show typing indicator
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.textContent = "Routine AI is thinking...";

  messages.appendChild(typing);

  const chatContainer = document.querySelector(".chat-container");

  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Disable send button
  sendBtn.disabled = true;

  try {
    // Get JWT token
    const token = localStorage.getItem("token");

    // Call backend API
    const response = await axios.post(
      AI_API_URL,
      {
        message: text,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Remove typing indicator
    typing.remove();

    // Display AI response
    addMessage(response.data.response, "bot");
  } catch (error) {
    console.error("Routine AI Error:", error.response?.data || error.message);

    typing.remove();

    const errorMessage =
      error.response?.status === 401
        ? "Your session has expired. Please login again."
        : error.response?.data?.message ||
          "Unable to connect to Routine AI. Please try again.";

    addMessage(errorMessage, "bot");
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// Display messages
function addMessage(text, sender) {
  const message = document.createElement("div");

  message.className = `message ${sender}`;

  if (sender === "bot") {
    const avatar = document.createElement("div");

    avatar.className = "avatar";
    avatar.innerHTML = '<i class="fa-solid fa-leaf"></i>';

    message.appendChild(avatar);
  }

  const content = document.createElement("div");

  content.className = "message-content";

  // Safe text rendering
  content.textContent = text;

  message.appendChild(content);

  messages.appendChild(message);

  const chatContainer = document.querySelector(".chat-container");

  chatContainer.scrollTop = chatContainer.scrollHeight;
}
