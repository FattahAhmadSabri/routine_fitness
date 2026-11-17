const ForgotPassword = require("./forgotPasswordSchema");
const User = require("./userSchema");
const Payment = require("./paymentSchema");
const BMI = require("./bmiSchema");

User.hasMany(ForgotPassword);
ForgotPassword.belongsTo(User);

User.hasMany(BMI);
BMI.belongsTo(User);

User.hasMany(Payment, {
  foreignKey: "userId",
});

Payment.belongsTo(User, {
  foreignKey: "userId",
});

module.exports = {
  User,
  ForgotPassword,
  Payment,
  BMI,
};
