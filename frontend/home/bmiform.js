
const bmiForm = document.getElementById("bmiForm");

const heightFeet = document.getElementById("heightFeet");
const heightInches = document.getElementById("heightInches");
const weightInput = document.getElementById("weight");

const saveBmiBtn = document.getElementById("saveBmiBtn");

// Convert feet and inches into metres
function convertHeightToMeters(feet, inches) {
  const totalInches = (feet * 12) + inches;
  return Number((totalInches * 0.0254).toFixed(3));
}

bmiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const feet = Number(heightFeet.value);
  const inches = Number(heightInches.value);
  const weight = Number(weightInput.value);

  // Validate inputs
  if (
    !Number.isInteger(feet) ||
    !Number.isInteger(inches) ||
    feet < 1 ||
    feet > 8 ||
    inches < 0 ||
    inches > 11 ||
    !Number.isFinite(weight) ||
    weight < 10 ||
    weight > 500
  ) {
    alert("Please enter valid height and weight.");
    return;
  }

  // Convert height into metres
  const height = convertHeightToMeters(feet, inches);

  // API payload
  const payload = {
    height,
    weight
  };

  try {
    saveBmiBtn.disabled = true;
    saveBmiBtn.querySelector("span").textContent = "Saving...";

    const response = await api.post("/bmi/create", payload);

    alert(response.data.message || "Measurements saved successfully!");

    bmiForm.reset();

  } catch (error) {
    console.error("BMI submission error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to save measurements. Please try again."
    );

  } finally {
    saveBmiBtn.disabled = false;
    saveBmiBtn.querySelector("span").textContent = "Save measurements";
  }
});
