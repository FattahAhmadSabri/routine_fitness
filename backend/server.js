const express = require("express");
const cors = require("cors");

const env = require("dotenv");
env.config();
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true,
  }),
);
const port = process.env.PORT;
app.use(express.json());
const userRoute = require("./routes/userRoute");
const bmiRoute = require("./routes/bmiRoute");
const paymentRoute = require("./routes/paymentRoute");
const sequelize = require("./utils/dbConfig");
const aiRoute = require("./routes/aiRoute");
app.use("/api", userRoute);
app.use("/api", bmiRoute);
app.use("/api", paymentRoute);
app.use("/api", aiRoute);
app.get("/check", (req, res) => {
  res.send("health care server working");
});

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL connected successfully");

    await sequelize.sync();

    console.log("Database tables synchronized");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
