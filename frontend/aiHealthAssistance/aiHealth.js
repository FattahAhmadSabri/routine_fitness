const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();

  if (!text) return;

  sendMessage(text);
});

function sendSuggestion(text) {
  sendMessage(text);
}

function sendMessage(text) {
  welcome.style.display = "none";

  addMessage(text, "user");

  userInput.value = "";

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.textContent = "Routine AI is thinking...";
  messages.appendChild(typing);

  document.querySelector(".chat-container").scrollTop =
    document.querySelector(".chat-container").scrollHeight;

  setTimeout(() => {
    typing.remove();

    addMessage(
      "Thanks for your question! I'm your Routine health companion. Once connected to the AI backend, I can provide personalized guidance based on your health information.",
      "bot",
    );
  }, 1200);
}

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
  content.textContent = text;

  message.appendChild(content);
  messages.appendChild(message);

  const chatContainer = document.querySelector(".chat-container");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
