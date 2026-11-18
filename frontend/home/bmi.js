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

function logoutUser(event) {
  event.preventDefault();

  
  localStorage.removeItem("token");
  localStorage.removeItem("user")
  window.location.href = "../loginAuth/index.html";
}

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

    // Uncomment to check the exact field names your API returns
    // console.log("User profile:", user);

    // Update user information
    updateUserDetails(user);

    // Update BMI / BMR / body fat information
    updateBMI(user.BMIs);

    // Premium-related UI (must run here, where `user` exists)
    const isPremium =
      user.isPremium === true ||
      user.isPremium === "true" ||
      user.isPremium === 1;

    updateSubscription(isPremium);
    updatePDFButton(isPremium);
    updatePremiumBMIButton(isPremium);
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
  const fullName = user.name?.trim() || "User";
  const firstName = fullName.split(/\s+/)[0] || "there";

  // Sidebar
  const sidebarName = document.getElementById("sidebarUserName");
  const sidebarEmail = document.getElementById("sidebarUserEmail");

  if (sidebarName) {
    sidebarName.textContent = fullName;
  }

  if (sidebarEmail) {
    sidebarEmail.textContent = user.email || "";
  }

  // Dashboard greeting
  const dashboardName = document.getElementById("dashboardUserName");

  if (dashboardName) {
    dashboardName.textContent = firstName;
  }

  // User initials
  const initials = fullName
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

  // Safe setter so a missing element never breaks the script
  function setText(el, text) {
    if (el) el.textContent = text;
  }

  // Reset all metrics when no valid record exists
  function resetMetrics() {
    setText(elements.bmiValue, "--");
    setText(elements.bmiFoot, "No BMI record available");
    setText(elements.bmiCategory, "Not available");
    if (elements.bmiMarker) elements.bmiMarker.style.display = "none";

    setText(elements.bmrValue, "--");
    setText(elements.bmrFoot, "No BMR record available");

    setText(elements.bfpValue, "--");
    setText(elements.bfpFoot, "No body fat record available");
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

  setText(elements.bmiValue, bmi.toFixed(1));
  setText(elements.bmiCategory, category);

  setText(
    elements.bmiFoot,
    `${latestBMI.weight} kg · ${latestBMI.height} m · ` +
      `Recorded ${new Date(latestBMI.createdAt).toLocaleDateString("en-IN")}`,
  );

  // BMI scale marker
  if (elements.bmiMarker) {
    elements.bmiMarker.style.display = "block";
    elements.bmiMarker.style.left = `${Math.min(Math.max((bmi / 40) * 100, 0), 100)}%`;
  }

  // BMR
  setText(
    elements.bmrValue,
    Number.isFinite(bmr)
      ? bmr.toLocaleString("en-IN", { maximumFractionDigits: 1 })
      : "--",
  );

  setText(
    elements.bmrFoot,
    Number.isFinite(bmr)
      ? "Estimated calories burned at rest per day"
      : "BMR data not available",
  );

  // Body fat percentage
  setText(elements.bfpValue, Number.isFinite(bfp) ? bfp.toFixed(1) : "--");

  setText(
    elements.bfpFoot,
    Number.isFinite(bfp)
      ? "Estimated body fat percentage"
      : "Body fat data not available",
  );
}

// ==========================================
// PREMIUM UI
// ==========================================

function updateSubscription(isPremium) {
  const subscriptionBtn = document.getElementById("subscriptionBtn");

  if (!subscriptionBtn) return;

  if (isPremium) {
    // Premium user: show only the golden crown
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

function updatePDFButton(isPremium) {
  const pdfButton = document.getElementById("pdfDownloadBtn");

  if (!pdfButton) return;

  pdfButton.hidden = !isPremium;
}

function updatePremiumBMIButton(isPremium) {
  const addBmiBtn = document.getElementById("addBmiBtn");

  if (!addBmiBtn) return;

  addBmiBtn.hidden = !isPremium;
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

// The Get Subscription button redirects via its inline onclick in index.html,
// so the old "Subscription module is ready to connect" toast was removed.

document
  .getElementById("pdfDownloadBtn")
  ?.addEventListener("click", async () => {
    try {
      const response = await api.post(
        "/bmi/generate-pdf",
        {},
        { responseType: "blob" },
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Routine-Health-Report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
      showToast("Unable to download your health report.");
    }
  });

// ==========================================
// GYM CLOCK / REST TIMER
// ==========================================

(function () {
  var root = document.getElementById("gymClock");
  if (!root) return;

  var NS = "http://www.w3.org/2000/svg",
    C = 200,
    CIRC = 1137.3;
  var svg = root.querySelector(".gc-face svg");
  var ticks = svg.querySelector("#ticks"),
    nums = svg.querySelector("#nums");
  function el(n, a, p) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    p.appendChild(e);
    return e;
  }

  for (var i = 0; i < 60; i++) {
    var big = i % 5 === 0;
    el(
      "line",
      {
        x1: C,
        y1: C - 160,
        x2: C,
        y2: C - (big ? 142 : 151),
        stroke: "var(--gc-chalk)",
        "stroke-width": big ? 4 : 1.5,
        "stroke-linecap": "round",
        opacity: big ? 1 : 0.6,
        transform: "rotate(" + i * 6 + " " + C + " " + C + ")",
      },
      ticks,
    );
  }
  for (var h = 1; h <= 12; h++) {
    var a = (h * Math.PI) / 6;
    el(
      "text",
      { class: "num", x: C + Math.sin(a) * 113, y: C - Math.cos(a) * 113 },
      nums,
    ).textContent = h;
  }

  var hH = svg.querySelector("#hHand"),
    mH = svg.querySelector("#mHand"),
    sH = svg.querySelector("#sHand");
  var ring = svg.querySelector("#ring");
  var digital = document.getElementById("digital"),
    msg = document.getElementById("msg");
  var wrap = document.getElementById("plateWrap"),
    stopBtn = document.getElementById("stopBtn");
  var setsEl = document.getElementById("sets");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastSec = -1,
    rest = null;

  function place(g, d) {
    g.setAttribute(
      "transform",
      "translate(" + C + " " + C + ") rotate(" + d + ")",
    );
  }
  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function message(hr) {
    if (hr < 5) return "Late-night grind. Respect.";
    if (hr < 9) return "Morning session. Go get it.";
    if (hr < 12) return "Prime time. Add a plate.";
    if (hr < 15) return "Lunch lift. Eat, then press.";
    if (hr < 19) return "Peak hours. Own the floor.";
    return "Last set of the day. Finish strong.";
  }

  function dayKey() {
    var d = new Date();
    return (
      "gymclock-sets-" +
      d.getFullYear() +
      "-" +
      d.getMonth() +
      "-" +
      d.getDate()
    );
  }
  var sets = 0;
  try {
    sets = parseInt(localStorage.getItem(dayKey()), 10) || 0;
  } catch (e) {}
  setsEl.textContent = sets;

  function beep() {
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach(function (t) {
        var o = ac.createOscillator(),
          g = ac.createGain();
        o.type = "square";
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.12, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.18);
        o.connect(g);
        g.connect(ac.destination);
        o.start(ac.currentTime + t);
        o.stop(ac.currentTime + t + 0.2);
      });
    } catch (e) {}
  }

  function startRest(sec) {
    rest = { end: Date.now() + sec * 1000, total: sec * 1000 };
    ring.setAttribute("opacity", "1");
    stopBtn.hidden = false;
    wrap.classList.remove("done");
  }
  function stopRest(finished) {
    rest = null;
    ring.setAttribute("opacity", "0");
    stopBtn.hidden = true;
    digital.classList.remove("resting");
    lastSec = -1;
    if (finished) {
      wrap.classList.add("done");
      beep();
      setTimeout(function () {
        wrap.classList.remove("done");
      }, 3200);
    }
  }

  root.querySelectorAll("[data-rest]").forEach(function (b) {
    b.addEventListener("click", function () {
      startRest(parseInt(b.getAttribute("data-rest"), 10));
      sets++;
      setsEl.textContent = sets;
      try {
        localStorage.setItem(dayKey(), sets);
      } catch (e) {}
    });
  });
  stopBtn.addEventListener("click", function () {
    stopRest(false);
  });

  function tick() {
    var d = new Date(),
      s = d.getSeconds() + (reduce ? 0 : d.getMilliseconds() / 1000);
    var m = d.getMinutes() + s / 60,
      hr = (d.getHours() % 12) + m / 60;
    place(sH, s * 6);
    place(mH, m * 6);
    place(hH, hr * 30);

    if (rest) {
      var left = rest.end - Date.now();
      if (left <= 0) stopRest(true);
      else {
        ring.setAttribute("stroke-dashoffset", CIRC * (1 - left / rest.total));
        var secs = Math.ceil(left / 1000);
        digital.textContent =
          "REST " + Math.floor(secs / 60) + ":" + pad(secs % 60);
        digital.classList.add("resting");
        msg.textContent =
          secs <= 5 ? "Chalk up. Next set." : "Breathe. Recover.";
      }
    }

    if (d.getSeconds() !== lastSec) {
      lastSec = d.getSeconds();
      var h12 = d.getHours() % 12 || 12,
        ap = d.getHours() < 12 ? "AM" : "PM";
      svg.setAttribute(
        "aria-label",
        "Analog clock, " + h12 + ":" + pad(d.getMinutes()) + " " + ap,
      );
      if (!rest) {
        digital.textContent =
          h12 + ":" + pad(d.getMinutes()) + ":" + pad(lastSec) + " " + ap;
        msg.textContent = message(d.getHours());
      }
      if (lastSec === 0 && !reduce && !wrap.classList.contains("done")) {
        wrap.classList.remove("thud");
        void wrap.offsetWidth;
        wrap.classList.add("thud");
      }
    }
    reduce ? setTimeout(tick, 250) : requestAnimationFrame(tick);
  }
  tick();
})();

// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

updateTodayDate();
fetchUserProfile();
