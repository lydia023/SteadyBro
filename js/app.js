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
const deletePopover = document.querySelector("#delete-popover");
const deleteTitle = document.querySelector("#delete-title");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarMonthLabel = document.querySelector("#calendar-month-label");
const summaryMonthLabel = document.querySelector("#summary-month-label");
const entryPopover = document.querySelector("#entry-popover");
const supportPlanForm = document.querySelector("#support-plan-form");
const supportPlanStatus = document.querySelector("#support-plan-status");
const counsellorContactActions = document.querySelector("#counsellor-contact-actions");
const copyMessageButton = document.querySelector("#copy-message-button");
const copyMessageStatus = document.querySelector("#copy-message-status");
const pastReflectionsToggle = document.querySelector("#past-reflections-toggle");
const pastReflections = document.querySelector("#past-reflections");
const pastReflectionList = document.querySelector("#past-reflection-list");
const groundPopover = document.querySelector("#ground-popover");
const groundStepCount = document.querySelector("#ground-step-count");
const groundTitle = document.querySelector("#ground-title");
const groundPrompt = document.querySelector("#ground-prompt");
const groundAnswer = document.querySelector("#ground-answer");
const settingsPopover = document.querySelector("#settings-popover");
const settingsStatus = document.querySelector("#settings-status");
const dailyEntriesKey = "quickResetDailyEntries";
const weeklyEntriesKey = "quickResetWeeklyEntries";
const supportPlanKey = "quickResetSupportPlan";
const appStorageKeys = [dailyEntriesKey, weeklyEntriesKey, supportPlanKey];
let pendingDailyUpdate = null;
let pendingDeletion = null;
let calendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarEntry = null;
let editingDailyEntryId = null;
let editingDailyEntryDate = null;
let groundStepIndex = 0;
let groundAnswers = [];
let expandedPastReflection = null;
const mockPastReflections = [
  {
    weekStart: "2026-10-12",
    repeatingThoughts: "I kept thinking about whether I am doing enough during training.",
    proudOf: "I got through a demanding week and still showed up.",
    selfCare: "I took one evening to rest without feeling guilty.",
    wishDifferent: "I wish I had asked for a little help earlier.",
    feeling: "Tired, but more settled by the end of the week.",
    controllable: "How I speak to myself and whether I take the next small step.",
    matters: "The people I care about and becoming more steady.",
    friendAdvice: "You do not have to handle the whole week at once.",
  },
  {
    weekStart: "2026-10-05",
    repeatingThoughts: "I was replaying one conversation and wondering if I said the wrong thing.",
    proudOf: "I kept my routine even on a low-energy day.",
    selfCare: "I went for a short walk after dinner.",
    wishDifferent: "I wish I had put my phone down earlier at night.",
    feeling: "",
    controllable: "",
    matters: "",
    friendAdvice: "",
  },
];
const groundSteps = [
  ["5 things I can see", "Name five things you can see around you."],
  ["4 things I can touch", "Notice four things you can touch or feel."],
  ["3 things I can hear", "Listen for three sounds around you."],
  ["2 things I can smell", "Notice two smells, even if they are subtle."],
  ["1 emotion I can feel", "Name one emotion you can feel right now."],
];

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

function requestDeletionConfirmation(message, action) {
  pendingDeletion = action;
  deleteTitle.textContent = `${message} This cannot be undone.`;
  deletePopover.hidden = false;
  deletePopover.querySelector("[data-delete-confirm]").focus();
}

function writeDailyEntries(entries) {
  localStorage.setItem(dailyEntriesKey, JSON.stringify(entries));
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatReadableDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getCalendarEntries() {
  return readDailyEntries().filter((entry) => entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.date));
}

function renderCalendar() {
  if (!calendarGrid) return;

  const entries = getCalendarEntries();
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - firstDayOffset);
  const monthName = new Intl.DateTimeFormat("en-SG", { month: "long", year: "numeric" }).format(monthStart);

  calendarMonthLabel.textContent = monthName;
  summaryMonthLabel.textContent = monthName;
  calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = formatDateKey(date);
    const entry = entriesByDate.get(dateKey);
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.setAttribute("role", "gridcell");
    dayButton.dataset.date = dateKey;
    dayButton.disabled = !entry;
    if (date.getMonth() !== monthStart.getMonth()) dayButton.classList.add("calendar-day--outside");
    if (dateKey === getTodayDate()) dayButton.classList.add("calendar-day--today");
    dayButton.innerHTML = `<span>${date.getDate()}</span>`;

    if (entry) {
      const indicator = document.createElement("i");
      indicator.className = `mood-dot mood-dot--${entry.mood}`;
      indicator.setAttribute("aria-label", entry.mood || "Recorded");
      dayButton.append(indicator);
    }

    calendarGrid.append(dayButton);
  }

  const monthlyEntries = entries.filter((entry) => entry.date.startsWith(
    `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`,
  ));
  ["okay", "stressed", "overwhelmed"].forEach((mood) => {
    document.querySelector(`#${mood}-count`).textContent =
      monthlyEntries.filter((entry) => entry.mood === mood).length;
  });
}

function closeEntryPopover() {
  entryPopover.hidden = true;
  selectedCalendarEntry = null;
}

function showEntryPopover(entry) {
  selectedCalendarEntry = entry;
  document.querySelector("#entry-title").textContent = formatReadableDate(entry.date);
  document.querySelector("#entry-mood").textContent = entry.mood || "Not recorded";
  document.querySelector("#entry-thought").textContent = entry.oneLineThought || "None recorded";
  document.querySelector("#entry-signs").textContent = entry.signs?.join(", ") || "None recorded";
  document.querySelector("#entry-needs").textContent =
    [...(entry.needs || []), entry.otherNeed].filter(Boolean).join(", ") || "None recorded";
  document.querySelector("#entry-action").textContent = entry.tomorrowAction || "None recorded";
  entryPopover.hidden = false;
  entryPopover.querySelector("[data-entry-edit]").focus();
}

function editDailyEntry(entry) {
  editingDailyEntryId = entry.id;
  editingDailyEntryDate = entry.date;
  document.querySelector("#mind-input").value = entry.oneLineThought || "";
  document.querySelector("#tomorrow-input").value = entry.tomorrowAction || "";
  document.querySelector("#other-need").value = entry.otherNeed || "";
  document.querySelectorAll(".choice-button").forEach((button) => {
    const group = button.dataset.group;
    const value = button.textContent.trim();
    let selected = false;
    if (group === "mood") selected = value.toLowerCase() === entry.mood;
    if (group === "am-i") selected = (entry.signs || []).includes(value);
    if (group === "need") selected = (entry.needs || []).includes(value) || (value === "Other" && entry.otherNeed);
    if (group === "support") selected = value.toLowerCase().startsWith(entry.supportNeed || "never");
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#other-need").hidden = !entry.otherNeed;
  closeEntryPopover();
  showPage("daily");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteDailyEntry(entry) {
  requestDeletionConfirmation("Delete this Quick Reset entry?", () => {
    const entries = readDailyEntries().filter((item) => item && item.id !== entry.id);
    try {
      writeDailyEntries(entries);
      editingDailyEntryId = null;
      editingDailyEntryDate = null;
      closeEntryPopover();
      renderCalendar();
    } catch {
      document.querySelector("#entry-title").textContent = "This entry could not be deleted.";
    }
  });
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

function readSupportPlan() {
  try {
    const storedPlan = localStorage.getItem(supportPlanKey);
    if (!storedPlan) return {};
    const parsedPlan = JSON.parse(storedPlan);
    return parsedPlan && typeof parsedPlan === "object" && !Array.isArray(parsedPlan) ? parsedPlan : {};
  } catch {
    return {};
  }
}

function writeSupportPlan(plan) {
  localStorage.setItem(supportPlanKey, JSON.stringify(plan));
}

function showSettingsStatus(message, type) {
  settingsStatus.textContent = message;
  settingsStatus.className = `form-status form-status--${type}`;
}

function removeStoredData(keys) {
  try {
    keys.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

function performStoredDataDeletion(keys) {
  if (removeStoredData(keys)) {
    showSettingsStatus("Selected local data was deleted from this device.", "success");
    if (keys.includes(dailyEntriesKey)) renderCalendar();
    if (keys.includes(supportPlanKey)) renderCounsellorContactActions();
  } else {
    showSettingsStatus("The selected data could not be deleted.", "error");
  }
}

function deleteTodaysEntryConfirmed() {
  const entries = readDailyEntries();
  const remainingEntries = entries.filter((entry) => !entry || entry.date !== getTodayDate());

  try {
    writeDailyEntries(remainingEntries);
    showSettingsStatus("Today's entry was deleted from this device.", "success");
    renderCalendar();
  } catch {
    showSettingsStatus("Today's entry could not be deleted.", "error");
  }
}

function normalisePhoneNumber(phone) {
  return phone.replace(/[^\d+]/g, "");
}

function normaliseTelegramUsername(username) {
  return username.trim().replace(/^@/, "");
}

function renderCounsellorContactActions() {
  const plan = readSupportPlan();
  counsellorContactActions.innerHTML = "";

  const phone = normalisePhoneNumber(plan.counsellorPhone || "");
  if (phone) {
    const callLink = document.createElement("a");
    callLink.className = "contact-button";
    callLink.href = `tel:${phone}`;
    callLink.textContent = "Call counsellor";
    counsellorContactActions.append(callLink);
  }

  const telegramUsername = normaliseTelegramUsername(plan.counsellorTelegram || "");
  if (telegramUsername) {
    const telegramLink = document.createElement("a");
    telegramLink.className = "contact-button contact-button--telegram";
    telegramLink.href = `https://t.me/${encodeURIComponent(telegramUsername)}`;
    telegramLink.textContent = "Open Telegram";
    counsellorContactActions.append(telegramLink);
  }

  counsellorContactActions.hidden = counsellorContactActions.childElementCount === 0;
}

function loadSupportPlan() {
  const plan = readSupportPlan();
  supportPlanForm.querySelector("#counsellor-name").value = plan.counsellorName || "";
  supportPlanForm.querySelector("#counsellor-phone").value = plan.counsellorPhone || "";
  supportPlanForm.querySelector("#counsellor-telegram").value = plan.counsellorTelegram || "";
  renderCounsellorContactActions();
}

function saveSupportPlan() {
  const formData = new FormData(supportPlanForm);
  const existingPlan = readSupportPlan();
  const plan = {
    ...existingPlan,
    counsellorName: formData.get("counsellorName").trim(),
    counsellorPhone: formData.get("counsellorPhone").trim(),
    counsellorTelegram: formData.get("counsellorTelegram").trim(),
  };

  try {
    writeSupportPlan(plan);
    renderCounsellorContactActions();
    supportPlanStatus.textContent = "Counsellor details saved on this device.";
    supportPlanStatus.className = "form-status form-status--success";
  } catch {
    supportPlanStatus.textContent = "Counsellor details could not be saved on this device.";
    supportPlanStatus.className = "form-status form-status--error";
  }
}

async function copyOpeningMessage() {
  const message = document.querySelector("#opening-message").textContent;

  try {
    await navigator.clipboard.writeText(message);
    copyMessageStatus.textContent = "Message copied.";
    copyMessageStatus.className = "form-status form-status--success";
  } catch {
    copyMessageStatus.textContent = "Copy is not available here. Please select the message manually.";
    copyMessageStatus.className = "form-status form-status--error";
  }
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

function getWeekDateRange(weekStart) {
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = start.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  const endLabel = end.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel}–${endLabel}`;
}

function createReflectionAnswer(label, answer) {
  if (!answer) return "";
  const wrapper = document.createElement("div");
  wrapper.className = "past-reflection-answer";
  const heading = document.createElement("dt");
  heading.textContent = label;
  const content = document.createElement("dd");
  content.textContent = answer;
  wrapper.append(heading, content);
  return wrapper;
}

function renderPastReflections() {
  pastReflectionList.innerHTML = "";

  if (mockPastReflections.length === 0) {
    pastReflectionList.innerHTML =
      "<p class=\"empty-reflections\">No past reflections yet. Your weekly reflections will appear here.</p>";
    return;
  }

  mockPastReflections.forEach((reflection, index) => {
    const card = document.createElement("article");
    card.className = "past-reflection-card";
    const isExpanded = expandedPastReflection === index;
    card.classList.toggle("is-expanded", isExpanded);

    const button = document.createElement("button");
    button.className = "past-reflection-summary";
    button.type = "button";
    button.setAttribute("aria-expanded", String(isExpanded));
    button.innerHTML = `
      <span>
        <strong>${getWeekDateRange(reflection.weekStart)}</strong>
        <span>${reflection.repeatingThoughts}</span>
      </span>
      <span class="past-reflection-chevron" aria-hidden="true">⌄</span>
    `;
    button.addEventListener("click", () => {
      expandedPastReflection = isExpanded ? null : index;
      renderPastReflections();
    });
    card.append(button);

    if (isExpanded) {
      const details = document.createElement("div");
      details.className = "past-reflection-details";
      const answers = document.createElement("dl");
      [
        ["What thoughts keep going round my head this week?", reflection.repeatingThoughts],
        ["What am I proud of myself for this week?", reflection.proudOf],
        ["One thing I did for myself this week", reflection.selfCare],
        ["What is something I wish I did differently?", reflection.wishDifferent],
        ["What am I feeling?", reflection.feeling],
        ["What can I control right now?", reflection.controllable],
        ["What matters to me beyond this problem?", reflection.matters],
        ["One thing I would say to a friend going through the same thing", reflection.friendAdvice],
      ].forEach(([label, answer]) => {
        const answerElement = createReflectionAnswer(label, answer);
        if (answerElement) answers.append(answerElement);
      });
      const actions = document.createElement("div");
      actions.className = "past-reflection-actions";
      actions.innerHTML = `
        <button class="reflection-action reflection-action--edit" type="button">Edit</button>
        <button class="reflection-action reflection-action--delete" type="button">Delete</button>
      `;
      details.append(answers, actions);
      card.append(details);
    }

    pastReflectionList.append(card);
  });
}

function renderGroundStep() {
  const [title, prompt] = groundSteps[groundStepIndex];
  groundStepCount.textContent = `Step ${groundStepIndex + 1} of ${groundSteps.length}`;
  groundTitle.textContent = title;
  groundPrompt.textContent = prompt;
  groundAnswer.value = groundAnswers[groundStepIndex] || "";
  document.querySelector("[data-ground-back]").disabled = groundStepIndex === 0;
  document.querySelector("[data-ground-next]").hidden = groundStepIndex === groundSteps.length - 1;
  document.querySelector("[data-ground-done]").hidden = groundStepIndex !== groundSteps.length - 1;
}

function openGroundingExercise() {
  groundStepIndex = 0;
  groundAnswers = [];
  renderGroundStep();
  groundPopover.hidden = false;
  groundAnswer.focus();
}

function closeGroundingExercise() {
  groundPopover.hidden = true;
  groundAnswers = [];
}

function createDailyEntry() {
  const selectedMood = document.querySelector('.choice-button[data-group="mood"].selected');
  const selectedSigns = [...document.querySelectorAll('.choice-button[data-group="am-i"].selected')];
  const selectedNeed = document.querySelector('.choice-button[data-group="need"].selected');
  const selectedSupport = document.querySelector('.choice-button[data-group="support"].selected');

  return {
    id: editingDailyEntryId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: editingDailyEntryDate || getTodayDate(),
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
    if (item.dataset.target === "calendar") renderCalendar();
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
pastReflectionsToggle.addEventListener("click", () => {
  const willShow = pastReflections.hidden;
  pastReflections.hidden = !willShow;
  pastReflectionsToggle.setAttribute("aria-expanded", String(willShow));
  if (willShow) {
    renderPastReflections();
    pastReflections.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

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

document.querySelector("#previous-month").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#next-month").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderCalendar();
});

calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest(".calendar-day");
  if (!dayButton || dayButton.disabled) return;
  const entry = getCalendarEntries().find((item) => item.date === dayButton.dataset.date);
  if (entry) showEntryPopover(entry);
});

entryPopover.querySelector("[data-entry-close]").addEventListener("click", closeEntryPopover);
entryPopover.querySelector("[data-entry-edit]").addEventListener("click", () => {
  if (selectedCalendarEntry) editDailyEntry(selectedCalendarEntry);
});
entryPopover.querySelector("[data-entry-delete]").addEventListener("click", () => {
  if (selectedCalendarEntry) deleteDailyEntry(selectedCalendarEntry);
});
entryPopover.addEventListener("click", (event) => {
  if (event.target === entryPopover) closeEntryPopover();
});

document.querySelectorAll("[data-ground-open]").forEach((button) => {
  button.addEventListener("click", openGroundingExercise);
});

groundAnswer.addEventListener("input", () => {
  groundAnswers[groundStepIndex] = groundAnswer.value;
});

document.querySelector("[data-ground-back]").addEventListener("click", () => {
  groundAnswers[groundStepIndex] = groundAnswer.value;
  if (groundStepIndex > 0) {
    groundStepIndex -= 1;
    renderGroundStep();
    groundAnswer.focus();
  }
});

document.querySelector("[data-ground-next]").addEventListener("click", () => {
  groundAnswers[groundStepIndex] = groundAnswer.value;
  if (groundStepIndex < groundSteps.length - 1) {
    groundStepIndex += 1;
    renderGroundStep();
    groundAnswer.focus();
  }
});

document.querySelector("[data-ground-done]").addEventListener("click", closeGroundingExercise);
document.querySelector("[data-ground-close]").addEventListener("click", closeGroundingExercise);
groundPopover.addEventListener("click", (event) => {
  if (event.target === groundPopover) closeGroundingExercise();
});

document.querySelector("[data-settings-open]").addEventListener("click", () => {
  settingsPopover.hidden = false;
  settingsPopover.querySelector("[data-settings-close]").focus();
});

document.querySelector("[data-settings-close]").addEventListener("click", () => {
  settingsPopover.hidden = true;
});

settingsPopover.addEventListener("click", (event) => {
  if (event.target === settingsPopover) settingsPopover.hidden = true;
});

document.querySelector("[data-delete-today]").addEventListener("click", () => {
  requestDeletionConfirmation("Delete today's Quick Reset entry?", deleteTodaysEntryConfirmed);
});

document.querySelector("[data-delete-daily]").addEventListener("click", () => {
  requestDeletionConfirmation("Delete all Daily Quick Reset entries?", () => {
    performStoredDataDeletion([dailyEntriesKey]);
  });
});

document.querySelector("[data-delete-weekly]").addEventListener("click", () => {
  requestDeletionConfirmation("Delete all Weekly Reflections?", () => {
    performStoredDataDeletion([weeklyEntriesKey]);
  });
});

document.querySelector("[data-delete-support]").addEventListener("click", () => {
  requestDeletionConfirmation("Delete all support-plan information?", () => {
    performStoredDataDeletion([supportPlanKey]);
  });
});

document.querySelector("[data-delete-all]").addEventListener("click", () => {
  requestDeletionConfirmation("Delete ALL Quick Reset data stored on this device?", () => {
    performStoredDataDeletion(appStorageKeys);
  });
});

deletePopover.querySelector("[data-delete-confirm]").addEventListener("click", () => {
  if (pendingDeletion) pendingDeletion();
  pendingDeletion = null;
  deletePopover.hidden = true;
});

deletePopover.querySelector("[data-delete-cancel]").addEventListener("click", () => {
  pendingDeletion = null;
  deletePopover.hidden = true;
});

deletePopover.addEventListener("click", (event) => {
  if (event.target === deletePopover) {
    pendingDeletion = null;
    deletePopover.hidden = true;
  }
});

supportPlanForm.querySelector(".support-save-button").addEventListener("click", saveSupportPlan);
copyMessageButton.addEventListener("click", copyOpeningMessage);

setCurrentDate();
showPage("daily");
renderCalendar();
loadSupportPlan();
