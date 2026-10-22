const pages = [...document.querySelectorAll(".page")];
const navItems = [...document.querySelectorAll(".nav-item")];
const headerDate = document.querySelector("#header-date");

function showPage(pageName) {
  pages.forEach((page) => {
    const isActive = page.dataset.page === pageName;
    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  navItems.forEach((item) => {
    const isActive = item.dataset.target === pageName;
    item.classList.toggle("active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function setCurrentDate() {
  const today = new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  headerDate.textContent = today;
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    showPage(item.dataset.target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

setCurrentDate();
showPage("daily");
