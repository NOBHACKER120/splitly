// firebaseauth.js
// Single-module Firebase auth + Firestore helper for Splitly
// Usage: <script type="module" src="/path/to/firebaseauth.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// ---------- CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyAxBMwGAnfYagpH94hLogzK4ynBaJaGkxw",
  authDomain: "splitly-7d510.firebaseapp.com",
  projectId: "splitly-7d510",
  storageBucket: "splitly-7d510.firebasestorage.app",
  messagingSenderId: "789437258089",
  appId: "1:789437258089:web:83602026ede1e599e305f8"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helpful: share a small map of firebase -> friendly messages
function friendlyError(code) {
  if (!code) return 'Something went wrong. Please try again.';
  const c = code.toLowerCase();
  if (c.includes('invalid-email')) return 'Invalid email format.';
  if (c.includes('user-not-found')) return 'No account found with this email.';
  if (c.includes('wrong-password')) return 'Incorrect password. Try again!';
  if (c.includes('email-already-in-use')) return 'Email is already registered.';
  if (c.includes('weak-password')) return 'Password should be at least 8 characters.';
  if (c.includes('popup-closed-by-user')) return 'Sign-in popup was closed before finishing.';
  return code || 'Something went wrong. Please try again.';
}

// ---------- AUTH HELPERS ----------
export async function signInWithEmail(email, password) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    // require verification
    if (!userCred.user.emailVerified) {
      await signOut(auth);
      const err = new Error('Please verify your email before logging in.');
      err.code = 'auth/email-not-verified';
      throw err;
    }
    return userCred;
  } catch (err) {
    // normalize
    err.message = friendlyError(err.code) || err.message;
    throw err;
  }
}

export async function createUserWithEmail(name, email, password) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    // send verification email
    await sendEmailVerification(user);

    // update profile and write to Firestore (best-effort)
    try {
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), {
        fullName: name,
        email,
        createdAt: new Date()
      }, { merge: true });
    } catch (e) {
      // don't block signup if Firestore/profile update fails
      console.warn('Profile/Firestore write failed:', e?.message || e);
    }

    // Sign out so the user must verify before using the app
    await signOut(auth);
    return userCred;
  } catch (err) {
    err.message = friendlyError(err.code) || err.message;
    throw err;
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Always upsert the user document
    await setDoc(doc(db, 'users', user.uid), {
      fullName: user.displayName || '',
      email: user.email || '',
      provider: 'google',
      lastLogin: new Date()
    }, { merge: true });

    return result;
  } catch (err) {
    err.message = friendlyError(err.code) || err.message;
    throw err;
  }
}

export function firebaseSignOut() {
  return signOut(auth);
}

// small convenience: expose auth state changes
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

// export core objects in case UI wants them
export { auth, db, storage };

// Make functions available on window for non-module UI code
window.auth = window.auth || {};
window.auth.signInWithEmail = signInWithEmail;
window.auth.createUserWithEmail = createUserWithEmail;
window.auth.signInWithGoogle = signInWithGoogle;
window.auth.signOut = firebaseSignOut;
window.auth.onAuthChange = onAuthChange;

// Debug logging (remove in production if desired)
onAuthStateChanged(auth, user => console.log(user ? 'Firebase: user signed in' : 'Firebase: no user'));

// End of module
