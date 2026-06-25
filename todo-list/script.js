const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const clearDone = document.querySelector("#clear-done");
const filters = document.querySelectorAll(".filter");
const today = document.querySelector("#today");

const storageKey = "todo-list.tasks";
let tasks = JSON.parse(localStorage.getItem(storageKey) || "[]");
let currentFilter = "all";

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

today.textContent = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short",
}).format(new Date());

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function visibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.done);
  }

  if (currentFilter === "done") {
    return tasks.filter((task) => task.done);
  }

  return tasks;
}

function render() {
  list.innerHTML = "";
  const items = visibleTasks();

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = tasks.length === 0 ? "还没有任务" : "这个筛选下没有任务";
    list.appendChild(empty);
  } else {
    items.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task${task.done ? " done" : ""}`;
      item.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.ariaLabel = "切换完成状态";

      const text = document.createElement("span");
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.className = "delete";
      remove.type = "button";
      remove.textContent = "×";
      remove.ariaLabel = "删除任务";

      item.append(checkbox, text, remove);
      list.appendChild(item);
    });
  }

  const activeCount = tasks.filter((task) => !task.done).length;
  count.textContent = `${activeCount} 项待完成`;
  clearDone.disabled = !tasks.some((task) => task.done);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: createId(),
    text,
    done: false,
  });

  input.value = "";
  saveTasks();
  render();
});

list.addEventListener("click", (event) => {
  const item = event.target.closest(".task");

  if (!item) {
    return;
  }

  if (event.target.matches("input")) {
    tasks = tasks.map((task) =>
      task.id === item.dataset.id ? { ...task, done: event.target.checked } : task,
    );
  }

  if (event.target.matches(".delete")) {
    tasks = tasks.filter((task) => task.id !== item.dataset.id);
  }

  saveTasks();
  render();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  render();
});

render();
