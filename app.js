const DAYS = ["월", "화", "수", "목", "금"];
const MAX_PERIODS = { "월": 7, "화": 7, "수": 6, "목": 7, "금": 7 };
let currentTab = "teacher";

(function init() {
    const teacherDD = document.getElementById("teacher-dropdown");
    const classDD = document.getElementById("class-dropdown");
    const roomDD = document.getElementById("room-dropdown");

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

    (TIMETABLE_DATA.roomList || []).forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        roomDD.appendChild(opt);
    });
})();

function switchTab(tab) {
    currentTab = tab;
    document.getElementById("tab-teacher").classList.toggle("active", tab === "teacher");
    document.getElementById("tab-class").classList.toggle("active", tab === "class");
    document.getElementById("tab-room").classList.toggle("active", tab === "room");
    document.getElementById("select-teacher").classList.toggle("hidden", tab !== "teacher");
    document.getElementById("select-class").classList.toggle("hidden", tab !== "class");
    document.getElementById("select-room").classList.toggle("hidden", tab !== "room");

    if (tab === "teacher") {
        const v = document.getElementById("teacher-dropdown").value;
        if (v) onTeacherSelect(v); else showPlaceholder();
    } else if (tab === "class") {
        const v = document.getElementById("class-dropdown").value;
        if (v) onClassSelect(v); else showPlaceholder();
    } else {
        const v = document.getElementById("room-dropdown").value;
        if (v) onRoomSelect(v); else showPlaceholder();
    }
}

let currentLabel = "";

function showPlaceholder() {
    document.getElementById("timetable-container").innerHTML =
        '<div class="placeholder"><div class="placeholder-icon">📋</div>위에서 선택하면 시간표가 표시됩니다</div>';
    document.getElementById("action-btns").classList.add("hidden");
    currentLabel = "";
}

function showActionBtns() {
    document.getElementById("action-btns").classList.remove("hidden");
}

function onTeacherSelect(name) {
    if (!name) { showPlaceholder(); return; }
    const data = TIMETABLE_DATA.teachers[name];
    if (!data) return;
    currentLabel = name + " 선생님";
    renderTable(data, "teacher");
    showActionBtns();
}

function onClassSelect(name) {
    if (!name) { showPlaceholder(); return; }
    const data = TIMETABLE_DATA.classes[name];
    if (!data) return;
    currentLabel = name + "반";
    renderTable(data, "class");
    showActionBtns();
}

function onRoomSelect(name) {
    if (!name) { showPlaceholder(); return; }
    const data = (TIMETABLE_DATA.rooms || {})[name];
    if (!data) return;
    currentLabel = name;
    renderTable(data, "room");
    showActionBtns();
}

// 교사 시간표: 학반+과목 조합별 고유 색상
const COMBO_PALETTE = [
    "#dbeafe","#fef3c7","#d1fae5","#fce7f3","#ede9fe",
    "#ffedd5","#e0e7ff","#ccfbf1","#fef9c3","#fae8ff",
    "#cffafe","#fee2e2","#dcfce7","#f5d0fe","#e0f2fe",
    "#fbcfe8","#d9f99d","#bfdbfe","#fecaca","#c7d2fe",
    "#fed7aa","#a7f3d0","#c4b5fd","#fecdd3","#bae6fd",
    "#fde68a","#bbf7d0","#ddd6fe","#fdba74","#99f6e4",
    "#f0abfc","#a5b4fc","#fca5a5","#6ee7b7",
];
const COMBO_COLOR_MAP = {};
let comboColorIdx = 0;

function getComboColor(className, subject) {
    if (!className || !subject) return "";
    const key = className + "|" + subject;
    if (!COMBO_COLOR_MAP[key]) {
        COMBO_COLOR_MAP[key] = COMBO_PALETTE[comboColorIdx % COMBO_PALETTE.length];
        comboColorIdx++;
    }
    return COMBO_COLOR_MAP[key];
}

// 학반 시간표: 과목별 동적 색상 배정 (최대 15색)
const SUBJ_PALETTE = [
    "#fef9c3","#bfdbfe","#fbcfe8","#a7f3d0","#c4b5fd",
    "#fed7aa","#99f6e4","#f0abfc","#d9f99d","#fecaca",
    "#e0e7ff","#fde68a","#ccfbf1","#fecdd3","#bae6fd",
];
const SUBJ_COLOR_MAP = {};
let subjColorIdx = 0;

function getSubjectDynColor(subject) {
    if (!subject) return "";
    const key = subject;
    if (!SUBJ_COLOR_MAP[key]) {
        SUBJ_COLOR_MAP[key] = SUBJ_PALETTE[subjColorIdx % SUBJ_PALETTE.length];
        subjColorIdx++;
    }
    return SUBJ_COLOR_MAP[key];
}

function getCellRoom(cell) {
    if (!cell) return "";
    if (Array.isArray(cell)) {
        const rooms = cell.map(c => c.room).filter(Boolean);
        return rooms.length > 0 ? rooms[0] : "";
    }
    return cell.room || "";
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

            let subject, sub, bg, room;

            if (Array.isArray(cell)) {
                subject = cell.map(c => c.subject).join('/');
                room = getCellRoom(cell);
                if (mode === "teacher") {
                    sub = cell.map(c => c.class || c["class"]).join('/');
                    bg = getComboColor(cell[0].class || cell[0]["class"], cell[0].subject);
                } else if (mode === "class") {
                    sub = cell.map(c => c.teacher).join(', ');
                    bg = getSubjectDynColor(cell[0].subject);
                } else {
                    // room mode: sub = teacher / class
                    sub = cell.map(c => c.teacher + ' ' + (c.class || c["class"])).join(', ');
                    bg = getSubjectDynColor(cell[0].subject);
                }
            } else {
                subject = cell.subject;
                room = cell.room || "";
                const className = cell.class || cell["class"];
                if (mode === "teacher") {
                    sub = className;
                    bg = getComboColor(className, subject);
                } else if (mode === "class") {
                    sub = cell.teacher;
                    bg = getSubjectDynColor(subject);
                } else {
                    // room mode
                    sub = (cell.teacher || "") + " " + (className || "");
                    bg = getSubjectDynColor(subject);
                }
            }

            html += `<td style="background:${bg}"><div class="cell-subject">${subject}</div><div class="cell-sub">${sub || ""}</div>`;
            if (room && mode !== "room") {
                html += `<div class="cell-room">${room}</div>`;
            }
            html += '</td>';
        });
        html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// 현재 시간표 데이터를 2D 배열로 추출
function getCurrentTableData() {
    let data;
    if (currentTab === "teacher") {
        data = TIMETABLE_DATA.teachers[document.getElementById("teacher-dropdown").value];
    } else if (currentTab === "class") {
        data = TIMETABLE_DATA.classes[document.getElementById("class-dropdown").value];
    } else {
        data = (TIMETABLE_DATA.rooms || {})[document.getElementById("room-dropdown").value];
    }
    if (!data) return null;

    const mode = currentTab;
    const rows = [["교시", "월", "화", "수", "목", "금"]];

    for (let p = 1; p <= 7; p++) {
        const row = [p + "교시"];
        DAYS.forEach(day => {
            if (p > MAX_PERIODS[day]) { row.push(""); return; }
            const cell = data[day] ? data[day][p] : null;
            if (!cell) { row.push(""); return; }
            if (Array.isArray(cell)) {
                const subj = cell.map(c => c.subject).join('/');
                let sub;
                if (mode === "teacher") sub = cell.map(c => c.class || c["class"]).join('/');
                else if (mode === "class") sub = cell.map(c => c.teacher).join(', ');
                else sub = cell.map(c => c.teacher + ' ' + (c.class || c["class"])).join(', ');
                const room = getCellRoom(cell);
                row.push(subj + "\n" + sub + (room && mode !== "room" ? "\n" + room : ""));
            } else {
                let sub;
                if (mode === "teacher") sub = cell.class || cell["class"];
                else if (mode === "class") sub = cell.teacher;
                else sub = (cell.teacher || "") + " " + (cell.class || cell["class"] || "");
                const room = cell.room || "";
                row.push(cell.subject + "\n" + (sub || "") + (room && mode !== "room" ? "\n" + room : ""));
            }
        });
        rows.push(row);
    }
    return rows;
}

// 이미지용 테이블 HTML을 데이터에서 직접 생성 (DOM 클론 없이)
function buildImageHTML() {
    let data;
    if (currentTab === "teacher") {
        data = TIMETABLE_DATA.teachers[document.getElementById("teacher-dropdown").value];
    } else if (currentTab === "class") {
        data = TIMETABLE_DATA.classes[document.getElementById("class-dropdown").value];
    } else {
        data = (TIMETABLE_DATA.rooms || {})[document.getElementById("room-dropdown").value];
    }
    if (!data) return "";
    const mode = currentTab;

    const thStyle = 'style="background:#4f46e5;color:#fff;padding:10px 6px;text-align:center;font-weight:600;font-size:13px;letter-spacing:2px;border:1px solid #4f46e5;"';
    const thFirstStyle = 'style="background:#4f46e5;color:#fff;padding:10px 4px;text-align:center;font-weight:600;font-size:11px;width:36px;border:1px solid #4f46e5;"';
    const emptyStyle = 'style="background:#fafbff;border:1px solid #e2e8f0;height:50px;text-align:center;vertical-align:middle;padding:6px 4px;"';
    const periodStyle = 'style="font-weight:700;color:#4f46e5;background:#f5f3ff;font-size:13px;border:1px solid #e2e8f0;height:50px;text-align:center;vertical-align:middle;padding:6px 4px;"';

    let html = '<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:sans-serif;">';
    html += `<tr><th ${thFirstStyle}></th>`;
    DAYS.forEach(d => { html += `<th ${thStyle}>${d}</th>`; });
    html += '</tr>';

    for (let p = 1; p <= 7; p++) {
        html += `<tr><td ${periodStyle}>${p}</td>`;
        DAYS.forEach(day => {
            if (p > MAX_PERIODS[day]) { html += `<td ${emptyStyle}></td>`; return; }
            const cell = data[day] ? data[day][p] : null;
            if (!cell) { html += `<td ${emptyStyle}></td>`; return; }

            let subject, sub, bg, room;
            if (Array.isArray(cell)) {
                subject = cell.map(c => c.subject).join('/');
                room = getCellRoom(cell);
                if (mode === "teacher") {
                    sub = cell.map(c => c.class||c["class"]).join('/');
                    bg = getComboColor(cell[0].class||cell[0]["class"], cell[0].subject);
                } else if (mode === "class") {
                    sub = cell.map(c => c.teacher).join(', ');
                    bg = getSubjectBg(cell[0].subject);
                } else {
                    sub = cell.map(c => c.teacher + ' ' + (c.class||c["class"])).join(', ');
                    bg = getSubjectBg(cell[0].subject);
                }
            } else {
                subject = cell.subject;
                room = cell.room || "";
                const cn = cell.class || cell["class"];
                if (mode === "teacher") {
                    sub = cn;
                    bg = getComboColor(cn, subject);
                } else if (mode === "class") {
                    sub = cell.teacher;
                    bg = getSubjectBg(subject);
                } else {
                    sub = (cell.teacher || "") + " " + (cn || "");
                    bg = getSubjectBg(subject);
                }
            }

            html += `<td style="background:${bg};border:1px solid #e2e8f0;height:50px;text-align:center;vertical-align:middle;padding:6px 4px;">`;
            html += `<div style="font-weight:600;color:#1e293b;font-size:11px;line-height:1.3;">${subject}</div>`;
            html += `<div style="font-size:9px;color:#64748b;margin-top:2px;">${sub || ""}</div>`;
            if (room && mode !== "room") {
                html += `<div style="font-size:8px;color:#e67e22;font-weight:600;margin-top:1px;">${room}</div>`;
            }
            html += '</td>';
        });
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

// 이미지용 과목 배경색
function getSubjectBg(subject) {
    return getSubjectDynColor(subject) || "#f8fafc";
}

// 이미지 다운로드
function downloadImage() {
    const tableHTML = buildImageHTML();
    if (!tableHTML) return;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;left:0;top:0;padding:28px 24px 18px;background:#fff;width:560px;z-index:99999;";
    wrapper.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:18px;font-weight:700;color:#4f46e5;">원주여자고등학교</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px;">${currentLabel} 시간표</div>
        </div>
        <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">${tableHTML}</div>
    `;

    document.body.appendChild(wrapper);

    html2canvas(wrapper, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
    }).then(canvas => {
        document.body.removeChild(wrapper);
        const link = document.createElement("a");
        link.download = `시간표_${currentLabel}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        console.error(err);
        document.body.removeChild(wrapper);
        alert("이미지 저장에 실패했습니다.");
    });
}

// 엑셀(.xlsx) 다운로드 - 과목/학반(교사)/특별실 행으로 분리
function downloadExcel() {
    let data;
    if (currentTab === "teacher") {
        data = TIMETABLE_DATA.teachers[document.getElementById("teacher-dropdown").value];
    } else if (currentTab === "class") {
        data = TIMETABLE_DATA.classes[document.getElementById("class-dropdown").value];
    } else {
        data = (TIMETABLE_DATA.rooms || {})[document.getElementById("room-dropdown").value];
    }
    if (!data) return;
    const mode = currentTab;

    const wb = XLSX.utils.book_new();
    const sheetData = [
        [`원주여자고등학교 ${currentLabel} 시간표`],
        [],
        ["교시", "월", "화", "수", "목", "금"],
    ];

    const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // 제목 병합
    ];

    // room 모드가 아닐 때 특별실이 있으면 3행, 없으면 2행
    const hasRoom = mode !== "room";

    for (let p = 1; p <= 7; p++) {
        const subjRow = [p + "교시"];
        const subRow = [""];
        const roomRow = hasRoom ? [""] : null;

        DAYS.forEach(day => {
            if (p > MAX_PERIODS[day]) {
                subjRow.push(""); subRow.push("");
                if (roomRow) roomRow.push("");
                return;
            }
            const cell = data[day] ? data[day][p] : null;
            if (!cell) {
                subjRow.push(""); subRow.push("");
                if (roomRow) roomRow.push("");
                return;
            }

            if (Array.isArray(cell)) {
                subjRow.push(cell.map(c => c.subject).join('/'));
                if (mode === "teacher") subRow.push(cell.map(c => c.class||c["class"]).join('/'));
                else if (mode === "class") subRow.push(cell.map(c => c.teacher).join(', '));
                else subRow.push(cell.map(c => c.teacher + ' ' + (c.class||c["class"])).join(', '));
                if (roomRow) roomRow.push(getCellRoom(cell));
            } else {
                subjRow.push(cell.subject);
                if (mode === "teacher") subRow.push(cell.class||cell["class"]||"");
                else if (mode === "class") subRow.push(cell.teacher||"");
                else subRow.push((cell.teacher||"") + " " + (cell.class||cell["class"]||""));
                if (roomRow) roomRow.push(cell.room||"");
            }
        });

        sheetData.push(subjRow);
        sheetData.push(subRow);
        if (roomRow) sheetData.push(roomRow);

        // 교시 셀 병합
        const rowCount = roomRow ? 3 : 2;
        const startRow = sheetData.length - rowCount;
        merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow + rowCount - 1, c: 0 } });
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!merges"] = merges;

    ws["!cols"] = [
        { wch: 8 },
        { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "시간표");
    XLSX.writeFile(wb, `시간표_${currentLabel}.xlsx`);
}

// 인쇄 - 별도 창에서 깔끔하게 인쇄
function printTimetable() {
    const card = document.querySelector(".table-card");
    if (!card) return;

    const printWin = window.open("", "_blank", "width=800,height=900");
    if (!printWin) { alert("팝업이 차단되었습니다. 팝업을 허용해주세요."); return; }

    // 원본 테이블의 셀 배경색 추출
    const origCells = card.querySelectorAll("td, th");
    const bgColors = [];
    origCells.forEach(cell => {
        bgColors.push(getComputedStyle(cell).backgroundColor);
    });

    const tableHTML = card.innerHTML;

    printWin.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>시간표 인쇄</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
@page { size: A4 portrait; margin: 15mm 12mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans KR', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.print-header { text-align: center; margin-bottom: 16px; }
.print-header h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.print-header p { font-size: 0.9rem; color: #64748b; margin-top: 4px; }
.table-card { border: 2px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th { background: #4f46e5 !important; color: #fff !important; padding: 10px 6px; text-align: center; font-weight: 600; font-size: 0.95rem; letter-spacing: 2px; }
th:first-child { width: 40px; letter-spacing: 0; font-size: 0.8rem; }
td { border: 1px solid #cbd5e1; padding: 8px 4px; text-align: center; vertical-align: middle; height: 56px; }
td:first-child { font-weight: 700; color: #4f46e5; background: #f5f3ff !important; font-size: 0.9rem; }
.cell-subject { font-weight: 600; color: #1e293b; font-size: 0.82rem; line-height: 1.3; }
.cell-sub { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
.cell-room { font-size: 0.65rem; color: #e67e22; font-weight: 600; margin-top: 1px; }
.cell-empty { background: #fafbff !important; }
.print-footer { text-align: center; margin-top: 12px; font-size: 0.7rem; color: #94a3b8; }
</style>
</head><body>
<div class="print-header">
    <h1>원주여자고등학교</h1>
    <p>${currentLabel} 시간표</p>
</div>
<div class="table-card">${tableHTML}</div>
</body></html>`);

    // 배경색 적용
    const newCells = printWin.document.querySelectorAll("td, th");
    newCells.forEach((cell, i) => {
        if (bgColors[i] && bgColors[i] !== "rgba(0, 0, 0, 0)") {
            cell.style.backgroundColor = bgColors[i];
        }
    });

    printWin.document.close();
    printWin.onload = function() {
        printWin.focus();
        printWin.print();
        printWin.onafterprint = function() { printWin.close(); };
    };
}
