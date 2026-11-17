const cashfree = Cashfree({
  mode: "sandbox",
});

document
  .getElementById("paymentForm")
  .addEventListener("submit", handlePayment);

async function handlePayment(event) {
  event.preventDefault();

  const customerPhone = document.getElementById("phone").value.trim();

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please log in again.");
      window.location.href = "../login/login.html";
      return;
    }

    // Use existing Axios instance from your API JS file
    const response = await api.post("/payments/create_order", {
      customerPhone,
    });

    console.log("Payment Response:", response.data);

    const paymentSessionId = response.data.data?.payment_session_id;

    if (!paymentSessionId) {
      alert("Payment Session ID not found.");
      return;
    }

    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_self",
    });

    console.log("Checkout Result:", result);
  } catch (error) {
    console.error("Payment Error:", error);

    alert(error.response?.data?.message || "Unable to initiate payment.");
  }
}
