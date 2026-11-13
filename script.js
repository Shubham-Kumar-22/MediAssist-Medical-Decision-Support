
const healthForm = document.getElementById("healthForm");
const result = document.getElementById("result");
const resultContent = document.getElementById("resultContent");

const newAssessment = document.getElementById("newAssessment");
const downloadReport = document.getElementById("downloadReport");
const clearHistory = document.getElementById("clearHistory");

const emergencySymptoms = [
    "breathing",
    "chest-pain",
    "confusion",
    "severe-headache"
];

const symptomNames = {
    fever: "Fever",
    cough: "Cough",
    headache: "Headache",
    fatigue: "Fatigue",
    nausea: "Nausea",
    "sore-throat": "Sore Throat",
    breathing: "Breathing Difficulty",
    "chest-pain": "Chest Pain",
    confusion: "Confusion",
    "severe-headache": "Sudden Severe Headache"
};

const STORAGE_KEY = "mediassist_demo_history";

function getHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const records = saved ? JSON.parse(saved) : [];

        return Array.isArray(records) ? records : [];
    } catch (error) {
        console.error("Unable to read history:", error);
        return [];
    }
}

function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return true;
    } catch (error) {
        alert("Unable to save history in this browser.");
        return false;
    }
}

// Dashboard statistics
function updateDashboard() {
    const history = getHistory();

    const total = history.length;

    const urgent = history.filter(
        record => record.urgent === true
    ).length;

    const symptoms = history.reduce(
        (sum, record) => sum + record.symptoms.length,
        0
    );

    document.getElementById("totalAssessments").textContent = total;
    document.getElementById("urgentAssessments").textContent = urgent;
    document.getElementById("totalSymptoms").textContent = symptoms;
}

// Display assessment history
function displayHistory() {
    const historyBody = document.getElementById("historyBody");
    const history = getHistory();

    historyBody.innerHTML = "";

    if (history.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-history">
                    No assessment history available.
                </td>
            </tr>
        `;

        updateDashboard();
        return;
    }

    history.slice().reverse().forEach(record => {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(record.date).toLocaleString();

        const symptomCell = document.createElement("td");
        symptomCell.textContent = record.symptoms
            .map(symptom => symptomNames[symptom] || "Unknown")
            .join(", ");

        const statusCell = document.createElement("td");
        statusCell.textContent = record.urgent
            ? "Urgent Warning"
            : "General Information";

        statusCell.className = record.urgent
            ? "status-urgent"
            : "status-general";

        row.append(dateCell, symptomCell, statusCell);
        historyBody.appendChild(row);
    });

    updateDashboard();
}

// Safe HTML text
function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// Submit assessment
healthForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("patientName").value.trim();
    const age = Number(document.getElementById("age").value);
    const duration = document.getElementById("duration").value;

    const additional = document.getElementById("additional").value.trim();

    const selectedSymptoms = Array.from(
        document.querySelectorAll(
            'input[name="symptoms"]:checked'
        )
    ).map(input => input.value);

    if (
        !name ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120 ||
        !duration
    ) {
        alert("Please enter valid patient information.");
        return;
    }

    if (selectedSymptoms.length === 0) {
        alert("Please select at least one symptom.");
        return;
    }

    const hasEmergencyWarning = selectedSymptoms.some(
        symptom => emergencySymptoms.includes(symptom)
    );

    const symptomList = selectedSymptoms.map(
        symptom => symptomNames[symptom]
    );

    const durationText = {
        today: "Started today",
        "few-days": "A few days",
        week: "About a week",
        long: "More than a week",
        unknown: "Not sure"
    };

    let guidance = "";

    if (hasEmergencyWarning) {
        guidance = `
            <div class="result-item urgent">
                <h3>⚠️ Urgent Medical Attention</h3>
                <p>
                    One or more selected symptoms can be associated
                    with serious medical conditions.
                    Seek immediate professional medical assessment.
                    For severe or sudden symptoms, contact local
                    emergency services.
                </p>
            </div>
        `;
    } else {
        guidance = `
            <div class="result-item">
                <h3>📋 General Health Guidance</h3>
                <p>
                    Your selected symptoms do not establish a diagnosis.
                    Consult a qualified healthcare professional,
                    especially if symptoms persist or worsen.
                </p>
            </div>
        `;
    }

    resultContent.innerHTML = `
        <div class="result-item">
            <h3>👤 Patient Details</h3>
            <p><strong>Name:</strong> ${escapeHTML(name)}</p>
            <p><strong>Age:</strong> ${age}</p>
            <p><strong>Duration:</strong> ${durationText[duration]}</p>
        </div>

        <div class="result-item">
            <h3>🩺 Selected Symptoms</h3>
            <ul>
                ${symptomList.map(item => `<li>${item}</li>`).join("")}
            </ul>
        </div>

        ${guidance}

        <div class="result-item">
            <h3>📝 Additional Information</h3>
            <p>${escapeHTML(additional || "No additional information provided.")}</p>
        </div>

        <div class="result-item">
            <h3>⚕️ Important Reminder</h3>
            <p>
                This is an educational symptom-information summary,
                not a medical diagnosis or treatment plan.
                Consult a qualified healthcare professional.
            </p>
        </div>
    `;

    // Save anonymous demo summary only
    const history = getHistory();

    history.push({
        date: new Date().toISOString(),
        symptoms: selectedSymptoms,
        urgent: hasEmergencyWarning
    });

    saveHistory(history);

    displayHistory();

    result.hidden = false;

    result.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Download / Print PDF report
downloadReport.addEventListener("click", function() {
    if (result.hidden) {
        alert("Please complete an assessment first.");
        return;
    }

    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
        alert("Please allow pop-ups to download your report.");
        return;
    }

    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>MediAssist Assessment Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 35px;
                    color: #24344d;
                    line-height: 1.6;
                }

                h1 { color: #1678d3; }

                .report-box {
                    border: 1px solid #dce5ef;
                    padding: 18px;
                    margin: 15px 0;
                    border-radius: 8px;
                }

                .urgent {
                    background: #fff1f0;
                    border-color: #e9b8b2;
                }

                p, li { font-size: 14px; }

                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>MediAssist</h1>
            <h2>Health Information Report</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>

            ${resultContent.innerHTML}

            <p>
                Educational use only. Not a medical diagnosis
                or treatment recommendation.
            </p>

            <button onclick="window.print()">Print / Save as PDF</button>
        </body>
        </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
});

// Clear history
clearHistory.addEventListener("click", function() {
    const confirmClear = confirm(
        "Are you sure you want to clear all demo history?"
    );

    if (!confirmClear) return;

    if (saveHistory([])) {
        displayHistory();
    }
});

// New assessment
newAssessment.addEventListener("click", function() {
    healthForm.reset();

    result.hidden = true;
    resultContent.innerHTML = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Hide old result when form is reset
healthForm.addEventListener("reset", function() {
    result.hidden = true;
    resultContent.innerHTML = "";
});

// Initial dashboard loading
displayHistory();
