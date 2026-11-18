const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ==========================================
// HELPERS
// ==========================================

// Escape HTML to prevent HTML injection
const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// BMI category (WHO adult classification) + advice
const getBMIAssessment = (bmi) => {
  if (bmi < 18.5) {
    return {
      category: "Underweight",
      color: "#3B82F6",
      explanation:
        "Your BMI is below the healthy range for adults. Gradual, nutrient-focused changes can help.",
      tips: [
        "Include nutrient-dense foods and adequate protein at every meal.",
        "Add strength training to build lean muscle.",
        "Consult a doctor or nutritionist if you experience fatigue or weakness.",
      ],
    };
  }
  if (bmi < 25) {
    return {
      category: "Normal",
      color: "#16A34A",
      explanation:
        "Your BMI is within the healthy range for adults. Keep up the habits that support it.",
      tips: [
        "Maintain balanced nutrition with plenty of whole foods.",
        "Stay physically active with a mix of cardio and strength work.",
        "Continue regular health checkups.",
      ],
    };
  }
  if (bmi < 30) {
    return {
      category: "Overweight",
      color: "#CA8A04",
      explanation:
        "Your BMI is above the healthy range. Small, consistent changes can move it in the right direction.",
      tips: [
        "Focus on balanced portions and whole foods.",
        "Combine regular cardio with strength training.",
        "Limit processed foods and sugary drinks.",
      ],
    };
  }
  if (bmi < 35) {
    return {
      category: "Obesity (Class I)",
      color: "#EA580C",
      explanation:
        "Your BMI falls in the Class I obesity range. Professional guidance is recommended.",
      tips: [
        "Consult a healthcare professional for a personal plan.",
        "Build sustainable nutrition and exercise habits.",
        "Monitor blood pressure and blood sugar as advised.",
      ],
    };
  }
  if (bmi < 40) {
    return {
      category: "Obesity (Class II)",
      color: "#DC2626",
      explanation:
        "Your BMI falls in the Class II obesity range. Medical guidance is strongly recommended.",
      tips: [
        "Consult a healthcare professional promptly.",
        "Follow a medically guided weight management plan.",
        "Schedule regular health monitoring.",
      ],
    };
  }
  return {
    category: "Obesity (Class III)",
    color: "#B91C1C",
    explanation:
      "Your BMI falls in the Class III obesity range. Please seek medical assessment.",
    tips: [
      "Seek medical guidance for a full assessment.",
      "Discuss suitable weight management options with your doctor.",
      "Follow a sustainable, supervised lifestyle plan.",
    ],
  };
};

// Body fat category (ACE reference ranges, by sex)
const getBFPAssessment = (bfp, gender) => {
  const g = String(gender || "")
    .trim()
    .toLowerCase();

  const isFemale = g.startsWith("f");
  const isMale = g.startsWith("m");

  if (!isFemale && !isMale) {
    return {
      label: "Varies by sex and age",
      reference: "Varies by sex and age",
    };
  }

  const limits = isFemale ? [14, 21, 25, 32] : [6, 14, 18, 25];
  const labels = [
    "Essential",
    "Athletic",
    "Fitness",
    "Average",
    "Above average",
  ];

  let label = labels[4];
  for (let i = 0; i < limits.length; i++) {
    if (bfp < limits[i]) {
      label = labels[i];
      break;
    }
  }

  return {
    label,
    reference: isFemale
      ? "Fitness to average: 21 – 31% (women)"
      : "Fitness to average: 14 – 24% (men)",
  };
};

// ==========================================
// MAIN
// ==========================================

const createPDFBuffer = async (data) => {
  // ---------- Validate report data ----------
  if (!data) {
    throw new Error("BMI report data is missing.");
  }

  const bmi = Number(data.bmIndex);
  const bmr = Number(data.bmr);
  const bfp = Number(data.bfp);

  if (![bmi, bmr, bfp].every(Number.isFinite)) {
    throw new Error("Invalid BMI report data.");
  }

  if (bmi <= 0 || bmr <= 0) {
    throw new Error("Invalid BMI or BMR value.");
  }

  if (bfp < 0 || bfp > 100) {
    throw new Error("Invalid body fat percentage.");
  }

  // ---------- Logo (optional: falls back to a text mark) ----------
  let logoHTML = `<div class="logo-fallback">R</div>`;

  try {
    const imagePath = path.join(__dirname, "../utils/Routine.png");

    if (fs.existsSync(imagePath)) {
      const imageBase64 = fs.readFileSync(imagePath, "base64");
      logoHTML = `<img class="logo" src="data:image/png;base64,${imageBase64}" alt="Routine logo" />`;
    }
  } catch (error) {
    console.error("Logo load error:", error.message);
  }

  // ---------- Personal information ----------
  const name = escapeHTML(data.name || "N/A");
  const age =
    data.age != null && data.age !== "" ? `${escapeHTML(data.age)} yrs` : "N/A";
  const gender = escapeHTML(data.gender || "N/A");

  const rawHeight = Number(data.height);
  const heightM =
    Number.isFinite(rawHeight) && rawHeight > 0
      ? rawHeight > 3
        ? rawHeight / 100
        : rawHeight
      : null;

  const rawWeight = Number(data.weight);
  const weightKg =
    Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : null;

  const heightText = heightM ? `${heightM.toFixed(2)} m` : "N/A";
  const weightText = weightKg ? `${weightKg.toFixed(1)} kg` : "N/A";

  const reportDateObj = data.createdAt ? new Date(data.createdAt) : new Date();
  const safeDate = Number.isNaN(reportDateObj.getTime())
    ? new Date()
    : reportDateObj;

  const reportDate = safeDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const generatedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  // ---------- Report ID (stable for the same record) ----------
  const ymd = safeDate.toISOString().slice(0, 10).replace(/-/g, "");
  const hash = crypto
    .createHash("sha1")
    .update(
      [
        data.id ?? "",
        data.name ?? "",
        safeDate.toISOString(),
        bmi,
        bmr,
        bfp,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  const reportId = `RT-${ymd}-${hash}`;

  // ---------- Assessments ----------
  const { category, color, explanation, tips } = getBMIAssessment(bmi);
  const bfpAssessment = getBFPAssessment(bfp, data.gender);

  // BMI scale marker (scale runs from BMI 15 to 40)
  const markerPos = clamp(((bmi - 15) / 25) * 100, 0, 100);

  // Healthy weight range for this height (BMI 18.5 - 24.9)
  let healthyRangeText = "N/A";
  let healthyRangeNote = "Height not available";

  if (heightM) {
    const low = 18.5 * heightM * heightM;
    const high = 24.9 * heightM * heightM;

    healthyRangeText = `${low.toFixed(1)} – ${high.toFixed(1)} kg`;

    if (weightKg) {
      if (weightKg > high) {
        healthyRangeNote = `${(weightKg - high).toFixed(1)} kg above range`;
      } else if (weightKg < low) {
        healthyRangeNote = `${(low - weightKg).toFixed(1)} kg below range`;
      } else {
        healthyRangeNote = "Current weight is within range";
      }
    } else {
      healthyRangeNote = "For a BMI of 18.5 – 24.9";
    }
  }

  // Body composition estimate
  const fatKg = weightKg ? (weightKg * bfp) / 100 : null;
  const leanKg = weightKg ? weightKg - fatKg : null;
  const leanPct = 100 - bfp;

  // ---------- HTML ----------
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Routine Health Report ${escapeHTML(reportId)}</title>
  <style>
    @page { size: A4; margin: 0; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 210mm;
      height: 296mm;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10px;
      color: #1F2937;
      line-height: 1.4;
    }

    .page {
      position: relative;
      width: 210mm;
      height: 296mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ---------- Header ---------- */
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 9mm 12mm 7mm;
      background: #064E3B;
      color: #ffffff;
      border-bottom: 3px solid #84CC16;
    }
    .logo, .logo-fallback {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      background: #ffffff;
      object-fit: contain;
      padding: 4px;
    }
    .logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      color: #064E3B;
    }
    .brand h1 { font-size: 22px; letter-spacing: 1px; font-weight: 800; }
    .brand p  { font-size: 10px; color: #BEF264; margin-top: 2px; letter-spacing: 0.4px; }
    .meta { margin-left: auto; text-align: right; font-size: 9px; color: #D1FAE5; line-height: 1.7; }
    .meta strong { color: #ffffff; font-weight: 700; }
    .doc-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 2px;
    }

    /* ---------- Content ---------- */
    .content {
      flex: 1;
      padding: 7mm 12mm 0;
      display: flex;
      flex-direction: column;
      gap: 5mm;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #064E3B;
      margin-bottom: 6px;
    }
    .section-title::before {
      content: "";
      width: 3px;
      height: 11px;
      background: #84CC16;
      border-radius: 2px;
    }

    /* ---------- Patient strip ---------- */
    .patient {
      display: grid;
      grid-template-columns: 1.6fr 0.8fr 0.9fr 0.9fr 0.9fr;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: #F8FAFC;
    }
    .patient > div { padding: 9px 12px; border-right: 1px solid #E5E7EB; }
    .patient > div:last-child { border-right: 0; }
    .label {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.9px;
      text-transform: uppercase;
      color: #6B7280;
    }
    .value { font-size: 12px; font-weight: 700; color: #111827; margin-top: 3px; }

    /* ---------- KPI cards ---------- */
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .kpi {
      border: 1px solid #E5E7EB;
      border-top: 3px solid var(--accent, #84CC16);
      border-radius: 8px;
      padding: 10px 11px 9px;
      background: #ffffff;
    }
    .kpi .num { font-size: 23px; font-weight: 800; color: #064E3B; margin-top: 5px; line-height: 1.1; }
    .kpi .num small { font-size: 9px; font-weight: 600; color: #6B7280; margin-left: 3px; }
    .pill {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 8px;
      font-weight: 700;
      color: #ffffff;
      background: var(--accent, #16A34A);
    }
    .kpi .ref { margin-top: 6px; font-size: 8px; color: #6B7280; line-height: 1.4; }

    /* ---------- Visual panels ---------- */
    .visuals { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
    .panel { border: 1px solid #E5E7EB; border-radius: 8px; padding: 11px 13px; }

    .bmi-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
    .bmi-big { font-size: 30px; font-weight: 800; color: #064E3B; line-height: 1; }

    .scale { position: relative; display: flex; height: 11px; border-radius: 6px; overflow: hidden; }
    .scale span { height: 100%; }
    .marker-wrap { position: relative; height: 0; }
    .marker {
      position: absolute;
      top: -20px;
      width: 0;
      height: 0;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 9px solid #111827;
    }
    .marker-line {
      position: absolute;
      top: -11px;
      width: 2px;
      height: 11px;
      margin-left: -1px;
      background: #111827;
    }
    .scale-labels { display: flex; margin-top: 5px; font-size: 7.5px; color: #4B5563; font-weight: 600; }
    .scale-labels span { text-align: center; }
    .ticks { position: relative; height: 10px; margin-top: 2px; font-size: 7.5px; color: #9CA3AF; }
    .ticks span { position: absolute; transform: translateX(-50%); }

    .healthy {
      margin-top: 10px;
      padding: 8px 10px;
      background: #F0FDF4;
      border-radius: 6px;
      border-left: 3px solid #84CC16;
      font-size: 9px;
      color: #374151;
    }
    .healthy strong { color: #064E3B; font-size: 11px; }

    .comp { display: flex; align-items: center; gap: 12px; }
    .legend { flex: 1; font-size: 9px; }
    .legend-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid #F3F4F6; }
    .legend-row:last-child { border-bottom: 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
    .legend-row b { margin-left: auto; font-size: 10px; color: #111827; }
    .legend-sub { font-size: 7.5px; color: #6B7280; }

    /* ---------- Recommendations ---------- */
    .advice {
      border: 1px solid #E5E7EB;
      border-left: 4px solid #84CC16;
      border-radius: 8px;
      padding: 11px 14px 12px;
      background: #FAFEF5;
    }
    .advice h3 { font-size: 13px; color: #064E3B; }
    .advice p { font-size: 9.5px; color: #4B5563; margin: 3px 0 9px; }
    .tips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .tip {
      display: flex;
      gap: 7px;
      align-items: flex-start;
      background: #ffffff;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 8px 9px;
      font-size: 9px;
      color: #374151;
    }
    .tip i {
      flex: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #064E3B;
      color: #ffffff;
      font-style: normal;
      font-size: 8.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ---------- Notes ---------- */
    .notes { font-size: 8px; color: #6B7280; line-height: 1.6; }
    .notes strong { color: #374151; }

    /* ---------- Footer ---------- */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0 12mm;
      padding: 3mm 0 6mm;
      border-top: 1px solid #E5E7EB;
      font-size: 8px;
      color: #6B7280;
    }
    .footer strong { color: #064E3B; }
  </style>
</head>

<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      ${logoHTML}
      <div class="brand">
        <h1>ROUTINE</h1>
        <p>For Health Lovers</p>
      </div>
      <div class="meta">
        <div class="doc-title">Health Assessment Report</div>
        Report ID: <strong>${escapeHTML(reportId)}</strong><br />
        Assessment date: <strong>${escapeHTML(reportDate)}</strong>
      </div>
    </div>

    <div class="content">

      <!-- Patient information -->
      <div>
        <div class="section-title">Personal Information</div>
        <div class="patient">
          <div><div class="label">Name</div><div class="value">${name}</div></div>
          <div><div class="label">Age</div><div class="value">${age}</div></div>
          <div><div class="label">Gender</div><div class="value">${gender}</div></div>
          <div><div class="label">Height</div><div class="value">${escapeHTML(heightText)}</div></div>
          <div><div class="label">Weight</div><div class="value">${escapeHTML(weightText)}</div></div>
        </div>
      </div>

      <!-- Key results -->
      <div>
        <div class="section-title">Key Results</div>
        <div class="kpis">

          <div class="kpi" style="--accent:${color}">
            <div class="label">Body Mass Index</div>
            <div class="num">${bmi.toFixed(1)}<small>kg/m²</small></div>
            <span class="pill">${escapeHTML(category)}</span>
            <div class="ref">Healthy range: 18.5 – 24.9</div>
          </div>

          <div class="kpi" style="--accent:#064E3B">
            <div class="label">Basal Metabolic Rate</div>
            <div class="num">${bmr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<small>kcal/day</small></div>
            <span class="pill" style="--accent:#064E3B">Energy at rest</span>
            <div class="ref">Varies by age, sex and body size</div>
          </div>

          <div class="kpi" style="--accent:#84CC16">
            <div class="label">Body Fat</div>
            <div class="num">${bfp.toFixed(1)}<small>%</small></div>
            <span class="pill" style="--accent:#65A30D">${escapeHTML(bfpAssessment.label)}</span>
            <div class="ref">${escapeHTML(bfpAssessment.reference)}</div>
          </div>

          <div class="kpi" style="--accent:#0EA5E9">
            <div class="label">Healthy Weight Range</div>
            <div class="num" style="font-size:16px;padding-top:4px">${escapeHTML(healthyRangeText)}</div>
            <span class="pill" style="--accent:#0EA5E9">For your height</span>
            <div class="ref">${escapeHTML(healthyRangeNote)}</div>
          </div>

        </div>
      </div>

      <!-- Visual insights -->
      <div>
        <div class="section-title">Visual Health Insights</div>
        <div class="visuals">

          <!-- BMI scale -->
          <div class="panel">
            <div class="label">BMI classification</div>
            <div class="bmi-head" style="margin-top:6px">
              <div class="bmi-big">${bmi.toFixed(1)}</div>
              <span class="pill" style="--accent:${color};margin-top:0">${escapeHTML(category)}</span>
            </div>

            <div class="scale">
              <span style="width:14%;background:#60A5FA"></span>
              <span style="width:26%;background:#22C55E"></span>
              <span style="width:20%;background:#FACC15"></span>
              <span style="width:20%;background:#FB923C"></span>
              <span style="width:20%;background:#EF4444"></span>
            </div>
            <div class="marker-wrap">
              <div class="marker" style="left:${markerPos.toFixed(1)}%"></div>
            </div>
            <div class="scale-labels" style="margin-top:7px">
              <span style="width:14%">Under</span>
              <span style="width:26%">Normal</span>
              <span style="width:20%">Overweight</span>
              <span style="width:20%">Obese I</span>
              <span style="width:20%">Obese II+</span>
            </div>
            <div class="ticks">
              <span style="left:14%">18.5</span>
              <span style="left:40%">25</span>
              <span style="left:60%">30</span>
              <span style="left:80%">35</span>
            </div>

            <div class="healthy">
              Healthy weight for your height:
              <strong>${escapeHTML(healthyRangeText)}</strong><br />
              ${escapeHTML(healthyRangeNote)}
            </div>
          </div>

          <!-- Body composition -->
          <div class="panel">
            <div class="label" style="margin-bottom:8px">Estimated body composition</div>
            <div class="comp">
              <svg viewBox="0 0 36 36" width="104" height="104">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#064E3B" stroke-width="5" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#84CC16" stroke-width="5"
                  stroke-dasharray="${bfp.toFixed(2)} ${(100 - bfp).toFixed(2)}"
                  transform="rotate(-90 18 18)" />
                <text x="18" y="18" text-anchor="middle" font-size="6" font-weight="700" fill="#064E3B">${bfp.toFixed(1)}%</text>
                <text x="18" y="22.5" text-anchor="middle" font-size="2.6" fill="#6B7280">BODY FAT</text>
              </svg>

              <div class="legend">
                <div class="legend-row">
                  <span class="dot" style="background:#84CC16"></span>
                  <div>Body fat<div class="legend-sub">${fatKg !== null ? fatKg.toFixed(1) + " kg" : "Weight not available"}</div></div>
                  <b>${bfp.toFixed(1)}%</b>
                </div>
                <div class="legend-row">
                  <span class="dot" style="background:#064E3B"></span>
                  <div>Lean mass<div class="legend-sub">${leanKg !== null ? leanKg.toFixed(1) + " kg" : "Weight not available"}</div></div>
                  <b>${leanPct.toFixed(1)}%</b>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Recommendations -->
      <div class="advice">
        <div class="section-title" style="margin-bottom:4px">Assessment &amp; Recommendations</div>
        <h3>${escapeHTML(category)}</h3>
        <p>${escapeHTML(explanation)}</p>
        <div class="tips">
          ${tips
            .map(
              (tip, index) =>
                `<div class="tip"><i>${index + 1}</i><span>${escapeHTML(tip)}</span></div>`,
            )
            .join("")}
        </div>
      </div>

      <!-- Notes -->
      <div class="notes">
        <strong>Method &amp; notes.</strong>
        BMI = weight (kg) ÷ height (m)², classified using the WHO adult categories.
        BMR and body fat percentage are estimates. Body fat categories use ACE reference ranges
        and depend on sex and age. <strong>Disclaimer:</strong> this report is for informational
        purposes only and is not a medical diagnosis. BMI and estimated body fat are screening
        measures and should be interpreted in context. Consult a qualified healthcare professional
        before making major dietary or exercise changes.
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <span>Developed by <strong>Fattah Sabri</strong> | Powered by <strong>Routine</strong></span>
      <span>Generated ${escapeHTML(generatedAt)} IST · ${escapeHTML(reportId)} · Page 1 of 1</span>
    </div>

  </div>
</body>
</html>
`;

  // ---------- Generate PDF ----------
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Capture browser errors
    page.on("pageerror", (error) => {
      console.error("PDF page error:", error);
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    await page.emulateMediaType("print");

    // Single A4 page: margins are handled inside the layout
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      pageRanges: "1",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

module.exports = {
  createPDFBuffer,
};
