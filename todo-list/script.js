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

const storageKey = "todo-list.tasks.v2";
const legacyKey = "todo-list.tasks";
const priorityLabels = { high: "紧急", medium: "普通", low: "轻松" };
const statusLabels = { "not-started": "未开始", "in-progress": "进行中", done: "已完成" };
const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

let currentFilter = "all";
let editingId = null;
let weekStart = startOfWeek(new Date());
let tasks = loadTasks();

function loadTasks() {
  const saved = localStorage.getItem(storageKey);
  if (saved) return JSON.parse(saved);

  const legacy = JSON.parse(localStorage.getItem(legacyKey) || "[]");
  return legacy.map((task) => ({
    id: task.id || createId(),
    text: task.text,
    priority: "medium",
    status: task.done ? "done" : "not-started",
    scheduledAt: "",
    createdAt: new Date().toISOString(),
  }));
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
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

function formatTime(iso) {
  if (!iso) return "未安排时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function startOfWeek(date) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  const day = base.getDay() || 7;
  base.setDate(base.getDate() - day + 1);
  return base;
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
          <span class="badge time-badge">${formatTime(task.scheduledAt)}</span>
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

function renderCalendar() {
  calendar.innerHTML = "";
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayTasks = tasks
      .filter((task) => task.scheduledAt && sameDay(new Date(task.scheduledAt), day))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    const column = document.createElement("section");
    column.className = "day";
    column.innerHTML = `
      <div class="day-head">
        <span class="day-name">${dayNames[i]}</span>
        <span class="day-date">${day.getMonth() + 1}/${day.getDate()}</span>
      </div>
      ${dayTasks.map((task) => `<button class="calendar-task ${task.priority}" type="button" data-id="${task.id}"><span class="calendar-time">${formatTime(task.scheduledAt)}</span>${escapeHtml(task.text)}</button>`).join("")}
    `;
    calendar.appendChild(column);
  }
}

function render() {
  renderTasks();
  renderCalendar();
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  const payload = {
    text,
    priority: priorityInput.value,
    status: statusInput.value,
    scheduledAt: normalizeDateInput(timeInput.value),
  };

  if (editingId) {
    tasks = tasks.map((task) => (task.id === editingId ? { ...task, ...payload, updatedAt: new Date().toISOString() } : task));
  } else {
    tasks.unshift({ id: createId(), ...payload, createdAt: new Date().toISOString() });
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
    tasks = tasks.map((entry) => (entry.id === task.id ? { ...entry, status: nextStatus(entry.status) } : entry));
    saveTasks();
    render();
  }
  if (button.dataset.action === "delete") {
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

document.querySelector("#prev-week").addEventListener("click", () => {
  weekStart.setDate(weekStart.getDate() - 7);
  renderCalendar();
});
document.querySelector("#next-week").addEventListener("click", () => {
  weekStart.setDate(weekStart.getDate() + 7);
  renderCalendar();
});
document.querySelector("#this-week").addEventListener("click", () => {
  weekStart = startOfWeek(new Date());
  renderCalendar();
});

render();
