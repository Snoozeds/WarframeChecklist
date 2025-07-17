// Task data with categories
const dailyTasks = {
    "Daily Activities": [
        "Daily login reward",
        "Sortie Missions",
        "Daily Focus Cap",
        "Steel Path Incursions"
    ],
    "Resource Crafting": [
        "Collect & Craft Forma",
        "Craft: Mutagen Mass",
        "Craft: Fieldron",
        "Craft: Detonite Injector",
        "Craft: Other resources/items"
    ],
    "Syndicate Standing": [
        "Daily standing cap with pledged syndicates",
        "Gain standing: Cephalon Symaris - Relay",
        "Gain standing: Ostron - Cetus",
        "Gain standing: The Quills - Cetus",
        "Gain standing: Solaris United - Fortuna",
        "Gain standing: Vox Solaris - Fortuna",
        "Gain standing: Ventkids - Fortuna",
        "Gain standing: Entrati - Necralisk",
        "Gain standing: Necraloid - Necralisk",
        "Gain standing: The Holdfasts - Chrysalith",
        "Gain standing: Cavia - Sanctum Anatomica",
        "Gain standing: The Hex - Höllvania Central Mall",
        "Spend syndicate standing"
    ]
};

const weeklyTasks = {
    "Nightwave": [
        "Weekly Nightwave missions",
        "Spend Nightwave credits"
    ],
    "Weekly Missions": [
        "Ayatan Treasure Hunt",
        "Help Clem - Relay",
        "Break Narmer Mission",
        "Archon Hunt",
        "Netracell missions"
    ],
    "Duviri Activities": [
        "Duviri Circuit",
        "Duviri Steel Path Circuit"
    ],
    "Special Activities": [
        "Spend Riven Silvers - Iron Wake",
        "Buy weekly Kuva with Voidplumes - Zariman",
        "Spend Steel Essence with Teshin's shop",
        "Buy archon shard from Bird 3",
        "Elite Deep Archimedea - Necraloid",
        "Elite Temporal Archimedea - Kaya",
        "1999 Calendar"
    ]
};

let taskIdCounter = 0;
let customTasks = { daily: [], weekly: [] };
let hideCompletedTasks = { daily: false, weekly: false };

function getNextTaskId() {
    return taskIdCounter++;
}

// Local Storage keys
const STORAGE_KEYS = {
    DAILY_COMPLETED: 'warframe_daily_completed',
    WEEKLY_COMPLETED: 'warframe_weekly_completed',
    CUSTOM_TASKS: 'warframe_custom_tasks',
    LAST_DAILY_RESET: 'warframe_last_daily_reset',
    LAST_WEEKLY_RESET: 'warframe_last_weekly_reset',
    HIDDEN_TASKS: 'warframe_hidden_tasks',
    DAILY_LAYOUT: 'warframe_layout_daily',
    WEEKLY_LAYOUT: 'warframe_layout_weekly'
};

// Storage management functions
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Date utility functions
function getDateString() {
    const date = new Date();
    return date.getUTCFullYear() + '-' +
        String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(date.getUTCDate()).padStart(2, '0');
}

function getWeekNumber() {
    const date = new Date();
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const firstDayOfYear = new Date(utcDate.getUTCFullYear(), 0, 1);
    const pastDaysOfYear = (utcDate - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7);
}

function getWeekString() {
    const date = new Date();
    return `${date.getUTCFullYear()}-W${getWeekNumber()}`;
}

// Reset functions
function checkAndResetDaily() {
    const today = getDateString();
    const lastReset = loadFromStorage(STORAGE_KEYS.LAST_DAILY_RESET);

    if (lastReset !== today) {
        saveToStorage(STORAGE_KEYS.DAILY_COMPLETED, {});
        saveToStorage(STORAGE_KEYS.LAST_DAILY_RESET, today);
        console.log('Daily tasks reset for', today);
        return true;
    }
    return false;
}

function checkAndResetWeekly() {
    const currentWeek = getWeekString();
    const lastReset = loadFromStorage(STORAGE_KEYS.LAST_WEEKLY_RESET);

    if (lastReset !== currentWeek) {
        saveToStorage(STORAGE_KEYS.WEEKLY_COMPLETED, {});
        saveToStorage(STORAGE_KEYS.LAST_WEEKLY_RESET, currentWeek);
        console.log('Weekly tasks reset for', currentWeek);
        return true;
    }
    return false;
}

// Task completion storage
function saveTaskCompletion(taskId, completed, type) {
    const key = type === 'daily' ? STORAGE_KEYS.DAILY_COMPLETED : STORAGE_KEYS.WEEKLY_COMPLETED;
    const completedTasks = loadFromStorage(key, {});

    if (completed) {
        completedTasks[taskId] = true;
    } else {
        delete completedTasks[taskId];
    }

    saveToStorage(key, completedTasks);
}

function loadTaskCompletion(type) {
    const key = type === 'daily' ? STORAGE_KEYS.DAILY_COMPLETED : STORAGE_KEYS.WEEKLY_COMPLETED;
    return loadFromStorage(key, {});
}

// Custom tasks storage
function saveCustomTasks() {
    saveToStorage(STORAGE_KEYS.CUSTOM_TASKS, customTasks);
}

function loadCustomTasks() {
    const saved = loadFromStorage(STORAGE_KEYS.CUSTOM_TASKS, { daily: [], weekly: [] });
    customTasks = saved;

    let maxId = 0;
    Object.values(customTasks).forEach(tasks => {
        tasks.forEach(task => {
            if (task.id > maxId) maxId = task.id;
        });
    });
    taskIdCounter = maxId + 1;
}

// Hidden tasks storage
function saveHiddenTasks() {
    const hiddenTasks = [];
    document.querySelectorAll('.task.hidden').forEach(task => {
        hiddenTasks.push(task.dataset.taskId);
    });
    saveToStorage(STORAGE_KEYS.HIDDEN_TASKS, hiddenTasks);
}

function loadHiddenTasks() {
    const hiddenTasks = loadFromStorage(STORAGE_KEYS.HIDDEN_TASKS, []);
    hiddenTasks.forEach(taskId => {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        if (task) {
            task.classList.add('hidden');
        }
    });
}

// Create task HTML
function createTaskHTML(taskText, taskId, isCustom = false) {
    return `
        <div class="task" data-task-id="${taskId}" draggable="true" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)">
            <input type="checkbox" id="task-${taskId}">
            <label class="checkbox" for="task-${taskId}">
                <svg class="done-icon" viewBox="0 0 26 26">
                    <path d="M 22.566406 4.730469 L 20.773438 3.511719 C 20.277344 3.175781 19.597656 3.304688 19.265625 3.796875 L 10.476563 16.757813 L 6.4375 12.71875 C 6.015625 12.296875 5.328125 12.296875 4.90625 12.71875 L 3.371094 14.253906 C 2.949219 14.675781 2.949219 15.363281 3.371094 15.789063 L 9.582031 22 C 9.929688 22.347656 10.476563 22.613281 10.96875 22.613281 C 11.460938 22.613281 11.957031 22.304688 12.277344 21.839844 L 22.855469 6.234375 C 23.191406 5.742188 23.0625 5.066406 22.566406 4.730469 Z" />
                </svg>
            </label>
            <label for="task-${taskId}" class="task-text" title="${taskText}">
                ${taskText}
            </label>
            <button class="hide-button" onclick="toggleTaskVisibility('${taskId}')">
                <svg class="hide-icon" viewBox="0 0 24 24">
                    <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5-.59 1.22-1.42 2.27-2.41 3.12l1.41 1.41c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l1.65 1.65C10.66 6.09 11.32 6 12 6zm-1.07 1.14L13 9.21c.57.25 1.03.71 1.28 1.28l2.07 2.07c.08-.34.14-.7.14-1.07C16.5 9.01 14.48 7 12 7c-.37 0-.72.05-1.07.14zM2.01 3.87l2.68 2.68C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.98-.29 4.32-.82l3.42 3.42 1.41-1.41L3.42 2.45 2.01 3.87zm7.5 7.5l2.61 2.61c-.04.01-.08.02-.12.02-1.38 0-2.5-1.12-2.5-2.5 0-.05.01-.08.01-.13zm-3.4-3.4l1.75 1.75c-.23.55-.36 1.15-.36 1.78 0 2.48 2.02 4.5 4.5 4.5.63 0 1.23-.13 1.77-.36l.98.98c-.88.24-1.8.38-2.75.38-3.79 0-7.17-2.13-8.82-5.5.7-1.43 1.72-2.61 2.93-3.53z"/>
                </svg>
            </button>
            ${isCustom ? `
            <button class="delete-button" onclick="deleteTask('${taskId}')">
                <svg class="delete-icon" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
            ` : ''}
        </div>
    `;
}

// Create category HTML
function createCategoryHTML(categoryName, tasks, type) {
    let categoryId;
    if (categoryName === 'Custom Tasks') {
        categoryId = `${type}-custom-tasks`;
    } else {
        categoryId = `${type}-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
    }

    let tasksHTML = '';

    tasks.forEach(task => {
        let taskId, taskText, isCustom;

        if (typeof task === 'object') {
            taskId = task.id;
            taskText = task.text;
            isCustom = task.isCustom || false;
        } else {
            taskId = getNextTaskId();
            taskText = task;
            isCustom = false;
        }

        tasksHTML += createTaskHTML(taskText, taskId, isCustom);
    });

    return `
        <div class="task-category">
            <div class="category-header" onclick="toggleCategory('${categoryId}')">
                <svg class="category-arrow" viewBox="0 0 24 24">
                    <path d="M6 9L12 15L18 9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${categoryName}</span>
            </div>
            <div class="category-tasks" id="${categoryId}">
                ${tasksHTML}
            </div>
        </div>
    `;
}

// Initialize tasks
function initializeTasks() {
    // Check for resets first
    const dailyReset = checkAndResetDaily();
    const weeklyReset = checkAndResetWeekly();

    // Load custom tasks
    loadCustomTasks();

    const dailyContainer = document.getElementById('daily-tasks');
    const weeklyContainer = document.getElementById('weekly-tasks');

    // Clear containers
    dailyContainer.innerHTML = '';
    weeklyContainer.innerHTML = '';

    // Add daily task categories
    const dailyLayout = loadTaskLayout('daily');
    if (dailyLayout) {
        Object.entries(dailyLayout).forEach(([category, tasks]) => {
            dailyContainer.innerHTML += createCategoryHTML(category, tasks, 'daily');
        });
    } else {
        // If no saved layout, create default categories
        Object.entries(dailyTasks).forEach(([category, tasks]) => {
            dailyContainer.innerHTML += createCategoryHTML(category, tasks, 'daily');
        });
        // Add custom tasks category
        dailyContainer.innerHTML += createCategoryHTML('Custom Tasks', customTasks.daily, 'daily');
    }

    // Add weekly task categories
    const weeklyLayout = loadTaskLayout('weekly');
    if (weeklyLayout) {
        Object.entries(weeklyLayout).forEach(([category, tasks]) => {
            weeklyContainer.innerHTML += createCategoryHTML(category, tasks, 'weekly');
        });
    } else {
        // If no saved layout, create default categories
        Object.entries(weeklyTasks).forEach(([category, tasks]) => {
            weeklyContainer.innerHTML += createCategoryHTML(category, tasks, 'weekly');
        });
        // Add custom tasks category
        weeklyContainer.innerHTML += createCategoryHTML('Custom Tasks', customTasks.weekly, 'weekly');
    }

    // Restore task completion state
    restoreTaskStates();

    // Add change listeners to checkboxes
    addCheckboxListeners();

    // Load hidden tasks
    loadHiddenTasks();

    updateProgress();

    // Show reset notifications
    if (dailyReset || weeklyReset) {
        showResetNotification(dailyReset, weeklyReset);
    }
}

// Restore task completion states from storage
function restoreTaskStates() {
    const dailyCompleted = loadTaskCompletion('daily');
    const weeklyCompleted = loadTaskCompletion('weekly');

    // Restore daily tasks
    Object.keys(dailyCompleted).forEach(taskId => {
        const checkbox = document.getElementById(`task-${taskId}`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.closest('.task').classList.add('completed');
        }
    });

    // Restore weekly tasks
    Object.keys(weeklyCompleted).forEach(taskId => {
        const checkbox = document.getElementById(`task-${taskId}`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.closest('.task').classList.add('completed');
        }
    });
}

// Show reset notification
function showResetNotification(dailyReset, weeklyReset) {
    let message = 'Tasks have been reset: ';
    const messages = [];

    if (dailyReset) messages.push('Daily tasks');
    if (weeklyReset) messages.push('Weekly tasks');

    message += messages.join(' and ');

    let container = document.getElementById('notification-container');

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'reset-notification';
    notification.textContent = message;

    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Animate out and remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400); // wait for transition
    }, 5000);
}



// Toggle category visibility
function toggleCategory(categoryId) {
    const category = document.getElementById(categoryId);
    const categoryContainer = category.closest('.task-category');

    categoryContainer.classList.toggle('category-collapsed');

    if (categoryContainer.classList.contains('category-collapsed')) {
        category.style.maxHeight = '0';
    } else {
        category.style.maxHeight = category.scrollHeight + 'px';
    }
}

// Add checkbox listeners
function addCheckboxListeners() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const task = this.closest('.task');
            const taskId = task.dataset.taskId;
            const isCompleted = this.checked;

            // Determine if this is a daily or weekly task
            const type = task.closest('[id$="-tasks"]').id.includes('daily') ? 'daily' : 'weekly';

            task.classList.toggle('completed', isCompleted);

            // Save completion state
            saveTaskCompletion(taskId, isCompleted, type);

            updateProgress();
            updateTaskVisibility();
        });
    });
}

// Update progress bars
function updateProgress() {
    updateSectionProgress('daily');
    updateSectionProgress('weekly');
}

function updateSectionProgress(type) {
    const tasks = document.querySelectorAll(`#${type}-tasks input[type="checkbox"]`);
    const completed = document.querySelectorAll(`#${type}-tasks input[type="checkbox"]:checked`);
    const percentage = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    document.getElementById(`${type}-progress-fill`).style.width = percentage + '%';
    document.getElementById(`${type}-progress-text`).textContent = `${completed.length} / ${tasks.length} completed`;
    document.getElementById(`${type}-percentage-text`).textContent = `${percentage}%`;
}

// Toggle task visibility
function toggleTaskVisibility(taskId) {
    const task = document.querySelector(`[data-task-id="${taskId}"]`);
    if (task) {
        task.classList.toggle('hidden');
        saveHiddenTasks();
    }
}

// Toggle completed tasks visibility
function toggleCompleted(type) {
    hideCompletedTasks[type] = !hideCompletedTasks[type];
    updateTaskVisibility();

    // Update button state
    const button = event.target;
    button.classList.toggle('active', hideCompletedTasks[type]);
}

// Update task visibility based on hide settings
function updateTaskVisibility() {
    ['daily', 'weekly'].forEach(type => {
        if (hideCompletedTasks[type]) {
            document.querySelectorAll(`#${type}-tasks .task.completed`).forEach(task => {
                task.style.display = 'none';
            });
        } else {
            document.querySelectorAll(`#${type}-tasks .task.completed`).forEach(task => {
                task.style.display = 'flex';
            });
        }
    });
}

// Expand all categories
function expandAll(type) {
    document.querySelectorAll(`#${type}-tasks .task-category`).forEach(category => {
        category.classList.remove('category-collapsed');
        const tasks = category.querySelector('.category-tasks');
        tasks.style.maxHeight = tasks.scrollHeight + 'px';
    });
}

// Collapse all categories
function collapseAll(type) {
    document.querySelectorAll(`#${type}-tasks .task-category`).forEach(category => {
        category.classList.add('category-collapsed');
        const tasks = category.querySelector('.category-tasks');
        tasks.style.maxHeight = '0';
    });
}

// Add custom task
function addCustomTask(taskText, type) {
    const taskId = getNextTaskId();
    const customTask = { id: taskId, text: taskText, isCustom: true };

    // Add to custom tasks array
    customTasks[type].push(customTask);

    // Save to storage
    saveCustomTasks();

    // Find the custom tasks category container
    const customCategory = document.querySelector(`#${type}-custom-tasks`);
    if (customCategory) {
        // Add the new task HTML
        const taskHTML = createTaskHTML(taskText, taskId, true);
        customCategory.insertAdjacentHTML('beforeend', taskHTML);

        // Update the category's max height if it's expanded
        const categoryContainer = customCategory.closest('.task-category');
        if (!categoryContainer.classList.contains('category-collapsed')) {
            customCategory.style.maxHeight = customCategory.scrollHeight + 'px';
        }
    }

    // Re-add listeners for the new task
    addCheckboxListeners();
    updateProgress();
}

// Delete custom task
function deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    const taskLabel = taskElement.querySelector('.task-text')?.innerText || 'this task';
    const confirmed = confirm(`Are you sure you want to delete "${taskLabel}"?`);

    if (!confirmed) return;

    // Remove from DOM
    taskElement.remove();

    // Remove from custom tasks array
    Object.keys(customTasks).forEach(type => {
        customTasks[type] = customTasks[type].filter(task => task.id.toString() !== taskId.toString());
    });

    // Save to storage
    saveCustomTasks();

    updateProgress();
}

// Allow dragging tasks into custom orders
let draggedTask = null;

function handleDragStart(event) {
    draggedTask = event.currentTarget;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', draggedTask.outerHTML);
    setTimeout(() => {
        draggedTask.classList.add('dragging');
    }, 0);
}

function handleDragOver(event) {
    event.preventDefault();
    const target = event.currentTarget;
    if (target && target !== draggedTask && target.classList.contains('task')) {
        const parent = target.parentNode;
        const isBelow = event.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2;
        parent.insertBefore(draggedTask, isBelow ? target.nextSibling : target);
    }
}

function handleDrop(event) {
    event.preventDefault();
    if (draggedTask) {
        const originalParent = draggedTask.closest('[id$="-tasks"]');
        const newParent = event.currentTarget.closest('[id$="-tasks"]');

        // Determine if task moved between sections
        const originalType = originalParent.id.includes('daily') ? 'daily' : 'weekly';
        const newType = newParent.id.includes('daily') ? 'daily' : 'weekly';

        draggedTask.classList.remove('dragging');

        // If task moved between sections, update completion storage
        if (originalType !== newType) {
            const taskId = draggedTask.dataset.taskId;
            const isCompleted = draggedTask.querySelector('input[type="checkbox"]').checked;

            // Remove from original section storage
            saveTaskCompletion(taskId, false, originalType);

            // Add to new section storage if completed
            if (isCompleted) {
                saveTaskCompletion(taskId, true, newType);
            }
        }

        draggedTask = null;

        // Save layout for both daily and weekly
        saveTaskLayout('daily');
        saveTaskLayout('weekly');

        // Update progress bars
        updateProgress();
    }
}

// Save custom task layout
function saveTaskLayout(type) {
    const layout = {};
    const container = document.getElementById(`${type}-tasks`);
    const categories = container.querySelectorAll('.task-category');

    categories.forEach(categoryEl => {
        const categoryTitle = categoryEl.querySelector('.category-header span').textContent;
        const taskEls = categoryEl.querySelectorAll('.task');
        const tasks = [];

        taskEls.forEach(taskEl => {
            const taskId = parseInt(taskEl.dataset.taskId);
            const taskText = taskEl.querySelector('.task-text').textContent.trim();
            const isCustom = !!taskEl.querySelector('.delete-button');

            tasks.push({ id: taskId, text: taskText, isCustom });
        });

        layout[categoryTitle] = tasks;
    });

    const key = type === 'daily' ? STORAGE_KEYS.DAILY_LAYOUT : STORAGE_KEYS.WEEKLY_LAYOUT;
    saveToStorage(key, layout);
}

// Load custom task layout
function loadTaskLayout(type) {
    const key = type === 'daily' ? STORAGE_KEYS.DAILY_LAYOUT : STORAGE_KEYS.WEEKLY_LAYOUT;
    return loadFromStorage(key, null);
}

function resetAllDailyTasks() {
    const confirmed = confirm('Are you sure you want to reset all daily tasks?');

    if (!confirmed) return;

    // Clear completed daily tasks from storage
    saveToStorage(STORAGE_KEYS.DAILY_COMPLETED, {});

    // Only uncheck daily checkboxes
    document.querySelectorAll('#daily-tasks input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.task').classList.remove('completed');
    });

    updateProgress();
    showResetNotification(true, false);
}

function resetAllWeeklyTasks() {
    const confirmed = confirm('Are you sure you want to reset all weekly tasks?');

    if (!confirmed) return;

    // Clear completed weekly tasks from storage
    saveToStorage(STORAGE_KEYS.WEEKLY_COMPLETED, {});

    // Only uncheck weekly checkboxes
    document.querySelectorAll('#weekly-tasks input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest('.task').classList.remove('completed');
    });

    updateProgress();
    showResetNotification(false, true);
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.custom-task-form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const input = this.querySelector('.task-input');
            const taskText = input.value.trim();
            const type = input.dataset.type;

            if (taskText) {
                addCustomTask(taskText, type);
                input.value = '';
            }
        });
    });

    // Initialize the app
    initializeTasks();
});