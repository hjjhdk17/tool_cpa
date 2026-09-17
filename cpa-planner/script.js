/* ============================================================
   CPA Planner — Phase 5: Grade Improvement + Persistent Data
   ============================================================
   1. Academic data (immutable seed)
   2. Grade point mapping
   3. Academic calculations (raw / effective / projected)
   4. History validation
   5. Persistence (localStorage)
   6. Semester planner (planned courses)
   7. UI rendering / initialization
   ============================================================ */

// ------------------------------------------------------------------
// 1. ACADEMIC DATA — Completed courses (source of truth)
// ------------------------------------------------------------------

const academicHistory = [
  // ---- Semester 20241 ----
  { id: "hist-20241-MI1141E", semester: "20241", code: "MI1141E", name: "Đại số",                credits: 4, grade: "B"  },
  { id: "hist-20241-MI1111E", semester: "20241", code: "MI1111E", name: "Giải tích I",           credits: 4, grade: "B+" },
  { id: "hist-20241-IT1110E", semester: "20241", code: "IT1110E", name: "Nhập môn lập trình",    credits: 4, grade: "B+" },
  { id: "hist-20241-EM1170",  semester: "20241", code: "EM1170",  name: "Pháp luật đại cương",   credits: 2, grade: "B"  },

  // ---- Semester 20242 ----
  { id: "hist-20242-SSH1111", semester: "20242", code: "SSH1111", name: "Triết học Mác - Lênin",                credits: 3, grade: "B+" },
  { id: "hist-20242-MI2020E", semester: "20242", code: "MI2020E", name: "Probability and Statistics",           credits: 2, grade: "C"  },
  { id: "hist-20242-MI1121E", semester: "20242", code: "MI1121E", name: "Giải tích II",                         credits: 3, grade: "B"  },
  { id: "hist-20242-IT3052E", semester: "20242", code: "IT3052E", name: "Tối ưu hóa",                           credits: 3, grade: "C"  },
  { id: "hist-20242-IT3020E", semester: "20242", code: "IT3020E", name: "Discrete Math",                        credits: 3, grade: "B"  },
  { id: "hist-20242-IT3010E", semester: "20242", code: "IT3010E", name: "Cấu trúc dữ liệu và giải thuật",      credits: 3, grade: "B"  },

  // ---- Semester 20251 ----
  { id: "hist-20251-SSH1121", semester: "20251", code: "SSH1121", name: "Kinh tế chính trị Mác - Lênin",        credits: 2, grade: "B+" },
  { id: "hist-20251-PH1120E", semester: "20251", code: "PH1120E", name: "Vật lý đại cương II",                  credits: 3, grade: "B"  },
  { id: "hist-20251-MI1131E", semester: "20251", code: "MI1131E", name: "Giải tích III",                        credits: 3, grade: "B"  },
  { id: "hist-20251-IT3100E", semester: "20251", code: "IT3100E", name: "Object-oriented Programming",          credits: 3, grade: "C+" },
  { id: "hist-20251-IT3030E", semester: "20251", code: "IT3030E", name: "Kiến trúc máy tính",                   credits: 3, grade: "C"  },
  { id: "hist-20251-IT2030",  semester: "20251", code: "IT2030",  name: "Technical Writing and Presentation",   credits: 3, grade: "A"  },

  // ---- Semester 20252 ----
  { id: "hist-20252-IT3090E", semester: "20252", code: "IT3090E", name: "Cơ sở dữ liệu",                                credits: 3, grade: "B+" },
  { id: "hist-20252-IT2022E", semester: "20252", code: "IT2022E", name: "Thống kê ứng dụng và phân tích thực nghiệm",    credits: 3, grade: "C+" },
  { id: "hist-20252-EM1010",  semester: "20252", code: "EM1010",  name: "Quản trị học đại cương",                         credits: 2, grade: "A"  },
  { id: "hist-20252-SSH1131", semester: "20252", code: "SSH1131", name: "Chủ nghĩa xã hội khoa học",                     credits: 2, grade: "B+" },
  { id: "hist-20252-IT3190E", semester: "20252", code: "IT3190E", name: "Học máy",                                        credits: 3, grade: "B"  },
];

// Planned / future courses — kept separate; must not affect Current CPA
const semesterPlan = {
  semester: "20261",
  courses: [],
};

let nextPlannedCourseId = 1;
let gradeOverrides = {};
let hasUnsavedChanges = false;
let lastSavedAt = null;

const STORAGE_KEY = "cpaPlannerState";
const GRADE_OPTIONS = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"];

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

function normalizeCourseCode(code) {
  return String(code || "").trim().toUpperCase();
}

// ------------------------------------------------------------------
// 3. ACADEMIC CALCULATIONS
//    Raw history: all attempts (display / editing)
//    Effective history: highest grade per course code (Current CPA)
//    Projected effective: merge effective completed + planned, then highest
// ------------------------------------------------------------------

function sumCredits(courses) {
  return courses.reduce((sum, course) => sum + course.credits, 0);
}

function calculateQualityPoints(courses) {
  return courses.reduce((sum, course) => {
    return sum + course.credits * getGradePoint(course.grade);
  }, 0);
}

function getRawAcademicHistory() {
  return academicHistory.map((course) => {
    const overrideGrade = gradeOverrides[course.id];
    return {
      ...course,
      grade: overrideGrade && overrideGrade in GRADE_POINTS ? overrideGrade : course.grade,
    };
  });
}

function getEffectiveAcademicHistory(courses) {
  const bestByCode = new Map();

  for (const course of courses) {
    const code = normalizeCourseCode(course.code);
    if (!code) continue;

    const points = getGradePoint(course.grade);
    if (!Number.isFinite(points)) continue;

    const existing = bestByCode.get(code);
    if (!existing) {
      bestByCode.set(code, { ...course, code });
      continue;
    }

    if (points > getGradePoint(existing.grade)) {
      bestByCode.set(code, { ...course, code });
    }
  }

  return Array.from(bestByCode.values());
}

function getProjectedEffectiveHistory(completedCourses, plannedCourses) {
  const effectiveCompleted = getEffectiveAcademicHistory(completedCourses);
  if (!plannedCourses || plannedCourses.length === 0) {
    return effectiveCompleted;
  }
  return getEffectiveAcademicHistory(effectiveCompleted.concat(plannedCourses));
}

function calculateCompletedCredits(courses) {
  return sumCredits(courses);
}

function calculateEffectiveCompletedCredits(courses) {
  return sumCredits(getEffectiveAcademicHistory(courses));
}

function calculateCurrentCPA(courses) {
  const effective = getEffectiveAcademicHistory(courses);
  const totalCredits = calculateCompletedCredits(effective);
  if (totalCredits === 0) return 0;
  return calculateQualityPoints(effective) / totalCredits;
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
  if (!plannedCourses || plannedCourses.length === 0) {
    return calculateCurrentCPA(completedCourses);
  }

  const projected = getProjectedEffectiveHistory(completedCourses, plannedCourses);
  const totalCredits = calculateCompletedCredits(projected);
  if (totalCredits === 0) return 0;
  return calculateQualityPoints(projected) / totalCredits;
}

function isCompletedCourseCode(code, completedCourses) {
  const normalized = normalizeCourseCode(code);
  return completedCourses.some((course) => normalizeCourseCode(course.code) === normalized);
}

function getPlannedCourseStatus(course, completedCourses) {
  return isCompletedCourseCode(course.code, completedCourses) ? "Improvement" : "New";
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
// 5. PERSISTENCE — localStorage (source state only, never derived CPA)
// ------------------------------------------------------------------

function formatSavedAt(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updateSaveStatus() {
  const el = document.getElementById("save-status");
  if (!el) return;

  if (hasUnsavedChanges) {
    el.textContent = "Unsaved changes";
    el.className = "save-status save-status--unsaved";
    return;
  }

  if (lastSavedAt) {
    const time = formatSavedAt(lastSavedAt);
    el.textContent = time ? `Saved at ${time}` : "Saved";
    el.className = "save-status save-status--saved";
    return;
  }

  el.textContent = "Saved";
  el.className = "save-status save-status--saved";
}

function markUnsaved() {
  hasUnsavedChanges = true;
  updateSaveStatus();
}

function isValidPlannedCourse(course) {
  return (
    course &&
    typeof course === "object" &&
    typeof course.id === "string" &&
    typeof course.code === "string" &&
    typeof course.name === "string" &&
    Number.isInteger(course.credits) &&
    course.credits > 0 &&
    typeof course.semester === "string" &&
    course.semester.trim() !== "" &&
    course.grade in GRADE_POINTS
  );
}

function isValidPersistedState(data) {
  if (!data || typeof data !== "object") return false;
  if (data.version !== 1) return false;
  if (!Array.isArray(data.plannedCourses)) return false;
  if (!data.plannedCourses.every(isValidPlannedCourse)) return false;
  if (!data.gradeOverrides || typeof data.gradeOverrides !== "object" || Array.isArray(data.gradeOverrides)) {
    return false;
  }

  for (const grade of Object.values(data.gradeOverrides)) {
    if (!(grade in GRADE_POINTS)) return false;
  }

  return true;
}

function restoreNextPlannedCourseId(courses) {
  let max = 0;
  for (const course of courses) {
    const match = String(course.id).match(/^planned-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  nextPlannedCourseId = max + 1;
}

function loadPersistedState() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("[CPA Planner] Unable to read localStorage:", error);
    return;
  }

  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!isValidPersistedState(data)) {
      console.warn("[CPA Planner] Ignoring malformed saved state.");
      return;
    }

    gradeOverrides = { ...data.gradeOverrides };
    semesterPlan.courses = data.plannedCourses.map((course) => ({ ...course }));
    semesterPlan.semester = data.plannerSemester || semesterPlan.semester;
    restoreNextPlannedCourseId(semesterPlan.courses);
    lastSavedAt = data.savedAt || null;
    hasUnsavedChanges = false;
  } catch (error) {
    console.warn("[CPA Planner] Ignoring corrupted saved state:", error);
  }
}

function savePersistedState() {
  const savedAt = new Date().toISOString();
  const payload = {
    version: 1,
    plannedCourses: semesterPlan.courses.map((course) => ({ ...course })),
    gradeOverrides: { ...gradeOverrides },
    plannerSemester: getSelectedPlannerSemester(),
    savedAt,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    showPlannerMessage("Could not save data. Please try again.");
    console.warn("[CPA Planner] Unable to write localStorage:", error);
    return false;
  }

  lastSavedAt = savedAt;
  hasUnsavedChanges = false;
  semesterPlan.semester = payload.plannerSemester;
  showPlannerMessage("Saved successfully.", "success");
  updateSaveStatus();
  return true;
}

function handleSave() {
  const invalidPlanned = semesterPlan.courses.filter((course) => !isValidPlannedCourse(course));
  if (invalidPlanned.length > 0) {
    showPlannerMessage("Cannot save: planned course data is invalid.");
    return;
  }

  savePersistedState();
  renderAcademicSummary();
  renderAcademicHistory();
  renderSemesterPlanner();
}

// ------------------------------------------------------------------
// 6. SEMESTER PLANNER — planned courses only (does not affect Current CPA)
// ------------------------------------------------------------------

function normalizeCourseCode(code) {
  return String(code || "").trim().toUpperCase();
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
