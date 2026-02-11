import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

// ===== STRIPE =====
const stripe = Stripe("pk_test_51SzautGqBhYoGeXbv4LSy6PQVpfO2oPzexUMoCAijD9ELFMtKxn6AjFgEaQkgQg24h2q4aZC3DTRzKhT8kBSOLhD00jpeLGhhk");

// ===== CONFIG =====
const FREE_TASK_LIMIT = 5;
const TODO_STORAGE_KEY = "kwiktask_todos";

// ===== DOM =====
const toDoForm = document.getElementById("todo-form");
const toDoInput = document.getElementById("todo-input");
const toDoList = document.getElementById("todo-list");
const taskCountEl = document.getElementById("taskCount");
const taskLimitIndicator = document.getElementById("taskLimitIndicator");
const freeTierIndicator = document.getElementById("freeTierIndicator");
const proBadge = document.getElementById("proBadge");
const adUnit = document.getElementById("adUnit");
const upgradePrompt = document.getElementById("upgradePrompt");
const addButton = document.getElementById("add-button");

const modal = document.getElementById("stripeModal");
const successModal = document.getElementById("successModal");
const closeSuccessModal = document.getElementById("closeSuccessModal");
const continueBtn = document.getElementById("continueBtn");

// ===== STATE =====
let allToDos = [];
let isPro = false;

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/login.html";
        return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
        isPro = snap.data().pro === true;
    }

    init();
});

// ================= INIT =================
function init() {
    loadTodos();
    updateUIForTier();
    updateToDoList();
    attachEventListeners();
}

// ================= UI =================
function updateUIForTier() {
    if (proBadge) proBadge.style.display = isPro ? "flex" : "none";
    if (freeTierIndicator) freeTierIndicator.style.display = isPro ? "none" : "flex";
    if (adUnit) adUnit.style.display = isPro ? "none" : "block";

    if (taskLimitIndicator && !isPro) {
        taskLimitIndicator.textContent = `${getActiveTaskCount()}/${FREE_TASK_LIMIT} tasks`;
    }

    if (toDoInput) {
        toDoInput.placeholder = isPro
            ? "write a task... (unlimited)"
            : `write a task... (${FREE_TASK_LIMIT - getActiveTaskCount()} left)`;
    }
}

// ================= TASK LIMIT =================
function getActiveTaskCount() {
    return allToDos.filter(t => !t.completed).length;
}

function canAddTask() {
    if (isPro) return true;
    return getActiveTaskCount() < FREE_TASK_LIMIT;
}

function showUpgradePromptIfNeeded() {
    if (!isPro && upgradePrompt) {
        if (getActiveTaskCount() >= FREE_TASK_LIMIT) {
            upgradePrompt.style.display = "flex";
            toDoInput.disabled = true;
            addButton.disabled = true;
        } else {
            upgradePrompt.style.display = "none";
            toDoInput.disabled = false;
            addButton.disabled = false;
        }
    }
}

// ================= TODOS =================
function loadTodos() {
    const todosJson = localStorage.getItem(TODO_STORAGE_KEY) || "[]";
    allToDos = JSON.parse(todosJson);
}

function saveTodos() {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(allToDos));
}

function addToDo() {
    if (!canAddTask()) {
        alert("Free plan limit reached. Upgrade to Pro.");
        return;
    }

    const text = toDoInput.value.trim();
    if (!text) return;

    allToDos.push({ id: Date.now().toString(), text, completed: false });
    toDoInput.value = "";
    saveTodos();
    updateToDoList();
}

function updateToDoList() {
    toDoList.innerHTML = "";

    if (allToDos.length === 0) {
        toDoList.innerHTML = `<li class="todo empty-state">no tasks yet</li>`;
    } else {
        allToDos.forEach(todo => toDoList.append(createToDoItem(todo)));
    }

    updateTaskCount();
    showUpgradePromptIfNeeded();
    updateUIForTier();
}

function createToDoItem(todo) {
    const li = document.createElement("li");
    li.className = "todo";

    li.innerHTML = `
        <input type="checkbox" ${todo.completed ? "checked" : ""}>
        <span>${escapeHTML(todo.text)}</span>
        <button>🗑</button>
    `;

    li.querySelector("input").onchange = () => {
        todo.completed = !todo.completed;
        saveTodos();
        updateToDoList();
    };

    li.querySelector("button").onclick = () => {
        allToDos = allToDos.filter(t => t.id !== todo.id);
        saveTodos();
        updateToDoList();
    };

    return li;
}

function updateTaskCount() {
    if (!taskCountEl) return;
    const active = getActiveTaskCount();
    taskCountEl.textContent = isPro
        ? `${active} tasks remaining`
        : `${active} of ${FREE_TASK_LIMIT} remaining`;
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ================= STRIPE =================
async function startCheckout() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first");

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email }),
    });

    const session = await response.json();
    if (session.error) throw new Error(session.error);

    const stripe = Stripe("pk_test_51SzautGqBhYoGeXbv4LSy6PQVpfO2oPzexUMoCAijD9ELFMtKxn6AjFgEaQkgQg24h2q4aZC3DTRzKhT8kBSOLhD00jpeLGhhk"); 
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (err) {
    console.error("Server returned an error:", err);
    alert("Failed to start checkout. Check console for details.");
  }
}

// ================= EVENTS =================
function attachEventListeners() {
    // To-do form
    toDoForm.addEventListener("submit", e => {
        e.preventDefault();
        addToDo();
    });

    // Stripe modal
    document.getElementById("subscribeBtn")?.addEventListener("click", () => {
        modal.classList.add("active");
    });

    document.getElementById("upgradePromptBtn")?.addEventListener("click", () => {
        modal.classList.add("active");
    });

    document.getElementById("closeModal")?.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    // Stripe checkout button
    document.getElementById("stripeCheckoutBtn")?.addEventListener("click", startCheckout);

    // Success modal
    closeSuccessModal?.addEventListener("click", () => successModal.classList.remove("active"));
    continueBtn?.addEventListener("click", () => successModal.classList.remove("active"));

    // Click outside modal closes it
    window.addEventListener("click", e => {
        if (e.target === modal) modal.classList.remove("active");
        if (e.target === successModal) successModal.classList.remove("active");
    });
}

// ================= POLL FIREBASE TO SHOW PRO BADGE (optional) =================
async function pollProStatus() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().pro === true && !isPro) {
        isPro = true;
        updateUIForTier();
        successModal.classList.add("active");
    }
}

// Check every 5 seconds in case webhook updated the user
setInterval(pollProStatus, 5000);
