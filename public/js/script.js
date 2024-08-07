document.addEventListener("DOMContentLoaded", function () {
  // Toggle mobile menu
  const menuToggle = document.getElementById("menu");
  const mobileMenu = document.getElementById("mobile-menu");

  menuToggle.addEventListener("click", function (event) {
    event.preventDefault();
    mobileMenu.classList.toggle("hidden");
    if (mobileMenu.classList.contains("hidden")) {
      mobileMenu.classList.remove("opacity-100", "translate-y-0");
      mobileMenu.classList.add("opacity-0", "-translate-y-2");
    } else {
      mobileMenu.classList.remove("opacity-0", "-translate-y-2");
      mobileMenu.classList.add("opacity-100", "translate-y-0");
    }
  });

  // Hide mobile menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !menuToggle.contains(event.target) &&
      !mobileMenu.contains(event.target)
    ) {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("opacity-100", "translate-y-0");
      mobileMenu.classList.add("opacity-0", "-translate-y-2");
    }
  });
});
