// Navbar scroll effect
window.addEventListener("scroll", function () {
  var navbar = document.getElementById("navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("navbar-scrolled");
  } else {
    navbar.classList.remove("navbar-scrolled");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Section animations on scroll
  const sections = document.querySelectorAll('.animate-section');
  setTimeout(() => {
    if (sections[0]) sections[0].classList.add('active');
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

  // Rotating punchlines
  const punchlineElement = document.getElementById("punchline");
  if (punchlineElement) {
    const punchlines = [
      `No awkward money talks - just easy bill splitting!`,
      `More memories, less money stress: Splitly makes group travel effortless!`,
      `Split smart, stay stress-free: track, settle, and relax with Splitly!`,
      `Check-in stress-free! Split hotel bills fairly with Splitly.`
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
  }

  // Switch between login and signup tabs
  function switchTabLocal(tab) {
    const loginForm = document.getElementById("login");
    const signupForm = document.getElementById("signup");
    if (loginForm) loginForm.classList.remove("active");
    if (signupForm) signupForm.classList.remove("active");
    const tabEl = document.getElementById(tab);
    if (tabEl) tabEl.classList.add("active");
    const btnLogin = document.getElementById("btn-login");
    const btnSignup = document.getElementById("btn-signup");
    if (btnLogin) btnLogin.classList.remove("active");
    if (btnSignup) btnSignup.classList.remove("active");
    const btnTab = document.getElementById("btn-" + tab);
    if (btnTab) btnTab.classList.add("active");
    const authContainer = document.getElementById("authContainer");
    if (authContainer) {
      authContainer.style.height = (tab === "signup") ? "450px" : "420px";
    }
  }

  // On page load, check URL parameter for tab switching
  (function() {
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
    const tab = getQueryParam("tab");
    if (tab === "signup") {
      switchTabLocal("signup");
    } else {
      switchTabLocal("login");
    }
  })();

  // Toggle password visibility
  const toggleIcons = document.querySelectorAll('.toggle-password');
  toggleIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      let targetId = this.getAttribute("data-target");
      let pwdInput = targetId ? document.getElementById(targetId) : null;
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

// =====================
// NEW NAVIGATION SCRIPT
// =====================
(function () {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  const auth = document.getElementById("nav-auth");
  const navContainer = document.querySelector(".nav-container");
  const authButtons = auth ? auth.innerHTML : "";

  if (!toggle || !links) return;

  // Open menu
function openMenu() {
  toggle.classList.add("open");
  links.classList.add("mobile-open");
  navContainer.classList.add("mobile-open");
  toggle.setAttribute("aria-expanded", "true");

  // Insert login/signup inside menu
  if (authButtons && !links.querySelector(".auth-btn")) {
    links.insertAdjacentHTML("beforeend", authButtons);
  }

  // Add staggered animation delays dynamically
  const menuItems = links.querySelectorAll(".nav-link, .auth-btn");
  menuItems.forEach((item, i) => {
    const delay = `${i * 80}ms`;
    item.setAttribute("data-delay", delay);
    item.style.setProperty("--delay", delay);
  });
}


  // Close menu
  function closeMenu() {
    toggle.classList.remove("open");
    links.classList.remove("mobile-open");
    navContainer.classList.remove("mobile-open");
    toggle.setAttribute("aria-expanded", "false");
    // Remove auth buttons
    links.querySelectorAll(".auth-btn").forEach(btn => btn.remove());
  }

  toggle.addEventListener("click", (e) => {
    const expanded = toggle.classList.contains("open");
    if (expanded) closeMenu();
    else openMenu();
    e.stopPropagation();
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!navContainer.contains(e.target)) closeMenu();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Close when clicking any nav link
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth <= 880) closeMenu();
    });
  });

  // Reset on resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) {
      closeMenu();
    }
  });
    // =====================
  // MARK ACTIVE LINK
  // =====================
  function markActiveLink() {
    const navLinks = document.querySelectorAll(".nav-link");
    const path = location.pathname.replace(/\/+$/, "") || "/";
    navLinks.forEach((link) => {
      try {
        const href = new URL(link.getAttribute("href"), location.origin)
          .pathname.replace(/\/+$/, "") || "/";
        if (href === path) link.classList.add("active");
        else link.classList.remove("active");
      } catch (e) {
        link.classList.remove("active");
      }
    });
  }

  // Run it on page load
  markActiveLink();

  // Also re-run when a nav link is clicked
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", markActiveLink);
  });

})();

