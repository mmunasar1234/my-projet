/* Student Registration & Fee System
 * - Vanilla JS + Firebase Firestore (Compat Mode)
 */

"use strict";

// db is global from firebase-config.js

// -------------------- DOM --------------------
const form = document.getElementById("studentForm");
const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const courseName = document.getElementById("courseName");
const feeAmount = document.getElementById("feeAmount");
const paidAmount = document.getElementById("paidAmount");

const messageBox = document.getElementById("messageBox");

const tbody = document.getElementById("studentsTbody");
const emptyState = document.getElementById("emptyState");

const totalStudentsEl = document.getElementById("totalStudents");
const totalFeeEl = document.getElementById("totalFee");
const totalPaidEl = document.getElementById("totalPaid");
const totalRemainingEl = document.getElementById("totalRemaining");

const searchInput = document.getElementById("searchInput");

const btnClear = document.getElementById("btnClear");


// -------------------- UI INIT --------------------
// Initial Loading State
tbody.innerHTML = `<tr><td colspan="10" class="center muted" style="padding: 20px;">Connecting to Database...</td></tr>`;

// -------------------- DATA --------------------
let students = []; // local cache from Firestore

// -------------------- FIRESTORE LISTENER --------------------
if (typeof db !== 'undefined') {
    // Listen for real-time updates
    db.collection("students").orderBy("date", "desc").onSnapshot((snapshot) => {
        students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        applyFilterAndRender();
        renderStats();
    }, (error) => {
        console.error("Error getting documents: ", error);
        showMessage("err", "Error loading data. Check console (Rules?).");
        tbody.innerHTML = `<tr><td colspan="10" class="center muted error">Connection Error.</td></tr>`;
    });
} else {
    console.error("DB Not Initialized");
    showMessage("err", "Firebase DB not connected.");
}

// -------------------- HELPERS --------------------
function money(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "$0.00";
    return "$" + num.toFixed(2);
}

function safeTrim(v) {
    return String(v ?? "").trim();
}

function todayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function showMessage(type, text) {
    messageBox.className = "message";
    if (type === "ok") messageBox.classList.add("ok");
    if (type === "err") messageBox.classList.add("err");
    messageBox.textContent = text;
    messageBox.style.display = "block";

    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => {
        messageBox.style.display = "none";
    }, 4000);
}

function badgeForAgreement(val) {
    if (val === "Full Payment") return `<span class="badge full">Full</span>`;
    if (val === "Installment") return `<span class="badge inst">Installment</span>`;
    if (val === "Scholarship") return `<span class="badge scho">Scholarship</span>`;
    if (val === "Not Paid") return `<span class="badge warn">Not Paid</span>`;
    return `<span class="badge">${val}</span>`;
}

function parsePositiveNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
}

function isValidName(name) {
    return /^[A-Za-z\s]+$/.test(name);
}

// -------------------- VALIDATION --------------------
function validateForm() {
    const name = safeTrim(studentName.value);
    const sid = safeTrim(studentId.value);
    const course = safeTrim(courseName.value);

    const fee = parsePositiveNumber(feeAmount.value);
    const paid = parsePositiveNumber(paidAmount.value);

    // Auto-calculate Agreement
    let autoAgreement = "Pending";
    if (fee === 0) {
        autoAgreement = "Scholarship";
    } else if (paid >= fee) {
        autoAgreement = "Full Payment";
    } else if (paid === 0) {
        autoAgreement = "Not Paid";
    } else {
        autoAgreement = "Installment";
    }

    if (!name || !sid || !course) {
        return { ok: false, msg: "Please fill all fields (Name, ID, Course)." };
    }

    if (!isValidName(name)) {
        return { ok: false, msg: "Student name must contain letters and spaces only." };
    }

    if (!Number.isFinite(fee) || fee < 0) {
        return { ok: false, msg: "Fee must be a valid number (0 or more)." };
    }

    if (!Number.isFinite(paid) || paid < 0) {
        return { ok: false, msg: "Paid must be a valid number (0 or more)." };
    }

    if (paid > fee) {
        return { ok: false, msg: "Paid amount cannot exceed Fee amount." };
    }

    // Unique ID check
    const exists = students.some(s => s.studentId.toLowerCase() === sid.toLowerCase());
    if (exists) {
        return { ok: false, msg: "Student ID already exists. Use a unique ID." };
    }

    return {
        ok: true,
        data: {
            studentName: name,
            studentId: sid,
            courseName: course,
            fee,
            paid,
            remaining: fee - paid,
            agreement: autoAgreement,
            date: todayString(),
            timestamp: new Date()
        }
    };
}

// -------------------- RENDER --------------------
function renderTable(list) {
    tbody.innerHTML = "";

    if (!list.length) {
        emptyState.style.display = "block";
        return;
    }
    emptyState.style.display = "none";

    list.forEach((s, idx) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(s.studentName)}</td>
      <td>${escapeHtml(s.studentId)}</td>
      <td>${escapeHtml(s.courseName)}</td>
      <td class="right">${money(s.fee)}</td>
      <td class="right">${money(s.paid)}</td>
      <td class="right">${money(s.remaining)}</td>
      <td>${badgeForAgreement(s.agreement)}</td>
      <td>${escapeHtml(s.date)}</td>

    `;

        tbody.appendChild(tr);
    });
}

function renderStats() {
    const totalStudents = students.length;
    const totalFee = students.reduce((sum, s) => sum + s.fee, 0);
    const totalPaid = students.reduce((sum, s) => sum + s.paid, 0);
    const totalRemaining = students.reduce((sum, s) => sum + s.remaining, 0);

    totalStudentsEl.textContent = String(totalStudents);
    totalFeeEl.textContent = money(totalFee);
    totalPaidEl.textContent = money(totalPaid);
    totalRemainingEl.textContent = money(totalRemaining);
}

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// -------------------- ACTIONS --------------------
async function addStudent(studentObj) {
    try {
        await db.collection("students").add(studentObj);
        showMessage("ok", "Student added to Firebase ✅");
        clearForm();
    } catch (e) {
        console.error("Error adding document: ", e);
        showMessage("err", "Error adding student. Check permissions.");
    }
}



function clearForm() {
    form.reset();
    studentName.focus();
}



// -------------------- SEARCH --------------------
function applyFilterAndRender() {
    const q = safeTrim(searchInput.value).toLowerCase();

    if (!q) {
        renderTable(students);
        return;
    }

    const filtered = students.filter(s => {
        return (
            s.studentName.toLowerCase().includes(q) ||
            s.studentId.toLowerCase().includes(q) ||
            s.courseName.toLowerCase().includes(q) ||
            (s.agreement && s.agreement.toLowerCase().includes(q))
        );
    });

    renderTable(filtered);
}

// -------------------- EVENTS --------------------
studentName.addEventListener("input", (e) => {
    const val = e.target.value;
    if (/\d/.test(val)) {
        e.target.value = val.replace(/\d/g, "");
        showMessage("err", "Digits are not allowed in Name!");
    }
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const result = validateForm();
    if (!result.ok) {
        showMessage("err", result.msg);
        return;
    }

    addStudent(result.data);
});

btnClear.addEventListener("click", () => {
    clearForm();
    showMessage("ok", "Form cleared.");
});



searchInput.addEventListener("input", () => {
    applyFilterAndRender();
});
