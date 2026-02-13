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
const NOTES_STORAGE_KEY = "kwiktask_notes_demo";
const USE_DEMO_MODE = false;
const TEST_MODE = true;

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
    notesView: document.getElementById('notes-view'),
    analyticsView: document.getElementById('analytics-view'),
    calendarView: document.getElementById('calendar-view'),
    filesView: document.getElementById('files-view'),
    settingsView: document.getElementById('settings-view'),
    notesLocked: document.getElementById('notesLocked'),
    analyticsLocked: document.getElementById('analyticsLocked'),
    calendarLocked: document.getElementById('calendarLocked'),
    filesLocked: document.getElementById('filesLocked'),
    notesContent: document.getElementById('notesContent'),
    analyticsContent: document.getElementById('analyticsContent'),
    calendarContent: document.getElementById('calendarContent'),
    filesContent: document.getElementById('filesContent'),
    
    // Calendar elements - UPDATED with time slot and grid container
    currentMonth: document.getElementById('currentMonth'),
    calendarStats: document.getElementById('calendarStats'),
    todayBtn: document.getElementById('todayBtn'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    calendarWeekdays: document.getElementById('calendarWeekdays'),
    calendarGrid: document.getElementById('calendarGrid'),
    calendarGridContainer: document.getElementById('calendarGridContainer'),
    quickTaskInput: document.getElementById('quickTaskInput'),
    quickTaskDate: document.getElementById('quickTaskDate'),
    quickTaskTimeSlot: document.getElementById('quickTaskTimeSlot'),
    quickTaskPriority: document.getElementById('quickTaskPriority'),
    quickAddTaskBtn: document.getElementById('quickAddTaskBtn'),
    selectedDayTasks: document.getElementById('selectedDayTasks'),
    selectedDayTitle: document.getElementById('selectedDayTitle'),
    closeSelectedDay: document.getElementById('closeSelectedDay'),
    selectedDayList: document.getElementById('selectedDayList'),
    calendarViewToggle: document.querySelectorAll('.calendar-view-toggle .view-toggle-btn'),
    
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
    
    // Notes elements
    notesGrid: document.getElementById('notesGrid'),
    notesContainer: document.getElementById('notesContainer'),
    notesEmptyState: document.getElementById('notesEmptyState'),
    newNoteBtn: document.getElementById('newNoteBtn'),
    noteSearchInput: document.getElementById('noteSearchInput'),
    notesViewToggle: document.querySelectorAll('.notes-view-toggle .view-toggle-btn'),
    noteFolderChips: document.querySelectorAll('.folder-chip'),
    recentNotesList: document.getElementById('recentNotesList'),
    emptyStateNewNoteBtn: document.getElementById('emptyStateNewNoteBtn'),
    viewAllNotesBtn: document.getElementById('viewAllNotesBtn'),
    noteEditorModal: document.getElementById('noteEditorModal'),
    noteTitleInput: document.getElementById('noteTitleInput'),
    noteBodyTextarea: document.getElementById('noteBodyTextarea'),
    noteFolderSelect: document.getElementById('noteFolderSelect'),
    noteEditorDate: document.getElementById('noteEditorDate'),
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    cancelNoteBtn: document.getElementById('cancelNoteBtn'),
    closeNoteEditor: document.getElementById('closeNoteEditor'),
    deleteNoteModal: document.getElementById('deleteNoteModal'),
    deleteNoteName: document.getElementById('deleteNoteName'),
    confirmDeleteNoteBtn: document.getElementById('confirmDeleteNoteBtn'),
    cancelDeleteNoteBtn: document.getElementById('cancelDeleteNoteBtn'),
    closeDeleteNoteModal: document.getElementById('closeDeleteNoteModal'),
    
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

// ===== NOTES STATE =====
let allNotes = [];
let activeNoteFolder = 'all';
let notesViewMode = 'grid';
let currentEditingNoteId = null;

// ===== ANALYTICS STATE =====
let taskHistory = [];
let completionData = [];
let streakData = { current: 0, longest: 0 };

// ===== CALENDAR STATE - UPDATED =====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let calendarTasks = [];
let calendarViewMode = 'month';
let selectedWeekStart = null;
let selectedDay = null;

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

function formatDateRelative(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    const [hour, minute] = timeSlot.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
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
    loadNotes();
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

// ================= NOTES FUNCTIONS =================
async function loadNotes() {
    if (!isPro) {
        allNotes = [];
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const notesRef = collection(db, "users", user.uid, "notes");
        const q = query(notesRef, orderBy("updatedAt", "desc"));
        const notesSnapshot = await getDocs(q);
        
        allNotes = [];
        notesSnapshot.forEach((doc) => {
            allNotes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📝 Loaded ${allNotes.length} notes from Firestore`);
        
        if (allNotes.length === 0) {
            createDemoNotes();
        }
        
    } catch (error) {
        console.error("Error loading notes:", error);
        const notesJson = localStorage.getItem(NOTES_STORAGE_KEY) || "[]";
        allNotes = JSON.parse(notesJson);
    }
    
    renderNotes();
}

async function createDemoNotes() {
    const demos = [
        { title: "Welcome to KwikTask Notes", body: "This is your first note! You can write meeting notes, ideas, journal entries, or anything else. All notes are synced to your account.\n\n✨ Pro tip: Use folders to keep things organized.", folder: "personal", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { title: "Productivity hacks", body: "• Pomodoro 25/5\n• Block distractions\n• Use two lists: Today & Later\n• Review weekly", folder: "ideas", createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
        { title: "Q2 Strategy", body: "Goals:\n- Increase engagement\n- New onboarding flow\n- Team offsite in June", folder: "work", createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() }
    ];
    
    const user = auth.currentUser;
    if (!user) return;
    
    for (const demo of demos) {
        try {
            const notesRef = collection(db, "users", user.uid, "notes");
            await addDoc(notesRef, demo);
        } catch (e) {
            console.warn("Could not add demo note", e);
        }
    }
    
    await loadNotes();
}

async function saveNote() {
    if (!isPro) {
        alert("Notes are a Pro feature. Please upgrade.");
        return;
    }
    
    const title = DOM.noteTitleInput?.value.trim() || "Untitled";
    const body = DOM.noteBodyTextarea?.value.trim() || "";
    const folder = DOM.noteFolderSelect?.value || "personal";
    
    if (!body && !title) {
        showNotification("Cannot save empty note", "error");
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    const now = new Date().toISOString();
    
    try {
        const notesRef = collection(db, "users", user.uid, "notes");
        
        if (currentEditingNoteId) {
            const noteRef = doc(db, "users", user.uid, "notes", currentEditingNoteId);
            await updateDoc(noteRef, {
                title,
                body,
                folder,
                updatedAt: now
            });
            showNotification('✏️ Note updated');
        } else {
            await addDoc(notesRef, {
                title,
                body,
                folder,
                createdAt: now,
                updatedAt: now
            });
            showNotification('📝 Note created');
        }
        
        DOM.noteEditorModal?.classList.remove('active');
        await loadNotes();
        
        currentEditingNoteId = null;
        DOM.noteTitleInput.value = '';
        DOM.noteBodyTextarea.value = '';
        DOM.noteFolderSelect.value = 'personal';
        
    } catch (error) {
        console.error("Error saving note:", error);
        alert("Failed to save note");
    }
}

async function deleteNote(noteId) {
    if (!isPro) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await deleteDoc(doc(db, "users", user.uid, "notes", noteId));
        allNotes = allNotes.filter(n => n.id !== noteId);
        renderNotes();
        DOM.deleteNoteModal?.classList.remove('active');
        showNotification('🗑️ Note deleted');
    } catch (error) {
        console.error("Error deleting note:", error);
        alert("Failed to delete note");
    }
}

function openNewNoteModal() {
    currentEditingNoteId = null;
    DOM.noteTitleInput.value = '';
    DOM.noteBodyTextarea.value = '';
    DOM.noteFolderSelect.value = 'personal';
    
    const now = new Date();
    DOM.noteEditorDate.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    DOM.noteEditorModal?.classList.add('active');
}

function openEditNoteModal(note) {
    currentEditingNoteId = note.id;
    DOM.noteTitleInput.value = note.title || '';
    DOM.noteBodyTextarea.value = note.body || '';
    DOM.noteFolderSelect.value = note.folder || 'personal';
    
    const date = note.updatedAt ? new Date(note.updatedAt) : new Date();
    DOM.noteEditorDate.textContent = 'last edited ' + formatDateRelative(note.updatedAt);
    
    DOM.noteEditorModal?.classList.add('active');
}

function renderNotes() {
    if (!DOM.notesGrid) return;
    
    let filteredNotes = [...allNotes];
    if (activeNoteFolder !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.folder === activeNoteFolder);
    }
    
    const searchTerm = DOM.noteSearchInput?.value.toLowerCase() || '';
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n => 
            (n.title && n.title.toLowerCase().includes(searchTerm)) || 
            (n.body && n.body.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredNotes.length === 0) {
        if (DOM.notesContainer) DOM.notesContainer.style.display = 'none';
        if (DOM.notesEmptyState) {
            DOM.notesEmptyState.style.display = 'block';
            const emptyHeading = DOM.notesEmptyState.querySelector('h3');
            if (emptyHeading) {
                emptyHeading.textContent = searchTerm ? 'No matching notes' : 'No notes yet';
            }
        }
        return;
    } else {
        if (DOM.notesContainer) DOM.notesContainer.style.display = 'block';
        if (DOM.notesEmptyState) DOM.notesEmptyState.style.display = 'none';
    }
    
    DOM.notesGrid.className = `notes-grid ${notesViewMode === 'list' ? 'list-view' : ''}`;
    DOM.notesGrid.innerHTML = '';
    
    filteredNotes.forEach(note => {
        const noteCard = createNoteCardElement(note);
        DOM.notesGrid.appendChild(noteCard);
    });
    
    renderRecentNotes();
}

function createNoteCardElement(note) {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.dataset.id = note.id;
    
    const folderIcons = {
        'personal': '🧑',
        'work': '💼',
        'ideas': '💡',
        'other': '🗂️'
    };
    
    const folderIcon = folderIcons[note.folder] || '📓';
    const folderLabel = note.folder || 'other';
    
    const bodyPreview = note.body ? note.body.substring(0, 100).replace(/\n/g, ' ') : '';
    const previewText = bodyPreview + (note.body && note.body.length > 100 ? '...' : '');
    
    const dateStr = formatDateRelative(note.updatedAt || note.createdAt);
    
    div.innerHTML = `
        <div class="note-card-header">
            <span class="note-folder-badge">${folderIcon} ${folderLabel}</span>
            <button class="note-card-menu" data-id="${note.id}">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>
        <h4 class="note-card-title">${escapeHTML(note.title || 'Untitled')}</h4>
        <p class="note-card-preview">${escapeHTML(previewText)}</p>
        <div class="note-card-footer">
            <span class="note-date">${dateStr}</span>
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (e.target.closest('.note-card-menu')) return;
        openEditNoteModal(note);
    });
    
    const menuBtn = div.querySelector('.note-card-menu');
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (DOM.deleteNoteName) DOM.deleteNoteName.textContent = note.title || 'Untitled';
        DOM.deleteNoteModal.dataset.noteId = note.id;
        DOM.deleteNoteModal?.classList.add('active');
    });
    
    return div;
}

function renderRecentNotes() {
    if (!DOM.recentNotesList) return;
    
    const recent = [...allNotes]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 3);
    
    if (recent.length === 0) {
        DOM.recentNotesList.innerHTML = '<div style="padding: 1rem; text-align: center; color: #999;">No recent notes</div>';
        return;
    }
    
    let html = '';
    recent.forEach(note => {
        const date = formatDateRelative(note.updatedAt || note.createdAt);
        html += `
            <div class="recent-note-item" data-id="${note.id}">
                <i class="fas fa-file-alt"></i>
                <span>${escapeHTML(note.title || 'Untitled')}</span>
                <span>${date}</span>
            </div>
        `;
    });
    
    DOM.recentNotesList.innerHTML = html;
    
    DOM.recentNotesList.querySelectorAll('.recent-note-item').forEach(el => {
        el.addEventListener('click', () => {
            const noteId = el.dataset.id;
            const note = allNotes.find(n => n.id === noteId);
            if (note) openEditNoteModal(note);
        });
    });
}

function setActiveNoteFolder(folderId) {
    activeNoteFolder = folderId;
    
    DOM.noteFolderChips.forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.folder === folderId) {
            chip.classList.add('active');
        }
    });
    
    renderNotes();
}

function toggleNotesViewMode(mode) {
    notesViewMode = mode;
    
    DOM.notesViewToggle.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === mode) {
            btn.classList.add('active');
        }
    });
    
    renderNotes();
}

function searchNotes(query) {
    renderNotes();
}

function attachNotesEventListeners() {
    DOM.newNoteBtn?.addEventListener('click', openNewNoteModal);
    DOM.emptyStateNewNoteBtn?.addEventListener('click', openNewNoteModal);
    DOM.saveNoteBtn?.addEventListener('click', saveNote);
    DOM.cancelNoteBtn?.addEventListener('click', () => {
        DOM.noteEditorModal?.classList.remove('active');
        currentEditingNoteId = null;
    });
    DOM.closeNoteEditor?.addEventListener('click', () => {
        DOM.noteEditorModal?.classList.remove('active');
        currentEditingNoteId = null;
    });
    DOM.confirmDeleteNoteBtn?.addEventListener('click', () => {
        const noteId = DOM.deleteNoteModal?.dataset.noteId;
        if (noteId) deleteNote(noteId);
    });
    DOM.cancelDeleteNoteBtn?.addEventListener('click', () => {
        DOM.deleteNoteModal?.classList.remove('active');
    });
    DOM.closeDeleteNoteModal?.addEventListener('click', () => {
        DOM.deleteNoteModal?.classList.remove('active');
    });
    DOM.noteFolderChips?.forEach(chip => {
        chip.addEventListener('click', () => {
            const folder = chip.dataset.folder;
            if (folder) setActiveNoteFolder(folder);
        });
    });
    DOM.noteSearchInput?.addEventListener('input', (e) => {
        searchNotes(e.target.value);
    });
    DOM.notesViewToggle?.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.view;
            toggleNotesViewMode(mode);
        });
    });
    DOM.viewAllNotesBtn?.addEventListener('click', () => {
        setActiveNoteFolder('all');
    });
}

// ================= UPDATED CALENDAR FUNCTIONS WITH TIME SLOTS =================

function initCalendar() {
    console.log("📅 Initializing calendar with time slots...");
    loadCalendarTasks();
    
    if (DOM.quickTaskDate) {
        const today = new Date().toISOString().split('T')[0];
        DOM.quickTaskDate.value = today;
    }
    
    if (DOM.quickTaskTimeSlot) {
        DOM.quickTaskTimeSlot.value = '09:00';
    }
    
    switchCalendarView('month');
}

function loadCalendarTasks() {
    calendarTasks = [...allToDos].map(task => ({
        ...task,
        date: task.createdAt ? task.createdAt.split('T')[0] : null,
        timeSlot: task.timeSlot || null,
        hasTimeSlot: !!task.timeSlot
    }));
}

function quickAddTask() {
    const taskText = DOM.quickTaskInput?.value.trim();
    const taskDate = DOM.quickTaskDate?.value;
    const taskTimeSlot = DOM.quickTaskTimeSlot?.value;
    const taskPriority = DOM.quickTaskPriority?.value;
    
    if (!taskText) {
        showNotification('Please enter a task', 'error');
        return;
    }
    
    if (!taskDate) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    let createdAt;
    if (taskTimeSlot) {
        createdAt = new Date(`${taskDate}T${taskTimeSlot}:00`).toISOString();
    } else {
        createdAt = new Date(taskDate).toISOString();
    }
    
    const newTask = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        priority: taskPriority || 'medium',
        createdAt: createdAt,
        completedAt: null,
        date: taskDate,
        timeSlot: taskTimeSlot || null,
        hasTimeSlot: !!taskTimeSlot
    };
    
    allToDos.push(newTask);
    saveTodos();
    
    DOM.quickTaskInput.value = '';
    DOM.quickTaskDate.value = new Date().toISOString().split('T')[0];
    DOM.quickTaskTimeSlot.value = '09:00';
    
    loadCalendarTasks();
    
    if (calendarViewMode === 'month') {
        renderCalendar();
    } else if (calendarViewMode === 'week') {
        renderWeekView();
    } else if (calendarViewMode === 'day') {
        renderDayView();
    }
    
    showNotification('✅ Task added to calendar!');
}

function switchCalendarView(viewMode) {
    calendarViewMode = viewMode;
    
    DOM.calendarViewToggle.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewMode) {
            btn.classList.add('active');
        }
    });
    
    if (!DOM.calendarGridContainer) return;
    
    if (viewMode === 'month') {
        renderCalendar();
    } else if (viewMode === 'week') {
        if (!selectedWeekStart) {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            selectedWeekStart = new Date(today.setDate(diff));
        }
        renderWeekView();
    } else if (viewMode === 'day') {
        if (!selectedDay) {
            selectedDay = new Date().toISOString().split('T')[0];
        }
        renderDayView();
    }
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
    
    if (DOM.calendarWeekdays) {
        DOM.calendarWeekdays.innerHTML = '';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-weekday';
            dayHeader.textContent = day;
            dayHeader.addEventListener('click', () => {
                const weekStart = getWeekStartFromDay(day);
                selectedWeekStart = weekStart;
                switchCalendarView('week');
            });
            DOM.calendarWeekdays.appendChild(dayHeader);
        });
    }
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        DOM.calendarGrid.appendChild(emptyDay);
    }
    
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            i === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayCell.appendChild(dayNumber);
        
        const dateStr = dayCell.dataset.date;
        const dayTasks = calendarTasks.filter(task => task.date === dateStr);
        
        if (dayTasks.length > 0) {
            const taskIndicator = document.createElement('div');
            taskIndicator.className = 'task-indicator';
            
            const completedCount = dayTasks.filter(t => t.completed).length;
            const scheduledCount = dayTasks.filter(t => t.hasTimeSlot).length;
            
            taskIndicator.innerHTML = `
                <span class="task-count">📋 ${dayTasks.length}</span>
                ${scheduledCount > 0 ? `<span class="scheduled-count">⏰ ${scheduledCount}</span>` : ''}
                ${completedCount > 0 ? `<span class="completed-count">✅ ${completedCount}</span>` : ''}
            `;
            dayCell.appendChild(taskIndicator);
        }
        
        dayCell.addEventListener('click', () => {
            selectedDay = dateStr;
            switchCalendarView('day');
        });
        
        DOM.calendarGrid.appendChild(dayCell);
    }
}

function getWeekStartFromDay(dayName) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDayIndex = days.indexOf(dayName);
    const today = new Date();
    const currentDayIndex = today.getDay();
    const diff = targetDayIndex - currentDayIndex;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
    return weekStart;
}

function renderWeekView() {
    if (!DOM.calendarGridContainer || !selectedWeekStart) return;
    
    const weekStart = new Date(selectedWeekStart);
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        weekDays.push(day);
    }
    
    const weekStartStr = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEndStr = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (DOM.currentMonth) {
        DOM.currentMonth.textContent = `${weekStartStr} - ${weekEndStr}`;
    }
    
    const totalTasks = calendarTasks.length;
    const completedTasks = calendarTasks.filter(t => t.completed).length;
    if (DOM.calendarStats) {
        DOM.calendarStats.textContent = `${totalTasks} tasks · ${completedTasks} completed`;
    }
    
    let html = `
        <div class="calendar-weekdays">
            <div class="calendar-weekday">Mon</div>
            <div class="calendar-weekday">Tue</div>
            <div class="calendar-weekday">Wed</div>
            <div class="calendar-weekday">Thu</div>
            <div class="calendar-weekday">Fri</div>
            <div class="calendar-weekday">Sat</div>
            <div class="calendar-weekday">Sun</div>
        </div>
        <div class="calendar-week-grid">
    `;
    
    weekDays.forEach((day, index) => {
        const dateStr = day.toISOString().split('T')[0];
        const dayTasks = calendarTasks.filter(task => task.date === dateStr);
        const isToday = day.toDateString() === new Date().toDateString();
        
        html += `
            <div class="calendar-week-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <div class="day-header">
                    <span class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span class="day-number">${day.getDate()}</span>
                </div>
                <div class="day-tasks-container" id="week-day-tasks-${dateStr}">
        `;
        
        const scheduledForDay = dayTasks.filter(t => t.hasTimeSlot).sort((a, b) => {
            return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        });
        
        scheduledForDay.forEach(task => {
            const timeDisplay = task.timeSlot ? formatTimeSlot(task.timeSlot) : '';
            html += `
                <div class="week-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <span class="task-time">${timeDisplay}</span>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <span class="task-priority priority-${task.priority}"></span>
                </div>
            `;
        });
        
        const unscheduled = dayTasks.filter(t => !t.hasTimeSlot);
        unscheduled.forEach(task => {
            html += `
                <div class="week-task-item unscheduled ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <span class="task-time">📋</span>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <span class="task-priority priority-${task.priority}"></span>
                </div>
            `;
        });
        
        if (dayTasks.length === 0) {
            html += `<div class="no-tasks">no tasks</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="week-navigation">
            <button class="week-nav-btn" id="prevWeekBtn"><i class="fas fa-chevron-left"></i> previous week</button>
            <button class="week-nav-btn" id="nextWeekBtn">next week <i class="fas fa-chevron-right"></i></button>
        </div>
    `;
    
    DOM.calendarGridContainer.innerHTML = html;
    attachWeekViewListeners();
}

function renderDayView() {
    if (!DOM.calendarGridContainer || !selectedDay) return;
    
    const date = new Date(selectedDay);
    const dateStr = selectedDay;
    const dayTasks = calendarTasks.filter(task => task.date === dateStr);
    
    if (DOM.currentMonth) {
        DOM.currentMonth.textContent = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    const completedTasks = dayTasks.filter(t => t.completed).length;
    if (DOM.calendarStats) {
        DOM.calendarStats.textContent = `${dayTasks.length} tasks · ${completedTasks} completed`;
    }
    
    let html = `
        <div class="day-view-container">
            <div class="day-view-header">
                <button class="day-nav-btn" id="prevDayBtn"><i class="fas fa-chevron-left"></i> yesterday</button>
                <button class="day-nav-btn" id="nextDayBtn">tomorrow <i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="day-timeline">
    `;
    
    for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const slotTasks = dayTasks.filter(t => t.timeSlot === timeSlot);
            
            html += `
                <div class="day-timeline-hour" data-time="${timeSlot}">
                    <div class="hour-label">${formatTimeSlot(timeSlot)}</div>
                    <div class="hour-tasks" id="hour-tasks-${dateStr}-${timeSlot.replace(':', '-')}">
            `;
            
            slotTasks.forEach(task => {
                html += `
                    <div class="day-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" class="day-task-checkbox">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        <span class="task-priority priority-${task.priority}"></span>
                        <button class="task-delete-btn" data-task-id="${task.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }
    
    const unscheduledTasks = dayTasks.filter(t => !t.timeSlot);
    if (unscheduledTasks.length > 0) {
        html += `
            <div class="unscheduled-tasks-section">
                <h4>unscheduled</h4>
        `;
        
        unscheduledTasks.forEach(task => {
            html += `
                <div class="day-task-item unscheduled ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" class="day-task-checkbox">
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    <span class="task-priority priority-${task.priority}"></span>
                    <button class="task-delete-btn" data-task-id="${task.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    DOM.calendarGridContainer.innerHTML = html;
    attachDayViewListeners();
}

function attachWeekViewListeners() {
    document.querySelectorAll('.calendar-week-day').forEach(dayEl => {
        dayEl.addEventListener('click', (e) => {
            if (e.target.closest('.week-task-item') || e.target.closest('.week-nav-btn')) return;
            const date = dayEl.dataset.date;
            selectedDay = date;
            switchCalendarView('day');
        });
    });
    
    document.querySelectorAll('.week-task-item').forEach(taskEl => {
        taskEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = taskEl.dataset.taskId;
            const task = allToDos.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                task.completedAt = task.completed ? new Date().toISOString() : null;
                saveTodos();
                loadCalendarTasks();
                renderWeekView();
                showNotification(task.completed ? '✅ Task completed' : '↩️ Task reopened');
            }
        });
    });
    
    document.getElementById('prevWeekBtn')?.addEventListener('click', previousWeek);
    document.getElementById('nextWeekBtn')?.addEventListener('click', nextWeek);
}

function attachDayViewListeners() {
    document.querySelectorAll('.day-task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.dataset.taskId;
            const task = allToDos.find(t => t.id === taskId);
            if (task) {
                task.completed = e.target.checked;
                task.completedAt = task.completed ? new Date().toISOString() : null;
                saveTodos();
                loadCalendarTasks();
                renderDayView();
                showNotification(task.completed ? '✅ Task completed' : '↩️ Task reopened');
            }
        });
    });
    
    document.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.currentTarget.dataset.taskId;
            allToDos = allToDos.filter(t => t.id !== taskId);
            saveTodos();
            loadCalendarTasks();
            renderDayView();
            showNotification('🗑️ Task deleted');
        });
    });
    
    document.querySelectorAll('.day-timeline-hour').forEach(hourEl => {
        hourEl.addEventListener('click', (e) => {
            if (e.target.closest('.day-task-item')) return;
            const timeSlot = hourEl.dataset.time;
            DOM.quickTaskDate.value = selectedDay;
            DOM.quickTaskTimeSlot.value = timeSlot;
            DOM.quickTaskInput.focus();
        });
    });
    
    document.getElementById('prevDayBtn')?.addEventListener('click', previousDay);
    document.getElementById('nextDayBtn')?.addEventListener('click', nextDay);
}

function previousWeek() {
    if (!selectedWeekStart) return;
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    selectedWeekStart = newDate;
    renderWeekView();
}

function nextWeek() {
    if (!selectedWeekStart) return;
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    selectedWeekStart = newDate;
    renderWeekView();
}

function previousDay() {
    if (!selectedDay) return;
    const date = new Date(selectedDay);
    date.setDate(date.getDate() - 1);
    selectedDay = date.toISOString().split('T')[0];
    renderDayView();
}

function nextDay() {
    if (!selectedDay) return;
    const date = new Date(selectedDay);
    date.setDate(date.getDate() + 1);
    selectedDay = date.toISOString().split('T')[0];
    renderDayView();
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
    selectedDay = new Date().toISOString().split('T')[0];
    selectedWeekStart = new Date();
    const day = selectedWeekStart.getDay();
    const diff = selectedWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    selectedWeekStart = new Date(selectedWeekStart.setDate(diff));
    
    if (calendarViewMode === 'month') {
        renderCalendar();
    } else if (calendarViewMode === 'week') {
        renderWeekView();
    } else if (calendarViewMode === 'day') {
        renderDayView();
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
            if (a.timeSlot && b.timeSlot) {
                return a.timeSlot.localeCompare(b.timeSlot);
            }
            if (a.timeSlot) return -1;
            if (b.timeSlot) return 1;
            return 0;
        }).forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `selected-day-task-item ${task.completed ? 'completed' : ''}`;
            const timeDisplay = task.timeSlot ? formatTimeSlot(task.timeSlot) : 'no time';
            taskItem.innerHTML = `
                <i class="fas ${task.completed ? 'fa-check-circle' : task.timeSlot ? 'fa-clock' : 'fa-circle'}" 
                   style="color: ${task.completed ? '#00b894' : task.timeSlot ? '#0984e3' : '#666'};"></i>
                <span class="task-text">${escapeHTML(task.text)}</span>
                <span class="task-time">${timeDisplay}</span>
            `;
            DOM.selectedDayList.appendChild(taskItem);
        });
    }
    
    DOM.selectedDayTasks.style.display = 'block';
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
        const foldersRef = collection(db, "users", user.uid, "folders");
        const foldersSnapshot = await getDocs(foldersRef);
        
        folders = [];
        foldersSnapshot.forEach((doc) => {
            folders.push({
                id: doc.id,
                ...doc.data()
            });
        });

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

    const currentFolders = folders.filter(f => f.parent === currentFolder);
    const currentFiles = files.filter(f => f.parent === currentFolder);

    if (currentFolders.length === 0 && currentFiles.length === 0) {
        showEmptyState();
        return;
    }

    if (DOM.filesEmptyState) DOM.filesEmptyState.style.display = 'none';

    currentFolders.forEach(folder => {
        const folderElement = createFolderElement(folder);
        DOM.filesGrid.appendChild(folderElement);
    });

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
        const filesRef = collection(db, "users", user.uid, "files");
        const filesQuery = query(filesRef, where("parent", "==", folderId));
        const filesSnapshot = await getDocs(filesQuery);
        
        const fileDeletions = [];
        filesSnapshot.forEach((doc) => {
            fileDeletions.push(deleteDoc(doc.ref));
        });
        await Promise.all(fileDeletions);
        
        const foldersRef = collection(db, "users", user.uid, "folders");
        const subfoldersQuery = query(foldersRef, where("parent", "==", folderId));
        const subfoldersSnapshot = await getDocs(subfoldersQuery);
        
        const folderDeletions = [];
        subfoldersSnapshot.forEach((doc) => {
            folderDeletions.push(deleteFolder(doc.id));
        });
        await Promise.all(folderDeletions);
        
        await deleteDoc(doc(db, "users", user.uid, "folders", folderId));
        
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
    DOM.newFolderBtn?.addEventListener('click', () => {
        DOM.newFolderModal?.classList.add('active');
    });

    DOM.uploadFileBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            Array.from(e.target.files).forEach(file => uploadFile(file));
        };
        input.click();
    });

    DOM.filesViewToggle?.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.view;
            toggleViewMode(mode);
        });
    });

    DOM.fileSearchInput?.addEventListener('input', (e) => {
        searchFiles(e.target.value);
    });

    DOM.createFolderBtn?.addEventListener('click', () => {
        const name = DOM.folderName?.value;
        if (name) {
            const selectedColor = document.querySelector('.color-option.selected');
            const color = selectedColor ? selectedColor.dataset.color : '#000';
            createFolder(name, color);
        }
    });

    DOM.folderColorPicker?.forEach(option => {
        option.addEventListener('click', () => {
            DOM.folderColorPicker.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    DOM.closeNewFolderModal?.addEventListener('click', () => {
        DOM.newFolderModal?.classList.remove('active');
    });

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

    DOM.closeFilePreview?.addEventListener('click', () => {
        DOM.filePreviewModal?.classList.remove('active');
    });

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
    
    const savedTheme = localStorage.getItem('kwiktask_theme') || 'light';
    if (savedTheme === 'light' && DOM.themeLight) DOM.themeLight.checked = true;
    if (savedTheme === 'dark' && DOM.themeDark) DOM.themeDark.checked = true;
    if (savedTheme === 'system' && DOM.themeSystem) DOM.themeSystem.checked = true;
    
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
    if (DOM.tasksView) DOM.tasksView.style.display = 'none';
    if (DOM.notesView) DOM.notesView.style.display = 'none';
    if (DOM.analyticsView) DOM.analyticsView.style.display = 'none';
    if (DOM.calendarView) DOM.calendarView.style.display = 'none';
    if (DOM.filesView) DOM.filesView.style.display = 'none';
    if (DOM.settingsView) DOM.settingsView.style.display = 'none';
    
    if (view === 'tasks' && DOM.tasksView) {
        DOM.tasksView.style.display = 'block';
    }
    else if (view === 'notes' && DOM.notesView) {
        DOM.notesView.style.display = 'block';
        if (isPro) {
            if (DOM.notesLocked) DOM.notesLocked.style.display = 'none';
            if (DOM.notesContent) DOM.notesContent.style.display = 'block';
            loadNotes();
        } else {
            if (DOM.notesLocked) DOM.notesLocked.style.display = 'flex';
            if (DOM.notesContent) DOM.notesContent.style.display = 'none';
        }
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
    DOM.todoForm?.addEventListener("submit", e => {
        e.preventDefault();
        addToDo();
    });

    DOM.logoutBtn?.addEventListener("click", handleLogout);

    DOM.navItems?.forEach(item => {
        item.addEventListener("click", () => {
            DOM.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            handleNavigation(item.dataset.view);
        });
    });

    DOM.todayBtn?.addEventListener('click', goToToday);
    DOM.prevMonthBtn?.addEventListener('click', previousMonth);
    DOM.nextMonthBtn?.addEventListener('click', nextMonth);
    DOM.closeSelectedDay?.addEventListener('click', () => {
        if (DOM.selectedDayTasks) DOM.selectedDayTasks.style.display = 'none';
    });
    
    DOM.quickAddTaskBtn?.addEventListener("click", quickAddTask);
    
    DOM.quickTaskInput?.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            quickAddTask();
        }
    });
    
    DOM.calendarViewToggle?.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchCalendarView(view);
        });
    });

    document.getElementById("subscribeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("upgradePromptBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("analyticsUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("calendarUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("filesUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    document.getElementById("notesUpgradeBtn")?.addEventListener("click", () => DOM.stripeModal?.classList.add("active"));
    
    if (DOM.upgradeFromSettings) DOM.upgradeFromSettings?.addEventListener("click", (e) => {
        e.preventDefault();
        DOM.stripeModal?.classList.add("active");
    });

    document.getElementById("closeModal")?.addEventListener("click", () => DOM.stripeModal?.classList.remove("active"));
    document.getElementById("stripeCheckoutBtn")?.addEventListener("click", startCheckout);
    
    DOM.closeSuccessModal?.addEventListener("click", () => DOM.successModal?.classList.remove("active"));
    DOM.continueBtn?.addEventListener("click", () => {
        DOM.successModal?.classList.remove("active");
        handleNavigation('tasks');
        DOM.navItems.forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-view="tasks"]')?.classList.add('active');
    });

    DOM.saveProfileBtn?.addEventListener("click", saveProfile);
    DOM.clearDataBtn?.addEventListener("click", clearAllTasks);
    
    DOM.themeLight?.addEventListener("change", saveTheme);
    DOM.themeDark?.addEventListener("change", saveTheme);
    DOM.themeSystem?.addEventListener("change", saveTheme);
    
    DOM.notificationsEnabled?.addEventListener("change", saveNotificationSettings);
    DOM.soundEnabled?.addEventListener("change", saveNotificationSettings);
    
    DOM.exportDataBtn?.addEventListener("click", exportUserData);

    window.addEventListener("click", e => {
        if (e.target === DOM.stripeModal) DOM.stripeModal?.classList.remove("active");
        if (e.target === DOM.successModal) DOM.successModal?.classList.remove("active");
        if (e.target === DOM.newFolderModal) DOM.newFolderModal?.classList.remove("active");
        if (e.target === DOM.filePreviewModal) DOM.filePreviewModal?.classList.remove("active");
        if (e.target === DOM.noteEditorModal) DOM.noteEditorModal?.classList.remove("active");
        if (e.target === DOM.deleteNoteModal) DOM.deleteNoteModal?.classList.remove("active");
    });
    
    attachNotesEventListeners();
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
                loadNotes();
                DOM.successModal?.classList.add("active");
            }
        } catch (error) {
            console.error("Error polling pro status:", error);
        }
    }, 5000);
}

// ================= ANALYTICS FUNCTIONS =================
function initAnalytics() {
    console.log("📊 Initializing analytics with REAL task data...");
    
    loadTodos();
    taskHistory = [...allToDos];
    
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
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTasks = taskHistory.filter(t => {
        if (!t.createdAt) return false;
        return new Date(t.createdAt) > thirtyDaysAgo;
    });
    const avgPerDay = recentTasks.length > 0 ? (recentTasks.length / 30).toFixed(1) : 0;
    
    calculateStreaks();
    
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
    
    const timeSlots = [0, 0, 0, 0];
    
    taskHistory.forEach(task => {
        if (task.completed && task.completedAt) {
            const hour = new Date(task.completedAt).getHours();
            if (hour >= 5 && hour < 12) timeSlots[0]++;
            else if (hour >= 12 && hour < 17) timeSlots[1]++;
            else if (hour >= 17 && hour < 21) timeSlots[2]++;
            else timeSlots[3]++;
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
        'Task,Completed,Created At,Completed At,Priority,Time Slot',
        ...allToDos.map(t => 
            `"${t.text}",${t.completed},${t.createdAt || ''},${t.completedAt || ''},${t.priority || 'medium'},${t.timeSlot || ''}`
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
window.loadNotes = loadNotes;
window.saveNote = saveNote;
window.deleteNote = deleteNote;
window.openNewNoteModal = openNewNoteModal;
window.switchCalendarView = switchCalendarView;
window.renderWeekView = renderWeekView;
window.renderDayView = renderDayView;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.previousDay = previousDay;
window.nextDay = nextDay;
window.goToToday = goToToday;

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
    
    .scheduled-count {
        color: #0984e3;
        font-size: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .scheduled-count:before {
        content: '⏰';
        font-size: 10px;
    }
    .calendar-weekday {
        cursor: pointer;
        transition: background 0.2s;
    }
    .calendar-weekday:hover {
        background: rgba(0,0,0,0.05);
        border-radius: 100px;
    }
`;
document.head.appendChild(style);