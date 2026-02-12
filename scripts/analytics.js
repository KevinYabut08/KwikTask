// analytics.js - Full analytics dashboard for KwikTask Pro
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = window.db;
const auth = window.auth;

// ===== ANALYTICS STATE =====
let taskHistory = [];
let completionData = [];
let streakData = [];

// ===== INITIALIZE ANALYTICS =====
export async function initAnalytics() {
    const user = auth.currentUser;
    if (!user) return;

    await loadTaskHistory(user.uid);
    renderAnalytics();
    renderCharts();
}

// ===== LOAD TASK HISTORY FROM FIRESTORE =====
async function loadTaskHistory(userId) {
    try {
        const tasksRef = collection(db, "users", userId, "tasks");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const q = query(
            tasksRef,
            where("createdAt", ">=", thirtyDaysAgo.toISOString()),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        taskHistory = [];
        
        querySnapshot.forEach((doc) => {
            taskHistory.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        processAnalyticsData();
    } catch (error) {
        console.error("Error loading task history:", error);
    }
}

// ===== PROCESS ANALYTICS DATA =====
function processAnalyticsData() {
    // Process completion data by day
    const last7Days = [];
    const completions = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days.push(dateStr);
        
        const dayStart = new Date(date.setHours(0,0,0,0)).toISOString();
        const dayEnd = new Date(date.setHours(23,59,59,999)).toISOString();
        
        const completedCount = taskHistory.filter(t => 
            t.completed && 
            t.completedAt >= dayStart && 
            t.completedAt <= dayEnd
        ).length;
        
        completions.push(completedCount);
    }
    
    completionData = {
        labels: last7Days,
        datasets: [{
            label: 'Tasks Completed',
            data: completions,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#000',
            borderWidth: 1
        }]
    };
    
    // Calculate streaks
    calculateStreaks();
}

// ===== CALCULATE STREAKS =====
function calculateStreaks() {
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;
    
    const today = new Date().setHours(0,0,0,0);
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const hasCompletedTask = taskHistory.some(t => {
            if (!t.completed || !t.completedAt) return false;
            const taskDate = new Date(t.completedAt).setHours(0,0,0,0);
            return taskDate === date.setHours(0,0,0,0);
        });
        
        if (hasCompletedTask) {
            streakCount++;
            if (i === 0) currentStreak = streakCount;
        } else {
            if (streakCount > longestStreak) longestStreak = streakCount;
            streakCount = 0;
        }
    }
    
    streakData = {
        current: currentStreak,
        longest: longestStreak
    };
}

// ===== RENDER ANALYTICS DASHBOARD =====
function renderAnalytics() {
    // Update stats
    const totalTasks = taskHistory.length;
    const completedTasks = taskHistory.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgTasksPerDay = totalTasks > 0 ? (totalTasks / 30).toFixed(1) : 0;
    
    document.getElementById('totalTasksStat').textContent = totalTasks;
    document.getElementById('completedTasksStat').textContent = completedTasks;
    document.getElementById('completionRateStat').textContent = `${completionRate}%`;
    document.getElementById('avgTasksStat').textContent = avgTasksPerDay;
    document.getElementById('currentStreakStat').textContent = streakData.current || 0;
    document.getElementById('longestStreakStat').textContent = streakData.longest || 0;
    
    // Update productivity insights
    renderProductivityInsights();
}

// ===== RENDER CHARTS =====
function renderCharts() {
    // Only render if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        loadChartJS();
    } else {
        createCharts();
    }
}

function loadChartJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.onload = createCharts;
    document.head.appendChild(script);
}

function createCharts() {
    // Weekly completion chart
    const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
    if (weeklyCtx) {
        new Chart(weeklyCtx, {
            type: 'bar',
            data: completionData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f0f0f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Productivity by time of day chart
    renderTimeOfDayChart();
}

function renderTimeOfDayChart() {
    const timeCtx = document.getElementById('timeOfDayChart')?.getContext('2d');
    if (!timeCtx) return;
    
    const timeSlots = ['6am-12pm', '12pm-4pm', '4pm-8pm', '8pm-12am', '12am-6am'];
    const timeCounts = [0, 0, 0, 0, 0];
    
    taskHistory.filter(t => t.completed && t.completedAt).forEach(task => {
        const hour = new Date(task.completedAt).getHours();
        if (hour >= 6 && hour < 12) timeCounts[0]++;
        else if (hour >= 12 && hour < 16) timeCounts[1]++;
        else if (hour >= 16 && hour < 20) timeCounts[2]++;
        else if (hour >= 20 || hour < 0) timeCounts[3]++;
        else timeCounts[4]++;
    });
    
    new Chart(timeCtx, {
        type: 'doughnut',
        data: {
            labels: timeSlots,
            datasets: [{
                data: timeCounts,
                backgroundColor: [
                    '#000000',
                    '#333333',
                    '#666666',
                    '#999999',
                    '#cccccc'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ===== PRODUCTIVITY INSIGHTS =====
function renderProductivityInsights() {
    const insightsList = document.getElementById('productivityInsights');
    if (!insightsList) return;
    
    insightsList.innerHTML = '';
    
    const insights = [];
    
    // Best day insight
    const dayProductivity = {};
    taskHistory.filter(t => t.completed).forEach(task => {
        if (task.completedAt) {
            const day = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
            dayProductivity[day] = (dayProductivity[day] || 0) + 1;
        }
    });
    
    let bestDay = Object.entries(dayProductivity).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
        insights.push({
            icon: 'fa-star',
            text: `Your most productive day is ${bestDay[0]} (${bestDay[1]} tasks)`
        });
    }
    
    // Streak insight
    if (streakData.current > 0) {
        insights.push({
            icon: 'fa-fire',
            text: `${streakData.current} day streak! Keep it going 🔥`
        });
    }
    
    // Completion insight
    const completionRate = taskHistory.length > 0 
        ? Math.round((taskHistory.filter(t => t.completed).length / taskHistory.length) * 100) 
        : 0;
    
    if (completionRate > 70) {
        insights.push({
            icon: 'fa-trophy',
            text: `${completionRate}% completion rate - you're crushing it! 🎯`
        });
    } else if (completionRate < 30) {
        insights.push({
            icon: 'fa-lightbulb',
            text: `Try breaking down large tasks into smaller ones`
        });
    }
    
    // Render insights
    insights.forEach(insight => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas ${insight.icon}"></i> ${insight.text}`;
        insightsList.appendChild(li);
    });
}

// ===== EXPORT DATA =====
export async function exportUserData() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const tasksRef = collection(db, "users", user.uid, "tasks");
        const querySnapshot = await getDocs(tasksRef);
        
        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        const exportData = {
            user: {
                uid: user.uid,
                email: user.email,
                exportDate: new Date().toISOString()
            },
            stats: {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.completed).length,
                completionRate: tasks.length > 0 
                    ? (tasks.filter(t => t.completed).length / tasks.length * 100).toFixed(1)
                    : 0,
                currentStreak: streakData.current,
                longestStreak: streakData.longest
            },
            tasks: tasks
        };
        
        // Convert to CSV
        const csv = convertToCSV(tasks);
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kwiktask-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        alert('✅ Your data has been exported successfully!');
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data. Please try again.');
    }
}

function convertToCSV(tasks) {
    const headers = ['id', 'text', 'completed', 'createdAt', 'completedAt'];
    const rows = tasks.map(task => [
        task.id,
        `"${task.text.replace(/"/g, '""')}"`,
        task.completed,
        task.createdAt || '',
        task.completedAt || ''
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}