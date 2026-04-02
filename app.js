import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@latest/dist/browser/+esm";

const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const runButton = document.getElementById("generateButton");

let vm;

async function initRuby() {
  const response = await fetch("./wasm/ruby.wasm");
  const module = await WebAssembly.compileStreaming(response);
  vm = await DefaultRubyVM(module);

  const rubyCode = await fetch("./tbn_wa.rb").then(r => r.text());
  vm.eval(rubyCode);

  runButton.disabled = false;
  document.getElementById("loading").style.display = "none";
}

function renderTable(items) {
  const rows = items.map(item => `
    <tr>
      <td>${item.date}</td>
      <td>${item.person}</td>
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

runButton.addEventListener("click", async () => {
  errorEl.textContent = "";
  resultEl.innerHTML = "";

  try {
    const startDate = document.getElementById("startDate").value;
    const memberCount = Number(document.getElementById("memberCount").value);
    const weeks = Number(document.getElementById("weeks").value);

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
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

await initRuby();