'use strict';
const taskForm       = document.getElementById('taskForm');
const taskTitleInput  = document.getElementById('taskTitle');
const taskCategorySelect = document.getElementById('taskCategory');
const taskList        = document.getElementById('taskList');
const emptyState       = document.getElementById('emptyState');

const searchInput     = document.getElementById('searchInput');
const categoryFilter  = document.getElementById('categoryFilter');
const clearAllBtn     = document.getElementById('clearAllBtn');

const totalCountEl     = document.getElementById('totalCount');
const pendingCountEl   = document.getElementById('pendingCount');
const completedCountEl = document.getElementById('completedCount');

const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon      = document.getElementById('themeIcon');
const themeLabel     = document.getElementById('themeLabel');

const grandparentBox = document.getElementById('grandparent');
const parentBox      = document.getElementById('parent');
const childBtn       = document.getElementById('child');
const captureToggle  = document.getElementById('captureToggle');
const propagationLog = document.getElementById('propagationLog');
const clearLogBtn    = document.getElementById('clearLogBtn');


/* 2. STATE */
let tasks = [];
let currentSearchTerm = '';
let currentCategoryFilter = 'all';


/* 3. LOCAL STORAGE HELPERS  (Bonus: Local Storage) */
const STORAGE_KEY_TASKS = 'taskline_tasks';
const STORAGE_KEY_THEME = 'taskline_theme';

function saveTasksToStorage() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_TASKS);
  return raw ? JSON.parse(raw) : [];
}

function saveThemeToStorage(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function loadThemeFromStorage() {
  return localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
}


/* 4. UTILITIES */
function generateId() {
  return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function formatTimestamp(ms) {
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}


/* 5. ATTRIBUTES VS PROPERTIES  (Feature 2) */
function demonstrateAttributesVsProperties() {
  console.log('%c--- Attributes vs Properties Demo ---', 'color:#7C6CF6;font-weight:bold;');
  console.log('input.value (live PROPERTY):', taskTitleInput.value);
  console.log('input.getAttribute("value") (original ATTRIBUTE):', taskTitleInput.getAttribute('value'));

  taskTitleInput.value = 'User is typing something new…';
  console.log('After changing .value directly:');
  console.log('  input.value            ->', taskTitleInput.value, '(changed)');
  console.log('  input.getAttribute("value") ->', taskTitleInput.getAttribute('value'), '(still the original HTML attribute!)');

  taskTitleInput.value = '';
  taskTitleInput.setAttribute('value', '');
}


/* 6. RENDERING  (uses DocumentFragment for performance) */

function getVisibleTasks() {
  return tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(currentSearchTerm.toLowerCase());
    const matchesCategory = currentCategoryFilter === 'all' || task.category === currentCategoryFilter;
    return matchesSearch && matchesCategory;
  });
}

function renderTaskList() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = '';

  const fragment = document.createDocumentFragment();
  visibleTasks.forEach((task) => {
    const taskNode = buildTaskElement(task);
    fragment.appendChild(taskNode);
  });

  taskList.appendChild(fragment);

  toggleEmptyState(visibleTasks.length === 0);
  updateStats();
}

function toggleEmptyState(isEmpty) {
  emptyState.classList.toggle('is-visible', isEmpty);
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = total - completed;

  totalCountEl.textContent = String(total);
  pendingCountEl.textContent = String(pending);
  completedCountEl.textContent = String(completed);
}


/* 7. BUILDING A SINGLE TASK CARD  (Feature 1 + Feature 2 + Feature 3) */
function buildTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';

  li.setAttribute('data-id', task.id);
  li.setAttribute('data-status', task.status);
  li.setAttribute('data-category', task.category);

  const main = document.createElement('div');
  main.className = 'task-item__main';

  const titleEl = document.createElement('span');
  titleEl.className = 'task-item__title';
 
  titleEl.appendChild(document.createTextNode(task.title));

  const metaEl = document.createElement('div');
  metaEl.className = 'task-item__meta';

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'badge badge--category';
  categoryBadge.appendChild(document.createTextNode(task.category));

  const statusBadge = document.createElement('span');
  statusBadge.className = 'badge badge--status-' + task.status;
  statusBadge.appendChild(document.createTextNode(
    task.status === 'completed' ? 'Completed' : 'Pending'
  ));

  const timeEl = document.createElement('span');
  timeEl.className = 'task-item__time';
  timeEl.appendChild(document.createTextNode(formatTimestamp(task.createdAt)));
  metaEl.append(categoryBadge, statusBadge, timeEl);

  main.append(titleEl, metaEl);

  // ----- Action buttons -----
  const actions = document.createElement('div');
  actions.className = 'task-item__actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn--ghost btn--sm';
  editBtn.type = 'button';
  editBtn.dataset.action = 'edit';           
  editBtn.appendChild(document.createTextNode('✏️ Edit'));

  const completeBtn = document.createElement('button');
  completeBtn.className = 'btn btn--ghost btn--sm';
  completeBtn.type = 'button';
  completeBtn.dataset.action = 'complete';
  completeBtn.appendChild(document.createTextNode(
    task.status === 'completed' ? '↺ Undo' : '✔ Complete'
  ));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--ghost btn--sm btn--danger';
  deleteBtn.type = 'button';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.appendChild(document.createTextNode('🗑 Delete'));

  actions.append(editBtn, completeBtn, deleteBtn);

  li.appendChild(main);
  li.appendChild(actions);

  return li;
}


/* 8. CREATING A NEW TASK  (Feature 1 + Feature 5 + DOM Manipulation) */
function handleTaskFormSubmit(event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  if (title === '') {
    taskTitleInput.focus();
    return;
  }

  const newTask = {
    id: generateId(),
    title,
    category: taskCategorySelect.value,
    status: 'pending',
    createdAt: Date.now()
  };

  tasks.push(newTask);
  saveTasksToStorage();
  renderTaskList();

  
  const newNode = taskList.querySelector(`[data-id="${newTask.id}"]`);
  if (newNode) {
    taskList.prepend(newNode);

   
    const flash = document.createElement('div');
    flash.className = 'divider-flash';
    newNode.before(flash);
   
    setTimeout(() => flash.remove(), 1200);
  }


  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.appendChild(document.createTextNode(`"${newTask.title}" added to ${newTask.category}.`));
  taskForm.after(toast);
  setTimeout(() => toast.remove(), 2200);

  taskForm.reset();
  taskTitleInput.focus();
}

taskForm.addEventListener('submit', handleTaskFormSubmit);


/* 9. EVENT DELEGATION  (Feature 6) */

taskList.addEventListener('click', (event) => {
  const actionBtn = event.target.closest('button[data-action]');
  if (!actionBtn || !taskList.contains(actionBtn)) return; 
  const taskCard = actionBtn.closest('.task-item');
  if (!taskCard || !taskCard.matches('.task-item')) return;

  const taskId = taskCard.getAttribute('data-id'); 
  const action = actionBtn.dataset.action;         

  if (action === 'delete') {
    handleDeleteTask(taskId, taskCard);
  } else if (action === 'complete') {
    handleToggleComplete(taskId, taskCard);
  } else if (action === 'edit') {
    handleEditTask(taskId, taskCard);
  }
});


/* ---- Delete (Bonus: confirmation before delete) ---- */
function handleDeleteTask(taskId, taskCard) {
  const task = tasks.find((t) => t.id === taskId);
  const confirmed = window.confirm(`Delete "${task ? task.title : 'this task'}"? This can't be undone.`);
  if (!confirmed) return;

  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasksToStorage();

  taskCard.remove();

  updateStats();
  toggleEmptyState(getVisibleTasks().length === 0);
}

/* ---- Complete / Undo toggle ---- */
function handleToggleComplete(taskId, taskCard) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.status = task.status === 'completed' ? 'pending' : 'completed';
  saveTasksToStorage();

  if (task.status === 'completed') {
    taskCard.setAttribute('data-completed-at', String(Date.now()));
  } else if (taskCard.hasAttribute('data-completed-at')) {
    taskCard.removeAttribute('data-completed-at');
  }

 
  const refreshedCard = buildTaskElement(task);
  taskCard.replaceWith(refreshedCard);

  updateStats();
}

/* ---- Edit (Bonus: editable tasks) ---- */
function handleEditTask(taskId, taskCard) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const titleSpan = taskCard.querySelector('.task-item__title');
  if (!titleSpan) return;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'edit-input';
  editInput.value = task.title;
  editInput.setAttribute('value', task.title); 

  
  titleSpan.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const newTitle = editInput.value.trim() || task.title;
    task.title = newTitle;
    saveTasksToStorage();

    const newTitleSpan = document.createElement('span');
    newTitleSpan.className = 'task-item__title';
    newTitleSpan.appendChild(document.createTextNode(newTitle));


    editInput.replaceWith(newTitleSpan);
  }

  editInput.addEventListener('blur', commitEdit, { once: true });
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') editInput.blur();     
    if (e.key === 'Escape') {
      editInput.value = task.title;
      editInput.blur();
    }
  });
}


/*  10. SEARCH + FILTER  (Bonus) */
searchInput.addEventListener('input', (event) => {
  currentSearchTerm = event.target.value;
  renderTaskList();
});

categoryFilter.addEventListener('change', (event) => {
  currentCategoryFilter = event.target.value;
  renderTaskList();
});


/* 11. CLEAR ALL  (Bonus) */
clearAllBtn.addEventListener('click', () => {
  if (tasks.length === 0) return;
  const confirmed = window.confirm('Clear ALL tasks? This cannot be undone.');
  if (!confirmed) return;

  tasks = [];
  saveTasksToStorage();
  renderTaskList();
});


/* 12. THEME TOGGLE  (Feature 4) */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);

  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme === 'light');
  if (theme === 'dark') {
    document.body.classList.add('is-dark-mode');
    document.body.classList.remove('is-light-mode');
  } else {
    document.body.classList.add('is-light-mode');
    document.body.classList.remove('is-dark-mode');
  }

  console.log('body.dataset.theme is now:', document.body.dataset.theme);

  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
  themeToggleBtn.setAttribute('aria-pressed', String(theme === 'light'));

  saveThemeToStorage(theme);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.body.dataset.theme; 
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});


/* 13. EVENT PROPAGATION DEMO  (Feature 7) */

let useCapture = false;

function logToConsolePanel(text, variant) {
  const item = document.createElement('li');
  if (variant) item.classList.add(variant);
  item.appendChild(document.createTextNode(text));
  propagationLog.appendChild(item);
}

function makePropagationHandler(label) {
  return function handler(event) {
    const phase = event.eventPhase === 1 ? 'CAPTURING' : event.eventPhase === 3 ? 'BUBBLING' : 'AT TARGET';
    logToConsolePanel(`${label} (${phase} phase)`, useCapture ? 'log-capture' : 'log-bubble');
    console.log(`${label} — event phase: ${phase}`);
  };
}

function attachPropagationListeners(capture) {
  grandparentBox.removeEventListener('click', grandparentHandler, !capture);
  parentBox.removeEventListener('click', parentHandler, !capture);
  childBtn.removeEventListener('click', childHandler, !capture);

  grandparentBox.addEventListener('click', grandparentHandler, { capture });
  parentBox.addEventListener('click', parentHandler, { capture });
  childBtn.addEventListener('click', childHandler, { capture });
}

const grandparentHandler = makePropagationHandler('Grandparent');
const parentHandler = makePropagationHandler('Parent');
const childHandler = makePropagationHandler('Child');

attachPropagationListeners(useCapture); 

captureToggle.addEventListener('change', (event) => {
  useCapture = event.target.checked;
  attachPropagationListeners(useCapture);
  logToConsolePanel(
    `— switched to ${useCapture ? 'CAPTURING (capture: true)' : 'BUBBLING (default)'} —`
  );
});

clearLogBtn.addEventListener('click', () => {
  propagationLog.innerHTML = '';
});


/* 14. INIT */
function init() {
  applyTheme(loadThemeFromStorage());
  tasks = loadTasksFromStorage();
  renderTaskList();
  demonstrateAttributesVsProperties();
}

init();