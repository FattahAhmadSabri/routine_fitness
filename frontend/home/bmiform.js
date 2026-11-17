const bmiForm = document.getElementById("bmiForm");

const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");

const bmiPreview = document.getElementById("bmiPreview");
const bmiCategory = document.getElementById("bmiCategory");

function calculateBMI() {
  const height = Number(heightInput.value);
  const weight = Number(weightInput.value);

  if (height <= 0 || weight <= 0) {
    bmiPreview.textContent = "--";
    bmiCategory.textContent = "Enter valid measurements";
    return;
  }

  const bmi = weight / (height * height);

  bmiPreview.textContent = bmi.toFixed(1);

  if (bmi < 18.5) {
    bmiCategory.textContent = "Underweight";
  } else if (bmi < 25) {
    bmiCategory.textContent = "Normal weight";
  } else if (bmi < 30) {
    bmiCategory.textContent = "Overweight";
  } else {
    bmiCategory.textContent = "Obesity range";
  }
}

heightInput.addEventListener("input", calculateBMI);
weightInput.addEventListener("input", calculateBMI);

bmiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    height: Number(heightInput.value),
    weight: Number(weightInput.value)
  };

  if (
    !Number.isFinite(payload.height) ||
    !Number.isFinite(payload.weight) ||
    payload.height < 0.5 ||
    payload.height > 2.5 ||
    payload.weight < 10 ||
    payload.weight > 500
  ) {
    alert("Please enter valid height and weight.");
    return;
  }

  try {
    const response = await api.post("/bmi/create", payload);

    alert(response.data.message || "Measurements saved successfully!");

    bmiForm.reset();
    calculateBMI();

  } catch (error) {
    console.error("BMI submission error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to save measurements. Please try again."
    );
  }
});

calculateBMI();