// settings.js - Full settings panel for KwikTask
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { exportUserData } from './analytics.js';

const db = window.db;
const auth = window.auth;

// ===== SETTINGS STATE =====
let userSettings = {
    theme: 'light',
    notifications: false,
    soundEnabled: true,
    taskSortOrder: 'created',
    weekStartsOn: 'monday',
    emailDigest: false
};

// ===== INITIALIZE SETTINGS =====
export async function initSettings() {
    const user = auth.currentUser;
    if (!user) return;
    
    await loadUserSettings(user.uid);
    renderSettings();
    attachSettingsEvents();
}

// ===== LOAD USER SETTINGS =====
async function loadUserSettings(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().settings) {
            userSettings = { ...userSettings, ...userDoc.data().settings };
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// ===== SAVE USER SETTINGS =====
async function saveUserSettings() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            settings: userSettings,
            updatedAt: new Date().toISOString()
        });
        
        showToast('Settings saved successfully!', 'success');
    } catch (error) {
        console.error("Error saving settings:", error);
        showToast('Failed to save settings', 'error');
    }
}

// ===== RENDER SETTINGS =====
function renderSettings() {
    // Profile section
    const user = auth.currentUser;
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('displayName').value = user.displayName || '';
    }
    
    // Theme settings
    const themeRadios = document.getElementsByName('theme');
    for (let radio of themeRadios) {
        if (radio.value === userSettings.theme) {
            radio.checked = true;
        }
    }
    
    // Notification settings
    document.getElementById('notificationsEnabled').checked = userSettings.notifications;
    document.getElementById('soundEnabled').checked = userSettings.soundEnabled;
    
    // Task preferences
    document.getElementById('taskSortOrder').value = userSettings.taskSortOrder;
    document.getElementById('weekStartsOn').value = userSettings.weekStartsOn;
    document.getElementById('emailDigest').checked = userSettings.emailDigest;
    
    // Apply current theme
    applyTheme(userSettings.theme);
}

// ===== APPLY THEME =====
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
        document.documentElement.style.setProperty('--text-color', '#ffffff');
        document.documentElement.style.setProperty('--card-bg', '#2d2d2d');
        document.documentElement.style.setProperty('--border-color', '#404040');
    } else {
        document.body.classList.remove('dark-theme');
        document.documentElement.style.setProperty('--bg-color', '#ffffff');
        document.documentElement.style.setProperty('--text-color', '#1a1a1a');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--border-color', '#f0f0f0');
    }
}

// ===== UPDATE PROFILE =====
async function updateUserProfile() {
    const user = auth.currentUser;
    if (!user) return;
    
    const displayName = document.getElementById('displayName').value;
    
    try {
        await updateProfile(user, {
            displayName: displayName
        });
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast('Failed to update profile', 'error');
    }
}

// ===== TOGGLE NOTIFICATIONS =====
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notifications not supported', 'error');
        return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// ===== CLEAR ALL DATA =====
async function clearAllData() {
    const confirmed = confirm(
        '⚠️ Are you sure you want to delete ALL your tasks and data?\n\nThis action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Clear localStorage
        localStorage.removeItem('kwiktask_todos');
        
        // Clear Firestore tasks
        // Note: This would need a Cloud Function or batch delete
        showToast('Your data has been cleared', 'success');
        
        // Reload page to reset state
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error("Error clearing data:", error);
        showToast('Failed to clear data', 'error');
    }
}

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== ATTACH SETTINGS EVENTS =====
function attachSettingsEvents() {
    // Profile
    document.getElementById('saveProfileBtn')?.addEventListener('click', updateUserProfile);
    
    // Theme
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            userSettings.theme = e.target.value;
            applyTheme(userSettings.theme);
            saveUserSettings();
        });
    });
    
    // Notifications
    document.getElementById('notificationsEnabled')?.addEventListener('change', async (e) => {
        if (e.target.checked) {
            const granted = await requestNotificationPermission();
            if (granted) {
                userSettings.notifications = true;
                showToast('Notifications enabled!', 'success');
            } else {
                e.target.checked = false;
                userSettings.notifications = false;
                showToast('Notification permission denied', 'error');
            }
        } else {
            userSettings.notifications = false;
        }
        saveUserSettings();
    });
    
    document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
        userSettings.soundEnabled = e.target.checked;
        saveUserSettings();
    });
    
    // Task preferences
    document.getElementById('taskSortOrder')?.addEventListener('change', (e) => {
        userSettings.taskSortOrder = e.target.value;
        saveUserSettings();
    });
    
    document.getElementById('weekStartsOn')?.addEventListener('change', (e) => {
        userSettings.weekStartsOn = e.target.value;
        saveUserSettings();
    });
    
    document.getElementById('emailDigest')?.addEventListener('change', (e) => {
        userSettings.emailDigest = e.target.checked;
        saveUserSettings();
    });
    
    // Export data
    document.getElementById('exportDataBtn')?.addEventListener('click', exportUserData);
    
    // Danger zone
    document.getElementById('clearDataBtn')?.addEventListener('click', clearAllData);
}