import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.7.2/dist/browser/+esm";

const MEMBER_NAME_STORAGE_KEY = "toban-member-names";
const THEME_STORAGE_KEY = "toban-theme";
const MEMBER_LABELS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"];

const button = document.getElementById("generateButton");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const copyFeedbackEl = document.getElementById("copyFeedback");
const resultEl = document.getElementById("result");
const startDateInput = document.getElementById("startDate");
const memberCountInput = document.getElementById("memberCount");
const weeksInput = document.getElementById("weeks");
const memberSummaryEl = document.getElementById("memberSummary");
const openMemberModalButton = document.getElementById("openMemberModal");
const closeMemberModalButton = document.getElementById("closeMemberModal");
const saveMemberNamesButton = document.getElementById("saveMemberNames");
const resetMemberNamesButton = document.getElementById("resetMemberNames");
const memberModalEl = document.getElementById("memberModal");
const memberNameListEl = document.getElementById("memberNameList");
const memberNameCountEl = document.getElementById("memberNameCount");
const themeToggleButton = document.getElementById("themeToggle");
const themeToggleIconEl = document.getElementById("themeToggleIcon");
const themeToggleLabelEl = document.getElementById("themeToggleLabel");

let vm = null;
let memberNames = loadMemberNames();
let lastGeneratedItems = [];
let copyFeedbackTimeoutId = null;

function loadMemberNames() {
  try {
    const raw = localStorage.getItem(MEMBER_NAME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMemberNames() {
  localStorage.setItem(MEMBER_NAME_STORAGE_KEY, JSON.stringify(memberNames));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  themeToggleIconEl.textContent = "Mode";
  themeToggleLabelEl.textContent = isDark ? "Light" : "Dark";
}

function getMemberLabels(count) {
  if (count > MEMBER_LABELS.length) {
    throw new Error(`人数は最大 ${MEMBER_LABELS.length} 人までです。`);
  }

  return MEMBER_LABELS.slice(0, count);
}

function getValidMemberCount() {
  const count = Number(memberCountInput.value);
  if (!Number.isInteger(count) || count <= 0) {
    return 0;
  }

  return Math.min(count, MEMBER_LABELS.length);
}

function getDisplayName(label) {
  const name = (memberNames[label] || "").trim();
  return name || label;
}

function hasCustomDisplayName(label) {
  return getDisplayName(label) !== label;
}

function showCopyFeedback(message, isError = false) {
  if (copyFeedbackTimeoutId) {
    clearTimeout(copyFeedbackTimeoutId);
  }

  copyFeedbackEl.textContent = message;
  copyFeedbackEl.classList.remove("hidden");
  copyFeedbackEl.classList.toggle("border-sky-200", !isError);
  copyFeedbackEl.classList.toggle("bg-sky-50", !isError);
  copyFeedbackEl.classList.toggle("text-sky-700", !isError);
  copyFeedbackEl.classList.toggle("dark:border-sky-400/20", !isError);
  copyFeedbackEl.classList.toggle("dark:bg-sky-400/10", !isError);
  copyFeedbackEl.classList.toggle("dark:text-sky-200", !isError);
  copyFeedbackEl.classList.toggle("border-rose-200", isError);
  copyFeedbackEl.classList.toggle("bg-rose-50", isError);
  copyFeedbackEl.classList.toggle("text-rose-700", isError);
  copyFeedbackEl.classList.toggle("dark:border-rose-400/20", isError);
  copyFeedbackEl.classList.toggle("dark:bg-rose-400/10", isError);
  copyFeedbackEl.classList.toggle("dark:text-rose-200", isError);

  copyFeedbackTimeoutId = window.setTimeout(() => {
    copyFeedbackEl.textContent = "";
    copyFeedbackEl.classList.add("hidden");
  }, 2500);
}

function updateMemberSummary() {
  const count = getValidMemberCount();
  if (count <= 0) {
    memberSummaryEl.textContent = "人数を入力すると担当名を設定できます。";
    return;
  }

  const labels = getMemberLabels(count);
  const preview = labels.slice(0, 4).map((label) => getDisplayName(label)).join(" / ");
  const customizedCount = labels.filter((label) => (memberNames[label] || "").trim()).length;
  const moreText = count > 4 ? ` ほか${count - 4}名` : "";
  memberSummaryEl.textContent = `${customizedCount}名の表示名を設定済み。${preview}${moreText}`;
}

function renderMemberNameFields() {
  const count = getValidMemberCount();
  memberNameListEl.innerHTML = "";
  memberNameCountEl.textContent = count > 0 ? `${count}人` : "未設定";

  if (count <= 0) {
    memberNameListEl.innerHTML = `
      <p class="col-span-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        先に人数を入力してください。
      </p>
    `;
    return;
  }

  const labels = getMemberLabels(count);
  memberNameListEl.innerHTML = labels.map((label) => `
    <label class="field block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <span class="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-100">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-400/15 dark:text-teal-200">${escapeHtml(label)}</span>
        担当 ${escapeHtml(label)}
      </span>
      <input
        class="field-input mt-3"
        data-member-label="${escapeHtml(label)}"
        type="text"
        maxlength="30"
        placeholder="表示名を入力"
        value="${escapeHtml(memberNames[label] || "")}"
      />
    </label>
  `).join("");
}

function openMemberModal() {
  renderMemberNameFields();
  memberModalEl.classList.remove("hidden");
  memberModalEl.classList.add("flex");
  memberModalEl.setAttribute("aria-hidden", "false");
  memberNameListEl.querySelector("input")?.focus();
}

function closeMemberModal() {
  memberModalEl.classList.add("hidden");
  memberModalEl.classList.remove("flex");
  memberModalEl.setAttribute("aria-hidden", "true");
}

function persistMemberNamesFromModal() {
  const inputs = memberNameListEl.querySelectorAll("[data-member-label]");
  inputs.forEach((input) => {
    const label = input.getAttribute("data-member-label");
    const value = input.value.trim();

    if (!label) {
      return;
    }

    if (value) {
      memberNames[label] = value;
    } else {
      delete memberNames[label];
    }
  });

  saveMemberNames();
  updateMemberSummary();
}

function formatPersonCell(label) {
  const displayName = getDisplayName(label);
  const hasCustomName = hasCustomDisplayName(label);

  if (!hasCustomName) {
    return `
      <div class="flex items-center gap-3">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">${escapeHtml(label)}</span>
        <span class="font-medium text-slate-700 dark:text-slate-100">${escapeHtml(label)}</span>
      </div>
    `;
  }

  return `
    <div class="flex items-center gap-3">
      <span class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-teal-100 px-3 text-xs font-semibold text-teal-700 dark:bg-teal-400/15 dark:text-teal-200">担当</span>
      <div class="min-w-0 font-medium text-slate-800 dark:text-white">${escapeHtml(displayName)}</div>
    </div>
  `;
}

function getClipboardText(items) {
  const lines = [
    ["日付", "担当"].join("\t"),
    ...items.map((item) => [item.date, getDisplayName(item.person)].join("\t"))
  ];
  return lines.join("\n");
}

async function copyScheduleToClipboard() {
  if (lastGeneratedItems.length === 0) {
    showCopyFeedback("先に当番表を作成してください。", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(getClipboardText(lastGeneratedItems));
    showCopyFeedback("日付と担当をクリップボードにコピーしました。");
  } catch (error) {
    showCopyFeedback("コピーに失敗しました。", true);
    console.error(error);
  }
}

function renderTable(items) {
  lastGeneratedItems = items;
  const rows = items.map((item) => `
    <tr>
      <td>
        <div class="font-medium">${escapeHtml(item.date)}</div>
      </td>
      <td>${formatPersonCell(item.person)}</td>
    </tr>
  `).join("");

  resultEl.innerHTML = `
    <div class="border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Result</p>
          <h3 class="mt-1 text-lg font-semibold text-slate-800 dark:text-white">生成された当番表</h3>
        </div>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-soft dark:bg-slate-900 dark:text-slate-300 dark:shadow-none">
            ${escapeHtml(String(items.length))} weeks
          </div>
          <button
            id="copyScheduleButton"
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            クリップボードにコピー
          </button>
        </div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>日付</th>
          <th>担当</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.getElementById("copyScheduleButton")?.addEventListener("click", copyScheduleToClipboard);
}

async function initRuby() {
  loadingEl.textContent = "Ruby.wasm を初期化しています...";

  const response = await fetch("https://cdn.jsdelivr.net/npm/@ruby/3.4-wasm-wasi@2.7.2/dist/ruby+stdlib.wasm");
  if (!response.ok) {
    throw new Error(`wasm の読み込みに失敗しました: ${response.status}`);
  }

  const module = await WebAssembly.compileStreaming(response);
  const rubyVM = await DefaultRubyVM(module);
  vm = rubyVM.vm ?? rubyVM;

  const rubyCodeResponse = await fetch("./tbn_wa.rb");
  if (!rubyCodeResponse.ok) {
    throw new Error(`tbn_wa.rb の読み込みに失敗しました: ${rubyCodeResponse.status}`);
  }

  const rubyCode = await rubyCodeResponse.text();
  await vm.evalAsync(rubyCode);

  button.disabled = false;
  loadingEl.textContent = "準備完了です。";
}

button.addEventListener("click", async () => {
  errorEl.textContent = "";
  copyFeedbackEl.textContent = "";
  copyFeedbackEl.classList.add("hidden");
  resultEl.innerHTML = "";

  try {
    if (!vm) {
      throw new Error("Ruby.wasm の初期化がまだ終わっていません。");
    }

    const startDate = startDateInput.value;
    const memberCount = Number(memberCountInput.value);
    const weeks = Number(weeksInput.value);

    const rubyExpr = `
      generate_schedule(
        ${JSON.stringify(startDate)},
        ${memberCount},
        ${weeks}
      )
    `;

    const json = (await vm.evalAsync(rubyExpr)).toString();
    const items = JSON.parse(json);
    renderTable(items);
  } catch (error) {
    lastGeneratedItems = [];
    errorEl.textContent = `エラー: ${error.message}`;
  }
});

memberCountInput.addEventListener("input", () => {
  updateMemberSummary();
  if (!memberModalEl.classList.contains("hidden")) {
    renderMemberNameFields();
  }
});

openMemberModalButton.addEventListener("click", () => {
  errorEl.textContent = "";
  openMemberModal();
});

closeMemberModalButton.addEventListener("click", closeMemberModal);

saveMemberNamesButton.addEventListener("click", () => {
  persistMemberNamesFromModal();
  if (lastGeneratedItems.length > 0) {
    renderTable(lastGeneratedItems);
  }
  closeMemberModal();
});

resetMemberNamesButton.addEventListener("click", () => {
  const count = getValidMemberCount();
  if (count <= 0) {
    return;
  }

  getMemberLabels(count).forEach((label) => {
    delete memberNames[label];
  });
  saveMemberNames();
  renderMemberNameFields();
  updateMemberSummary();
  if (lastGeneratedItems.length > 0) {
    renderTable(lastGeneratedItems);
  }
});

memberModalEl.addEventListener("click", (event) => {
  if (event.target === memberModalEl) {
    closeMemberModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !memberModalEl.classList.contains("hidden")) {
    closeMemberModal();
  }
});

themeToggleButton.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

setTheme(localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light");
updateMemberSummary();

initRuby().catch((error) => {
  loadingEl.textContent = "";
  errorEl.textContent = `初期化エラー: ${error.message}`;
  console.error(error);
});
