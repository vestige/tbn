import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.7.2/dist/browser/+esm";

const button = document.getElementById("generateButton");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const startDateInput = document.getElementById("startDate");
const memberCountInput = document.getElementById("memberCount");
const weeksInput = document.getElementById("weeks");

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
    errorEl.textContent = `エラー: ${error.message}`;
  }
});

initRuby().catch((error) => {
  loadingEl.textContent = "";
  errorEl.textContent = `初期化エラー: ${error.message}`;
  console.error(error);
});