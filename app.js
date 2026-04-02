window.addEventListener("DOMContentLoaded", async () => {
  const button = document.getElementById("generateButton");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const startDateInput = document.getElementById("startDate");
  const memberCountInput = document.getElementById("memberCount");
  const weeksInput = document.getElementById("weeks");

  if (!button || !loadingEl || !errorEl || !resultEl || !startDateInput || !memberCountInput || !weeksInput) {
    console.error("必要なHTML要素が見つかりません");
    return;
  }

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

  try {
    loadingEl.textContent = "Ruby.wasm を初期化しています...";

    const rubyCode = await fetch("./tbn_wa.rb").then((r) => {
      if (!r.ok) throw new Error(`tbn_wa.rb の読み込みに失敗: ${r.status}`);
      return r.text();
    });

    const script = document.createElement("script");
    script.type = "text/ruby";
    script.textContent = `
      ${rubyCode}

      require "js"
      document = JS.global[:document]

      button = document.getElementById("generateButton")
      error_el = document.getElementById("error")
      result_el = document.getElementById("result")
      start_date_input = document.getElementById("startDate")
      member_count_input = document.getElementById("memberCount")
      weeks_input = document.getElementById("weeks")

      def escape_html(text)
        text
          .gsub("&", "&amp;")
          .gsub("<", "&lt;")
          .gsub(">", "&gt;")
          .gsub('"', "&quot;")
          .gsub("'", "&#39;")
      end

      def render_result(schedule)
        rows = schedule.map do |item|
          "<tr><td>#{escape_html(item["date"])}</td><td>#{escape_html(item["person"])}</td></tr>"
        end.join

        <<~HTML
          <table border="1" cellspacing="0" cellpadding="6">
            <thead>
              <tr>
                <th>日付</th>
                <th>担当</th>
              </tr>
            </thead>
            <tbody>#{rows}</tbody>
          </table>
        HTML
      end

      click_handler = JS::Function.new(-> (*_) do
        begin
          error_el[:textContent] = ""
          result_el[:innerHTML] = ""

          start_date = start_date_input[:value].to_s
          member_count = member_count_input[:value].to_s.to_i
          weeks = weeks_input[:value].to_s.to_i

          json = generate_schedule(start_date, member_count, weeks)
          schedule = JSON.parse(json)

          result_el[:innerHTML] = render_result(schedule)
        rescue => e
          error_el[:textContent] = "エラー: #{e.message}"
        end
      end)

      button.addEventListener("click", click_handler)
      button[:disabled] = false
      document.getElementById("loading")[:textContent] = "準備完了です。"
    `;

    document.body.appendChild(script);
  } catch (error) {
    loadingEl.textContent = "";
    errorEl.textContent = `初期化エラー: ${error.message}`;
  }
});