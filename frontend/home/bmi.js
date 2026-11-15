const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");

// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ==========================================
// SIDEBAR TOGGLE
// ==========================================

menuToggle?.addEventListener("click", () => {
  const isOpen = sidebar?.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));

  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".main-nav a").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");

    sidebar?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

// ==========================================
// DYNAMIC DATE AND GREETING
// ==========================================

function updateTodayDate() {
  const todayLabel = document.getElementById("todayLabel");

  if (todayLabel) {
    todayLabel.textContent = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
      .format(new Date())
      .toUpperCase();
  }

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  const greetingText = document.getElementById("greetingText");

  if (greetingText) {
    greetingText.textContent = greeting;
  }
}

// ==========================================
// USER PROFILE API
// ==========================================

async function fetchUserProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../loginAuth/index.html";
    return;
  }

  try {
    const response = await api.get("/user/me");

    const user = response.data.data;

    if (!response.data.success || !user) {
      throw new Error("Invalid profile response");
    }

    // Update user information
    updateUserDetails(user);

    // Update BMI information
    updateBMI(user.BMIs);

    // Update subscription
    // updateSubscription(user.isPremium);
  } catch (error) {
    console.error("User Profile Error:", error);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      window.location.href = "../loginAuth/index.html";
      return;
    }

    showToast(error.response?.data?.message || "Unable to load your profile.");
  }
}

// ==========================================
// UPDATE USER DETAILS
// ==========================================

function updateUserDetails(user) {
  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  // Sidebar
  const sidebarName = document.getElementById("sidebarUserName");
  const sidebarEmail = document.getElementById("sidebarUserEmail");

  if (sidebarName) {
    sidebarName.textContent = user.name;
  }

  if (sidebarEmail) {
    sidebarEmail.textContent = user.email;
  }

  // Dashboard greeting
  const dashboardName = document.getElementById("dashboardUserName");

  if (dashboardName) {
    dashboardName.textContent = firstName;
  }

  // User initials
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userInitials = document.getElementById("userInitials");
  const topbarInitials = document.getElementById("topbarInitials");

  if (userInitials) {
    userInitials.textContent = initials;
  }

  if (topbarInitials) {
    topbarInitials.textContent = initials;
  }
}

// ==========================================
// UPDATE BMI INFORMATION
// ==========================================

function updateBMI(bmiRecords) {
  const elements = {
    bmiValue: document.getElementById("bmiValue"),
    bmiFoot: document.getElementById("bmiFoot"),
    bmiMarker: document.getElementById("bmiMarker"),
    bmiCategory: document.getElementById("bmiCategory"),
    bmrValue: document.getElementById("bmrValue"),
    bmrFoot: document.getElementById("bmrFoot"),
    bfpValue: document.getElementById("bfpValue"),
    bfpFoot: document.getElementById("bfpFoot"),
  };

  // Reset all metrics when no valid record exists
  function resetMetrics() {
    elements.bmiValue.textContent = "--";
    elements.bmiFoot.textContent = "No BMI record available";
    elements.bmiCategory.textContent = "Not available";
    elements.bmiMarker.style.display = "none";

    elements.bmrValue.textContent = "--";
    elements.bmrFoot.textContent = "No BMR record available";

    elements.bfpValue.textContent = "--";
    elements.bfpFoot.textContent = "No body fat record available";
  }

  if (!Array.isArray(bmiRecords) || bmiRecords.length === 0) {
    resetMetrics();
    return;
  }

  // Get latest BMI record
  const latestBMI = [...bmiRecords]
    .filter((record) => record?.createdAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  if (!latestBMI) {
    resetMetrics();
    return;
  }

  const bmi = Number(latestBMI.bmIndex);
  const bmr = Number(latestBMI.bmr);
  const bfp = Number(latestBMI.bfp);

  if (!Number.isFinite(bmi)) {
    resetMetrics();
    return;
  }

  // BMI category
  let category = "Obesity Class III";

  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else if (bmi < 35) category = "Obesity Class I";
  else if (bmi < 40) category = "Obesity Class II";

  elements.bmiValue.textContent = bmi.toFixed(1);
  elements.bmiCategory.textContent = category;

  elements.bmiFoot.textContent =
    `${latestBMI.weight} kg · ${latestBMI.height} m · ` +
    `Recorded ${new Date(latestBMI.createdAt).toLocaleDateString("en-IN")}`;

  // BMI scale marker
  elements.bmiMarker.style.display = "block";
  elements.bmiMarker.style.left = `${Math.min(Math.max((bmi / 40) * 100, 0), 100)}%`;

  // BMR
  elements.bmrValue.textContent = Number.isFinite(bmr)
    ? bmr.toLocaleString("en-IN", { maximumFractionDigits: 1 })
    : "--";

  elements.bmrFoot.textContent = Number.isFinite(bmr)
    ? "Estimated calories burned at rest per day"
    : "BMR data not available";

  // Body fat percentage
  elements.bfpValue.textContent = Number.isFinite(bfp) ? bfp.toFixed(1) : "--";

  elements.bfpFoot.textContent = Number.isFinite(bfp)
    ? "Estimated body fat percentage"
    : "Body fat data not available";
}

// ==========================================
// PREMIUM SUBSCRIPTION
// ==========================================

function updateSubscription(isPremium) {
  const subscriptionText = document.getElementById("subscriptionText");

  const subscriptionBtn = document.getElementById("subscriptionBtn");

  if (!subscriptionText || !subscriptionBtn) return;

  if (isPremium) {
    subscriptionText.textContent = "Premium Active";
    subscriptionBtn.classList.add("premium-active");
  } else {
    subscriptionText.textContent = "Get Subscription";
    subscriptionBtn.classList.remove("premium-active");
  }
}

function updatePDFButton(isPremium) {
  const pdfButton = document.getElementById("pdfDownloadBtn");

  if (!pdfButton) return;

  pdfButton.hidden = !isPremium;
}

function updateSubscription(isPremium) {
  const subscriptionBtn = document.getElementById("subscriptionBtn");

  if (!subscriptionBtn) return;

  if (isPremium) {
    // Premium user: show only golden crown
    subscriptionBtn.innerHTML = `<span class="crown-icon premium-crown">♛</span>`;

    subscriptionBtn.disabled = true;
    subscriptionBtn.classList.add("premium-user");
  } else {
    // Regular user: show subscription button
    subscriptionBtn.innerHTML = `
      <span class="crown-icon">♛</span>
      <span id="subscriptionText">Get Subscription</span>
      <span class="arrow">→</span>
    `;

    subscriptionBtn.disabled = false;
    subscriptionBtn.classList.remove("premium-user");
  }
}

// ==========================================
// EXISTING DASHBOARD BUTTONS
// ==========================================

document.getElementById("logWorkout")?.addEventListener("click", () => {
  showToast("Activity logging is ready to connect.");
});

document.getElementById("workoutButton")?.addEventListener("click", () => {
  showToast("Workout details are coming soon.");
});

document.getElementById("activityPeriod")?.addEventListener("click", () => {
  showToast("Showing your activity for this week.");
});

document.getElementById("subscriptionBtn")?.addEventListener("click", () => {
  showToast("Subscription module is ready to connect.");
});

// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

updateTodayDate();
fetchUserProfile();
updateSubscription(user.isPremium);
updatePDFButton(user.isPremium);
