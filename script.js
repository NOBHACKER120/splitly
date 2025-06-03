// Navbar scroll effect
window.addEventListener("scroll", function () {
  var navbar = document.getElementById("navbar");
  if (window.scrollY > 50) {
      navbar.classList.add("navbar-scrolled");
  } else {
      navbar.classList.remove("navbar-scrolled");
  }
});



// Section animations on scroll
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll('.animate-section');
  setTimeout(() => {
      sections[0].classList.add('active');
  }, 500);
  const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('active');
              observer.unobserve(entry.target);
          }
      });
  }, { threshold: 0.2 });
  sections.forEach((section, index) => {
      if (index > 0) observer.observe(section);
  });
});

// Rotating punchlines
document.addEventListener("DOMContentLoaded", function () {
  const punchlineElement = document.getElementById("punchline");
  const punchlines = [
      `"No awkward money talks - just easy bill splitting!"`,
      `"More memories, less money stress: Splitly makes group travel effortless!"`,
      `"Split smart, stay stress-free: track, settle, and relax with Splitly!"`,
      `"Check-in stress-free! Split hotel bills fairly with Splitly."`
  ];
  let index = 0;
  function changePunchline() {
      punchlineElement.classList.add("fade-out");
      setTimeout(() => {
          index = (index + 1) % punchlines.length;
          punchlineElement.innerText = punchlines[index];
          punchlineElement.classList.remove("fade-out");
          punchlineElement.style.animation = "none";
          void punchlineElement.offsetWidth;
          punchlineElement.style.animation = "fadeInUp 1.5s ease-out forwards";
      }, 1000);
  }
  setInterval(changePunchline, 5000);
});

// Switch between login and signup tabs
function switchTab(tab) {
  const loginForm = document.getElementById("login");
  const signupForm = document.getElementById("signup");
  
  loginForm.classList.remove("active");
  signupForm.classList.remove("active");
  
  document.getElementById(tab).classList.add("active");
  
  document.getElementById("btn-login").classList.remove("active");
  document.getElementById("btn-signup").classList.remove("active");
  document.getElementById("btn-" + tab).classList.add("active");
  
  const authContainer = document.getElementById("authContainer");
  if (tab === "signup") {
    authContainer.style.height = "450px";
  } else {
    authContainer.style.height = "420px";
  }
}

// On page load, check URL parameter for tab switching
document.addEventListener("DOMContentLoaded", function () {
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  const tab = getQueryParam("tab");
  if (tab === "signup") {
    switchTab("signup");
  } else {
    switchTab("login");
  }
});

// Toggle password visibility for all toggle icons
// --- TOGGLE PASSWORD VISIBILITY ---
document.addEventListener("DOMContentLoaded", function () {
  const toggleIcons = document.querySelectorAll('.toggle-password');
  toggleIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      // Try to get the target input using the data-target attribute
      let targetId = this.getAttribute("data-target");
      let pwdInput = targetId ? document.getElementById(targetId) : null;
      // Fallback: search within the parent element for an input field
      if (!pwdInput) {
        pwdInput = this.parentElement.querySelector('input');
      }
      if (pwdInput) {
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          this.classList.replace("fa-eye", "fa-eye-slash");
        } else {
          pwdInput.type = "password";
          this.classList.replace("fa-eye-slash", "fa-eye");
        }
      }
    });
  });
});




document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById('launch-popup');
  const closeIcon = document.getElementById('popup-close');
  const learnMoreButton = document.getElementById('learn-more');
  const now = Date.now();
  const expiryTime = 6 * 60 * 60 * 1000; //for 6 hr ms
  const lastShown = localStorage.getItem('launchPopupShownTime');

  // Show popup if never shown or if the stored timestamp is older than expiryTime
  if (!lastShown || now - lastShown > expiryTime) {
    setTimeout(() => {
      popup.classList.add('show');
      localStorage.setItem('launchPopupShownTime', now);
    }, 1000); // 1-second delay for smoother experience
  }

  // Close popup when clicking the close icon
  closeIcon.addEventListener('click', () => {
    popup.classList.remove('show');
  });

  // Close popup when clicking outside the popup content
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.classList.remove('show');
    }
  });

  // CTA Button action: Redirect to the signup page (or further info page)
  learnMoreButton.addEventListener('click', () => {
    window.location.href = 'signup-login.html?tab=signup';
  });
});


