const {BMI} = require("../model/index");
const { Op } = require("sequelize");

const createBmiService = async (data) => {

  const { name, age, weight, height, gender } = data;

  if (
    !age ||
    age <= 0 ||
    !weight ||
    weight <= 0 ||
    !height ||
    height <= 0 ||
    !["male", "female"].includes(gender)
  ) {
    throw new Error("Invalid BMI input data");
  }

  const bmIndex = weight / height ** 2;

  const heightInCm = height * 100;

  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * heightInCm - 5 * age + 5
      : 10 * weight + 6.25 * heightInCm - 5 * age - 161;

  const bfp =
    gender === "male"
      ? 1.2 * bmIndex + 0.23 * age - 10.8 - 5.4
      : 1.2 * bmIndex + 0.23 * age - 5.4;

  const newBMI = await BMI.create({
    name,
    age,
    weight,
    height,
    gender,
    bmIndex,
    bmr,
    bfp,
  });

  return newBMI;
};

const getBMIService = async () => {
  return await BMI.findAll();
};

const getBMIByIdService = async (id) => {
  return await BMI.findByPk(id);
};

const sortDataService = async (age) => {
  return await BMI.findAll({
    where: {
      age: {
        [Op.gte]: age,
      },
    },
    order: [["age", "ASC"]],
  });
};

const sortValueService = async (age, weight) => {
  return await BMI.findAll({
    where: {
      age: {
        [Op.lte]: age,
      },
      weight: {
        [Op.lte]: weight,
      },
    },
    order: [["age", "ASC"]],
  });
};

module.exports = {
  createBmiService,
  getBMIService,
  getBMIByIdService,
  sortDataService,
  sortValueService,
};
