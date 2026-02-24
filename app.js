const DAYS = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = { "월": 7, "화": 7, "수": 6, "목": 7, "금": 7 };
let currentTab = "teacher";

(function init() {
    const teacherDD = document.getElementById("teacher-dropdown");
    const classDD = document.getElementById("class-dropdown");

    TIMETABLE_DATA.teacherList.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        teacherDD.appendChild(opt);
    });

    TIMETABLE_DATA.classList.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        classDD.appendChild(opt);
    });
})();

function switchTab(tab) {
    currentTab = tab;
    document.getElementById("tab-teacher").classList.toggle("active", tab === "teacher");
    document.getElementById("tab-class").classList.toggle("active", tab === "class");
    document.getElementById("select-teacher").classList.toggle("hidden", tab !== "teacher");
    document.getElementById("select-class").classList.toggle("hidden", tab !== "class");

    if (tab === "teacher") {
        const v = document.getElementById("teacher-dropdown").value;
        if (v) onTeacherSelect(v); else showPlaceholder();
    } else {
        const v = document.getElementById("class-dropdown").value;
        if (v) onClassSelect(v); else showPlaceholder();
    }
}

function showPlaceholder() {
    document.getElementById("timetable-container").innerHTML =
        '<div class="placeholder"><div class="placeholder-icon">📋</div>위에서 선택하면 시간표가 표시됩니다</div>';
}

function onTeacherSelect(name) {
    if (!name) { showPlaceholder(); return; }
    const data = TIMETABLE_DATA.teachers[name];
    if (!data) return;
    renderTable(data, "teacher");
}

function onClassSelect(name) {
    if (!name) { showPlaceholder(); return; }
    const data = TIMETABLE_DATA.classes[name];
    if (!data) return;
    renderTable(data, "class");
}

// 교사 시간표: 학반(학년) 기준 색상
function getGradeColor(className) {
    if (!className) return "";
    if (className.startsWith("1-")) return "grade-1";
    if (className.startsWith("2-")) return "grade-2";
    if (className.startsWith("3-")) return "grade-3";
    return "";
}

// 학반 시간표: 과목 기준 색상
function getSubjectColor(subject) {
    if (!subject) return "";
    const s = subject.replace(/^[A-K]/, "");
    if (/국어|문학|독서|화법|언어/.test(s)) return "subj-korean";
    if (/영어|영문|공통영어/.test(s)) return "subj-english";
    if (/수학|미적|확률|기하/.test(s)) return "subj-math";
    if (/과학|물리|화학|생명|지구|생물/.test(s)) return "subj-science";
    if (/사회|역사|지리|정치|경제|윤리|한국사|동아시아|세계사/.test(s)) return "subj-social";
    if (/체육/.test(s)) return "subj-pe";
    if (/음악/.test(s)) return "subj-music";
    if (/미술/.test(s)) return "subj-art";
    if (/기술|가정|정보|기가/.test(s)) return "subj-tech";
    return "subj-etc";
}

function renderTable(data, mode) {
    const container = document.getElementById("timetable-container");
    const maxPeriod = 7;

    let html = '<div class="table-card"><table class="tt-table"><thead><tr><th></th>';
    DAYS.forEach(d => { html += `<th>${d}</th>`; });
    html += '</tr></thead><tbody>';

    for (let p = 1; p <= maxPeriod; p++) {
        html += `<tr><td>${p}</td>`;
        DAYS.forEach(day => {
            if (p > MAX_PERIODS[day]) {
                html += '<td class="cell-empty"></td>';
                return;
            }
            const cell = data[day] ? data[day][p] : null;
            if (!cell) {
                html += '<td class="cell-empty"></td>';
                return;
            }

            if (Array.isArray(cell)) {
                const subjects = cell.map(c => c.subject).join('/');
                const sub = mode === "teacher"
                    ? cell.map(c => c.class || c["class"]).join('/')
                    : cell.map(c => c.teacher).join(', ');
                const color = mode === "teacher"
                    ? getGradeColor(cell[0].class || cell[0]["class"])
                    : getSubjectColor(cell[0].subject);
                html += `<td class="${color}"><div class="cell-subject">${subjects}</div><div class="cell-sub">${sub}</div></td>`;
                return;
            }

            const subject = cell.subject;
            const className = cell.class || cell["class"];
            const sub = mode === "teacher" ? className : cell.teacher;
            const color = mode === "teacher" ? getGradeColor(className) : getSubjectColor(subject);
            html += `<td class="${color}"><div class="cell-subject">${subject}</div><div class="cell-sub">${sub || ""}</div></td>`;
        });
        html += '</tr>';
    }

    html += '</tbody></table>';

    // 범례
    if (mode === "teacher") {
        html += '<div class="legend">';
        html += '<div class="legend-item"><span class="legend-dot" style="background:#eff6ff;border:1px solid #bfdbfe"></span>1학년</div>';
        html += '<div class="legend-item"><span class="legend-dot" style="background:#fef3c7;border:1px solid #fde68a"></span>2학년</div>';
        html += '<div class="legend-item"><span class="legend-dot" style="background:#f0fdf4;border:1px solid #bbf7d0"></span>3학년</div>';
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}
