/* ============================================================
   CPA Planner — Phase 4: GPA & CPA Calculation Engine
   ============================================================
   1. Academic data
   2. Grade point mapping
   3. Academic calculations
   4. History validation
   5. Semester planner (planned courses)
   6. UI rendering / initialization
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

let nextPlannedCourseId = 1;

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
// 3. ACADEMIC CALCULATIONS
//    Current CPA / completed credits: academicHistory only
//    Planned GPA / projected CPA: semesterPlan, kept separate
// ------------------------------------------------------------------

function sumCredits(courses) {
  return courses.reduce((sum, course) => sum + course.credits, 0);
}

function calculateQualityPoints(courses) {
  return courses.reduce((sum, course) => {
    return sum + course.credits * getGradePoint(course.grade);
  }, 0);
}

function calculateCompletedCredits(courses) {
  return sumCredits(courses);
}

function calculateCurrentCPA(courses) {
  const totalCredits = calculateCompletedCredits(courses);
  if (totalCredits === 0) return 0;
  return calculateQualityPoints(courses) / totalCredits;
}

function calculatePlannedCredits(courses) {
  return sumCredits(courses);
}

function calculateSemesterGPA(courses) {
  const totalCredits = sumCredits(courses);
  if (totalCredits === 0) return 0;
  return calculateQualityPoints(courses) / totalCredits;
}

function calculateProjectedCPA(completedCourses, plannedCourses) {
  const plannedCredits = calculatePlannedCredits(plannedCourses);
  if (plannedCredits === 0) {
    return calculateCurrentCPA(completedCourses);
  }

  const completedCredits = calculateCompletedCredits(completedCourses);
  const totalCredits = completedCredits + plannedCredits;
  if (totalCredits === 0) return 0;

  const completedQualityPoints = calculateQualityPoints(completedCourses);
  const plannedQualityPoints = calculateQualityPoints(plannedCourses);
  return (completedQualityPoints + plannedQualityPoints) / totalCredits;
}

function getPlannedSemesterStats(plannedCourses) {
  const grouped = groupBySemester(plannedCourses);
  const stats = [];

  grouped.forEach((courses, semester) => {
    stats.push({
      semester,
      credits: calculatePlannedCredits(courses),
      gpa: calculateSemesterGPA(courses),
    });
  });

  return stats;
}

function formatGPA(value) {
  return value.toFixed(2);
}

function formatCPA(value) {
  return value.toFixed(2);
}

function formatGradeScale(value) {
  return value.toFixed(1);
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
// 5. SEMESTER PLANNER — planned courses only (does not affect CPA)
// ------------------------------------------------------------------

function normalizeCourseCode(code) {
  return code.trim().toUpperCase();
}

function parseCredits(value) {
  const trimmed = String(value).trim();
  if (trimmed === "") return null;

  const number = Number(trimmed);
  if (!Number.isFinite(number) || !Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

function isDuplicatePlannedCourse(code, semester) {
  const normalizedCode = normalizeCourseCode(code);
  const normalizedSemester = semester.trim();

  return semesterPlan.courses.some((course) => {
    return (
      normalizeCourseCode(course.code) === normalizedCode &&
      course.semester === normalizedSemester
    );
  });
}

function validatePlannedCourse(course) {
  const errors = [];

  if (!course.code) {
    errors.push("Course code is required.");
  }

  if (!course.name) {
    errors.push("Course name is required.");
  }

  if (course.credits === null) {
    errors.push("Credits must be a positive whole number.");
  }

  if (!course.semester) {
    errors.push("Semester is required.");
  }

  if (!course.grade || !(course.grade in GRADE_POINTS)) {
    errors.push("Please select a valid planned grade.");
  }

  if (course.code && course.semester && isDuplicatePlannedCourse(course.code, course.semester)) {
    errors.push(
      `${normalizeCourseCode(course.code)} is already planned for semester ${course.semester}.`
    );
  }

  return errors;
}

function showPlannerMessage(message) {
  const el = document.getElementById("planner-message");
  if (!el) return;

  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }

  el.hidden = false;
  el.textContent = message;
}

function clearPlannerForm() {
  const codeInput = document.getElementById("planner-code-input");
  const nameInput = document.getElementById("planner-name-input");
  const creditsInput = document.getElementById("planner-credits-input");
  const gradeSelect = document.getElementById("planner-grade-select");

  if (codeInput) codeInput.value = "";
  if (nameInput) nameInput.value = "";
  if (creditsInput) creditsInput.value = "";
  if (gradeSelect) gradeSelect.selectedIndex = 0;
}

function readPlannedCourseForm() {
  const codeInput = document.getElementById("planner-code-input");
  const nameInput = document.getElementById("planner-name-input");
  const creditsInput = document.getElementById("planner-credits-input");
  const semesterInput = document.getElementById("planner-semester-input");
  const gradeSelect = document.getElementById("planner-grade-select");

  return {
    code: codeInput ? codeInput.value.trim() : "",
    name: nameInput ? nameInput.value.trim() : "",
    credits: parseCredits(creditsInput ? creditsInput.value : ""),
    semester: semesterInput ? semesterInput.value.trim() : "",
    grade: gradeSelect ? gradeSelect.value : "",
  };
}

function addPlannedCourse() {
  const draft = readPlannedCourseForm();
  const errors = validatePlannedCourse(draft);

  if (errors.length > 0) {
    showPlannerMessage(errors[0]);
    return;
  }

  semesterPlan.semester = draft.semester;
  semesterPlan.courses.push({
    id: `planned-${nextPlannedCourseId++}`,
    code: normalizeCourseCode(draft.code),
    name: draft.name,
    credits: draft.credits,
    semester: draft.semester,
    grade: draft.grade,
  });

  showPlannerMessage("");
  clearPlannerForm();
  renderSemesterPlanner();
}

function deletePlannedCourse(id) {
  const index = semesterPlan.courses.findIndex((course) => course.id === id);
  if (index === -1) return;

  const course = semesterPlan.courses[index];
  const confirmed = window.confirm(`Remove ${course.code} from the semester plan?`);
  if (!confirmed) return;

  semesterPlan.courses.splice(index, 1);
  showPlannerMessage("");
  renderSemesterPlanner();
}

function bindSemesterPlannerEvents() {
  const addButton = document.getElementById("btn-add-course");
  if (addButton) {
    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      addPlannedCourse();
    });
  }

  const tableBody = document.getElementById("planner-table-body");
  if (tableBody) {
    tableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-planned-id]");
      if (!button) return;
      deletePlannedCourse(button.getAttribute("data-delete-planned-id"));
    });
  }

  const semesterInput = document.getElementById("planner-semester-input");
  if (semesterInput) {
    semesterInput.addEventListener("input", () => {
      renderCalculationResults();
    });
  }
}

// ------------------------------------------------------------------
// 6. UI RENDERING / INITIALIZATION
// ------------------------------------------------------------------

function renderAcademicSummary() {
  const cpaValue = document.getElementById("summary-cpa-value");
  const creditsValue = document.getElementById("summary-credits-value");

  const currentCPA = calculateCurrentCPA(academicHistory);
  const completedCredits = calculateCompletedCredits(academicHistory);

  if (cpaValue) cpaValue.textContent = formatCPA(currentCPA);
  if (creditsValue) creditsValue.textContent = completedCredits;

  renderCalculationResults();
}

function setResultText(id, text, hasValue) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("has-value", Boolean(hasValue));
}

function getSelectedPlannerSemester() {
  const semesterInput = document.getElementById("planner-semester-input");
  const selected = semesterInput ? semesterInput.value.trim() : "";
  return selected || semesterPlan.semester;
}

function renderCalculationResults() {
  const plannedCourses = semesterPlan.courses;
  const plannedCredits = calculatePlannedCredits(plannedCourses);
  const currentCPA = calculateCurrentCPA(academicHistory);
  const projectedCPA = calculateProjectedCPA(academicHistory, plannedCourses);

  const selectedSemester = getSelectedPlannerSemester();
  const selectedCourses = plannedCourses.filter((course) => course.semester === selectedSemester);
  const selectedHasCourses = selectedCourses.length > 0;
  const selectedGPA = selectedHasCourses ? calculateSemesterGPA(selectedCourses) : null;

  const projectedDisplay = formatCPA(projectedCPA);
  const gpaDisplay = selectedGPA === null ? "—" : formatGPA(selectedGPA);

  const summaryProjected = document.getElementById("summary-projected-cpa-value");
  const summarySemesterGpa = document.getElementById("summary-semester-gpa-value");
  if (summaryProjected) summaryProjected.textContent = projectedDisplay;
  if (summarySemesterGpa) summarySemesterGpa.textContent = gpaDisplay;

  setResultText("result-planned-credits", String(plannedCredits), true);
  setResultText("result-semester-gpa", gpaDisplay, selectedHasCourses);
  setResultText("result-projected-cpa", projectedDisplay, true);

  // Current CPA is never affected by planned courses; keep the summary in sync.
  const cpaValue = document.getElementById("summary-cpa-value");
  if (cpaValue) cpaValue.textContent = formatCPA(currentCPA);
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
  if (semesterInput && !semesterInput.value.trim()) {
    semesterInput.value = semesterPlan.semester;
  }

  const tbody = document.getElementById("planner-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (semesterPlan.courses.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 7;
    emptyCell.className = "planner-empty";
    emptyCell.textContent = "No planned courses yet. Fill in the form below and click + Add Course.";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    renderCalculationResults();
    return;
  }

  const grouped = groupBySemester(semesterPlan.courses);

  grouped.forEach((courses, semesterCode) => {
    const headerRow = document.createElement("tr");
    headerRow.className = "planner-semester-summary";
    const headerCell = document.createElement("td");
    headerCell.colSpan = 7;
    const semesterCredits = calculatePlannedCredits(courses);
    const semesterGPA = calculateSemesterGPA(courses);
    headerCell.textContent = `${formatSemesterLabel(semesterCode)}  ·  ${semesterCredits} credits  ·  GPA ${formatGPA(semesterGPA)}`;
    headerRow.appendChild(headerCell);
    tbody.appendChild(headerRow);

    for (const course of courses) {
      const tr = document.createElement("tr");

      const codeCell = document.createElement("td");
      codeCell.className = "code-cell";
      codeCell.textContent = course.code;

      const nameCell = document.createElement("td");
      nameCell.textContent = course.name;

      const creditsCell = document.createElement("td");
      creditsCell.className = "center";
      creditsCell.textContent = String(course.credits);

      const semesterCell = document.createElement("td");
      semesterCell.className = "center";
      semesterCell.textContent = course.semester;

      const gradeCell = document.createElement("td");
      gradeCell.className = "center";
      const gradeBadge = document.createElement("span");
      gradeBadge.className = `grade-badge grade-${course.grade.replace("+", "-plus")}`;
      gradeBadge.textContent = course.grade;
      gradeCell.appendChild(gradeBadge);

      const scaleCell = document.createElement("td");
      scaleCell.className = "center";
      const scaleValue = document.createElement("span");
      const gradePoint = getGradePoint(course.grade);
      scaleValue.className = Number.isFinite(gradePoint) ? "grade-scale" : "scale-placeholder";
      scaleValue.textContent = Number.isFinite(gradePoint) ? formatGradeScale(gradePoint) : "—";
      scaleCell.appendChild(scaleValue);

      const actionCell = document.createElement("td");
      actionCell.className = "center";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn--ghost";
      deleteButton.title = "Remove course";
      deleteButton.setAttribute("data-delete-planned-id", course.id);
      deleteButton.textContent = "✕";
      actionCell.appendChild(deleteButton);

      tr.append(
        codeCell,
        nameCell,
        creditsCell,
        semesterCell,
        gradeCell,
        scaleCell,
        actionCell
      );
      tbody.appendChild(tr);
    }
  });

  renderCalculationResults();
}

document.addEventListener("DOMContentLoaded", () => {
  validateAcademicHistory();
  renderAcademicSummary();
  renderAcademicHistory();
  renderSemesterPlanner();
  bindSemesterPlannerEvents();
});
