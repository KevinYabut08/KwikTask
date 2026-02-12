import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = window.auth;
const db = window.db;

// ===== STRIPE =====
const stripe = Stripe("pk_test_51SzautGqBhYoGeXbv4LSy6PQVpfO2oPzexUMoCAijD9ELFMtKxn6AjFgEaQkgQg24h2q4aZC3DTRzKhT8kBSOLhD00jpeLGhhk");

// ===== CONFIG =====
const FREE_TASK_LIMIT = 5;
const TODO_STORAGE_KEY = "kwiktask_todos";
const USE_DEMO_MODE = false;
const TEST_MODE = true; // Set to true to test Pro features

// ===== DOM ELEMENTS =====
const DOM = {
    // Todo elements
    todoForm: document.getElementById("todo-form"),
    todoInput: document.getElementById("todo-input"),
    todoList: document.getElementById("todo-list"),
    taskCount: document.getElementById("taskCount"),
    taskLimitIndicator: document.getElementById("taskLimitIndicator"),
    freeTierIndicator: document.getElementById("freeTierIndicator"),
    proBadge: document.getElementById("proBadge"),
    adUnit: document.getElementById("adUnit"),
    upgradePrompt: document.getElementById("upgradePrompt"),
    addButton: document.getElementById("add-button"),
    
    // Modals
    stripeModal: document.getElementById("stripeModal"),
    successModal: document.getElementById("successModal"),
    closeSuccessModal: document.getElementById("closeSuccessModal"),
    continueBtn: document.getElementById("continueBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    tasksView: document.getElementById('tasks-view'),
    analyticsView: document.getElementById('analytics-view'),
    calendarView: document.getElementById('calendar-view'),
    filesView: document.getElementById('files-view'),
    settingsView: document.getElementById('settings-view'),
    analyticsLocked: document.getElementById('analyticsLocked'),
    calendarLocked: document.getElementById('calendarLocked'),
    filesLocked: document.getElementById('filesLocked'),
    analyticsContent: document.getElementById('analyticsContent'),
    calendarContent: document.getElementById('calendarContent'),
    filesContent: document.getElementById('filesContent'),
    
    // Calendar elements
    currentMonth: document.getElementById('currentMonth'),
    calendarStats: document.getElementById('calendarStats'),
    todayBtn: document.getElementById('todayBtn'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    calendarWeekdays: document.getElementById('calendarWeekdays'),
    calendarGrid: document.getElementById('calendarGrid'),
    quickTaskInput: document.getElementById('quickTaskInput'),
    quickTaskDate: document.getElementById('quickTaskDate'),
    quickTaskPriority: document.getElementById('quickTaskPriority'),
    quickAddTaskBtn: document.getElementById('quickAddTaskBtn'),
    selectedDayTasks: document.getElementById('selectedDayTasks'),
    selectedDayTitle: document.getElementById('selectedDayTitle'),
    closeSelectedDay: document.getElementById('closeSelectedDay'),
    selectedDayList: document.getElementById('selectedDayList'),
    
    // Files elements
    filesGrid: document.getElementById('filesGrid'),
    filesBreadcrumb: document.getElementById('filesBreadcrumb'),
    folderCount: document.getElementById('folderCount'),
    fileCount: document.getElementById('fileCount'),
    storageUsed: document.getElementById('storageUsed'),
    filesEmptyState: document.getElementById('filesEmptyState'),
    newFolderBtn: document.getElementById('newFolderBtn'),
    uploadFileBtn: document.getElementById('uploadFileBtn'),
    fileSearchInput: document.getElementById('fileSearchInput'),
    filesViewToggle: document.querySelectorAll('.files-view-toggle .view-toggle-btn'),
    createFolderBtn: document.getElementById('createFolderBtn'),
    folderName: document.getElementById('folderName'),
    folderColorPicker: document.querySelectorAll('.color-option'),
    closeNewFolderModal: document.getElementById('closeNewFolderModal'),
    newFolderModal: document.getElementById('newFolderModal'),
    filePreviewModal: document.getElementById('filePreviewModal'),
    previewFileIcon: document.getElementById('previewFileIcon'),
    previewFileName: document.getElementById('previewFileName'),
    previewFileType: document.getElementById('previewFileType'),
    previewFileSize: document.getElementById('previewFileSize'),
    previewFileModified: document.getElementById('previewFileModified'),
    previewFileLocation: document.getElementById('previewFileLocation'),
    downloadFileBtn: document.getElementById('downloadFileBtn'),
    renameFileBtn: document.getElementById('renameFileBtn'),
    deleteFileBtn: document.getElementById('deleteFileBtn'),
    closeFilePreview: document.getElementById('closeFilePreview'),
    emptyNewFolderBtn: document.getElementById('emptyNewFolderBtn'),
    emptyUploadBtn: document.getElementById('emptyUploadBtn'),
    
    // Analytics elements
    totalTasksStat: document.getElementById('totalTasksStat'),
    completedTasksStat: document.getElementById('completedTasksStat'),
    completionRateStat: document.getElementById('completionRateStat'),
    avgTasksStat: document.getElementById('avgTasksStat'),
    currentStreakStat: document.getElementById('currentStreakStat'),
    longestStreakStat: document.getElementById('longestStreakStat'),
    weeklyChart: document.getElementById('weeklyChart'),
    timeOfDayChart: document.getElementById('timeOfDayChart'),
    productivityInsights: document.getElementById('productivityInsights'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    
    // Settings elements
    userEmail: document.getElementById('userEmail'),
    displayName: document.getElementById('displayName'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    themeLight: document.getElementById('themeLight'),
    themeDark: document.getElementById('themeDark'),
    themeSystem: document.getElementById('themeSystem'),
    notificationsEnabled: document.getElementById('notificationsEnabled'),
    soundEnabled: document.getElementById('soundEnabled'),
    emailDigest: document.getElementById('emailDigest'),
    taskSortOrder: document.getElementById('taskSortOrder'),
    weekStartsOn: document.getElementById('weekStartsOn'),
    importDataBtn: document.getElementById('importDataBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    currentPlan: document.getElementById('currentPlan'),
    upgradeFromSettings: document.getElementById('upgradeFromSettings')
};

// ===== STATE =====
let allToDos = [];
let isPro = false;

// ===== ANALYTICS STATE =====
let taskHistory = [];
let completionData = [];
let streakData = { current: 0, longest: 0 };

// ===== CALENDAR STATE =====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let calendarTasks = [];

// ===== FILES STATE =====
let currentFolder = 'root';
let folderStack = ['root'];
let files = [];
let folders = [];
let viewMode = 'grid';

// ================= UTILITY FUNCTIONS =================
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'mp4': 'fa-file-video',
        'mp3': 'fa-file-audio',
        'zip': 'fa-file-archive',
        'html': 'fa-file-code',
        'css': 'fa-file-code',
        'js': 'fa-file-code',
        'txt': 'fa-file-alt'
    };
    return icons[type] || 'fa-file';
}

function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #1a1a1a;
        padding: 12px 24px;
        border-radius: 100px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 9999;
        animation: slideUp 0.3s ease;
        border: 1px solid #f0f0f0;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: #00b894;"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/login.html";
        return;
    }

    console.log("✅ User logged in:", user.email);
    
    if (TEST_MODE) {
        isPro = true;
        console.log("🔧 TEST MODE: Pro features ACTIVATED");
    } else {
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                isPro = snap.data().pro === true;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    init();
});

// ================= INIT =================
function init() {
    console.log("🚀 Initializing app with isPro =", isPro);
    loadTodos();
    updateUIForTier();
    updateToDoList();
    attachEventListeners();
}

// ================= UI UPDATES =================
function updateUIForTier() {
    if (DOM.proBadge) DOM.proBadge.style.display = isPro ? "flex" : "none";
    if (DOM.freeTierIndicator) DOM.freeTierIndicator.style.display = isPro ? "none" : "flex";
    if (DOM.adUnit) DOM.adUnit.style.display = isPro ? "none" : "block";
    if (DOM.currentPlan) DOM.currentPlan.textContent = isPro ? "pro" : "free";

    if (DOM.taskLimitIndicator) {
        DOM.taskLimitIndicator.textContent = isPro 
            ? "unlimited tasks" 
            : `${getActiveTaskCount()}/${FREE_TASK_LIMIT} tasks`;
    }

    if (DOM.todoInput) {
        DOM.todoInput.placeholder = isPro
            ? "write a task... (unlimited)"
            : `write a task... (${FREE_TASK_LIMIT - getActiveTaskCount()} left)`;
    }
    
    document.querySelectorAll('.pro-tag').forEach(tag => {
        if (tag) tag.style.display = isPro ? 'none' : 'inline-block';
    });
}

// ================= TASK FUNCTIONS =================
function getActiveTaskCount() {
    return allToDos.filter(t => !t.completed).length;
}

function canAddTask() {
    return isPro || getActiveTaskCount() < FREE_TASK_LIMIT;
}

function showUpgradePromptIfNeeded() {
    if (!isPro && DOM.upgradePrompt) {
        const atLimit = getActiveTaskCount() >= FREE_TASK_LIMIT;
        DOM.upgradePrompt.style.display = atLimit ? "flex" : "none";
        
        if (DOM.todoInput && DOM.addButton) {
            DOM.todoInput.disabled = atLimit;
            DOM.addButton.disabled = atLimit;
            DOM.todoInput.classList.toggle("disabled", atLimit);
            DOM.addButton.classList.toggle("disabled", atLimit);
        }
    }
}

function loadTodos() {
    const todosJson = localStorage.getItem(TODO_STORAGE_KEY) || "[]";
    allToDos = JSON.parse(todosJson);
}

function saveTodos() {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(allToDos));
}

function addToDo() {
    if (!canAddTask()) {
        alert("✨ Free plan limit reached. Upgrade to Pro for unlimited tasks!");
        return;
    }

    const text = DOM.todoInput?.value.trim();
    if (!text) return;

    allToDos.push({ 
        id: Date.now().toString(), 
        text, 
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    });
    
    DOM.todoInput.value = "";
    saveTodos();
    updateToDoList();
    showNotification('✅ Task added!');
}

function updateToDoList() {
    if (!DOM.todoList) return;
    
    DOM.todoList.innerHTML = "";

    if (allToDos.length === 0) {
        const emptyLi = document.createElement("li");
        emptyLi.className = "todo empty-state";
        emptyLi.innerHTML = `<span style="color: #999; padding: 20px; text-align: center; width: 100%;">no tasks yet · add one above</span>`;
        DOM.todoList.append(emptyLi);
    } else {
        allToDos.forEach(todo => DOM.todoList.append(createToDoItem(todo)));
    }

    updateTaskCount();
    showUpgradePromptIfNeeded();
    updateUIForTier();
}

function createToDoItem(todo) {
    const li = document.createElement("li");
    li.className = "todo";
    
    const todoId = `todo-${todo.id}`;

    li.innerHTML = `
        <input type="checkbox" id="${todoId}" ${todo.completed ? "checked" : ""}>
        <label for="${todoId}" class="custom-checkbox">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21.59 6.41l-1.41-1.41L9 16.17z"/>
            </svg>
        </label>
        <span class="todo-text">${escapeHTML(todo.text)}</span>
        <button class="delete-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2-14h8V3H8v2zM4 7v2h16V7H4z"/>
            </svg>
        </button>
    `;

    const checkbox = li.querySelector("input");
    checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        todo.completedAt = checkbox.checked ? new Date().toISOString() : null;
        saveTodos();
        updateToDoList();
    });

    const deleteBtn = li.querySelector(".delete-button");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        allToDos = allToDos.filter(t => t.id !== todo.id);
        saveTodos();
        updateToDoList();
        showNotification('🗑️ Task deleted');
    });

    return li;
}

function updateTaskCount() {
    if (!DOM.taskCount) return;
    const active = getActiveTaskCount();
    const total = allToDos.length;
    
    DOM.taskCount.textContent = isPro
        ? `${active} tasks remaining · ${total} total`
        : `${active} of ${FREE_TASK_LIMIT} tasks remaining`;
}

// ================= QUICK ADD TASK (CALENDAR) =================
function quickAddTask() {
    const taskText = DOM.quickTaskInput?.value.trim();
    const taskDate = DOM.quickTaskDate?.value;
    const taskPriority = DOM.quickTaskPriority?.value;
    
    if (!taskText) {
        alert("Please enter a task");
        return;
    }
    
    if (!taskDate) {
        alert("Please select a date");
        return;
    }
    
    // Create new task with the selected date
    const newTask = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        priority: taskPriority || 'medium',
        createdAt: new Date(taskDate).toISOString(),
        completedAt: null
    };
    
    allToDos.push(newTask);
    saveTodos();
    
    // Clear input
    DOM.quickTaskInput.value = '';
    DOM.quickTaskDate.value = '';
    
    // Refresh calendar to show new task
    loadCalendarTasks();
    renderCalendar();
    
    // Show success message
    showNotification('✅ Task added to calendar!');
}

// ================= ANALYTICS FUNCTIONS =================
function initAnalytics() {
    console.log("📊 Initializing analytics with REAL task data...");
    
    // Make sure we have the latest tasks
    loadTodos();
    taskHistory = [...allToDos];
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        renderAnalytics();
        renderCharts();
        renderProductivityInsights();
    }, 100);
}

function renderAnalytics() {
    const total = taskHistory.length;
    const completed = taskHistory.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate average per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTasks = taskHistory.filter(t => {
        if (!t.createdAt) return false;
        return new Date(t.createdAt) > thirtyDaysAgo;
    });
    const avgPerDay = recentTasks.length > 0 ? (recentTasks.length / 30).toFixed(1) : 0;
    
    // Calculate streaks
    calculateStreaks();
    
    // Update DOM
    if (DOM.totalTasksStat) DOM.totalTasksStat.textContent = total;
    if (DOM.completedTasksStat) DOM.completedTasksStat.textContent = completed;
    if (DOM.completionRateStat) DOM.completionRateStat.textContent = `${completionRate}%`;
    if (DOM.avgTasksStat) DOM.avgTasksStat.textContent = avgPerDay;
    if (DOM.currentStreakStat) DOM.currentStreakStat.textContent = streakData.current;
    if (DOM.longestStreakStat) DOM.longestStreakStat.textContent = streakData.longest;
}

function calculateStreaks() {
    if (taskHistory.length === 0) {
        streakData = { current: 0, longest: 0 };
        return;
    }
    
    // Get all completed tasks with unique dates
    const completedDates = taskHistory
        .filter(t => t.completed && t.completedAt)
        .map(t => new Date(t.completedAt).toDateString())
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => new Date(a) - new Date(b));
    
    if (completedDates.length === 0) {
        streakData = { current: 0, longest: 0 };
        return;
    }
    
    let currentStreak = 0;
    let longestStreak = 1;
    let streakCount = 1;
    
    // Calculate longest streak
    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(completedDates[i - 1]);
        const currDate = new Date(completedDates[i]);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streakCount++;
            longestStreak = Math.max(longestStreak, streakCount);
        } else {
            streakCount = 1;
        }
    }
    
    // Calculate current streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (completedDates.includes(today)) {
        currentStreak = 1;
        let checkDate = yesterday;
        let daysBack = 1;
        
        while (completedDates.includes(checkDate)) {
            currentStreak++;
            daysBack++;
            checkDate = new Date(Date.now() - (daysBack * 86400000)).toDateString();
        }
    } else if (completedDates.includes(yesterday)) {
        currentStreak = 1;
        let checkDate = new Date(Date.now() - (2 * 86400000)).toDateString();
        let daysBack = 2;
        
        while (completedDates.includes(checkDate)) {
            currentStreak++;
            daysBack++;
            checkDate = new Date(Date.now() - (daysBack * 86400000)).toDateString();
        }
    }
    
    streakData = { 
        current: currentStreak, 
        longest: Math.max(longestStreak, currentStreak) 
    };
}

function renderCharts() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded");
        return;
    }
    
    // Weekly activity data from REAL tasks
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    taskHistory.forEach(task => {
        if (task.completed && task.completedAt) {
            const taskDate = new Date(task.completedAt);
            if (taskDate > sevenDaysAgo) {
                const dayIndex = taskDate.getDay();
                weeklyData[dayIndex]++;
            }
        }
    });
    
    // Weekly Chart
    if (DOM.weeklyChart) {
        if (window.weeklyChartInstance) {
            window.weeklyChartInstance.destroy();
        }
        
        const ctx = DOM.weeklyChart.getContext('2d');
        window.weeklyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekDays,
                datasets: [{
                    label: 'Tasks Completed',
                    data: weeklyData,
                    backgroundColor: '#000',
                    borderRadius: 6,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#000' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0' },
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Time of day chart from REAL tasks
    const timeSlots = [0, 0, 0, 0]; // Morning, Afternoon, Evening, Night
    
    taskHistory.forEach(task => {
        if (task.completed && task.completedAt) {
            const hour = new Date(task.completedAt).getHours();
            if (hour >= 5 && hour < 12) timeSlots[0]++; // Morning
            else if (hour >= 12 && hour < 17) timeSlots[1]++; // Afternoon
            else if (hour >= 17 && hour < 21) timeSlots[2]++; // Evening
            else timeSlots[3]++; // Night
        }
    });
    
    const hasData = timeSlots.some(slot => slot > 0);
    
    if (DOM.timeOfDayChart) {
        if (window.timeChartInstance) {
            window.timeChartInstance.destroy();
        }
        
        const ctx = DOM.timeOfDayChart.getContext('2d');
        window.timeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Morning (5am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-9pm)', 'Night (9pm-5am)'],
                datasets: [{
                    data: hasData ? timeSlots : [25, 25, 25, 25],
                    backgroundColor: ['#000', '#333', '#666', '#999'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    },
                    tooltip: { backgroundColor: '#000' }
                },
                cutout: '65%'
            }
        });
    }
}

function renderProductivityInsights() {
    if (!DOM.productivityInsights) return;
    
    const total = taskHistory.length;
    const completed = taskHistory.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let insights = [];
    
    if (total === 0) {
        insights.push(`<li><i class="fas fa-plus-circle"></i> Add your first task to see insights!</li>`);
    } else {
        if (streakData.current > 0) {
            insights.push(`<li><i class="fas fa-fire"></i> ${streakData.current} day streak! Keep it up! 🔥</li>`);
        }
        
        if (streakData.longest > 0) {
            insights.push(`<li><i class="fas fa-trophy"></i> Longest streak: ${streakData.longest} days 🏆</li>`);
        }
        
        if (completionRate > 70) {
            insights.push(`<li><i class="fas fa-chart-line"></i> ${completionRate}% completion rate - you're crushing it! 🎯</li>`);
        } else if (completionRate < 30 && total > 5) {
            insights.push(`<li><i class="fas fa-lightbulb"></i> Try breaking down large tasks into smaller ones</li>`);
        }
        
        const mostProductiveDay = getMostProductiveDay();
        if (mostProductiveDay) {
            insights.push(`<li><i class="fas fa-calendar-check"></i> Most productive on ${mostProductiveDay}s 📊</li>`);
        }
        
        const bestTime = getBestTimeOfDay();
        if (bestTime) {
            insights.push(`<li><i class="fas fa-clock"></i> Best time to work: ${bestTime} ⏰</li>`);
        }
    }
    
    if (insights.length === 0) {
        insights.push(`<li><i class="fas fa-chart-line"></i> Keep going! Your productivity will grow 📈</li>`);
    }
    
    DOM.productivityInsights.innerHTML = insights.join('');
}

function getMostProductiveDay() {
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    taskHistory.forEach(task => {
        if (task.completed && task.completedAt) {
            const day = new Date(task.completedAt).getDay();
            dayCount[day]++;
        }
    });
    
    const max = Math.max(...dayCount);
    if (max === 0) return null;
    
    const index = dayCount.indexOf(max);
    return days[index];
}

function getBestTimeOfDay() {
    const timeSlots = [0, 0, 0, 0];
    const slots = ['Morning', 'Afternoon', 'Evening', 'Night'];
    
    taskHistory.forEach(task => {
        if (task.completed && task.completedAt) {
            const hour = new Date(task.completedAt).getHours();
            if (hour >= 5 && hour < 12) timeSlots[0]++;
            else if (hour >= 12 && hour < 17) timeSlots[1]++;
            else if (hour >= 17 && hour < 21) timeSlots[2]++;
            else timeSlots[3]++;
        }
    });
    
    const max = Math.max(...timeSlots);
    if (max === 0) return null;
    
    const index = timeSlots.indexOf(max);
    return slots[index];
}

function exportUserData() {
    const csv = [
        'Task,Completed,Created At,Completed At,Priority',
        ...allToDos.map(t => 
            `"${t.text}",${t.completed},${t.createdAt || ''},${t.completedAt || ''},${t.priority || 'medium'}`
        )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kwiktask-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('✅ Data exported successfully!');
}

// ================= CALENDAR FUNCTIONS =================
function initCalendar() {
    console.log("📅 Initializing calendar with REAL tasks...");
    loadCalendarTasks();
    renderCalendar();
}

function loadCalendarTasks() {
    calendarTasks = [...allToDos];
}

function renderCalendar() {
    if (!DOM.calendarGrid) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    if (DOM.currentMonth) DOM.currentMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const totalTasks = calendarTasks.length;
    const completedTasks = calendarTasks.filter(t => t.completed).length;
    if (DOM.calendarStats) DOM.calendarStats.textContent = `${totalTasks} tasks · ${completedTasks} completed`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    DOM.calendarGrid.innerHTML = '';
    
    // Add weekday headers
    if (DOM.calendarWeekdays) {
        DOM.calendarWeekdays.innerHTML = '';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-weekday';
            dayHeader.textContent = day;
            DOM.calendarWeekdays.appendChild(dayHeader);
        });
    }
    
    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        DOM.calendarGrid.appendChild(emptyDay);
    }
    
    // Add actual days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Check if today
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            i === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        // Day number
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);
        
        // Get tasks for this day
        const dateStr = dayCell.dataset.date;
        const dayTasks = calendarTasks.filter(task => {
            const taskDate = task.createdAt ? task.createdAt.split('T')[0] : '';
            return taskDate === dateStr;
        });
        
        // Add task indicators
        if (dayTasks.length > 0) {
            const taskIndicator = document.createElement('div');
            taskIndicator.className = 'task-indicator';
            
            const completedCount = dayTasks.filter(t => t.completed).length;
            taskIndicator.innerHTML = `
                <span class="task-count">📋 ${dayTasks.length}</span>
                ${completedCount > 0 ? `<span class="completed-count">✅ ${completedCount}</span>` : ''}
            `;
            dayCell.appendChild(taskIndicator);
            
            // Make day clickable
            dayCell.addEventListener('click', () => showDayTasks(dateStr, dayTasks));
        }
        
        DOM.calendarGrid.appendChild(dayCell);
    }
}

function showDayTasks(dateStr, tasks) {
    if (!DOM.selectedDayTasks || !DOM.selectedDayTitle || !DOM.selectedDayList) return;
    
    const date = new Date(dateStr);
    DOM.selectedDayTitle.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    DOM.selectedDayList.innerHTML = '';
    
    if (tasks.length === 0) {
        DOM.selectedDayList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No tasks for this day</div>';
    } else {
        tasks.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        }).forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `selected-day-task-item ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}" style="color: ${task.completed ? '#00b894' : '#666'};"></i>
                <span class="task-text">${escapeHTML(task.text)}</span>
                <span class="task-time">${task.createdAt ? new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            `;
            DOM.selectedDayList.appendChild(taskItem);
        });
    }
    
    DOM.selectedDayTasks.style.display = 'block';
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar();
}

// ================= FILES FUNCTIONS =================
async function initFiles() {
    console.log("📁 Initializing files with Firestore data...");
    
    const user = auth.currentUser;
    if (!user) return;
    
    await loadUserFiles();
    renderFiles();
    updateStorageStats();
    attachFilesEventListeners();
}

async function loadUserFiles() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Load folders from Firestore
        const foldersRef = collection(db, "users", user.uid, "folders");
        const foldersSnapshot = await getDocs(foldersRef);
        
        folders = [];
        foldersSnapshot.forEach((doc) => {
            folders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Load files from Firestore
        const filesRef = collection(db, "users", user.uid, "files");
        const filesSnapshot = await getDocs(filesRef);
        
        files = [];
        filesSnapshot.forEach((doc) => {
            files.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`📊 Loaded ${folders.length} folders and ${files.length} files`);
        
    } catch (error) {
        console.error("Error loading files:", error);
    }
}

function renderFiles() {
    if (!DOM.filesGrid) return;

    DOM.filesGrid.innerHTML = '';
    DOM.filesGrid.className = `files-grid ${viewMode === 'list' ? 'list-view' : ''}`;

    // Filter folders and files for current directory
    const currentFolders = folders.filter(f => f.parent === currentFolder);
    const currentFiles = files.filter(f => f.parent === currentFolder);

    // Show empty state if no files or folders
    if (currentFolders.length === 0 && currentFiles.length === 0) {
        showEmptyState();
        return;
    }

    // Hide empty state
    if (DOM.filesEmptyState) DOM.filesEmptyState.style.display = 'none';

    // Render folders
    currentFolders.forEach(folder => {
        const folderElement = createFolderElement(folder);
        DOM.filesGrid.appendChild(folderElement);
    });

    // Render files
    currentFiles.forEach(file => {
        const fileElement = createFileElement(file);
        DOM.filesGrid.appendChild(fileElement);
    });
}

function createFolderElement(folder) {
    const div = document.createElement('div');
    div.className = 'folder-item';
    div.dataset.id = folder.id;
    div.dataset.name = folder.name;

    div.innerHTML = `
        <div class="folder-icon">
            <i class="fas fa-folder" style="color: ${folder.color || '#000'};"></i>
        </div>
        <div class="folder-name">${escapeHTML(folder.name)}</div>
        <div class="folder-meta">
            <span>${folder.fileCount || 0} files</span>
            <span>•</span>
            <span>${formatFileSize(folder.size || 0)}</span>
        </div>
        <button class="folder-delete-btn" title="Delete folder">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    
    const deleteBtn = div.querySelector('.folder-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFolder(folder.id);
    });

    div.addEventListener('dblclick', () => openFolder(folder.id, folder.name));
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectItem(div, folder.id);
    });

    return div;
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.id = file.id;
    div.dataset.name = file.name;

    const fileIcon = getFileIcon(file.type);
    const fileDate = file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    }) : 'Unknown';

    div.innerHTML = `
        <div class="file-icon">
            <i class="fas ${fileIcon}"></i>
        </div>
        <div class="file-name">${escapeHTML(file.name)}</div>
        <div class="file-meta">
            <span>${formatFileSize(file.size || 0)}</span>
            <span>•</span>
            <span>${fileDate}</span>
        </div>
    `;

    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectItem(div, file.id);
        previewFile(file);
    });

    return div;
}

async function createFolder(name, color = '#000') {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const foldersRef = collection(db, "users", user.uid, "folders");
        await addDoc(foldersRef, {
            name: name,
            color: color,
            parent: currentFolder,
            createdAt: new Date().toISOString(),
            fileCount: 0,
            size: 0
        });

        await loadUserFiles();
        renderFiles();
        
        if (DOM.newFolderModal) DOM.newFolderModal.classList.remove('active');
        if (DOM.folderName) DOM.folderName.value = '';
        
        showNotification('📁 Folder created!');
        
    } catch (error) {
        console.error("Error creating folder:", error);
        alert("Failed to create folder");
    }
}

async function deleteFolder(folderId) {
    if (!confirm('Are you sure you want to delete this folder and ALL its contents? This cannot be undone.')) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
        // First, delete all files inside this folder
        const filesRef = collection(db, "users", user.uid, "files");
        const filesQuery = query(filesRef, where("parent", "==", folderId));
        const filesSnapshot = await getDocs(filesQuery);
        
        const fileDeletions = [];
        filesSnapshot.forEach((doc) => {
            fileDeletions.push(deleteDoc(doc.ref));
        });
        await Promise.all(fileDeletions);
        
        // Then, delete all subfolders recursively
        const foldersRef = collection(db, "users", user.uid, "folders");
        const subfoldersQuery = query(foldersRef, where("parent", "==", folderId));
        const subfoldersSnapshot = await getDocs(subfoldersQuery);
        
        const folderDeletions = [];
        subfoldersSnapshot.forEach((doc) => {
            // Recursively delete each subfolder
            folderDeletions.push(deleteFolder(doc.id));
        });
        await Promise.all(folderDeletions);
        
        // Finally, delete the folder itself
        await deleteDoc(doc(db, "users", user.uid, "folders", folderId));
        
        // If we're currently inside the deleted folder, navigate back to root
        if (currentFolder === folderId || folderStack.includes(folderId)) {
            currentFolder = 'root';
            folderStack = ['root'];
        }
        
        await loadUserFiles();
        renderFiles();
        updateBreadcrumb();
        
        showNotification('📁 Folder deleted successfully');
        
    } catch (error) {
        console.error("Error deleting folder:", error);
        alert("Failed to delete folder");
    }
}

async function uploadFile(file) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const filesRef = collection(db, "users", user.uid, "files");
        await addDoc(filesRef, {
            name: file.name,
            type: file.name.split('.').pop().toLowerCase(),
            size: file.size,
            parent: currentFolder,
            uploadedAt: new Date().toISOString()
        });

        await loadUserFiles();
        renderFiles();
        updateStorageStats();
        
        showNotification(`📄 ${file.name} uploaded!`);
        
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file");
    }
}

async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
        await deleteDoc(doc(db, "users", user.uid, "files", fileId));
        await loadUserFiles();
        renderFiles();
        
        if (DOM.filePreviewModal) DOM.filePreviewModal.classList.remove('active');
        
        showNotification('🗑️ File deleted');
        
    } catch (error) {
        console.error("Error deleting file:", error);
        alert("Failed to delete file");
    }
}

async function renameFile(fileId, newName) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await updateDoc(doc(db, "users", user.uid, "files", fileId), {
            name: newName,
            updatedAt: new Date().toISOString()
        });
        
        await loadUserFiles();
        renderFiles();
        
        showNotification('✏️ File renamed');
        
    } catch (error) {
        console.error("Error renaming file:", error);
        alert("Failed to rename file");
    }
}

function openFolder(folderId, folderName) {
    currentFolder = folderId;
    folderStack.push(folderId);
    renderFiles();
    updateBreadcrumb();
}

function updateBreadcrumb() {
    if (!DOM.filesBreadcrumb) return;

    let html = '<span class="breadcrumb-item" data-folder="root">my files</span>';
    
    for (let i = 1; i < folderStack.length; i++) {
        const folder = folders.find(f => f.id === folderStack[i]);
        if (folder) {
            html += `<span class="breadcrumb-item" data-folder="${folder.id}">${escapeHTML(folder.name)}</span>`;
        }
    }

    DOM.filesBreadcrumb.innerHTML = html;

    DOM.filesBreadcrumb.querySelectorAll('.breadcrumb-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            while (folderStack.length > index + 1) {
                folderStack.pop();
            }
            currentFolder = folderStack[folderStack.length - 1];
            renderFiles();
            updateBreadcrumb();
        });
    });
}

function previewFile(file) {
    if (!DOM.filePreviewModal) return;
    
    if (DOM.previewFileName) DOM.previewFileName.textContent = file.name;
    if (DOM.previewFileType) DOM.previewFileType.textContent = file.type || 'Unknown';
    if (DOM.previewFileSize) DOM.previewFileSize.textContent = formatFileSize(file.size || 0);
    if (DOM.previewFileModified) DOM.previewFileModified.textContent = file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown';
    if (DOM.previewFileLocation) DOM.previewFileLocation.textContent = getFolderPath(file.parent);
    
    const icon = getFileIcon(file.type);
    if (DOM.previewFileIcon) DOM.previewFileIcon.className = `fas ${icon}`;
    
    DOM.filePreviewModal.dataset.fileId = file.id;
    DOM.filePreviewModal.classList.add('active');
}

function getFolderPath(folderId) {
    if (folderId === 'root') return '/';
    const folder = folders.find(f => f.id === folderId);
    return folder ? `/${folder.name}` : '/';
}

function selectItem(element, id) {
    document.querySelectorAll('.folder-item.selected, .file-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');
}

function updateStorageStats() {
    const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    if (DOM.folderCount) DOM.folderCount.textContent = `${folders.length} folders`;
    if (DOM.fileCount) DOM.fileCount.textContent = `${files.length} files`;
    if (DOM.storageUsed) DOM.storageUsed.textContent = formatFileSize(totalSize);
}

function showEmptyState() {
    if (DOM.filesGrid) DOM.filesGrid.style.display = 'none';
    if (DOM.filesEmptyState) DOM.filesEmptyState.style.display = 'block';
}

function toggleViewMode(mode) {
    viewMode = mode;
    if (DOM.filesGrid) {
        DOM.filesGrid.className = `files-grid ${viewMode === 'list' ? 'list-view' : ''}`;
    }
    
    DOM.filesViewToggle.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === mode) {
            btn.classList.add('active');
        }
    });
}

function searchFiles(query) {
    if (!DOM.filesGrid) return;
    
    const items = DOM.filesGrid.querySelectorAll('.folder-item, .file-item');
    const searchTerm = query.toLowerCase();

    items.forEach(item => {
        const name = item.dataset.name?.toLowerCase() || '';
        item.style.display = name.includes(searchTerm) ? '' : 'none';
    });
}

function attachFilesEventListeners() {
    // New folder button
    DOM.newFolderBtn?.addEventListener('click', () => {
        DOM.newFolderModal?.classList.add('active');
    });

    // Upload button
    DOM.uploadFileBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            Array.from(e.target.files).forEach(file => uploadFile(file));
        };
        input.click();
    });

    // View toggle
    DOM.filesViewToggle?.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.view;
            toggleViewMode(mode);
        });
    });

    // Search input
    DOM.fileSearchInput?.addEventListener('input', (e) => {
        searchFiles(e.target.value);
    });

    // Create folder button
    DOM.createFolderBtn?.addEventListener('click', () => {
        const name = DOM.folderName?.value;
        if (name) {
            const selectedColor = document.querySelector('.color-option.selected');
            const color = selectedColor ? selectedColor.dataset.color : '#000';
            createFolder(name, color);
        }
    });

    // Color picker
    DOM.folderColorPicker?.forEach(option => {
        option.addEventListener('click', () => {
            DOM.folderColorPicker.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Close new folder modal
    DOM.closeNewFolderModal?.addEventListener('click', () => {
        DOM.newFolderModal?.classList.remove('active');
    });

    // File preview actions
    DOM.downloadFileBtn?.addEventListener('click', () => {
        const fileId = DOM.filePreviewModal?.dataset.fileId;
        const file = files.find(f => f.id === fileId);
        if (file) {
            showNotification(`📥 Downloading ${file.name}...`);
        }
    });

    DOM.renameFileBtn?.addEventListener('click', () => {
        const fileId = DOM.filePreviewModal?.dataset.fileId;
        const file = files.find(f => f.id === fileId);
        if (file) {
            const newName = prompt('Enter new file name:', file.name);
            if (newName && newName !== file.name) {
                renameFile(fileId, newName);
                DOM.filePreviewModal?.classList.remove('active');
            }
        }
    });

    DOM.deleteFileBtn?.addEventListener('click', () => {
        const fileId = DOM.filePreviewModal?.dataset.fileId;
        if (fileId) {
            deleteFile(fileId);
        }
    });

    // Close file preview modal
    DOM.closeFilePreview?.addEventListener('click', () => {
        DOM.filePreviewModal?.classList.remove('active');
    });

    // Empty state buttons
    DOM.emptyNewFolderBtn?.addEventListener('click', () => {
        DOM.newFolderModal?.classList.add('active');
    });

    DOM.emptyUploadBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            Array.from(e.target.files).forEach(file => uploadFile(file));
        };
        input.click();
    });
}

// ================= SETTINGS FUNCTIONS =================
function initSettings() {
    console.log("⚙️ Initializing settings...");
    
    const user = auth.currentUser;
    if (user) {
        if (DOM.userEmail) DOM.userEmail.value = user.email || '';
        if (DOM.displayName) DOM.displayName.value = user.displayName || '';
    }
    
    if (DOM.currentPlan) DOM.currentPlan.textContent = isPro ? 'pro' : 'free';
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('kwiktask_theme') || 'light';
    if (savedTheme === 'light' && DOM.themeLight) DOM.themeLight.checked = true;
    if (savedTheme === 'dark' && DOM.themeDark) DOM.themeDark.checked = true;
    if (savedTheme === 'system' && DOM.themeSystem) DOM.themeSystem.checked = true;
    
    // Load notification preferences
    const notifications = localStorage.getItem('kwiktask_notifications') === 'true';
    if (DOM.notificationsEnabled) DOM.notificationsEnabled.checked = notifications;
    
    const sound = localStorage.getItem('kwiktask_sound') !== 'false';
    if (DOM.soundEnabled) DOM.soundEnabled.checked = sound;
}

function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;
    
    const displayName = DOM.displayName?.value;
    if (displayName) {
        import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(({ updateProfile }) => {
            updateProfile(user, { displayName })
                .then(() => showNotification('✅ Profile updated successfully!'))
                .catch(err => console.error("Error updating profile:", err));
        });
    }
}

function saveTheme() {
    const theme = document.querySelector('input[name="theme"]:checked')?.value;
    if (theme) {
        localStorage.setItem('kwiktask_theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        showNotification(`🎨 Theme changed to ${theme}`);
    }
}

function saveNotificationSettings() {
    const notifications = DOM.notificationsEnabled?.checked || false;
    const sound = DOM.soundEnabled?.checked || true;
    
    localStorage.setItem('kwiktask_notifications', notifications);
    localStorage.setItem('kwiktask_sound', sound);
    
    showNotification('⚙️ Settings saved');
}

function clearAllTasks() {
    if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
        allToDos = [];
        saveTodos();
        updateToDoList();
        showNotification('✅ All tasks cleared');
    }
}

// ================= STRIPE CHECKOUT =================
async function startCheckout() {
    const user = auth.currentUser;
    if (!user) return alert("Please log in first");

    if (USE_DEMO_MODE) {
        try {
            await updateDoc(doc(db, "users", user.uid), {
                pro: true,
                proSince: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            isPro = true;
            DOM.stripeModal?.classList.remove("active");
            DOM.successModal?.classList.add("active");
            updateUIForTier();
            updateToDoList();
            showNotification("✅ DEMO: Upgraded to Pro successfully!");
        } catch (err) {
            console.error("Demo mode error:", err);
            alert("Demo mode failed. Please try again.");
        }
        return;
    }

    alert("Production Stripe checkout would redirect here");
}

// ================= NAVIGATION =================
function handleNavigation(view) {
    // Hide all views
    if (DOM.tasksView) DOM.tasksView.style.display = 'none';
    if (DOM.analyticsView) DOM.analyticsView.style.display = 'none';
    if (DOM.calendarView) DOM.calendarView.style.display = 'none';
    if (DOM.filesView) DOM.filesView.style.display = 'none';
    if (DOM.settingsView) DOM.settingsView.style.display = 'none';
    
    // Show selected view
    if (view === 'tasks' && DOM.tasksView) {
        DOM.tasksView.style.display = 'block';
    }
    else if (view === 'analytics' && DOM.analyticsView) {
        DOM.analyticsView.style.display = 'block';
        if (isPro) {
            if (DOM.analyticsLocked) DOM.analyticsLocked.style.display = 'none';
            if (DOM.analyticsContent) DOM.analyticsContent.style.display = 'block';
            initAnalytics();
        } else {
            if (DOM.analyticsLocked) DOM.analyticsLocked.style.display = 'block';
            if (DOM.analyticsContent) DOM.analyticsContent.style.display = 'none';
        }
    }
    else if (view === 'calendar' && DOM.calendarView) {
        DOM.calendarView.style.display = 'block';
        if (isPro) {
            if (DOM.calendarLocked) DOM.calendarLocked.style.display = 'none';
            if (DOM.calendarContent) DOM.calendarContent.style.display = 'block';
            initCalendar();
        } else {
            if (DOM.calendarLocked) DOM.calendarLocked.style.display = 'block';
            if (DOM.calendarContent) DOM.calendarContent.style.display = 'none';
        }
    }
    else if (view === 'files' && DOM.filesView) {
        DOM.filesView.style.display = 'block';
        if (isPro) {
            if (DOM.filesLocked) DOM.filesLocked.style.display = 'none';
            if (DOM.filesContent) DOM.filesContent.style.display = 'block';
            initFiles();
        } else {
            if (DOM.filesLocked) DOM.filesLocked.style.display = 'block';
            if (DOM.filesContent) DOM.filesContent.style.display = 'none';
        }
    }
    else if (view === 'settings' && DOM.settingsView) {
        DOM.settingsView.style.display = 'block';
        initSettings();
    }
}

// ================= EVENT LISTENERS =================
function attachEventListeners() {
    // Todo form
    DOM.todoForm?.addEventListener("submit", e => {
        e.preventDefault();
        addToDo();
    });

    // Logout
    DOM.logoutBtn?.addEventListener("click", handleLogout);

    // Navigation
    DOM.navItems?.forEach(item => {
        item.addEventListener("click", () => {
            DOM.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            handleNavigation(item.dataset.view);
        });
    });

    // Calendar navigation
    DOM.todayBtn?.addEventListener('click', goToToday);
    DOM.prevMonthBtn?.addEventListener('click', previousMonth);
    DOM.nextMonthBtn?.addEventListener('click', nextMonth);
    DOM.closeSelectedDay?.addEventListener('click', () => {
        if (DOM.selectedDayTasks) DOM.selectedDayTasks.style.display = 'none';
    });
    
    // Calendar quick add task - FIXED
    DOM.quickAddTaskBtn?.addEventListener("click", quickAddTask);
    
    // Allow Enter key in quick task input
    DOM.quickTaskInput?.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            quickAddTask();
        }
    });

    // Modal triggers
    document.getElementById("subscribeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("upgradePromptBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("analyticsUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("calendarUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("filesUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    DOM.upgradeFromSettings?.addEventListener("click", (e) => {
        e.preventDefault();
        DOM.stripeModal?.classList.add("active");
    });

    // Close modal
    document.getElementById("closeModal")?.addEventListener("click", () => DOM.stripeModal?.classList.remove("active"));
    document.getElementById("stripeCheckoutBtn")?.addEventListener("click", startCheckout);
    
    // Success modal
    DOM.closeSuccessModal?.addEventListener("click", () => DOM.successModal?.classList.remove("active"));
    DOM.continueBtn?.addEventListener("click", () => {
        DOM.successModal?.classList.remove("active");
        handleNavigation('tasks');
        DOM.navItems.forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-view="tasks"]')?.classList.add('active');
    });

    // Settings event listeners
    DOM.saveProfileBtn?.addEventListener("click", saveProfile);
    DOM.clearDataBtn?.addEventListener("click", clearAllTasks);
    
    DOM.themeLight?.addEventListener("change", saveTheme);
    DOM.themeDark?.addEventListener("change", saveTheme);
    DOM.themeSystem?.addEventListener("change", saveTheme);
    
    DOM.notificationsEnabled?.addEventListener("change", saveNotificationSettings);
    DOM.soundEnabled?.addEventListener("change", saveNotificationSettings);
    
    // Export data
    DOM.exportDataBtn?.addEventListener("click", exportUserData);

    // Click outside to close modals
    window.addEventListener("click", e => {
        if (e.target === DOM.stripeModal) DOM.stripeModal?.classList.remove("active");
        if (e.target === DOM.successModal) DOM.successModal?.classList.remove("active");
        if (e.target === DOM.newFolderModal) DOM.newFolderModal?.classList.remove("active");
        if (e.target === DOM.filePreviewModal) DOM.filePreviewModal?.classList.remove("active");
    });
}

// ================= LOGOUT =================
async function handleLogout() {
    try {
        await signOut(auth);
        localStorage.removeItem(TODO_STORAGE_KEY);
        window.location.href = "/login.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to log out. Please try again.");
    }
}

// ================= PRO STATUS POLLING =================
if (!TEST_MODE) {
    setInterval(async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().pro === true && !isPro) {
                isPro = true;
                updateUIForTier();
                updateToDoList();
                DOM.successModal?.classList.add("active");
            }
        } catch (error) {
            console.error("Error polling pro status:", error);
        }
    }, 5000);
}

// ===== GLOBAL EXPORTS =====
window.startCheckout = startCheckout;
window.initAnalytics = initAnalytics;
window.initCalendar = initCalendar;
window.initFiles = initFiles;
window.initSettings = initSettings;
window.exportUserData = exportUserData;
window.createFolder = createFolder;
window.uploadFile = uploadFile;
window.deleteFile = deleteFile;
window.renameFile = renameFile;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
`;
document.head.appendChild(style);