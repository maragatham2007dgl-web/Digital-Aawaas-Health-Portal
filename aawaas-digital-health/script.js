const STORAGE_KEY = "aawaasPatients";
let patients = [];

const $ = (id) => document.getElementById(id);

function loadData() {
    try {
        patients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        if (!Array.isArray(patients)) patients = [];
    } catch {
        patients = [];
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function nextId() {
    if (!patients.length) return 1;
    return Math.max(...patients.map(p => Number(p.id) || 0)) + 1;
}

function showMessage(text, type = "success") {
    $("message").textContent = text;
    $("message").className = `message ${type}`;
    setTimeout(() => {
        $("message").textContent = "";
        $("message").className = "message";
    }, 3500);
}

function getFormData() {
    return {
        name: $("name").value.trim(),
        age: Number($("age").value),
        gender: $("gender").value,
        homeState: $("homeState").value.trim(),
        preferredLanguage: $("preferredLanguage").value,
        workerIdCardNumber: $("workerIdCardNumber").value.trim(),
        emergencyContact: $("emergencyContact").value.trim(),
        medicalHistory: $("medicalHistory").value.trim()
    };
}

function validatePatient(p) {
    if (!p.name || !p.age || p.age < 1 || p.age > 120 ||
        !p.gender || !p.homeState || !p.workerIdCardNumber ||
        !p.emergencyContact) {
        showMessage("Please fill all required fields.", "error");
        return false;
    }
    return true;
}

function resetForm() {
    $("patientForm").reset();
    $("editId").value = "";
    $("saveBtn").innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Patient';
}

function submitPatient(event) {
    event.preventDefault();

    const patient = getFormData();
    if (!validatePatient(patient)) return;

    const editId = $("editId").value;

    if (editId) {
        const index = patients.findIndex(p => String(p.id) === String(editId));
        if (index !== -1) {
            patients[index] = {
                ...patients[index],
                ...patient,
                updatedAt: new Date().toISOString()
            };
            showMessage("Patient record updated successfully.");
        }
    } else {
        patients.push({
            id: nextId(),
            ...patient,
            createdAt: new Date().toISOString()
        });
        showMessage("Patient saved successfully.");
    }

    saveData();
    resetForm();
    renderPatients();
    populateQrPatients();
}

function renderPatients() {
    const tbody = $("patientTable");
    const search = $("searchInput").value.trim().toLowerCase();

    const filtered = patients.filter(p =>
        [
            p.name, p.homeState, p.preferredLanguage,
            p.workerIdCardNumber, p.emergencyContact, p.gender
        ].some(value => String(value ?? "").toLowerCase().includes(search))
    );

    tbody.innerHTML = "";

    $("recordCount").textContent =
        `${patients.length} record${patients.length === 1 ? "" : "s"}`;

    $("emptyState").style.display = filtered.length ? "none" : "block";

    filtered.forEach(patient => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHtml(patient.id)}</td>
            <td><strong>${escapeHtml(patient.name)}</strong></td>
            <td>${escapeHtml(patient.age)}</td>
            <td>${escapeHtml(patient.gender)}</td>
            <td>${escapeHtml(patient.homeState)}</td>
            <td>${escapeHtml(patient.preferredLanguage)}</td>
            <td>${escapeHtml(patient.workerIdCardNumber)}</td>
            <td>${escapeHtml(patient.emergencyContact)}</td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn qr-row-btn" title="Generate QR"
                            onclick="selectPatientForQr(${Number(patient.id)})">
                        <i class="fa-solid fa-qrcode"></i>
                    </button>
                    <button class="icon-btn edit-btn" title="Edit"
                            onclick="editPatient(${Number(patient.id)})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delete-btn" title="Delete"
                            onclick="deletePatient(${Number(patient.id)})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function editPatient(id) {
    const patient = patients.find(p => Number(p.id) === Number(id));
    if (!patient) return;

    $("editId").value = patient.id;
    $("name").value = patient.name || "";
    $("age").value = patient.age || "";
    $("gender").value = patient.gender || "";
    $("homeState").value = patient.homeState || "";
    $("preferredLanguage").value = patient.preferredLanguage || "Malayalam";
    $("workerIdCardNumber").value = patient.workerIdCardNumber || "";
    $("emergencyContact").value = patient.emergencyContact || "";
    $("medicalHistory").value = patient.medicalHistory || "";

    $("saveBtn").innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Update Patient';

    $("registerTitle").textContent = "Edit Migrant Worker";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deletePatient(id) {
    const patient = patients.find(p => Number(p.id) === Number(id));
    if (!patient) return;

    if (!confirm(`Delete the record for ${patient.name}?`)) return;

    patients = patients.filter(p => Number(p.id) !== Number(id));
    saveData();
    renderPatients();
    populateQrPatients();
    $("qrCard").classList.add("hidden");
    showMessage("Patient record deleted.");
}

function populateQrPatients() {
    const select = $("qrPatient");
    const current = select.value;

    select.innerHTML = '<option value="">Select Patient</option>';

    patients.forEach(patient => {
        const option = document.createElement("option");
        option.value = patient.id;
        option.textContent = `${patient.name} - ${patient.workerIdCardNumber}`;
        select.appendChild(option);
    });

    if (patients.some(p => String(p.id) === String(current))) {
        select.value = current;
    }
}

function selectPatientForQr(id) {
    $("qrPatient").value = String(id);
    generateQr();
    $("qrCard").scrollIntoView({ behavior: "smooth", block: "center" });
}

function generateQr() {
    const id = $("qrPatient").value;
    const patient = patients.find(p => String(p.id) === String(id));

    if (!patient) {
        showMessage("Please select a patient first.", "error");
        return;
    }

    $("qrcode").innerHTML = "";

    const qrData = JSON.stringify({
        app: "Aawaas Digital Health Portal",
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        homeState: patient.homeState,
        preferredLanguage: patient.preferredLanguage,
        workerIdCardNumber: patient.workerIdCardNumber,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory
    });

    new QRCode($("qrcode"), {
        text: qrData,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.M
    });

    $("qrName").textContent = patient.name;
    $("qrId").textContent = patient.id;
    $("qrWorkerId").textContent = patient.workerIdCardNumber;
    $("qrState").textContent = patient.homeState;
    $("qrLanguage").textContent = patient.preferredLanguage;
    $("qrEmergency").textContent = patient.emergencyContact;

    $("qrCard").classList.remove("hidden");
}

function exportData() {
    if (!patients.length) {
        showMessage("There are no records to export.", "error");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(patients, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aawaas-patient-records.json";
    a.click();
    URL.revokeObjectURL(url);

    showMessage("Patient records exported.");
}

function changeLanguage() {
    const language = $("languageSelect").value;

    const translations = {
        en: {
            title: "Aawaas Digital Health Portal",
            subtitle: "Digital Healthcare Platform for Migrant Workers in Kerala",
            register: "Register Migrant Worker"
        },
        ml: {
            title: "ആവാസ് ഡിജിറ്റൽ ഹെൽത്ത് പോർട്ടൽ",
            subtitle: "കേരളത്തിലെ കുടിയേറ്റ തൊഴിലാളികൾക്കായുള്ള ഡിജിറ്റൽ ആരോഗ്യ പ്ലാറ്റ്ഫോം",
            register: "കുടിയേറ്റ തൊഴിലാളിയെ രജിസ്റ്റർ ചെയ്യുക"
        },
        hi: {
            title: "आवास डिजिटल हेल्थ पोर्टल",
            subtitle: "केरल में प्रवासी श्रमिकों के लिए डिजिटल स्वास्थ्य मंच",
            register: "प्रवासी श्रमिक पंजीकरण"
        },
        bn: {
            title: "আবাস ডিজিটাল হেলথ পোর্টাল",
            subtitle: "কেরালায় অভিবাসী শ্রমিকদের জন্য ডিজিটাল স্বাস্থ্য প্ল্যাটফর্ম",
            register: "অভিবাসী শ্রমিক নিবন্ধন"
        },
        ta: {
            title: "ஆவாஸ் டிஜிட்டல் ஹெல்த் போர்டல்",
            subtitle: "கேரளாவில் புலம்பெயர் தொழிலாளர்களுக்கான டிஜிட்டல் சுகாதார தளம்",
            register: "புலம்பெயர் தொழிலாளர் பதிவு"
        }
    };

    const selected = translations[language] || translations.en;

    document.querySelector(".brand h1").textContent = selected.title;
    document.querySelector(".brand p").textContent = selected.subtitle;

    if (!$("editId").value) {
        $("registerTitle").textContent = selected.register;
    }
}

function clearAllRecords() {
    if (!patients.length) return;

    if (!confirm("Delete all saved patient records from this browser?")) return;

    patients = [];
    saveData();
    renderPatients();
    populateQrPatients();
    $("qrCard").classList.add("hidden");
    showMessage("All local patient records were cleared.");
}

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    renderPatients();
    populateQrPatients();

    $("patientForm").addEventListener("submit", submitPatient);
    $("clearBtn").addEventListener("click", () => {
        resetForm();
        $("registerTitle").textContent = "Register Migrant Worker";
        $("message").textContent = "";
        $("message").className = "message";
    });
    $("refreshBtn").addEventListener("click", () => {
        loadData();
        renderPatients();
        populateQrPatients();
        showMessage("Records refreshed.");
    });
    $("searchInput").addEventListener("input", renderPatients);
    $("exportBtn").addEventListener("click", exportData);
    $("generateQrBtn").addEventListener("click", generateQr);
    $("printQrBtn").addEventListener("click", () => {
        if ($("qrCard").classList.contains("hidden")) {
            showMessage("Generate a QR card first.", "error");
            return;
        }
        window.print();
    });
    $("languageSelect").addEventListener("change", changeLanguage);
});
