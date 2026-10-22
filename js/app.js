const pages = [...document.querySelectorAll(".page")];
const navItems = [...document.querySelectorAll(".nav-item")];
const headerDate = document.querySelector("#header-date");
const infoPopover = document.querySelector("#info-popover");
const infoTitle = document.querySelector("#info-title");

const infoCopy = {
  mind: "Naming one thing can make it feel a little less noisy. You do not need to explain it perfectly.",
  mood: "There is no right answer. Pick the word that feels closest to this moment.",
  "am-i": "These are signs to notice, not labels. Choose any that feel familiar today.",
  need: "Choose what would help for the next few minutes, not what would fix everything.",
  tomorrow: "A small, specific step is enough. Make it something you can actually do.",
  support: "You can ask for support before things become an emergency. You are not a burden.",
};

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

document.querySelectorAll(".choice-button").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.group;
    const isExclusive = ["mood", "am-i", "need", "support"].includes(group);

    if (isExclusive) {
      document.querySelectorAll(`.choice-button[data-group="${group}"]`).forEach((item) => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });
    }

    const isSelected = button.getAttribute("aria-pressed") === "true";
    button.classList.toggle("selected", !isSelected);
    button.setAttribute("aria-pressed", String(!isSelected));

    if (button.hasAttribute("data-other-choice")) {
      const otherInput = document.querySelector("#other-need");
      otherInput.hidden = isSelected;
      if (!isSelected) otherInput.focus();
    }

    if (group === "support") {
      const supportYes = document.querySelector("[data-support-yes]");
      document.querySelector("[data-support-link]").hidden =
        supportYes.getAttribute("aria-pressed") !== "true";
    }
  });
});

document.querySelectorAll("[data-info]").forEach((button) => {
  button.addEventListener("click", () => {
    infoTitle.textContent = infoCopy[button.dataset.info];
    infoPopover.hidden = false;
  });
});

document.querySelector(".info-close").addEventListener("click", () => {
  infoPopover.hidden = true;
});

infoPopover.addEventListener("click", (event) => {
  if (event.target === infoPopover) infoPopover.hidden = true;
});

document.querySelector("[data-support-link]").addEventListener("click", (event) => {
  event.preventDefault();
  showPage("support");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

setCurrentDate();
showPage("daily");
