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
const supportSavePopover = document.querySelector("#support-save-popover");
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
const splashScreen = document.querySelector("#splash-screen");
const dailyEntriesKey = "quickResetDailyEntries";
const weeklyEntriesKey = "quickResetWeeklyEntries";
const supportPlanKey = "quickResetSupportPlan";
const progressKey = "steadyBroProgress";
const appStorageKeys = [dailyEntriesKey, weeklyEntriesKey, supportPlanKey, progressKey];
let pendingDailyUpdate = null;
let pendingDeletion = null;
let calendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarEntry = null;
let editingDailyEntryId = null;
let editingDailyEntryDate = null;
let groundStepIndex = 0;
let groundAnswers = [];
let expandedPastReflection = null;
let editingWeeklyEntryId = null;
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
const moodEmojis = {
  okay: "🙂",
  stressed: "😐",
  overwhelmed: "😣",
};

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
    const dateLabel = document.createElement("span");
    dateLabel.className = "calendar-date-number";
    dateLabel.textContent = date.getDate();
    dayButton.append(dateLabel);

    if (entry) {
      const moodEmoji = moodEmojis[entry.mood] || "";
      const indicator = document.createElement("span");
      indicator.className = "mood-emoji";
      indicator.textContent = moodEmoji;
      dayButton.append(indicator);
      dayButton.setAttribute(
        "aria-label",
        `${formatReadableDate(dateKey)}: ${entry.mood || "Recorded"}`,
      );
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
  renderJournalProgress();
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

function readProgressState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { claimedCycles: 0, voucherCodes: [] };
    }
    const legacyClaimed = parsed.rewardCode ? 1 : 0;
    const claimedCycles = Math.min(
      3,
      Math.max(legacyClaimed, Number.isInteger(parsed.claimedCycles) ? parsed.claimedCycles : 0),
    );
    const voucherCodes = Array.isArray(parsed.voucherCodes)
      ? parsed.voucherCodes.filter((code) => typeof code === "string").slice(0, 3)
      : parsed.rewardCode
        ? [parsed.rewardCode]
        : [];
    return { ...parsed, claimedCycles, voucherCodes };
  } catch {
    return { claimedCycles: 0, voucherCodes: [] };
  }
}

function writeProgressState(state) {
  localStorage.setItem(progressKey, JSON.stringify(state));
}

function getEligibleDailyEntries() {
  return [...new Map(
    readDailyEntries()
      .filter((entry) => entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.date))
      .map((entry) => [entry.date, entry]),
  ).values()];
}

function getEligibleWeeklyEntries() {
  return [...new Map(
    readWeeklyEntries()
      .filter((entry) => entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.weekStart))
      .map((entry) => [entry.weekStart, entry]),
  ).values()];
}

function getJournalProgress() {
  return {
    daily: getEligibleDailyEntries().length,
    weekly: getEligibleWeeklyEntries().length,
  };
}

function getProgrammeStartDate() {
  const entries = getEligibleDailyEntries().sort((a, b) => a.date.localeCompare(b.date));
  return entries.length ? new Date(`${entries[0].date}T00:00:00`) : null;
}

function getProgrammeDay() {
  const start = getProgrammeStartDate();
  if (!start) return null;
  const today = new Date(`${getTodayDate()}T00:00:00`);
  return Math.floor((today - start) / 86400000) + 1;
}

function isWeeklyEntryDue() {
  const programmeDay = getProgrammeDay();
  if (!programmeDay || programmeDay % 7 !== 0) return false;
  return !getEligibleWeeklyEntries().some((entry) => entry.weekStart === getWeekStartDate());
}

function getNextWeeklyReflectionDate() {
  const start = getProgrammeStartDate();
  const programmeDay = getProgrammeDay();
  if (!start || !programmeDay) return null;

  const nextProgrammeDay = (Math.floor(programmeDay / 7) + 1) * 7;
  const nextDate = new Date(start);
  nextDate.setDate(start.getDate() + nextProgrammeDay - 1);
  return nextDate;
}

function renderWeeklyDueStatus() {
  const status = document.querySelector("#weekly-next-due");
  if (!status) return;
  const programmeDay = getProgrammeDay();
  if (programmeDay && isWeeklyEntryDue()) {
    status.textContent = "Weekly Reflection is due today.";
    return;
  }

  const nextDate = getNextWeeklyReflectionDate();
  status.textContent = nextDate
    ? `Next Weekly Reflection: ${nextDate.toLocaleDateString("en-SG", {
        weekday: "long",
        day: "numeric",
        month: "short",
      })}`
    : "Complete a Daily Journal entry to begin your programme.";
}

function renderHome() {
  const todayComplete = getEligibleDailyEntries().some((entry) => entry.date === getTodayDate());
  const weeklyDue = todayComplete && isWeeklyEntryDue();
  const statusTitle = document.querySelector("#journal-status-title");
  const statusCopy = document.querySelector("#journal-status-copy");
  const action = document.querySelector("#home-journal-action");
  if (!statusTitle || !statusCopy || !action) return;

  if (!todayComplete) {
    statusTitle.textContent = "Journaled yet?";
    statusCopy.textContent = "A quick check-in is waiting when you are ready.";
    action.textContent = "Make an entry now";
    action.dataset.targetPage = "daily";
  } else if (weeklyDue) {
    statusTitle.textContent = "It’s weekly entry day. Journaled yet?";
    statusCopy.textContent = "Your weekly reflection is ready when you have a quiet moment.";
    action.textContent = "Start Weekly Reflection";
    action.dataset.targetPage = "weekly";
  } else {
    statusTitle.textContent = "Done today ✓";
    statusCopy.textContent = "Your journal is up to date for today.";
    action.textContent = "View Journal";
    action.dataset.targetPage = "daily";
  }
}

function renderJournalProgress() {
  const list = document.querySelector("#journal-progress-list");
  const status = document.querySelector("#reward-status");
  if (!list || !status) return;

  const progress = getJournalProgress();
  const state = readProgressState();
  const claimedCycles = Math.min(3, state.claimedCycles);
  const currentCycle = claimedCycles + 1;
  list.innerHTML = claimedCycles < 3 ? `
    <p class="reward-cycle-label">Reward ${currentCycle} of 3</p>
    <div class="journal-progress-item">
      <div class="journal-progress-heading"><strong>Daily Journal</strong><span>${Math.min(Math.max(0, progress.daily - claimedCycles * 18), 18)} / 18</span></div>
      <div class="progress-track"><span style="width: ${Math.min(100, (Math.max(0, progress.daily - claimedCycles * 18) / 18) * 100)}%"></span></div>
    </div>
    <div class="journal-progress-item">
      <div class="journal-progress-heading"><strong>Weekly Reflections</strong><span>${Math.min(Math.max(0, progress.weekly - claimedCycles * 3), 3)} / 3</span></div>
      <div class="progress-track"><span style="width: ${Math.min(100, (Math.max(0, progress.weekly - claimedCycles * 3) / 3) * 100)}%"></span></div>
    </div>
  ` : "";

  const cycleDaily = progress.daily - claimedCycles * 18;
  const cycleWeekly = progress.weekly - claimedCycles * 3;
  status.innerHTML = "";
  if (claimedCycles >= 3) {
    status.innerHTML = "<strong>All rewards completed 🎉</strong><p>You’ve completed all 3 journal reward cycles.</p><p>Rewards claimed: 3 / 3</p>";
    return;
  }

  if (cycleDaily < 18 || cycleWeekly < 3) {
    status.innerHTML = `<p>Complete 18 Daily entries and 3 Weekly Reflections to unlock your $5 voucher.</p><p>Rewards claimed: ${claimedCycles} / 3</p>`;
    return;
  }

  const heading = document.createElement("strong");
  heading.textContent = "Reward unlocked 🎉";
  status.append(heading);
  const message = document.createElement("p");
  message.textContent = "You completed 18 Daily entries and 3 Weekly Reflections.";
  const claimedSummary = document.createElement("p");
  claimedSummary.textContent = `Rewards claimed: ${claimedCycles} / 3`;
  status.append(message, claimedSummary);
  if (state.voucherCodes[claimedCycles]) {
    const code = document.createElement("p");
    code.textContent = `Your voucher code: ${state.voucherCodes[claimedCycles]}`;
    status.append(code);
    return;
  }

  const claimButton = document.createElement("button");
  claimButton.className = "support-save-button";
  claimButton.type = "button";
  claimButton.textContent = "Claim $5 Shopee Voucher";
  claimButton.addEventListener("click", () => {
    const nextCycle = claimedCycles + 1;
    const voucherCodes = [...readProgressState().voucherCodes];
    voucherCodes[claimedCycles] = `STEADYBRO-REWARD-${String(nextCycle).padStart(2, "0")}`;
    writeProgressState({ claimedCycles: nextCycle, voucherCodes });
    renderJournalProgress();
  });
  status.append(message, claimButton);
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
    if (keys.includes(progressKey)) renderJournalProgress();
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
  const counsellorName = document.querySelector("#trusted-counsellor-name");
  counsellorContactActions.innerHTML = "";
  if (counsellorName) {
    counsellorName.textContent = plan.counsellorName || "Add their details below";
  }

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
    supportPlanStatus.textContent = "";
    supportSavePopover.hidden = false;
    supportSavePopover.querySelector("[data-support-save-close]").focus();
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
  const entries = readWeeklyEntries();
  const editingEntryIndex = editingWeeklyEntryId
    ? entries.findIndex((item) => item && item.id === editingWeeklyEntryId)
    : -1;
  const existingEntry = editingEntryIndex === -1 ? null : entries[editingEntryIndex];
  const entry = {
    id: existingEntry?.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    weekStart: existingEntry?.weekStart || getWeekStartDate(),
    timestamp: new Date().toISOString(),
    repeatingThoughts: formData.get("repeatingThoughts").trim(),
    controllable: formData.get("controllable").trim(),
    proudOf: formData.get("proudOf").trim(),
    selfCare: formData.get("selfCare").trim(),
    wishDifferent: formData.get("wishDifferent").trim(),
  };
  const existingEntryIndex = entries.findIndex((item) => item && item.weekStart === entry.weekStart);

  if (existingEntryIndex !== -1) {
    entry.id = entries[existingEntryIndex].id;
    entries[existingEntryIndex] = entry;
  } else {
    entries.push(entry);
  }

  try {
    writeWeeklyEntries(entries);
    editingWeeklyEntryId = null;
    weeklyReflectionForm.reset();
    showWeeklyStatus(
      existingEntryIndex === -1
        ? "Reflection saved privately on this device."
        : "This week's reflection was updated.",
      "success",
    );
    renderJournalProgress();
    renderWeeklyDueStatus();
    renderHome();
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
  const reflections = readWeeklyEntries().length ? readWeeklyEntries() : mockPastReflections;

  if (reflections.length === 0) {
    pastReflectionList.innerHTML =
      "<p class=\"empty-reflections\">No past reflections yet. Your weekly reflections will appear here.</p>";
    return;
  }

  reflections.forEach((reflection, index) => {
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
        ["What thought keeps going round my head this week?", reflection.repeatingThoughts],
        ["Which part of this can I do something about, and which part can’t I?", reflection.controllable],
        ["What am I proud of myself this week?", reflection.proudOf],
        ["What is one thing I did for myself, or that mattered to me, this week?", reflection.selfCare],
        ["What is one thing I’ll try differently next week?", reflection.wishDifferent],
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
      const storedReflection = readWeeklyEntries().some((item) => item && item.id === reflection.id);
      const editButton = actions.querySelector(".reflection-action--edit");
      const deleteButton = actions.querySelector(".reflection-action--delete");
      editButton.disabled = !storedReflection;
      deleteButton.disabled = !storedReflection;
      editButton.addEventListener("click", () => {
        editingWeeklyEntryId = reflection.id;
        weeklyReflectionForm.elements.repeatingThoughts.value = reflection.repeatingThoughts || "";
        weeklyReflectionForm.elements.controllable.value = reflection.controllable || "";
        weeklyReflectionForm.elements.proudOf.value = reflection.proudOf || "";
        weeklyReflectionForm.elements.selfCare.value = reflection.selfCare || "";
        weeklyReflectionForm.elements.wishDifferent.value = reflection.wishDifferent || "";
        pastReflections.hidden = true;
        pastReflectionsToggle.setAttribute("aria-expanded", "false");
        weeklyReflectionForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      deleteButton.addEventListener("click", () => {
        requestDeletionConfirmation("Delete this Weekly Reflection?", () => {
          const remainingEntries = readWeeklyEntries().filter((item) => item && item.id !== reflection.id);
          try {
            writeWeeklyEntries(remainingEntries);
            expandedPastReflection = null;
            renderPastReflections();
            renderJournalProgress();
            renderWeeklyDueStatus();
            renderHome();
          } catch {
            showWeeklyStatus("This reflection could not be deleted from this device.", "error");
          }
        });
      });
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
    renderHome();
    renderWeeklyDueStatus();
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

function openInternalPage(pageName) {
  showPage(pageName);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProviderForm(provider) {
  const screen = document.querySelector("#provider-screen");
  screen.hidden = false;
  const isSaf = provider === "saf";
  const providerName = isSaf ? "SAF Counselling Centre" : "SAMH";
  const availability = `
    <fieldset class="form-fieldset">
      <legend>5. When are you free?</legend>
      ${["Saturday morning", "Saturday afternoon", "Saturday evening", "Sunday morning", "Sunday afternoon", "Sunday evening", "Weekday evening"]
        .map((option) => `<label class="choice-option"><input type="checkbox" name="availability" value="${option}"><span>${option}</span></label>`)
        .join("")}
    </fieldset>
  `;
  const format = `
    <label><span>6. Preferred format</span><select name="format" required>
      <option value="">Select one</option><option>Online Video</option><option>Phone Call</option><option>In Person</option>
    </select></label>
  `;
  const consent = `
    <label class="consent-option"><input type="checkbox" name="consent" required><span>I agree to be contacted to arrange this session. My details are used only for this purpose.</span></label>
  `;
  screen.innerHTML = `
    <h3>${providerName}</h3>
    <form class="transient-form" data-provider-form>
      <label><span>1. Full Name</span><input name="fullName" type="text" required maxlength="80"></label>
      <label><span>2. Contact Number</span><input name="contactNumber" type="tel" required maxlength="30"></label>
      <label><span>3. Email</span><input name="email" type="email" required maxlength="120"></label>
      <label><span>4. How should we contact you?</span><select name="contactMethod" required>
        <option value="">Select one</option><option>WhatsApp</option><option>Phone call</option><option>Email</option>
      </select></label>
      ${availability}
      ${format}
      ${isSaf ? `<label><span>7. Which counsellor would you like to see?</span><select name="counsellor" required>
        <option value="">Select one</option><option>Any SAF counsellor</option><option>Counsellor A</option><option>Counsellor B</option><option>Counsellor C</option>
      </select></label>` : ""}
      <label><span>${isSaf ? "8" : "7"}. Anything you’d like us to know</span><textarea name="notes" rows="4" maxlength="500"></textarea></label>
      <fieldset class="form-fieldset">
        <legend>${isSaf ? "9" : "8"}. Consent</legend>
        ${consent}
      </fieldset>
      <button class="done-button" type="submit">Submit Request</button>
    </form>
  `;
  screen.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    screen.innerHTML = `<div class="success-panel"><h3>Request submitted ✓</h3><p>You’ll be contacted using your preferred contact method to arrange the session.</p></div>`;
  });
}

const chatBranches = {
  "I can’t stop thinking about something": {
    response: "It sounds like your mind is stuck on one thing right now. You don’t need to solve everything at once. Want to try one small step first?",
    choices: ["Ground myself", "Write it out", "Talk to someone", "I’m okay for now"],
  },
  "I’m feeling overwhelmed": {
    response: "Sounds like there’s a lot hitting you at once. Let’s make the next step smaller. What would help most right now?",
    choices: ["Breathe / ground myself", "Quick Reset", "Talk to someone", "Rest for now"],
  },
  "I don’t feel like talking to anyone": {
    response: "That’s okay. You don’t have to explain everything immediately. You can start with something private and low-pressure.",
    choices: ["Write one line", "Ground myself", "Maybe talk later", "Arrange counselling"],
  },
};

function appendChatMessage(message, role) {
  const thread = document.querySelector("#chat-thread");
  const bubble = document.createElement("div");
  bubble.className = `chat-message chat-message--${role}`;
  bubble.textContent = message;
  thread.append(bubble);
  thread.scrollTop = thread.scrollHeight;
}

function renderChatChoices(choices) {
  const actions = document.querySelector("#chat-actions");
  actions.innerHTML = "";
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "support-save-button";
    button.type = "button";
    button.textContent = choice;
    button.dataset.chatChoice = choice;
    actions.append(button);
  });
}

function showChatTyping() {
  const thread = document.querySelector("#chat-thread");
  const typing = document.createElement("div");
  typing.className = "chat-typing";
  typing.innerHTML = "<span></span><span></span><span></span>";
  thread.append(typing);
  thread.scrollTop = thread.scrollHeight;
  return typing;
}

function finishChatAction(choice) {
  const actions = document.querySelector("#chat-actions");
  actions.innerHTML = "";
  const response = {
    "Ground myself": "Let’s bring your attention back to the present.",
    "Breathe / ground myself": "Let’s bring your attention back to the present.",
    "Write it out": "Getting it out of your head might help you see the next step more clearly.",
    "Write one line": "Getting it out of your head might help you see the next step more clearly.",
    "Quick Reset": "Getting it out of your head might help you see the next step more clearly.",
    "Talk to someone": "You don’t need the perfect words. Even a simple message can be enough to start.",
    "Arrange counselling": "If you would rather speak privately with a professional, you can request a counselling session.",
    "I’m okay for now": "That’s okay. You can come back anytime if you need another step.",
    "Rest for now": "That’s okay. You can come back anytime if you need another step.",
    "Maybe talk later": "That’s okay too. Your support options will still be there when you’re ready.",
  }[choice];
  appendChatMessage(response, "assistant");

  const nextActions = {
    "Ground myself": [["Start 5-4-3-2-1", "ground"]],
    "Breathe / ground myself": [["Start 5-4-3-2-1", "ground"]],
    "Write it out": [["Open Quick Reset", "daily"]],
    "Write one line": [["Open Quick Reset", "daily"]],
    "Quick Reset": [["Open Quick Reset", "daily"]],
    "Talk to someone": [["Open My Support Plan", "support-plan"]],
    "Arrange counselling": [["Arrange Counselling", "counselling"]],
    "Maybe talk later": [["My Support Plan", "support-plan"], ["Close Chat", "close"]],
    "I’m okay for now": [["Close Chat", "close"]],
    "Rest for now": [["Close Chat", "close"]],
  }[choice] || [];
  nextActions.forEach(([label, action]) => {
    const button = document.createElement("button");
    button.className = "support-save-button";
    button.type = "button";
    button.textContent = label;
    button.dataset.chatAction = action;
    actions.append(button);
  });
}

function resetChat() {
  const thread = document.querySelector("#chat-thread");
  const actions = document.querySelector("#chat-actions");
  if (!thread || !actions) return;
  thread.innerHTML = "";
  appendChatMessage("Hey. I’m here with you. What’s been on your mind?", "assistant");
  renderChatChoices(Object.keys(chatBranches));
}

function openChat() {
  openInternalPage("ai-chat");
  resetChat();
}

function showPage(pageName) {
  pages.forEach((page) => {
    const isActive = page.dataset.page === pageName;
    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  navItems.forEach((item) => {
    const navPage = pageName === "weekly" || pageName === "daily" ? "daily" : pageName;
    const isActive = item.dataset.target === navPage;
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
renderWeeklyDueStatus();
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

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-target-page]");
  if (button) openInternalPage(button.dataset.targetPage);
});

document.querySelectorAll("[data-open-chat]").forEach((button) => {
  button.addEventListener("click", openChat);
});

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", () => {
    renderProviderForm(button.dataset.provider);
    document.querySelector("#provider-screen")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelector("[data-chat-restart]").addEventListener("click", resetChat);

document.querySelector("#chat-actions").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  button.disabled = true;
  if (button.dataset.chatAction) {
    const action = button.dataset.chatAction;
    if (action === "ground") openGroundingExercise();
    if (action === "daily") openInternalPage("daily");
    if (action === "counselling") {
      openInternalPage("support");
      document.querySelector("#professional-support-section")?.scrollIntoView({ behavior: "smooth" });
    }
    if (action === "support-plan") {
      openInternalPage("support");
      setTimeout(() => document.querySelector("#support-plan-section")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
    if (action === "close") openInternalPage("home");
    return;
  }

  const choice = button.dataset.chatChoice;
  if (!choice) return;
  const branch = chatBranches[choice];
  if (!branch) {
    finishChatAction(choice);
    return;
  }
  document.querySelector("#chat-actions").innerHTML = "";
  appendChatMessage(choice, "user");
  const typing = showChatTyping();
  window.setTimeout(() => {
    typing.remove();
    appendChatMessage(branch.response, "assistant");
    renderChatChoices(branch.choices);
  }, 700);
});

document.querySelector("#home-journal-action")?.addEventListener("click", (event) => {
  openInternalPage(event.currentTarget.dataset.targetPage || "daily");
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

supportSavePopover.querySelector("[data-support-save-close]").addEventListener("click", () => {
  supportSavePopover.hidden = true;
});

supportSavePopover.addEventListener("click", (event) => {
  if (event.target === supportSavePopover) supportSavePopover.hidden = true;
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
showPage("home");
renderHome();
renderCalendar();
loadSupportPlan();
resetChat();

window.setTimeout(() => {
  splashScreen?.classList.add("is-hidden");
  window.setTimeout(() => splashScreen?.remove(), 350);
}, 1500);
