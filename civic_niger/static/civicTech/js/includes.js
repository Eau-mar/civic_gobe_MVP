const btn = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
  
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });


let lastScrollTop = 0;
  const navbar = document.getElementById("navbar");

  window.addEventListener("scroll", function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
      // Scroll vers le bas -> cacher
      navbar.style.transform = "translateY(-100%)";
    } else {
      // Scroll vers le haut -> afficher
      navbar.style.transform = "translateY(0)";
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Pour Safari
  });