import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// 🔥 PASTE YOUR REAL CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyBxp7N-ozFLbK-o2GX13vBjby6a9CfaAww",
  authDomain: "kwiktask-a454c.firebaseapp.com",
  projectId: "kwiktask-a454c",
  storageBucket: "kwiktask-a454c.firebasestorage.app",
  messagingSenderId: "527340121540",
  appId: "1:527340121540:web:c74f0773f60b5e1fc98891",
  measurementId: "G-V6DMGJ1Y3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const errorMsg = document.getElementById("errorMsg");


// 🔥 SIGN UP
document.getElementById("signupBtn").onclick = async () => {
  try {
    const email = emailInput.value;
    const password = passwordInput.value;

    // Create new user
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // Save user info to Firestore
    await setDoc(doc(db, "users", userCred.user.uid), {
      email: email,
      pro: false,
      createdAt: new Date()
    });

    // Redirect to homepage immediately
    window.location.href = "index.html";

  } catch (error) {
    errorMsg.innerText = error.message;
  }
};

// 🔥 LOGIN
document.getElementById("loginBtn").onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    // Redirect to homepage immediately
    window.location.href = "index.html";

  } catch (error) {
    errorMsg.innerText = error.message;
  }
};
