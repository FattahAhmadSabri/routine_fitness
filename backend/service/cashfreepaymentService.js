const { Cashfree, CFEnvironment } = require("cashfree-pg");
const { User, Payment } = require("../model/index");
const sequelize = require("../utils/dbConfig");
const axios = require("axios"); // Required for the firewall fix

// ==========================================
// FIREWALL FIX:
// Force the SDK's internal Axios to use a real browser User-Agent.
// This prevents Cashfree's CloudFront firewall from blocking the request with a 403 error.
// ==========================================
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PREMIUM_AMOUNT = 500;

const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET,
);

const createOrder = async (
  orderId,
  customerId,
  customerPhone,
  orderCurrency = "INR",
) => {
  try {
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

    const request = {
      order_id: orderId,
      order_amount: PREMIUM_AMOUNT,
      order_currency: orderCurrency,

      customer_details: {
        // Cashfree strictly requires these to be strings, not numbers
        customer_id: customerId.toString(),
        customer_phone: customerPhone.toString(),
      },

      order_meta: {
        return_url:
          "return_url: `${process.env.FRONTEND_URL}/payment/payment-success.html?order_id={order_id}`,",
        notify_url: "http://localhost:5000/api/payment/webhook",
        payment_methods: "cc,dc,upi",
      },

      order_expiry_time: expiryDate.toISOString(),
    };

    console.log("Sending request to Cashfree:", request);

    const response = await cashfree.PGCreateOrder(request);

    await Payment.create({
      orderId,
      userId: customerId,
      amount: PREMIUM_AMOUNT,
      status: "pending",
    });

    return response.data;
  } catch (error) {
    console.error("Cashfree API Error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(
      error.response?.data?.message || "Failed to create Cashfree order.",
    );
  }
};

const getOrderStatus = async (orderId) => {
  const transaction = await sequelize.transaction();

  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    const payments = response.data;

    const successfulPayment = payments.find(
      (payment) => payment.payment_status === "SUCCESS",
    );

    let orderStatus;

    if (successfulPayment) {
      const paymentRecord = await Payment.findOne({
        where: { orderId },
        transaction,
      });

      if (!paymentRecord) {
        throw new Error("Payment record not found.");
      }

      await Payment.update(
        {
          status: "success",
          paymentId: successfulPayment.cf_payment_id,
        },
        {
          where: { orderId },
          transaction,
        },
      );

      const [updatedRows] = await User.update(
        { isPremium: true },
        {
          where: { id: paymentRecord.userId },
          transaction,
        },
      );

      if (updatedRows === 0) {
        throw new Error("User not found. Premium activation failed.");
      }

      orderStatus = "success";
    } else if (
      payments.some((payment) => payment.payment_status === "PENDING")
    ) {
      orderStatus = "pending";
    } else {
      orderStatus = "failure";
    }

    await transaction.commit();

    return {
      orderStatus,
      payments,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction rolled back:", error.message);
    throw error;
  }
};

module.exports = { createOrder, getOrderStatus };
