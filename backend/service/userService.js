const User = require("../model/userSchema");
const { ForgotPassword } = require("../model/index");
const { hashPassword, comparePassword } = require("../middleware/bcryptMiddleware");
const sendEmail = require("./emailService");
const sequelize = require("../utils/dbConfig");

const createUserService = async (name, email,age,gender, password) => {
  const hashedPassword = await hashPassword(password);
  const result = await User.create({ name, email,age,gender, password: hashedPassword });
  const data = result.toJSON();
  delete data.password;
  return data;
};

const loginService = async (email, password) => {
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return false;
  }

  const comparedPassword = await comparePassword(password, user.password);
  console.log(comparedPassword);
  if (!comparedPassword) {
    return false;
  }

  const data = user.toJSON();

  delete data.password;

  return data;
};

const forgotPasswordService = async (email) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      await transaction.rollback();
      return false;
    }

    await ForgotPassword.update(
      { isActive: false },
      {
        where: {
          userId: user.id,
          isActive: true,
        },
        transaction,
      },
    );

    const resetRequest = await ForgotPassword.create(
      {
        userId: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      { transaction },
    );

    await transaction.commit();

    await sendEmail(
      user.email,
      "Reset Password",
      `
      <a href="http://localhost:5500/frontend/login/reset-password.html?id=${resetRequest.id}">
    Reset Password
</a>
      `,
    );

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updatePasswordService = async (resetId, password) => {
  const transaction = await sequelize.transaction();

  try {
    const resetRequest = await ForgotPassword.findByPk(resetId, {
      transaction,
    });

    if (!resetRequest) {
      throw new Error("Invalid reset link");
    }

    if (!resetRequest.isActive) {
      throw new Error("Reset link has already been used");
    }

    const hashedPassword = await hashPassword(password);

    await User.update(
      { password: hashedPassword },
      {
        where: {
          id: resetRequest.userId,
        },
        transaction,
      },
    );

    await resetRequest.update(
      {
        isActive: false,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getUserByIdService = async (id) => {
  const response = await User.findByPk(id, {
    attributes: ["id", "name", "email", "isPremium"],
  });
  return response;
};

const deleteUserByIdService= async (id)=>{
    const response = await User.findByPk(id)
    return response.destroy()
}

module.exports = {
  createUserService,
  loginService,
  forgotPasswordService,
  updatePasswordService,
  getUserByIdService,
  deleteUserByIdService
};
