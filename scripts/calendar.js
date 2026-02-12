// calendar.js - Full calendar view for KwikTask Pro
import { collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = window.db;
const auth = window.auth;

// ===== CALENDAR STATE =====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let calendarTasks = [];

// ===== INITIALIZE CALENDAR =====
export async function initCalendar() {
    const user = auth.currentUser;
    if (!user) return;
    
    await loadCalendarTasks(user.uid);
    renderCalendar();
    attachCalendarEvents();
}

// ===== LOAD TASKS FOR CALENDAR =====
async function loadCalendarTasks(userId) {
    try {
        const tasksRef = collection(db, "users", userId, "tasks");
        const querySnapshot = await getDocs(tasksRef);
        
        calendarTasks = [];
        querySnapshot.forEach((doc) => {
            const task = doc.data();
            if (task.createdAt || task.completedAt) {
                calendarTasks.push({
                    id: doc.id,
                    ...task
                });
            }
        });
    } catch (error) {
        console.error("Error loading calendar tasks:", error);
    }
}

// ===== RENDER CALENDAR =====
function renderCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // Update month and year display
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-weekday';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
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
        const dayTasks = calendarTasks.filter(task => {
            const taskDate = task.completedAt || task.createdAt;
            return taskDate && taskDate.startsWith(dateStr);
        });
        
        // Add task indicators
        if (dayTasks.length > 0) {
            const taskIndicator = document.createElement('div');
            taskIndicator.className = 'task-indicator';
            
            const completedTasks = dayTasks.filter(t => t.completed).length;
            taskIndicator.innerHTML = `
                <span class="task-count">${dayTasks.length} tasks</span>
                <span class="completed-count">${completedTasks} done</span>
            `;
            dayCell.appendChild(taskIndicator);
            
            // Store tasks for popup
            dayCell.dataset.tasks = JSON.stringify(dayTasks);
            dayCell.dataset.date = dateStr;
            dayCell.addEventListener('click', showDayTasks);
        }
        
        calendarGrid.appendChild(dayCell);
    }
}

// ===== SHOW DAY TASKS POPUP =====
function showDayTasks(e) {
    const dayCell = e.currentTarget;
    const tasks = JSON.parse(dayCell.dataset.tasks);
    const date = dayCell.dataset.date;
    
    const modal = document.getElementById('dayTasksModal');
    const dateDisplay = document.getElementById('selectedDate');
    const tasksList = document.getElementById('dayTasksList');
    
    dateDisplay.textContent = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    tasksList.innerHTML = '';
    tasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    }).forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
            <span>${escapeHTML(task.text)}</span>
            <span class="task-time">${new Date(task.completedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        tasksList.appendChild(li);
    });
    
    modal.classList.add('active');
}

// ===== CALENDAR NAVIGATION =====
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

// ===== ATTACH CALENDAR EVENTS =====
function attachCalendarEvents() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', previousMonth);
    document.getElementById('nextMonthBtn')?.addEventListener('click', nextMonth);
    document.getElementById('todayBtn')?.addEventListener('click', goToToday);
    
    // Close modal
    document.getElementById('closeDayTasksModal')?.addEventListener('click', () => {
        document.getElementById('dayTasksModal').classList.remove('active');
    });
    
    // Click outside to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('dayTasksModal');
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Helper function for XSS protection
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}