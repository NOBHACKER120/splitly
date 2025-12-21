  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('navOverlay');

  function toggleMenu() {
    hamburger.classList.toggle('active');
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow =
      drawer.classList.contains('open') ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);
  
  
  document.querySelectorAll('.mobile-nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

   document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement;

      document.querySelectorAll('.faq-item').forEach(faq => {
        if (faq !== item) faq.classList.remove('active');
      });

      item.classList.toggle('active');
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
