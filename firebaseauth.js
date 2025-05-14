// Import necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxBMwGAnfYagpH94hLogzK4ynBaJaGkxw",
  authDomain: "splitly-7d510.firebaseapp.com",
  projectId: "splitly-7d510",
  storageBucket: "splitly-7d510.firebasestorage.app",
  messagingSenderId: "789437258089",
  appId: "1:789437258089:web:83602026ede1e599e305f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);  // Initialize Firestore

// Optional: Log auth state changes for debugging
onAuthStateChanged(auth, (user) => {
  console.log(user ? "User is signed in" : "No user signed in");
});

// Export both auth and db so other files can use them
export { auth, db };

// Consolidated DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication state and update UI accordingly.
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in");
      const signupModal = document.getElementById("signupModal");
      if (signupModal) signupModal.style.display = "none";
    } else {
      console.log("No user signed in");
      const signupModal = document.getElementById("signupModal");
      if (signupModal) signupModal.style.display = "block";
    }
  });

  // --- LOGIN FUNCTIONALITY ---
  const loginBtn = document.querySelector("#login .auth-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      if (!email) {
        showToast("Please enter your email.", true);
        return;
      }
      if (!password) {
        showToast("Please enter your password.", true);
        return;
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        showToast("Invalid email format.", true);
        return;
      }

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          if (!userCredential.user.emailVerified) {
            showToast("Please verify your email before logging in.", true);
            auth.signOut();
            return;
          }
          showToast("Login successful!");
          window.location.href = "profile.html";
        })
        .catch((error) => {
          console.error("Login error:", error);
          showToast(getCustomErrorMessage(error.code), true);
        });
    });
  }

  // --- SIGN UP FUNCTIONALITY ---
  // --- SIGN UP FUNCTIONALITY ---
// --- SIGN UP FUNCTIONALITY ---
const signupBtn = document.querySelector("#signup .auth-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // 1. collect user inputs
    const fullName = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    // 2. Manual Validation
    if (!fullName) {
      showToast("Please enter your full name.", true);
      return;
    }
    if (!email) {
      showToast("Please enter your email.", true);
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.", true);
      return;
    }
    if (!password) {
      showToast("Please enter a password.", true);
      return;
    }
    if (password.length < 8) {
      showToast("Password must be at least 8 characters.", true);
      return;
    }

    // 3. Firebase signup flow
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification FIRST
      await sendEmailVerification(user);

      // Continue with profile update & Firestore write (optional)
      try {
        await Promise.all([
          updateProfile(user, { displayName: fullName }),
          setDoc(doc(db, "users", user.uid), {
            fullName,
            email,
            createdAt: new Date()
          })
        ]);
      } catch (firestoreError) {
        console.warn("Firestore or profile update failed:", firestoreError.message);
        // But we continue, since verification already sent
      }

      // Show confirmation modal
      showConfirmationModal(
        "Almost there! A confirmation email has been sent to your email address. Please click on the link in that email to verify your account.",
        () => {
          auth.signOut();
          window.location.href = "signup-login.html?tab=login";
        }
      );

    } catch (error) {
      console.error("Signup flow error:", error);
      showToast(getCustomErrorMessage(error.code) || error.message, true);
    }
  });
}

});  // ←── closes the DOMContentLoaded listener

// --- Helper functions below (unchanged) ---

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }
  const toastMsg = document.getElementById("toast-message");
  toastMsg.innerText = message;
  if (isError) {
    toast.classList.add("error");
    toast.querySelector(".icon").innerHTML = "&#10006;";
  } else {
    toast.classList.remove("error");
    toast.querySelector(".icon").innerHTML = "&#10004;";
  }
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

function getCustomErrorMessage(code) {
  if (!code) return "Something went wrong. Please try again!";
  const err = code.trim().toLowerCase();
  if (err.includes("invalid-email"))           return "Invalid email format.";
  if (err.includes("user-not-found"))           return "No account found with this email.";
  if (err.includes("wrong-password"))           return "Incorrect password. Try again!";
  if (err.includes("email-already-in-use"))     return "Email is already registered!";
  if (err.includes("weak-password"))            return "Password should be at least 8 characters.";
  return "Something went wrong. Please try again!";
}


function showConfirmationModal(message = "", onOk) {
  const user = auth.currentUser;
  const userEmail = user?.email || "your email";
  const userName = user?.displayName || "there";

  const modal = document.createElement("div");
  modal.className = "confirmation-modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "30px 25px";
  box.style.borderRadius = "12px";
  box.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
  box.style.width = "100%";
  box.style.maxWidth = "420px";
  box.style.textAlign = "center";
  box.style.fontFamily = "sans-serif";

  const title = document.createElement("h2");
  title.innerText = "Verify your email";
  title.style.fontSize = "22px";
  title.style.marginBottom = "15px";
  title.style.color = "#333";

  const msg = document.createElement("p");
  msg.innerHTML = message || `Hi ${userName},<br><br>
    We've sent a verification email to <strong>${userEmail}</strong>.<br>
    Please check your inbox and click the link to activate your account.`;
  msg.style.fontSize = "15px";
  msg.style.lineHeight = "1.6";
  msg.style.color = "#555";
  msg.style.marginBottom = "25px";

  const note = document.createElement("p");
  note.innerText = "Didn’t get the email? Check your spam folder or try again later.";
  note.style.fontSize = "13px";
  note.style.color = "#999";
  note.style.marginBottom = "25px";

  const okBtn = document.createElement("button");
  okBtn.innerText = "OK, Got it";
  okBtn.style.padding = "12px 22px";
  okBtn.style.fontSize = "15px";
  okBtn.style.fontWeight = "600";
  okBtn.style.backgroundColor = "#2f2f2f";
  okBtn.style.color = "#fff";
  okBtn.style.border = "none";
  okBtn.style.borderRadius = "8px";
  okBtn.style.cursor = "pointer";
  okBtn.style.transition = "background 0.3s";
  okBtn.addEventListener("mouseover", () => okBtn.style.backgroundColor = "#000");
  okBtn.addEventListener("mouseout", () => okBtn.style.backgroundColor = "#2f2f2f");

  box.appendChild(title);
  box.appendChild(msg);
  box.appendChild(note);
  box.appendChild(okBtn);
  modal.appendChild(box);
  document.body.appendChild(modal);

  const close = () => {
    modal.remove();
    if (typeof onOk === "function") onOk();
  };

  okBtn.addEventListener("click", close);
  setTimeout(close, 30000);
}
