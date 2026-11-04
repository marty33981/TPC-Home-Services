// ─────────────────────────────────────────────────────────────
// TPC Home Services — Firebase + app configuration
// ─────────────────────────────────────────────────────────────
window.HW_CONFIG = {
  firebase: {
    apiKey:            "AIzaSyBb7wJP6W2EzkpVdtkbNJdOIBYjBzPosYk",
    authDomain:        "tpc-homewatch.firebaseapp.com",
    projectId:         "tpc-homewatch",
    storageBucket:     "tpc-homewatch.firebasestorage.app",
    messagingSenderId: "603133828808",
    appId:             "1:603133828808:web:5c5e7b6318dbe795f04ffd",
    measurementId:     "G-PVLJ7DY423",
  }
};

// Password rules: 8+ chars, one capital, one number, one symbol.
// Returns an error string or null if valid.
function validatePassword(pwd) {
  if (!pwd || pwd.length < 8)      return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pwd))          return "Password must contain at least one capital letter.";
  if (!/[0-9]/.test(pwd))          return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(pwd))   return "Password must contain at least one symbol.";
  return null;
}
