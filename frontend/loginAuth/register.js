const registerForm = document.getElementById("registerForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const ageInput = document.getElementById("age");
const genderInput = document.getElementById("gender");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerBtn = document.getElementById("registerBtn");
const btnText = document.getElementById("btnText");
const loader = document.getElementById("loader");
const message = document.getElementById("message");

// Show / Hide Password
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);

    const isHidden = target.type === "password";

    target.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
    button.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password",
    );
  });
});

// Loading State
function setLoading(isLoading) {
  registerBtn.disabled = isLoading;

  btnText.textContent = isLoading ? "Creating account..." : "Create account";

  loader.classList.toggle("hidden", !isLoading);
}

// Display Message
function showMessage(text, type = "error") {
  message.textContent = text;

  message.style.color = type === "success" ? "#16803c" : "#dc2626";
}

// Register API
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  message.textContent = "";

  // Collect form data
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const age = Number(ageInput.value);
  const gender = genderInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validate name
  if (name.length < 2 || name.length > 50) {
    showMessage("Name must be between 2 and 50 characters.");
    nameInput.focus();
    return;
  }

  // Validate email
  if (!emailInput.checkValidity()) {
    showMessage("Please enter a valid email address.");
    emailInput.focus();
    return;
  }

  // Validate age
  if (!Number.isInteger(age) || age < 1) {
    showMessage("Please enter a valid age.");
    ageInput.focus();
    return;
  }

  // Validate gender
  if (!["male", "female"].includes(gender)) {
    showMessage("Please select a valid gender.");
    genderInput.focus();
    return;
  }

  // Validate password
  if (password.length < 8) {
    showMessage("Password must contain at least 8 characters.");
    passwordInput.focus();
    return;
  }

  // Confirm password
  if (password !== confirmPassword) {
    showMessage("Passwords do not match.");
    confirmPasswordInput.focus();
    return;
  }

  try {
    setLoading(true);

    // API Request
    const response = await api.post("/user/register", {
      name,
      email,
      age,
      gender,
      password,
    });

    if (response.data.success) {
      showMessage(
        response.data.message || "Registration successful!",
        "success",
      );

      registerForm.reset();

      // Redirect to login page
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    } else {
      showMessage(response.data.message || "Registration failed.");
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 409) {
        showMessage("This email is already registered.");
      } else if (status === 400 || status === 422) {
        showMessage(
          error.response.data?.message ||
            "Please check your registration details.",
        );
      } else if (status === 429) {
        showMessage("Too many requests. Please try again later.");
      } else {
        showMessage(
          error.response.data?.message || "Unable to create account.",
        );
      }
    } else if (error.code === "ECONNABORTED") {
      showMessage("Request timed out. Please try again.");
    } else {
      showMessage("Unable to connect to the server.");
    }

    console.error("Registration Error:", error);
  } finally {
    setLoading(false);
  }
});
