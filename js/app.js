const pages = [...document.querySelectorAll(".page")];
const navItems = [...document.querySelectorAll(".nav-item")];
const headerDate = document.querySelector("#header-date");
const infoPopover = document.querySelector("#info-popover");
const infoTitle = document.querySelector("#info-title");
const quickResetForm = document.querySelector("#quick-reset-form");
const quickResetStatus = document.querySelector("#quick-reset-status");
const weeklyReflectionForm = document.querySelector("#weekly-reflection-form");
const weeklyReflectionStatus = document.querySelector("#weekly-reflection-status");
const updatePopover = document.querySelector("#update-popover");
const dailyEntriesKey = "quickResetDailyEntries";
const weeklyEntriesKey = "quickResetWeeklyEntries";
let pendingDailyUpdate = null;

const infoCopy = {
  mind: "Naming one thing can make it feel a little less noisy. You do not need to explain it perfectly.",
  mood: "There is no right answer. Pick the word that feels closest to this moment.",
  "am-i": "These are signs to notice, not labels. Choose any that feel familiar today.",
  need: "Choose what would help for the next few minutes, not what would fix everything.",
  tomorrow: "A small, specific step is enough. Make it something you can actually do.",
  support: "You can ask for support before things become an emergency. You are not a burden.",
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readDailyEntries() {
  try {
    const storedEntries = localStorage.getItem(dailyEntriesKey);

    if (!storedEntries) {
      return [];
    }

    const parsedEntries = JSON.parse(storedEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function writeDailyEntries(entries) {
  localStorage.setItem(dailyEntriesKey, JSON.stringify(entries));
}

function getWeekStartDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  today.setDate(today.getDate() - daysSinceMonday);
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function readWeeklyEntries() {
  try {
    const storedEntries = localStorage.getItem(weeklyEntriesKey);

    if (!storedEntries) {
      return [];
    }

    const parsedEntries = JSON.parse(storedEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function writeWeeklyEntries(entries) {
  localStorage.setItem(weeklyEntriesKey, JSON.stringify(entries));
}

function showWeeklyStatus(message, type) {
  weeklyReflectionStatus.textContent = message;
  weeklyReflectionStatus.className = `form-status form-status--${type}`;
}

function saveWeeklyReflection() {
  const formData = new FormData(weeklyReflectionForm);
  const entry = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    weekStart: getWeekStartDate(),
    timestamp: new Date().toISOString(),
    repeatingThoughts: formData.get("repeatingThoughts").trim(),
    proudOf: formData.get("proudOf").trim(),
    selfCare: formData.get("selfCare").trim(),
    wishDifferent: formData.get("wishDifferent").trim(),
    feeling: formData.get("feeling").trim(),
    controllable: formData.get("controllable").trim(),
    matters: formData.get("matters").trim(),
    friendAdvice: formData.get("friendAdvice").trim(),
  };
  const entries = readWeeklyEntries();
  const existingEntryIndex = entries.findIndex((item) => item && item.weekStart === entry.weekStart);

  if (existingEntryIndex !== -1) {
    entry.id = entries[existingEntryIndex].id;
    entries[existingEntryIndex] = entry;
  } else {
    entries.push(entry);
  }

  try {
    writeWeeklyEntries(entries);
    showWeeklyStatus(
      existingEntryIndex === -1
        ? "Reflection saved privately on this device."
        : "This week's reflection was updated.",
      "success",
    );
  } catch {
    showWeeklyStatus("This reflection could not be saved on this device.", "error");
  }
}

function createDailyEntry() {
  const selectedMood = document.querySelector('.choice-button[data-group="mood"].selected');
  const selectedSigns = [...document.querySelectorAll('.choice-button[data-group="am-i"].selected')];
  const selectedNeed = document.querySelector('.choice-button[data-group="need"].selected');
  const selectedSupport = document.querySelector('.choice-button[data-group="support"].selected');

  return {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: getTodayDate(),
    timestamp: new Date().toISOString(),
    oneLineThought: document.querySelector("#mind-input").value.trim(),
    mood: selectedMood?.textContent.trim().toLowerCase(),
    signs: selectedSigns.map((button) => button.textContent.trim()),
    needs: selectedNeed ? [selectedNeed.textContent.trim()] : [],
    otherNeed: document.querySelector("#other-need").value.trim(),
    tomorrowAction: document.querySelector("#tomorrow-input").value.trim(),
    supportNeed: selectedSupport?.textContent.trim().split(" ")[0].toLowerCase(),
  };
}

function showFormStatus(message, type) {
  quickResetStatus.textContent = message;
  quickResetStatus.className = `form-status form-status--${type}`;
}

function completeDailySave(entry, entries, existingEntryIndex) {
  if (existingEntryIndex === -1) {
    entries.push(entry);
  } else {
    entry.id = entries[existingEntryIndex].id;
    entries[existingEntryIndex] = entry;
  }

  try {
    writeDailyEntries(entries);
    showFormStatus(
      existingEntryIndex === -1 ? "Saved privately on this device." : "Today's Quick Reset was updated.",
      "success",
    );
  } catch {
    showFormStatus("This entry could not be saved on this device.", "error");
  }
}

function saveDailyEntry() {
  const selectedMood = document.querySelector('.choice-button[data-group="mood"].selected');

  if (!selectedMood) {
    showFormStatus("Please choose how you are doing right now.", "error");
    return;
  }

  const entry = createDailyEntry();
  const entries = readDailyEntries();
  const existingEntryIndex = entries.findIndex((item) => item && item.date === entry.date);

  if (existingEntryIndex !== -1) {
    pendingDailyUpdate = { entry, entries, existingEntryIndex };
    updatePopover.hidden = false;
    updatePopover.querySelector("[data-update-confirm]").focus();
    return;
  }

  completeDailySave(entry, entries, existingEntryIndex);
}

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

quickResetForm.querySelector(".done-button").addEventListener("click", saveDailyEntry);
weeklyReflectionForm.querySelector(".done-button").addEventListener("click", saveWeeklyReflection);

updatePopover.querySelector("[data-update-confirm]").addEventListener("click", () => {
  if (pendingDailyUpdate) {
    completeDailySave(
      pendingDailyUpdate.entry,
      pendingDailyUpdate.entries,
      pendingDailyUpdate.existingEntryIndex,
    );
  }
  pendingDailyUpdate = null;
  updatePopover.hidden = true;
});

updatePopover.querySelector("[data-update-cancel]").addEventListener("click", () => {
  pendingDailyUpdate = null;
  updatePopover.hidden = true;
});

updatePopover.addEventListener("click", (event) => {
  if (event.target === updatePopover) {
    pendingDailyUpdate = null;
    updatePopover.hidden = true;
  }
});

setCurrentDate();
showPage("daily");
