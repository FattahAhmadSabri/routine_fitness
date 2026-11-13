const express = require("express");
const cors = require("cors");
const app = express();

const env = require("dotenv");
app.use(cors());
env.config();
const port = process.env.PORT;
app.use(express.json());
const userRoute = require("./routes/userRoute");
const bmiRoute = require("./routes/bmiRoute")
const sequelize = require("./utils/dbConfig");
app.use("/api", userRoute);
app.use("/api", bmiRoute);
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
