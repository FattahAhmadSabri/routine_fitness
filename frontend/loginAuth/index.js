const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");

// Show / Hide Password
togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";

  togglePassword.textContent = isPassword ? "Hide" : "Show";
});

// Message Handler
function showMessage(text, type = "error") {
  message.textContent = text;

  message.style.color = type === "success" ? "#16803c" : "#dc2626";
}

// Login API
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  message.textContent = "";

  // Email Validation
  if (!emailInput.checkValidity() || !email) {
    showMessage("Please enter a valid email.");
    emailInput.focus();
    return;
  }

  // Password Validation
  if (!password) {
    showMessage("Please enter your password.");
    passwordInput.focus();
    return;
  }

  try {
    const response = await api.post("/user/login", {
      email,
      password,
    });

    if (response.data.success) {
      showMessage(response.data.message || "Login successful!", "success");

      // Only if your backend returns a JWT token.
      // Prefer HttpOnly cookies for production authentication.
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      // Redirect after successful login
      window.location.href = "../home/bmiHome.html";
    } else {
      showMessage(response.data.message || "Login failed.");
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 400 || status === 401) {
        showMessage("Invalid email or password.");
      } else if (status === 403) {
        showMessage("Access denied.");
      } else if (status === 429) {
        showMessage("Too many login attempts. Try again later.");
      } else {
        showMessage(error.response.data?.message || "Something went wrong.");
      }
    } else if (error.code === "ECONNABORTED") {
      showMessage("Request timed out. Please try again.");
    } else {
      showMessage("Unable to connect to the server.");
    }

    console.error("Login Error:", error);
  }
});



// Forgot Password
document.getElementById("forgotPassword").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "forgot-password.html";
});

// Google Login
document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = `${API_BASE_URL}/user/google`;
});
