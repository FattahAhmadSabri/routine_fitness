const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id");

const statusElement = document.getElementById("status");

document.getElementById("orderId").innerText =
  `Order ID: ${orderId || "Not found"}`;

async function checkPaymentStatus() {
  try {
    const { data } = await api.get(`/payments/${orderId}`);

    if (!data.success) {
      statusElement.innerText = "Payment verification failed.";
      return;
    }

    const orderStatus = data.data.orderStatus;

    if (orderStatus === "success") {
      statusElement.innerText = "🎉 Premium Membership Activated!";
    } else if (orderStatus === "pending") {
      statusElement.innerText = "Payment is being processed...";

      setTimeout(checkPaymentStatus, 3000);
    } else {
      statusElement.innerText = "❌ Payment failed.";
    }
  } catch (error) {
    console.error(
      "Payment Verification Error:",
      error.response?.data || error.message,
    );

    statusElement.innerText = "Unable to verify payment.";
  }
}

if (orderId) {
  checkPaymentStatus();
} else {
  statusElement.innerText = "Order ID not found.";
}
