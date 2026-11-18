const forgotForm = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    message.style.color = "#ff6b6b";
    message.textContent = "Please enter your email address.";
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    message.textContent = "";

    const response = await api.post(`/user/password/forgotPassword`, { email });

    message.style.color = "#7cdb9a";
    message.textContent =
      response.data.message || "Password reset link sent successfully!";

    forgotForm.reset();
  } catch (error) {
    message.style.color = "#ff6b6b";

    message.textContent =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Reset Link";
  }
});
