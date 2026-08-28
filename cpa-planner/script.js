/* ============================================================
   CPA Planner — Phase 1: Data & Rendering
   ============================================================
   This file contains:
   1. Completed course data (academicHistory)
   2. Planned course data structure (semesterPlan)
   3. Grouping utility
   4. Dynamic rendering functions
   5. UI initialisation
   ============================================================ */

// ------------------------------------------------------------------
// 1. ACADEMIC HISTORY — Completed Courses
//    Total completed credits: 61
// ------------------------------------------------------------------

const academicHistory = [
  // ---- Semester 20241 — 14 credits (4 courses) ----
  { semester: "20241", code: "MI1141E", name: "Đại số",                credits: 4, grade: "B"  },
  { semester: "20241", code: "MI1111E", name: "Giải tích I",           credits: 4, grade: "B+" },
  { semester: "20241", code: "IT1110E", name: "Nhập môn lập trình",    credits: 4, grade: "B+" },
  { semester: "20241", code: "EM1170",  name: "Pháp luật đại cương",   credits: 2, grade: "B"  },

  // ---- Semester 20242 — 17 credits (6 courses) ----
  { semester: "20242", code: "SSH1111", name: "Triết học Mác - Lênin",                credits: 3, grade: "B+" },
  { semester: "20242", code: "M12020E", name: "Probability and Statistics",           credits: 2, grade: "C"  },
  { semester: "20242", code: "MI1201E", name: "Giải tích II",                         credits: 3, grade: "B"  },
  { semester: "20242", code: "IT3052E", name: "Tối ưu hóa",                           credits: 3, grade: "C"  },
  { semester: "20242", code: "IT3020E", name: "Discrete Math",                        credits: 3, grade: "B"  },
  { semester: "20242", code: "IT3010E", name: "Cấu trúc dữ liệu và giải thuật",      credits: 3, grade: "B"  },

  // ---- Semester 20251 — 17 credits (6 courses) ----
  { semester: "20251", code: "SSH1121", name: "Kinh tế chính trị Mác - Lênin",        credits: 2, grade: "B+" },
  { semester: "20251", code: "PH1120E", name: "Vật lý đại cương II",                  credits: 3, grade: "B"  },
  { semester: "20251", code: "MI1131E", name: "Giải tích III",                        credits: 3, grade: "B"  },
  { semester: "20251", code: "IT3100E", name: "Object-oriented Programming",          credits: 3, grade: "C+" },
  { semester: "20251", code: "IT3030E", name: "Kiến trúc máy tính",                   credits: 3, grade: "C"  },
  { semester: "20251", code: "IT2030",  name: "Technical Writing and Presentation",   credits: 3, grade: "A"  },

  // ---- Semester 20252 — 13 credits (5 courses) ----
  { semester: "20252", code: "IT3090E", name: "Cơ sở dữ liệu",                                credits: 3, grade: "B+" },
  { semester: "20252", code: "IT2022E", name: "Thống kê ứng dụng và phân tích thực nghiệm",    credits: 3, grade: "C+" },
  { semester: "20252", code: "EM1010",  name: "Quản trị học đại cương",                         credits: 2, grade: "A"  },
  { semester: "20252", code: "SSH1131", name: "Chủ nghĩa xã hội khoa học",                     credits: 2, grade: "B+" },
  { semester: "20252", code: "IT3190E", name: "Học máy",                                        credits: 3, grade: "B"  },
];

// ------------------------------------------------------------------
// 2. SEMESTER PLAN — Planned / Future Courses (initially empty)
// ------------------------------------------------------------------

const semesterPlan = {
  semester: "20261",
  courses: [],
};

// ------------------------------------------------------------------
// 3. ACADEMIC SUMMARY — Static values for Phase 1
// ------------------------------------------------------------------

const academicSummary = {
  currentCPA: 3.05,
  completedCredits: 61,
};

// ------------------------------------------------------------------
// 4. UTILITY — Group courses by semester
// ------------------------------------------------------------------

/**
 * Groups an array of course objects by their `semester` property.
 * Returns a Map preserving insertion order so semesters render
 * in chronological order (assuming the source data is sorted).
 */
function groupBySemester(courses) {
  const grouped = new Map();
  for (const course of courses) {
    if (!grouped.has(course.semester)) {
      grouped.set(course.semester, []);
    }
    grouped.get(course.semester).push(course);
  }
  return grouped;
}

/**
 * Formats a raw semester code like "20241" into a readable label.
 * "20241" → "2024 — Semester 1"
 */
function formatSemesterLabel(code) {
  const year = code.slice(0, 4);
  const term = code.slice(4);
  return `${year} — Semester ${term}`;
}

// ------------------------------------------------------------------
// 5. RENDERING — Academic Summary
// ------------------------------------------------------------------

function renderAcademicSummary() {
  const cpaValue = document.getElementById("summary-cpa-value");
  const creditsValue = document.getElementById("summary-credits-value");

  if (cpaValue) cpaValue.textContent = academicSummary.currentCPA.toFixed(2);
  if (creditsValue) creditsValue.textContent = academicSummary.completedCredits;
}

// ------------------------------------------------------------------
// 6. RENDERING — Academic History (grouped by semester)
// ------------------------------------------------------------------

function renderAcademicHistory() {
  const container = document.getElementById("academic-history-container");
  if (!container) return;

  // Clear any static placeholder content
  container.innerHTML = "";

  const grouped = groupBySemester(academicHistory);

  grouped.forEach((courses, semesterCode) => {
    // Semester wrapper
    const semesterBlock = document.createElement("div");
    semesterBlock.className = "semester-block";

    // Semester header
    const header = document.createElement("div");
    header.className = "semester-header";

    const headerLabel = document.createElement("h3");
    headerLabel.textContent = formatSemesterLabel(semesterCode);
    header.appendChild(headerLabel);

    // Credit count badge
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const badge = document.createElement("span");
    badge.className = "semester-credits-badge";
    badge.textContent = `${totalCredits} credits`;
    header.appendChild(badge);

    semesterBlock.appendChild(header);

    // Course table
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "course-table";

    // Table header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Course Code</th>
        <th>Course Name</th>
        <th class="center">Credits</th>
        <th class="center">Grade</th>
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement("tbody");
    for (const course of courses) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="code-cell">${course.code}</td>
        <td>${course.name}</td>
        <td class="center">${course.credits}</td>
        <td class="center"><span class="grade-badge grade-${course.grade.replace('+', '-plus')}">${course.grade}</span></td>
      `;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    semesterBlock.appendChild(tableWrapper);

    container.appendChild(semesterBlock);
  });
}

// ------------------------------------------------------------------
// 7. RENDERING — Semester Planner
// ------------------------------------------------------------------

function renderSemesterPlanner() {
  const semesterInput = document.getElementById("planner-semester-input");
  if (semesterInput) {
    semesterInput.value = semesterPlan.semester;
  }
}

// ------------------------------------------------------------------
// 8. INITIALISATION
// ------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  renderAcademicSummary();
  renderAcademicHistory();
  renderSemesterPlanner();
});
