const {
  createOrder,
  getOrderStatus,
} = require("../service/cashfreepaymentService");
const {
  successResponse,
  errorResponse,
} = require("../middleware/responseHandleMiddleware");
const { randomUUID } = require("crypto");

const cashfreeOrderController = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orderId = randomUUID();
    const { customerPhone } = req.body;
    const order = await createOrder(orderId, customerId, customerPhone);
    return successResponse(res, 201, "payment genarated", order);
  } catch (error) {

     console.error("Cashfree Controller Error:", error);
  console.error("Error Message:", error.message);
  console.error("Cashfree Response:", error.response?.data);

  return errorResponse(res, 500, error.message);
    
  }
};

const getOrderStatusCashfreeController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const response = await getOrderStatus(orderId);
    return successResponse(res, 201, "payment successfully", response);
  } catch (error) {
    console.log(error);

    return errorResponse(res, 500, error.message);
  }
};

module.exports = { cashfreeOrderController, getOrderStatusCashfreeController };
