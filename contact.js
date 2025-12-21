// contact.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase config (same as firebaseauth.js)
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
const db = getFirestore(app);

// Select form
const form = document.querySelector(".contact-form");

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const query = form.query.value;
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !subject || !message) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    await addDoc(collection(db, "contact_messages"), {
      name,
      email,
      queryType: query,
      subject,
      message,
      page: "/contact",
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp()
    });

    form.reset();
    showSuccess();

  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again later.");
  }
});


function showSuccess() {
  // Remove existing success message if any
  const old = document.querySelector(".contact-success");
  if (old) old.remove();

  // Create success banner
  const success = document.createElement("div");
  success.className = "contact-success";
  success.innerHTML = "✅ Message sent successfully! We’ll get back to you within 24–48 hours.";

  // Insert ABOVE the form
  form.parentElement.insertBefore(success, form);
success.scrollIntoView({ behavior: "smooth", block: "center" });

  // Disable submit button
  const btn = form.querySelector(".contact-submit-btn");
  btn.disabled = true;
  btn.textContent = "Message Sent ✓";

  // Auto reset after 6 seconds
  setTimeout(() => {
    success.remove();
    btn.disabled = false;
    btn.textContent = "Send Message";
  }, 6000);
}
