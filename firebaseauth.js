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
      if (signupModal) {
        signupModal.style.display = "none";
      }
      // Optionally, show other user-specific tabs here.
    } else {
      console.log("No user signed in");
      const signupModal = document.getElementById("signupModal");
      if (signupModal) {
        signupModal.style.display = "block";
      }
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
  const signupBtn = document.querySelector("#signup .auth-btn");
  if (signupBtn) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const fullName = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;
      
      // Custom validations
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
        showToast("Invalid email format.", true);
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
      
      // Create new user with Firebase Authentication
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Update user profile with the full name
          return updateProfile(userCredential.user, { displayName: fullName })
            .then(() => {
              // Save user data in Firestore
              return setDoc(doc(db, "users", userCredential.user.uid), {
                fullName: fullName,
                email: email,
                createdAt: new Date()
              });
            });
        })
        .then(() => {
          // Send email verification
          return sendEmailVerification(auth.currentUser);
        })
        .then(() => {
          // Show modal confirmation informing the user that a confirmation email has been sent.
          showConfirmationModal(
            "Almost there! A confirmation email has been sent to your email address. Please click on the link in that email to verify your account.",
            () => {
              auth.signOut();
              window.location.href = "signup-login.html?tab=login";
            }
          );
        })
        .catch((error) => {
          console.error("Sign up error:", error);
          showToast(getCustomErrorMessage(error.code), true);
        });
    });
  }
});

// Custom Toast Function (for errors and simple messages)
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
  if (err.includes("invalid-email")) {
    return "Invalid email format.";
  }
  if (err.includes("user-not-found")) {
    return "No account found with this email.";
  }
  if (err.includes("wrong-password")) {
    return "Incorrect password. Try again!";
  }
  if (err.includes("email-already-in-use")) {
    return "Email is already registered!";
  }
  if (err.includes("weak-password")) {
    return "Password should be at least 8 characters.";
  }
  return "Something went wrong. Please try again!";
}

function showConfirmationModal(message, onOk) {
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
  modal.style.zIndex = "2000";

  const content = document.createElement("div");
  content.style.backgroundColor = "#fff";
  content.style.padding = "30px";
  content.style.borderRadius = "8px";
  content.style.textAlign = "center";
  content.style.width = "90%";
  content.style.maxWidth = "400px";
  
  const tickIcon = document.createElement("div");
  tickIcon.innerHTML = "&#10004;";
  tickIcon.style.fontSize = "40px";
  tickIcon.style.color = "green";
  tickIcon.style.marginBottom = "20px";
  
  const msg = document.createElement("p");
  msg.innerText = message;
  msg.style.fontSize = "16px";
  msg.style.marginBottom = "20px";
  
  const okBtn = document.createElement("button");
  okBtn.innerText = "OK";
  okBtn.style.padding = "10px 20px";
  okBtn.style.fontSize = "16px";
  okBtn.style.border = "none";
  okBtn.style.backgroundColor = "#ff8c00";
  okBtn.style.color = "#fff";
  okBtn.style.borderRadius = "5px";
  okBtn.style.cursor = "pointer";
  
  content.appendChild(tickIcon);
  content.appendChild(msg);
  content.appendChild(okBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  const removeModal = () => {
    if (modal && modal.parentElement) {
      modal.parentElement.removeChild(modal);
    }
    if (typeof onOk === "function") onOk();
  };
  
  okBtn.addEventListener("click", removeModal);
  setTimeout(removeModal, 30000);
}
