const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const priorityInput = document.querySelector("#priority-input");
const statusInput = document.querySelector("#status-input");
const timeInput = document.querySelector("#time-input");
const searchInput = document.querySelector("#search-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const statusFilters = document.querySelectorAll("[data-status-filter]");
const priorityFilters = document.querySelectorAll("[data-priority-filter]");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelEdit = document.querySelector("#cancel-edit");
const calendar = document.querySelector("#calendar");
const calendarMode = document.querySelector("#calendar-mode");
const calendarRange = document.querySelector("#calendar-range");
const lastSaved = document.querySelector("#last-saved");
const importFile = document.querySelector("#import-file");
const newTaskButton = document.querySelector("#new-task");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsOpen = document.querySelector("#settings-open");
const settingDecor = document.querySelector("#setting-decor");
const settingMotion = document.querySelector("#setting-motion");
const settingBarrage = document.querySelector("#setting-barrage");
const settingCompact = document.querySelector("#setting-compact");
const clearCompletedButton = document.querySelector("#clear-completed");
const sceneGirl = document.querySelector("#scene-girl");
const sceneBear = document.querySelector("#scene-bear");
const sceneKitty = document.querySelector("#scene-kitty");
const sceneDora = document.querySelector("#scene-dora");
const workspace = document.querySelector("#workspace");
const mascot = document.querySelector("#mascot");
const widgets = [...document.querySelectorAll("[data-widget]")];
const barrageLayer = document.querySelector("#barrage-layer");
const barrageMessages = ["刘子提醒你加油干！", "刘子提醒你注意劳逸结合", "刘子提醒你该想他了💗", "刘子说今天也要闪闪发光", "刘子提醒你完成一个就奖励自己一下", "刘子说先完成最重要的一件事"];

const storageKey = "todo-list.tasks.v2";
const metaKey = "todo-list.meta.v2";
const legacyKey = "todo-list.tasks";
const settingsKey = "todo-list.settings.v1";
const layoutVersion = 4;
const priorityOrder = ["high", "medium", "low"];
const statusOrder = ["not-started", "in-progress", "done"];
const priorityLabels = { high: "紧急", medium: "普通", low: "轻松" };
const statusLabels = { "not-started": "未开始", "in-progress": "进行中", done: "已完成" };
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
const characterAssets = {
  girl: {
    idle: "assets/characters/sprites/girl-12.png",
    cheer: "assets/characters/sprites/girl-11.png",
    work: "assets/characters/sprites/girl-04.png",
    rest: "assets/characters/sprites/girl-14.png",
  },
  medium: {
    idle: "assets/characters/sprites/bear-01.png",
    focus: "assets/characters/sprites/bear-07.png",
    happy: "assets/characters/sprites/bear-13.png",
    done: "assets/characters/sprites/bear-09.png",
  },
  high: {
    idle: "assets/characters/sprites/pinkcat-05.png",
    focus: "assets/characters/sprites/pinkcat-06.png",
    happy: "assets/characters/sprites/pinkcat-15.png",
    done: "assets/characters/sprites/pinkcat-09.png",
  },
  low: {
    idle: "assets/characters/sprites/bluecat-01.png",
    focus: "assets/characters/sprites/bluecat-07.png",
    happy: "assets/characters/sprites/bluecat-11.png",
    done: "assets/characters/sprites/bluecat-18.png",
  },
};

let currentStatusFilter = "all";
let currentPriorityFilter = "all";
let currentSearch = "";
let editingId = null;
let anchorDate = new Date();
let tasks = loadTasks();
let activeMove = null;
let settings = loadSettings();

function loadTasks() {
  const saved = localStorage.getItem(storageKey);
  if (saved) return normalizeTasks(JSON.parse(saved));
  const legacy = JSON.parse(localStorage.getItem(legacyKey) || "[]");
  return normalizeTasks(legacy.map((task) => ({ id: task.id || createId(), text: task.text, priority: "medium", status: task.done ? "done" : "not-started", scheduledAt: "", createdAt: new Date().toISOString() })));
}

function loadSettings() {
  const defaults = { decor: true, motion: true, barrage: true, compact: false };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function applySettings() {
  document.body.classList.toggle("hide-decor", !settings.decor);
  document.body.classList.toggle("reduce-character-motion", !settings.motion);
  document.body.classList.toggle("compact-table", settings.compact);
  settingDecor.checked = settings.decor;
  settingMotion.checked = settings.motion;
  settingBarrage.checked = settings.barrage;
  settingCompact.checked = settings.compact;
}

function normalizeTasks(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((task) => task && task.text).map((task) => ({
    id: task.id || createId(),
    text: String(task.text),
    priority: priorityOrder.includes(task.priority) ? task.priority : "medium",
    status: statusOrder.includes(task.status) ? task.status : "not-started",
    scheduledAt: task.scheduledAt || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || "",
  }));
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readMeta() { return JSON.parse(localStorage.getItem(metaKey) || "{}"); }
function writeMeta(meta) { localStorage.setItem(metaKey, JSON.stringify({ ...readMeta(), ...meta })); }
function saveTasks() { localStorage.setItem(storageKey, JSON.stringify(tasks)); writeMeta({ lastSavedAt: new Date().toISOString() }); renderSavedState(); }
function renderSavedState() {
  const meta = readMeta();
  lastSaved.textContent = meta.lastSavedAt ? `上次保存：${formatDateTime(meta.lastSavedAt)}` : tasks.length ? "已从本机读取，尚未再次保存" : "尚未保存";
  document.querySelector(".backup-actions")?.setAttribute("data-last", meta.lastSavedAt ? formatDateTime(meta.lastSavedAt) : "尚未保存");
}

function defaultLayout() {
  const width = Math.max(workspace.clientWidth, 980);
  const leftWidth = Math.max(320, Math.round(width * 0.28));
  const rightStart = leftWidth + 44;
  const rightWidth = width - rightStart - 16;
  const sceneWidth = Math.round(rightWidth * 0.62);
  return {
    calendar: { x: 16, y: 16, w: leftWidth, h: 404 },
    backup: { x: 16, y: 438, w: leftWidth, h: 350 },
    board: { x: rightStart, y: 16, w: rightWidth, h: 390 },
    scene: { x: rightStart, y: 422, w: sceneWidth, h: 366 },
    composer: { x: rightStart + sceneWidth + 16, y: 422, w: rightWidth - sceneWidth - 16, h: 366 },
  };
}

function getLayout() {
  const meta = readMeta();
  return meta.layoutVersion === layoutVersion && meta.widgetLayout ? meta.widgetLayout : defaultLayout();
}

function saveLayout(layout) { writeMeta({ layoutVersion, widgetLayout: layout }); }

function applyLayout() {
  if (window.matchMedia("(max-width: 900px)").matches) return;
  const layout = getLayout();
  const bounds = workspace.getBoundingClientRect();
  widgets.forEach((widget) => {
    const key = widget.dataset.widget;
    const item = constrainRect(layout[key] || defaultLayout()[key], bounds.width, bounds.height || 920);
    Object.assign(widget.style, { left: `${item.x}px`, top: `${item.y}px`, width: `${item.w}px`, height: `${item.h}px` });
    layout[key] = item;
  });
  const maxBottom = Math.max(...Object.values(layout).map((item) => item.y + item.h));
  workspace.style.minHeight = `${Math.max(860, maxBottom + 24)}px`;
  saveLayout(layout);
}

function constrainRect(rect, maxW, maxH) {
  const minW = 260;
  const minH = 160;
  const w = Math.max(minW, Math.min(rect.w, maxW - 24));
  const h = Math.max(minH, Math.min(rect.h, Math.max(maxH, rect.y + rect.h) - 16));
  const x = Math.max(8, Math.min(rect.x, maxW - w - 8));
  const y = Math.max(8, Math.min(rect.y, Math.max(maxH, rect.y + h + 24) - h - 8));
  return { x, y, w, h };
}

function normalizeDateInput(value) { return value ? new Date(value).toISOString() : ""; }
function toInputValue(iso) { if (!iso) return ""; const date = new Date(iso); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function formatDateTime(iso) { return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
function formatMonthTitle(date) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(date); }
function startOfDay(date) { const base = new Date(date); base.setHours(0, 0, 0, 0); return base; }
function startOfWeek(date) { const base = startOfDay(date); const day = base.getDay() || 7; base.setDate(base.getDate() - day + 1); return base; }
function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addDays(date, amount) { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
function addMonths(date, amount) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isToday(iso) { return sameDay(new Date(iso), new Date()); }

function visibleTasks() {
  const keyword = currentSearch.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesStatus = currentStatusFilter === "all" || task.status === currentStatusFilter;
    const matchesPriority = currentPriorityFilter === "all" || task.priority === currentPriorityFilter;
    const matchesSearch = !keyword || task.text.toLowerCase().includes(keyword);
    return matchesStatus && matchesPriority && matchesSearch;
  });
}

function resetForm() {
  editingId = null; form.reset(); priorityInput.value = "medium"; statusInput.value = "not-started"; formTitle.textContent = "编辑任务"; submitButton.textContent = "保存到清单"; cancelEdit.classList.add("hidden");
}

function renderTasks() {
  list.innerHTML = "";
  const items = visibleTasks();
  const openCount = tasks.filter((task) => task.status !== "done").length;
  count.textContent = `${openCount} 项待推进 · 共 ${tasks.length} 项`;
  if (!items.length) {
    const empty = document.createElement("li"); empty.className = "empty"; empty.textContent = tasks.length ? "这个筛选下暂时没有任务" : "小女孩还在等你的第一项任务"; list.appendChild(empty); return;
  }
  items.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task ${task.status === "done" ? "done" : ""}`;
    item.dataset.id = task.id;
    const avatarState = task.status === "done" ? "done" : task.status === "in-progress" ? "focus" : "idle";
    item.innerHTML = `<button class="task-check" type="button" data-action="toggle" aria-label="切换完成状态">${task.status === "done" ? "✓" : ""}</button><div class="task-main"><img class="task-avatar-img ${task.priority}" src="${characterAssets[task.priority][avatarState]}" alt="${priorityLabels[task.priority]}任务角色" /><p class="task-title">${escapeHtml(task.text)}</p></div><button class="badge tag-button priority-${task.priority}" type="button" data-action="priority">${priorityLabels[task.priority]}</button><button class="badge tag-button status-${task.status}" type="button" data-action="status">${statusLabels[task.status]}</button><span class="table-time ${task.scheduledAt && isToday(task.scheduledAt) ? "today-time" : ""}">${task.scheduledAt ? formatDateTime(task.scheduledAt) : "未安排"}</span><div class="task-actions"><button class="icon-btn" type="button" data-action="edit" aria-label="编辑">✎</button><button class="icon-btn danger" type="button" data-action="delete" aria-label="删除">⌫</button></div>`;
    list.appendChild(item);
  });
}

function getMonthSequence() {
  const mode = calendarMode.value;
  if (mode === "week") return [{ type: "week", start: startOfWeek(anchorDate) }];
  const count = mode === "year" ? 12 : mode === "quarter" ? 3 : 1;
  const first = mode === "year" ? new Date(anchorDate.getFullYear(), 0, 1) : startOfMonth(anchorDate);
  return Array.from({ length: count }, (_, index) => ({ type: "month", start: addMonths(first, index) }));
}

function renderCalendar() {
  const mode = calendarMode.value;
  const sections = getMonthSequence();
  calendar.className = `calendar ${mode}`;
  calendar.innerHTML = mode === "quarter" || mode === "year" ? renderSummary(sections, mode) : sections.map((section) => section.type === "week" ? renderWeek(section.start) : renderMonth(section.start)).join("");
  calendarRange.textContent = getCalendarRangeText(sections, mode);
}

function renderWeek(start) { const days = Array.from({ length: 7 }, (_, index) => addDays(start, index)); return `<section class="month-card"><div class="month-title">${formatMonthTitle(start)} · 周视图</div>${renderDayGrid(days, false)}</section>`; }
function renderMonth(start) { const firstDayOffset = (start.getDay() + 6) % 7; const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(); const blanks = Array.from({ length: firstDayOffset }, () => null); const days = Array.from({ length: daysInMonth }, (_, index) => new Date(start.getFullYear(), start.getMonth(), index + 1)); return `<section class="month-card"><div class="month-title">${formatMonthTitle(start)}</div>${renderDayGrid([...blanks, ...days], true)}</section>`; }
function renderDayGrid(days, includeWeekdays) { const headers = includeWeekdays ? weekDays.map((day) => `<div class="weekday">${day}</div>`).join("") : ""; const cells = days.map((day) => day ? renderDay(day) : `<div class="day blank"></div>`).join(""); return `<div class="month-grid">${headers}${cells}</div>`; }
function renderDay(day) {
  const dayTasks = tasks.filter((task) => task.scheduledAt && sameDay(new Date(task.scheduledAt), day)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const todayClass = sameDay(day, new Date()) ? " today" : "";
  return `<div class="day${todayClass}"><div class="day-head"><span class="day-date">${day.getDate()}</span>${dayTasks.length ? `<span class="day-count">${dayTasks.length} 项</span>` : ""}</div>${dayTasks.slice(0, 4).map((task) => `<button class="calendar-task ${task.priority} ${task.status === "done" ? "done" : ""}" type="button" data-id="${task.id}"><span class="calendar-time">${formatDateTime(task.scheduledAt)} · ${statusLabels[task.status]}</span>${escapeHtml(task.text)}</button>`).join("")}${dayTasks.length > 4 ? `<span class="day-count">还有 ${dayTasks.length - 4} 项</span>` : ""}</div>`;
}

function renderSummary(sections, mode) {
  return `<div class="summary-list ${mode}">${sections.map((section) => {
    const start = section.start; const end = addMonths(start, 1);
    const monthTasks = tasks.filter((task) => task.scheduledAt && new Date(task.scheduledAt) >= start && new Date(task.scheduledAt) < end).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return `<section class="summary-card"><div class="summary-title"><span>${formatMonthTitle(start)}</span><span>${monthTasks.length} 项</span></div><div class="summary-body">${monthTasks.length ? monthTasks.map((task) => `<button class="summary-task ${task.status === "done" ? "done" : ""}" type="button" data-id="${task.id}"><span>${formatDateTime(task.scheduledAt)}</span><span>${escapeHtml(task.text)} · ${statusLabels[task.status]}</span><span class="summary-dot ${task.priority}"></span></button>`).join("") : `<span class="summary-empty">这个月还没有安排</span>`}</div></section>`;
  }).join("")}</div>`;
}

function getCalendarRangeText(sections, mode) {
  if (mode === "week") { const start = sections[0].start; const end = addDays(start, 6); return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()} · 已安排时间的任务`; }
  if (mode === "year") return `${anchorDate.getFullYear()} 年摘要 · 按月份查看安排`;
  if (mode === "quarter") return `${formatMonthTitle(sections[0].start)} - ${formatMonthTitle(sections[2].start)} · 三个月摘要`;
  return `${formatMonthTitle(sections[0].start)} · 已安排时间的任务`;
}

function render() { applySettings(); renderSavedState(); applyLayout(); renderTasks(); renderCalendar(); }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]); }
function startEdit(task) { editingId = task.id; taskInput.value = task.text; priorityInput.value = task.priority; statusInput.value = task.status; timeInput.value = toInputValue(task.scheduledAt); formTitle.textContent = "编辑任务"; submitButton.textContent = "保存修改"; cancelEdit.classList.remove("hidden"); taskInput.focus(); }
function cycleValue(value, options) { return options[(options.indexOf(value) + 1) % options.length]; }
function celebrate(taskId = null) {
  if (!settings.motion) return;
  mascot.classList.remove("celebrate");
  void mascot.offsetWidth;
  mascot.classList.add("celebrate");
  sceneGirl.src = characterAssets.girl.cheer;
  sceneBear.src = characterAssets.medium.happy;
  sceneKitty.src = characterAssets.high.happy;
  sceneDora.src = characterAssets.low.happy;
  if (taskId) {
    const avatar = document.querySelector(`.task[data-id="${taskId}"] .task-avatar-img`);
    if (avatar) {
      avatar.classList.remove("party");
      const task = tasks.find((entry) => entry.id === taskId);
      if (task) avatar.src = characterAssets[task.priority].happy;
      void avatar.offsetWidth;
      avatar.classList.add("party");
    }
  }
  window.setTimeout(() => {
    mascot.classList.remove("celebrate");
    sceneGirl.src = characterAssets.girl.idle;
    sceneBear.src = characterAssets.medium.focus;
    sceneKitty.src = characterAssets.high.focus;
    sceneDora.src = characterAssets.low.focus;
    renderTasks();
  }, 1200);
}

function launchBarrage() {
  if (!settings.barrage) return;
  const message = barrageMessages[Math.floor(Math.random() * barrageMessages.length)];
  const item = document.createElement("div");
  item.className = "barrage";
  item.textContent = message;
  item.style.top = `${Math.floor(18 + Math.random() * 58)}vh`;
  barrageLayer.appendChild(item);
  window.setTimeout(() => item.remove(), 7200);
}
function updateTask(id, patch) { const before = tasks.find((task) => task.id === id); tasks = tasks.map((task) => task.id === id ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task); saveTasks(); renderTasks(); renderCalendar(); if (before?.status !== "done" && patch.status === "done") celebrate(id); }
function shiftCalendar(direction) { const mode = calendarMode.value; const amount = mode === "week" ? 7 * direction : mode === "quarter" ? 3 * direction : mode === "year" ? 12 * direction : direction; anchorDate = mode === "week" ? addDays(anchorDate, amount) : addMonths(anchorDate, amount); renderCalendar(); }
function exportBackup() { const payload = { app: "liuzi-todo", version: 2, exportedAt: new Date().toISOString(), tasks }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `liuzi-todo-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); }
function importBackup(file) { const reader = new FileReader(); reader.addEventListener("load", () => { try { const parsed = JSON.parse(reader.result); const importedTasks = normalizeTasks(Array.isArray(parsed) ? parsed : parsed.tasks); if (!importedTasks.length) throw new Error("没有可导入的任务"); if (!confirm(`将导入 ${importedTasks.length} 项任务，并替换当前清单。继续吗？`)) return; tasks = importedTasks; saveTasks(); resetForm(); render(); } catch (error) { alert(`导入失败：${error.message}`); } finally { importFile.value = ""; } }); reader.readAsText(file, "utf-8"); }

function startWidgetMove(event, mode) {
  if (window.matchMedia("(max-width: 900px)").matches) return;
  const widget = event.target.closest("[data-widget]");
  const rect = widget.getBoundingClientRect();
  activeMove = { mode, widget, key: widget.dataset.widget, startX: event.clientX, startY: event.clientY, rect: { x: widget.offsetLeft, y: widget.offsetTop, w: rect.width, h: rect.height } };
  widget.classList.add("dragging");
  event.target.setPointerCapture(event.pointerId);
}
function updateWidgetMove(event) {
  if (!activeMove) return;
  const layout = getLayout();
  const bounds = workspace.getBoundingClientRect();
  const dx = event.clientX - activeMove.startX;
  const dy = event.clientY - activeMove.startY;
  const next = activeMove.mode === "drag"
    ? { ...activeMove.rect, x: activeMove.rect.x + dx, y: activeMove.rect.y + dy }
    : { ...activeMove.rect, w: activeMove.rect.w + dx, h: activeMove.rect.h + dy };
  layout[activeMove.key] = constrainRect(next, bounds.width, Math.max(bounds.height, next.y + next.h + 24));
  saveLayout(layout);
  applyLayout();
}
function endWidgetMove(event) { if (!activeMove) return; activeMove.widget.classList.remove("dragging"); try { event.target.releasePointerCapture(event.pointerId); } catch {} activeMove = null; }

form.addEventListener("submit", (event) => { event.preventDefault(); const text = taskInput.value.trim(); if (!text) return; const payload = { text, priority: priorityInput.value, status: statusInput.value, scheduledAt: normalizeDateInput(timeInput.value) }; const completed = payload.status === "done"; if (editingId) { const before = tasks.find((task) => task.id === editingId); tasks = tasks.map((task) => task.id === editingId ? { ...task, ...payload, updatedAt: new Date().toISOString() } : task); if (before?.status !== "done" && completed) celebrate(editingId); } else { tasks.unshift({ id: createId(), ...payload, createdAt: new Date().toISOString(), updatedAt: "" }); if (completed) celebrate(); launchBarrage(); } saveTasks(); resetForm(); render(); });
cancelEdit.addEventListener("click", resetForm);
list.addEventListener("click", (event) => { const button = event.target.closest("button"); const item = event.target.closest(".task"); if (!button || !item) return; const task = tasks.find((entry) => entry.id === item.dataset.id); if (!task) return; if (button.dataset.action === "edit") startEdit(task); if (button.dataset.action === "priority") updateTask(task.id, { priority: cycleValue(task.priority, priorityOrder) }); if (button.dataset.action === "status") updateTask(task.id, { status: cycleValue(task.status, statusOrder) }); if (button.dataset.action === "toggle") updateTask(task.id, { status: task.status === "done" ? "not-started" : "done" }); if (button.dataset.action === "delete") { if (!confirm("确定删除这项任务吗？")) return; tasks = tasks.filter((entry) => entry.id !== task.id); saveTasks(); if (editingId === task.id) resetForm(); render(); } });
calendar.addEventListener("click", (event) => { const button = event.target.closest(".calendar-task, .summary-task"); if (!button) return; const task = tasks.find((entry) => entry.id === button.dataset.id); if (task) startEdit(task); });
statusFilters.forEach((button) => button.addEventListener("click", () => { currentStatusFilter = button.dataset.statusFilter; statusFilters.forEach((item) => item.classList.toggle("active", item === button)); renderTasks(); }));
priorityFilters.forEach((button) => button.addEventListener("click", () => { currentPriorityFilter = button.dataset.priorityFilter; priorityFilters.forEach((item) => item.classList.toggle("active", item === button)); renderTasks(); }));
searchInput.addEventListener("input", () => { currentSearch = searchInput.value; renderTasks(); });
newTaskButton.addEventListener("click", () => { resetForm(); taskInput.focus(); });
settingsOpen.addEventListener("click", () => settingsDialog.showModal());
[settingDecor, settingMotion, settingBarrage, settingCompact].forEach((input) => {
  input.addEventListener("change", () => {
    settings = {
      decor: settingDecor.checked,
      motion: settingMotion.checked,
      barrage: settingBarrage.checked,
      compact: settingCompact.checked,
    };
    saveSettings();
    applySettings();
  });
});
clearCompletedButton.addEventListener("click", () => {
  const doneCount = tasks.filter((task) => task.status === "done").length;
  if (!doneCount) return;
  if (!confirm(`确定清理 ${doneCount} 项已完成任务吗？`)) return;
  tasks = tasks.filter((task) => task.status !== "done");
  saveTasks();
  resetForm();
  render();
});
calendarMode.addEventListener("change", () => { anchorDate = new Date(); renderCalendar(); });
document.querySelector("#prev-period").addEventListener("click", () => shiftCalendar(-1));
document.querySelector("#next-period").addEventListener("click", () => shiftCalendar(1));
document.querySelector("#current-period").addEventListener("click", () => { anchorDate = new Date(); renderCalendar(); });
document.querySelector("#export-data").addEventListener("click", exportBackup);
document.querySelector("#import-trigger").addEventListener("click", () => importFile.click());
document.querySelector("#reset-layout").addEventListener("click", () => { writeMeta({ layoutVersion, widgetLayout: defaultLayout() }); applyLayout(); });
importFile.addEventListener("change", () => { if (importFile.files[0]) importBackup(importFile.files[0]); });
widgets.forEach((widget) => { widget.querySelector("[data-drag-handle]").addEventListener("pointerdown", (event) => { if (event.target.closest("button, select, input")) return; startWidgetMove(event, "drag"); }); widget.querySelector("[data-resize-grip]").addEventListener("pointerdown", (event) => startWidgetMove(event, "resize")); });
window.addEventListener("pointermove", updateWidgetMove);
window.addEventListener("pointerup", endWidgetMove);
window.addEventListener("resize", applyLayout);

render();


