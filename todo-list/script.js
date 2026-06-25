const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const priorityInput = document.querySelector("#priority-input");
const statusInput = document.querySelector("#status-input");
const timeInput = document.querySelector("#time-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const filters = document.querySelectorAll(".filter");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelEdit = document.querySelector("#cancel-edit");
const calendar = document.querySelector("#calendar");
const calendarMode = document.querySelector("#calendar-mode");
const calendarRange = document.querySelector("#calendar-range");
const lastSaved = document.querySelector("#last-saved");
const importFile = document.querySelector("#import-file");

const storageKey = "todo-list.tasks.v2";
const metaKey = "todo-list.meta.v2";
const legacyKey = "todo-list.tasks";
const priorityLabels = { high: "紧急", medium: "普通", low: "轻松" };
const statusLabels = { "not-started": "未开始", "in-progress": "进行中", done: "已完成" };
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

let currentFilter = "all";
let editingId = null;
let anchorDate = new Date();
let tasks = loadTasks();

function loadTasks() {
  const saved = localStorage.getItem(storageKey);
  if (saved) return normalizeTasks(JSON.parse(saved));

  const legacy = JSON.parse(localStorage.getItem(legacyKey) || "[]");
  return normalizeTasks(legacy.map((task) => ({
    id: task.id || createId(),
    text: task.text,
    priority: "medium",
    status: task.done ? "done" : "not-started",
    scheduledAt: "",
    createdAt: new Date().toISOString(),
  })));
}

function normalizeTasks(input) {
  if (!Array.isArray(input)) return [];
  return input.filter((task) => task && task.text).map((task) => ({
    id: task.id || createId(),
    text: String(task.text),
    priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium",
    status: ["not-started", "in-progress", "done"].includes(task.status) ? task.status : "not-started",
    scheduledAt: task.scheduledAt || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || "",
  }));
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readMeta() {
  return JSON.parse(localStorage.getItem(metaKey) || "{}");
}

function writeMeta(meta) {
  localStorage.setItem(metaKey, JSON.stringify({ ...readMeta(), ...meta }));
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
  writeMeta({ lastSavedAt: new Date().toISOString() });
  renderSavedState();
}

function renderSavedState() {
  const meta = readMeta();
  if (!meta.lastSavedAt) {
    lastSaved.textContent = tasks.length ? "已从本机读取，尚未再次保存" : "尚未保存";
    return;
  }
  lastSaved.textContent = `上次保存：${formatDateTime(meta.lastSavedAt)}`;
}

function normalizeDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function toInputValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(date);
}

function startOfDay(date) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  return base;
}

function startOfWeek(date) {
  const base = startOfDay(date);
  const day = base.getDay() || 7;
  base.setDate(base.getDate() - day + 1);
  return base;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function visibleTasks() {
  if (currentFilter === "all") return tasks;
  return tasks.filter((task) => task.status === currentFilter);
}

function resetForm() {
  editingId = null;
  form.reset();
  priorityInput.value = "medium";
  statusInput.value = "not-started";
  formTitle.textContent = "添加任务";
  submitButton.textContent = "添加到清单";
  cancelEdit.classList.add("hidden");
}

function renderTasks() {
  list.innerHTML = "";
  const items = visibleTasks();
  const openCount = tasks.filter((task) => task.status !== "done").length;
  count.textContent = `${openCount} 项待推进 · 共 ${tasks.length} 项`;

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = tasks.length === 0 ? "噜噜还没有收到任务" : "这个分类里暂时没有任务";
    list.appendChild(empty);
    return;
  }

  items.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task ${task.status === "done" ? "done" : ""}`;
    item.dataset.id = task.id;
    item.innerHTML = `
      <div class="task-main">
        <p class="task-title">${escapeHtml(task.text)}</p>
        <div class="badges">
          <span class="badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
          <span class="badge status-${task.status}">${statusLabels[task.status]}</span>
          <span class="badge time-badge">${task.scheduledAt ? formatDateTime(task.scheduledAt) : "未安排时间"}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" type="button" data-action="edit">编辑</button>
        <button class="icon-btn" type="button" data-action="next">推进</button>
        <button class="icon-btn danger" type="button" data-action="delete">删除</button>
      </div>
    `;
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
  calendar.innerHTML = sections.map((section) => section.type === "week" ? renderWeek(section.start) : renderMonth(section.start)).join("");
  calendarRange.textContent = getCalendarRangeText(sections, mode);
}

function renderWeek(start) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return `<section class="month-card"><div class="month-title">${formatMonthTitle(start)} · 周视图</div>${renderDayGrid(days, false)}</section>`;
}

function renderMonth(start) {
  const firstDayOffset = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOffset }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(start.getFullYear(), start.getMonth(), index + 1));
  return `<section class="month-card"><div class="month-title">${formatMonthTitle(start)}</div>${renderDayGrid([...blanks, ...days], true)}</section>`;
}

function renderDayGrid(days, includeWeekdays) {
  const headers = includeWeekdays ? weekDays.map((day) => `<div class="weekday">${day}</div>`).join("") : "";
  const cells = days.map((day) => day ? renderDay(day) : `<div class="day blank"></div>`).join("");
  return `<div class="month-grid">${headers}${cells}</div>`;
}

function renderDay(day) {
  const dayTasks = tasks
    .filter((task) => task.scheduledAt && sameDay(new Date(task.scheduledAt), day))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const todayClass = sameDay(day, new Date()) ? " today" : "";
  return `
    <div class="day${todayClass}">
      <div class="day-head"><span class="day-date">${day.getDate()}</span>${dayTasks.length ? `<span class="day-count">${dayTasks.length} 项</span>` : ""}</div>
      ${dayTasks.map((task) => `<button class="calendar-task ${task.priority}" type="button" data-id="${task.id}"><span class="calendar-time">${formatDateTime(task.scheduledAt)}</span>${escapeHtml(task.text)}</button>`).join("")}
    </div>
  `;
}

function getCalendarRangeText(sections, mode) {
  if (mode === "week") {
    const start = sections[0].start;
    const end = addDays(start, 6);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()} · 已安排时间的任务`;
  }
  if (mode === "year") return `${anchorDate.getFullYear()} 年 · 已安排时间的任务`;
  const first = sections[0].start;
  const last = sections[sections.length - 1].start;
  return sections.length === 1 ? `${formatMonthTitle(first)} · 已安排时间的任务` : `${formatMonthTitle(first)} - ${formatMonthTitle(last)} · 已安排时间的任务`;
}

function render() {
  renderSavedState();
  renderTasks();
  renderCalendar();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function startEdit(task) {
  editingId = task.id;
  taskInput.value = task.text;
  priorityInput.value = task.priority;
  statusInput.value = task.status;
  timeInput.value = toInputValue(task.scheduledAt);
  formTitle.textContent = "编辑任务";
  submitButton.textContent = "保存修改";
  cancelEdit.classList.remove("hidden");
  taskInput.focus();
}

function nextStatus(status) {
  if (status === "not-started") return "in-progress";
  if (status === "in-progress") return "done";
  return "not-started";
}

function shiftCalendar(direction) {
  const mode = calendarMode.value;
  const amount = mode === "week" ? 7 * direction : mode === "quarter" ? 3 * direction : mode === "year" ? 12 * direction : direction;
  anchorDate = mode === "week" ? addDays(anchorDate, amount) : addMonths(anchorDate, amount);
  renderCalendar();
}

function exportBackup() {
  const payload = { app: "lulu-todo", version: 2, exportedAt: new Date().toISOString(), tasks };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `lulu-todo-backup-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedTasks = normalizeTasks(Array.isArray(parsed) ? parsed : parsed.tasks);
      if (!importedTasks.length) throw new Error("没有可导入的任务");
      if (!confirm(`将导入 ${importedTasks.length} 项任务，并替换当前清单。继续吗？`)) return;
      tasks = importedTasks;
      saveTasks();
      resetForm();
      render();
    } catch (error) {
      alert(`导入失败：${error.message}`);
    } finally {
      importFile.value = "";
    }
  });
  reader.readAsText(file, "utf-8");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  const payload = { text, priority: priorityInput.value, status: statusInput.value, scheduledAt: normalizeDateInput(timeInput.value) };
  if (editingId) {
    tasks = tasks.map((task) => (task.id === editingId ? { ...task, ...payload, updatedAt: new Date().toISOString() } : task));
  } else {
    tasks.unshift({ id: createId(), ...payload, createdAt: new Date().toISOString(), updatedAt: "" });
  }
  saveTasks();
  resetForm();
  render();
});

cancelEdit.addEventListener("click", resetForm);

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const item = event.target.closest(".task");
  if (!button || !item) return;
  const task = tasks.find((entry) => entry.id === item.dataset.id);
  if (!task) return;
  if (button.dataset.action === "edit") startEdit(task);
  if (button.dataset.action === "next") {
    tasks = tasks.map((entry) => (entry.id === task.id ? { ...entry, status: nextStatus(entry.status), updatedAt: new Date().toISOString() } : entry));
    saveTasks();
    render();
  }
  if (button.dataset.action === "delete") {
    if (!confirm("确定删除这项任务吗？")) return;
    tasks = tasks.filter((entry) => entry.id !== task.id);
    saveTasks();
    if (editingId === task.id) resetForm();
    render();
  }
});

calendar.addEventListener("click", (event) => {
  const button = event.target.closest(".calendar-task");
  if (!button) return;
  const task = tasks.find((entry) => entry.id === button.dataset.id);
  if (task) startEdit(task);
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    renderTasks();
  });
});

calendarMode.addEventListener("change", () => { anchorDate = new Date(); renderCalendar(); });
document.querySelector("#prev-period").addEventListener("click", () => shiftCalendar(-1));
document.querySelector("#next-period").addEventListener("click", () => shiftCalendar(1));
document.querySelector("#current-period").addEventListener("click", () => { anchorDate = new Date(); renderCalendar(); });
document.querySelector("#export-data").addEventListener("click", exportBackup);
document.querySelector("#import-trigger").addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => { if (importFile.files[0]) importBackup(importFile.files[0]); });

render();
