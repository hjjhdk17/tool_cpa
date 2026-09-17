/* ============================================================
   CPA Planner — Phase 2: Academic Data & Current Academic State
   ============================================================
   1. Academic data
   2. Grade point mapping
   3. Academic calculations
   4. Validation
   5. UI rendering / initialization
   ============================================================ */

// ------------------------------------------------------------------
// 1. ACADEMIC DATA — Completed courses (source of truth)
// ------------------------------------------------------------------

const academicHistory = [
  // ---- Semester 20241 ----
  { semester: "20241", code: "MI1141E", name: "Đại số",                credits: 4, grade: "B"  },
  { semester: "20241", code: "MI1111E", name: "Giải tích I",           credits: 4, grade: "B+" },
  { semester: "20241", code: "IT1110E", name: "Nhập môn lập trình",    credits: 4, grade: "B+" },
  { semester: "20241", code: "EM1170",  name: "Pháp luật đại cương",   credits: 2, grade: "B"  },

  // ---- Semester 20242 ----
  { semester: "20242", code: "SSH1111", name: "Triết học Mác - Lênin",                credits: 3, grade: "B+" },
  { semester: "20242", code: "MI2020E", name: "Probability and Statistics",           credits: 2, grade: "C"  },
  { semester: "20242", code: "MI1121E", name: "Giải tích II",                         credits: 3, grade: "B"  },
  { semester: "20242", code: "IT3052E", name: "Tối ưu hóa",                           credits: 3, grade: "C"  },
  { semester: "20242", code: "IT3020E", name: "Discrete Math",                        credits: 3, grade: "B"  },
  { semester: "20242", code: "IT3010E", name: "Cấu trúc dữ liệu và giải thuật",      credits: 3, grade: "B"  },

  // ---- Semester 20251 ----
  { semester: "20251", code: "SSH1121", name: "Kinh tế chính trị Mác - Lênin",        credits: 2, grade: "B+" },
  { semester: "20251", code: "PH1120E", name: "Vật lý đại cương II",                  credits: 3, grade: "B"  },
  { semester: "20251", code: "MI1131E", name: "Giải tích III",                        credits: 3, grade: "B"  },
  { semester: "20251", code: "IT3100E", name: "Object-oriented Programming",          credits: 3, grade: "C+" },
  { semester: "20251", code: "IT3030E", name: "Kiến trúc máy tính",                   credits: 3, grade: "C"  },
  { semester: "20251", code: "IT2030",  name: "Technical Writing and Presentation",   credits: 3, grade: "A"  },

  // ---- Semester 20252 ----
  { semester: "20252", code: "IT3090E", name: "Cơ sở dữ liệu",                                credits: 3, grade: "B+" },
  { semester: "20252", code: "IT2022E", name: "Thống kê ứng dụng và phân tích thực nghiệm",    credits: 3, grade: "C+" },
  { semester: "20252", code: "EM1010",  name: "Quản trị học đại cương",                         credits: 2, grade: "A"  },
  { semester: "20252", code: "SSH1131", name: "Chủ nghĩa xã hội khoa học",                     credits: 2, grade: "B+" },
  { semester: "20252", code: "IT3190E", name: "Học máy",                                        credits: 3, grade: "B"  },
];

// Planned / future courses — kept separate; must not affect Current CPA
const semesterPlan = {
  semester: "20261",
  courses: [],
};

// ------------------------------------------------------------------
// 2. GRADE POINT MAPPING — 4.0 scale (single source)
// ------------------------------------------------------------------

const GRADE_POINTS = {
  "A+": 4.0,
  "A":  4.0,
  "B+": 3.5,
  "B":  3.0,
  "C+": 2.5,
  "C":  2.0,
  "D+": 1.5,
  "D":  1.0,
  "F":  0.0,
};

function getGradePoint(grade) {
  return GRADE_POINTS[grade];
}

// ------------------------------------------------------------------
// 3. ACADEMIC CALCULATIONS — derived from academicHistory only
// ------------------------------------------------------------------

function sumCredits(courses) {
  return courses.reduce((sum, course) => sum + course.credits, 0);
}

function calculateCompletedCredits(courses) {
  return sumCredits(courses);
}

function calculateCurrentCPA(courses) {
  const totalCredits = calculateCompletedCredits(courses);
  if (totalCredits === 0) return 0;

  const qualityPoints = courses.reduce((sum, course) => {
    return sum + course.credits * getGradePoint(course.grade);
  }, 0);

  return qualityPoints / totalCredits;
}

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

function formatSemesterLabel(code) {
  const year = code.slice(0, 4);
  const term = code.slice(4);
  return `${year} — Semester ${term}`;
}

// ------------------------------------------------------------------
// 4. VALIDATION — lightweight checks for accidental data corruption
// ------------------------------------------------------------------

const EXPECTED_HISTORY = {
  courseCount: 21,
  semesterCount: 4,
  completedCredits: 61,
};

function validateAcademicHistory() {
  const courseCount = academicHistory.length;
  const grouped = groupBySemester(academicHistory);
  const semesterCount = grouped.size;
  const completedCredits = calculateCompletedCredits(academicHistory);

  const issues = [];

  if (courseCount !== EXPECTED_HISTORY.courseCount) {
    issues.push(`courses: expected ${EXPECTED_HISTORY.courseCount}, got ${courseCount}`);
  }
  if (semesterCount !== EXPECTED_HISTORY.semesterCount) {
    issues.push(`semesters: expected ${EXPECTED_HISTORY.semesterCount}, got ${semesterCount}`);
  }
  if (completedCredits !== EXPECTED_HISTORY.completedCredits) {
    issues.push(`credits: expected ${EXPECTED_HISTORY.completedCredits}, got ${completedCredits}`);
  }

  if (issues.length > 0) {
    console.warn("[CPA Planner] Academic history validation failed:", issues);
    return false;
  }

  console.info(
    `[CPA Planner] Academic history OK — courses=${courseCount}, semesters=${semesterCount}, credits=${completedCredits}`
  );
  return true;
}

// ------------------------------------------------------------------
// 5. UI RENDERING / INITIALIZATION
// ------------------------------------------------------------------

function renderAcademicSummary() {
  const cpaValue = document.getElementById("summary-cpa-value");
  const creditsValue = document.getElementById("summary-credits-value");

  const currentCPA = calculateCurrentCPA(academicHistory);
  const completedCredits = calculateCompletedCredits(academicHistory);

  if (cpaValue) cpaValue.textContent = currentCPA.toFixed(2);
  if (creditsValue) creditsValue.textContent = completedCredits;
}

function renderAcademicHistory() {
  const container = document.getElementById("academic-history-container");
  if (!container) return;

  container.innerHTML = "";

  const grouped = groupBySemester(academicHistory);

  grouped.forEach((courses, semesterCode) => {
    const semesterBlock = document.createElement("div");
    semesterBlock.className = "semester-block";

    const header = document.createElement("div");
    header.className = "semester-header";

    const headerLabel = document.createElement("h3");
    headerLabel.textContent = formatSemesterLabel(semesterCode);
    header.appendChild(headerLabel);

    const totalCredits = sumCredits(courses);
    const badge = document.createElement("span");
    badge.className = "semester-credits-badge";
    badge.textContent = `${totalCredits} credits`;
    header.appendChild(badge);

    semesterBlock.appendChild(header);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-wrapper";

    const table = document.createElement("table");
    table.className = "course-table";

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

function renderSemesterPlanner() {
  const semesterInput = document.getElementById("planner-semester-input");
  if (semesterInput) {
    semesterInput.value = semesterPlan.semester;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  validateAcademicHistory();
  renderAcademicSummary();
  renderAcademicHistory();
  renderSemesterPlanner();
});
