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
// HAMBURGER + ACTIVE LINKS (kept intact)
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

})();

// ================== NEW IMPROVED SPA (show/hide) ==================
(function () {
  // selectors to hide / show home page elements
  const HOME_SELECTORS = ["#splitly", ".seo-section", "#content", ".hero-actions", "#btn-2"];
  const INTERNAL_PAGES = ["learn-more", "contact"]; // ids for internal pages

  // helper to hide elements by selector(s)
  function hideSelectors(selectors) {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.style.display = "none");
    });
  }

  // helper to restore display (remove inline display override)
  function restoreSelectors(selectors) {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.removeProperty("display");
      });
    });
  }

  function hideAllInternalPages() {
    INTERNAL_PAGES.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
  }

  function showPageByKey(key) {
    // normalize key
    if (!key) key = "home";

    // first hide all internals and homepage selectors (we'll restore as needed)
    hideAllInternalPages();
    hideSelectors(HOME_SELECTORS);

    if (key === "home") {
      // restore homepage elements to their CSS-driven display (not forcing block)
      restoreSelectors(HOME_SELECTORS);
    } else {
      // show the requested internal page id
      const el = document.getElementById(key);
      if (el) {
        el.style.removeProperty("display");
        // ensure it has internal-page class show for animation if present
        el.classList.add("show");
      }
    }

    // also ensure no animate-section inside #content leaks (hide them when internals displayed)
    if (key !== "home") {
      document.querySelectorAll("#content .animate-section").forEach(s => s.style.display = "none");
    } else {
      // restore animate-section default display
      document.querySelectorAll("#content .animate-section").forEach(s => s.style.removeProperty("display"));
    }

    // active link marking
    markActiveNav(key === "home" ? "home" : key);

    // ensure scroll top (no mid-scroll bug). Use instant for no smooth jump
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0,0); }

    // update hash for shareability (home -> remove hash)
    try {
      if (key === "home") history.replaceState(null, "", location.pathname + location.search);
      else history.replaceState(null, "", "#" + key);
    } catch (e) { /* ignore */ }
  }

  // mark active nav link robustly
  function markActiveNav(keyName) {
    document.querySelectorAll(".nav-link").forEach(a => {
      const href = (a.getAttribute("href") || "").trim();
      let linkKey = "";

      if (href.startsWith("#")) {
        linkKey = href.slice(1);
        if (linkKey === "") linkKey = "home";
      } else {
        // treat root / or index.html as home
        const urlPath = href.split("?")[0].split("#")[0];
        if (urlPath === "/" || urlPath === "" || urlPath.endsWith("index.html")) linkKey = "home";
        else {
          // extract basename (e.g., Learn-more.html => learn-more)
          const base = urlPath.split("/").pop().split(".")[0];
          linkKey = base || urlPath;
        }
      }

      if (keyName === "home" && linkKey === "home") a.classList.add("active");
      else if (linkKey === keyName) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  // intercept nav links (only handle internal hash links)
  document.querySelectorAll(".nav-link").forEach(a => {
    a.addEventListener("click", function (ev) {
      const href = (this.getAttribute("href") || "").trim();
      if (!href.startsWith("#")) {
        // external page — allow default navigation
        return;
      }
      ev.preventDefault();
      const key = href.slice(1) || "home";
      showPageByKey(key);

      // close mobile menu if open (existing close handler)
      const toggle = document.getElementById("nav-toggle");
      const navContainer = document.querySelector(".nav-container");
      if (navContainer && navContainer.classList.contains("mobile-open")) {
        if (toggle && toggle.classList.contains("open")) toggle.click();
        else navContainer.classList.remove("mobile-open");
      }
    });
  });

  // on load, honor hash or default to home
  window.addEventListener("load", () => {
    const hash = (location.hash || "").replace("#", "");
    if (hash === "learn-more" || hash === "contact") showPageByKey(hash);
    else showPageByKey("home");
  });

  // on hashchange (back/forward)
  window.addEventListener("hashchange", () => {
    const hash = (location.hash || "").replace("#", "");
    if (hash === "learn-more" || hash === "contact") showPageByKey(hash);
    else showPageByKey("home");
  });

  // expose for debugging
  window._showSplitlyPage = showPageByKey;

})();
