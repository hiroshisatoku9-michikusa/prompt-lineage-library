const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf8");
const seed = fs.readFileSync("seed-data.js", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>スタイルプロンプト図鑑</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">PL</div>
          <div>
            <h1>スタイルプロンプト図鑑</h1>
            <p id="saveState">読み込み中</p>
          </div>
        </div>
        <div class="top-actions">
          <button id="copyCurrentBtn" type="button" title="現在のプロンプトをコピー">コピー</button>
          <button id="exportJsonBtn" type="button" title="JSONを書き出し">JSON</button>
          <button id="exportCsvBtn" type="button" title="CSVを書き出し">CSV</button>
          <input id="importFile" type="file" accept="application/json,.json" hidden />
        </div>
      </header>

      <section class="toolbar" aria-label="プロンプトの絞り込み">
        <label class="search-box">
          <span>検索</span>
          <input id="searchInput" type="search" placeholder="タイトル・本文・タグから探す" autocomplete="off" />
        </label>
        <label>
          <span>整理</span>
          <select id="statusFilter"></select>
        </label>
        <label>
          <span>確度</span>
          <select id="confidenceFilter"></select>
        </label>
        <label>
          <span>系統</span>
          <select id="rootFilter"></select>
        </label>
        <label>
          <span>表示</span>
          <select id="archiveFilter">
            <option value="active">表示中</option>
            <option value="all">すべて</option>
            <option value="archived">保管済み</option>
          </select>
        </label>
        <label>
          <span>並び</span>
          <select id="sortSelect">
            <option value="id">ID順</option>
            <option value="date_desc">新しい順</option>
            <option value="status">整理状態</option>
            <option value="root">系統順</option>
          </select>
        </label>
      </section>

      <section class="workspace">
        <aside class="library-pane">
          <div class="pane-head">
            <strong id="resultCount">0枚のカード</strong>
            <button id="reviewBtn" type="button">要確認</button>
          </div>
          <div id="promptList" class="prompt-list" aria-label="プロンプト一覧"></div>
        </aside>

        <section class="detail-pane">
          <nav class="tabs" aria-label="詳細タブ">
            <button class="tab active" type="button" data-tab="detail">詳細</button>
            <button class="tab" type="button" data-tab="lineage">系譜</button>
            <button class="tab" type="button" data-tab="export">入出力</button>
          </nav>
          <div id="detailTab" class="tab-panel active"></div>
          <div id="lineageTab" class="tab-panel"></div>
          <div id="exportTab" class="tab-panel"></div>
        </section>
      </section>
    </main>

    <template id="emptyTemplate">
      <div class="empty-state">
        <h2>カードがありません</h2>
        <p>検索条件を変えるか、JSONを読み込んでください。</p>
      </div>
    </template>

    <script>
${seed}
    </script>
    <script>
${app}
    </script>
  </body>
</html>
`;

fs.writeFileSync("index.html", html);
