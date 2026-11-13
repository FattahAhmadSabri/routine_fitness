const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const createPDFBuffer = async (data) => {
  const imagePath = path.join(__dirname, "../utils/nano-banana.png");
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  const imageSrc = `data:image/png;base64,${imageBase64}`;

  const html = `
  <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body {
          font-family: 'Roboto', Arial, sans-serif;
          margin: 0;
          padding: 40px;
          background-color: #f9f9f9;
        }
        .header {
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }
        .logo { width: 60px; height: 60px; }
        h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .info { margin-top: 20px; }
        .info p { margin: 4px 0; font-size: 16px; }
        h2 {
          color: #333;
          margin-top: 30px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th { background-color: #007bff; color: white; }
        td.value { font-weight: 600; }
        .bmi-low { color: #ff9800; }
        .bmi-normal { color: #4caf50; }
        .bmi-over { color: #2196f3; }
        .bmi-obese { color: #f44336; }
        
        /* Chart layout */
        .charts-row {
          display: flex;
          justify-content: flex-start; /* Align from the very left */
          align-items: flex-start;
          margin-top: 40px;
          flex-wrap: nowrap; /* Force them into a single row */
          gap: 40px; /* Adds spacing between charts */
          overflow-x: auto; /* Adds scroll if screen is too small */
        }
        .chart-box {
          width: 220px;
          height: 220px;
        }
        footer {
          margin-top: 40px;
          text-align: center;
          font-size: 13px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="${imageSrc}" alt="Fitness Logo" />
        <h1>BMI & BMR Fitness Report</h1>
      </div>

      <div class="info">
        <p><strong>Name:</strong> ${data.name || "N/A"}</p>
        <p><strong>Age:</strong> ${data.age}</p>
        <p><strong>Gender:</strong> ${data.gender}</p>
        <p><strong>Height:</strong> ${data.height} m</p>
        <p><strong>Weight:</strong> ${data.weight} kg</p>
      </div>

      <h2>Results</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Standard Range</th>
        </tr>
        <tr>
          <td>BMI</td>
          <td class="value ${
            data.bmIndex < 18.5
              ? "bmi-low"
              : data.bmIndex < 25
                ? "bmi-normal"
                : data.bmIndex < 30
                  ? "bmi-over"
                  : "bmi-obese"
          }">${data.bmIndex.toFixed(1)}</td>
          <td>18.5 - 24.9 (Normal)</td>
        </tr>
        <tr>
          <td>BMR</td>
          <td class="value">${data.bmr.toFixed(0)} cal/day</td>
          <td>Varies by age, gender & body size</td>
        </tr>
        <tr>
          <td>Body Fat %</td>
          <td class="value">${data.bfp.toFixed(1)}%</td>
          <td>${
            data.gender === "male"
              ? "10% - 20% (Healthy Male)"
              : "18% - 28% (Healthy Female)"
          }</td>
        </tr>
      </table>

      <h2>Visual Insights</h2>
      <div class="charts-row">
        <div class="chart-box"><canvas id="bodyChart"></canvas></div>
        <div class="chart-box"><canvas id="bmiChart"></canvas></div>
        <div class="chart-box"><canvas id="bmrChart"></canvas></div>
      </div>

      <h2>Health Advice</h2>
      <p>${data.advice || "Maintain a healthy lifestyle with balanced diet and exercise."}</p>
      <p style="margin-top: 20px; font-size: 14px; color: #555;">
        <strong>Note:</strong> This report is for informational purposes only and should not be considered as medical advice.
        Please consult with a qualified healthcare professional before making any health-related decisions.
      </p>

      <footer>
        Developed by <strong>Sabri Fas</strong>
      </footer>

      <script>
        // Chart 1: Body Composition (Pie)
        const ctx1 = document.getElementById('bodyChart').getContext('2d');
        new Chart(ctx1, {
          type: 'pie',
          data: {
            labels: ['Body Fat %', 'Lean Mass %'],
            datasets: [{
              data: [${data.bfp.toFixed(1)}, ${(100 - data.bfp).toFixed(1)}],
              backgroundColor: ['#f44336', '#4caf50']
            }]
          },
          options: {
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Body Composition' }
            }
          }
        });

        // Chart 2: BMI Bar Chart
        const ctx2 = document.getElementById('bmiChart').getContext('2d');
        new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: ['BMI'],
            datasets: [{
              label: 'Your BMI',
              data: [${data.bmIndex.toFixed(1)}],
              backgroundColor: '#2196f3'
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true, max: 40 }
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'BMI Value' }
            }
          }
        });

        // Chart 3: BMR Line Chart
        const ctx3 = document.getElementById('bmrChart').getContext('2d');
        new Chart(ctx3, {
          type: 'line',
          data: {
            labels: ['BMR'],
            datasets: [{
              label: 'Calories/day',
              data: [${data.bmr.toFixed(0)}],
              borderColor: '#ff9800',
              fill: false,
              tension: 0.3
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true }
            },
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'BMR Overview' }
            }
          }
        });
      </script>
    </body>
  </html>
`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });
  await browser.close();

  return pdfBuffer;
};

module.exports = { createPDFBuffer };
