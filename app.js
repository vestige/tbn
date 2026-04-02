import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@latest/dist/browser/+esm";

window.addEventListener("DOMContentLoaded", () => {
  console.log("app.js loaded");

  const button = document.getElementById("generateButton");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const startDateInput = document.getElementById("startDate");
  const memberCountInput = document.getElementById("memberCount");
  const weeksInput = document.getElementById("weeks");

  console.log({ button, loadingEl, errorEl, resultEl, startDateInput, memberCountInput, weeksInput });

  if (!button || !loadingEl || !errorEl || !resultEl || !startDateInput || !memberCountInput || !weeksInput) {
    errorEl.textContent = "HTML要素の取得に失敗しました。index.html の id を確認してください。";
    return;
  }

  let vm = null;

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderTable(items) {
    const rows = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.person)}</td>
      </tr>
    `).join("");

    resultEl.innerHTML = `
      <table border="1" cellspacing="0" cellpadding="6">
        <thead>
          <tr>
            <th>日付</th>
            <th>担当</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  async function initRuby() {
    loadingEl.textContent = "Ruby.wasm を初期化しています...";

    const response = await fetch("https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@latest/dist/ruby+stdlib.wasm");
    const module = await WebAssembly.compileStreaming(response);
    vm = await DefaultRubyVM(module);

    const rubyCode = await fetch("./tbn_wa.rb").then((r) => r.text());
    vm.eval(rubyCode);

    button.disabled = false;
    loadingEl.textContent = "準備完了です。";
  }

  button.addEventListener("click", () => {
    errorEl.textContent = "";
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

      const json = vm.eval(rubyExpr).toString();
      const items = JSON.parse(json);
      renderTable(items);
    } catch (error) {
      errorEl.textContent = `エラー: ${error.message}`;
    }
  });

  initRuby().catch((error) => {
    loadingEl.textContent = "";
    errorEl.textContent = `初期化エラー: ${error.message}`;
  });
});