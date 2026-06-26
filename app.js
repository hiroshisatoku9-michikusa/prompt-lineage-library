const STORAGE_KEY = "prompt-lineage-library:v1";
const SEED_PATH = "./prompt_lineage_seed.json";
const DEFAULT_STATUSES = [
  "keep_master",
  "keep_variant",
  "review",
  "review_or_archive",
  "archive",
  "archive_legacy",
];

let memoryStore = "";

const state = {
  data: null,
  selectedId: "",
  activeTab: "detail",
  search: "",
  status: "all",
  root: "all",
  archive: "active",
  sort: "id",
  lineageRoot: "",
};

const el = {
  saveState: document.querySelector("#saveState"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  rootFilter: document.querySelector("#rootFilter"),
  archiveFilter: document.querySelector("#archiveFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  resultCount: document.querySelector("#resultCount"),
  promptList: document.querySelector("#promptList"),
  detailTab: document.querySelector("#detailTab"),
  lineageTab: document.querySelector("#lineageTab"),
  exportTab: document.querySelector("#exportTab"),
  copyCurrentBtn: document.querySelector("#copyCurrentBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  importFile: document.querySelector("#importFile"),
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  wireEvents();
  try {
    const stored = readStoredData();
    if (stored) {
      state.data = normalizeData(JSON.parse(stored));
      setSaveState("ローカル保存から読み込み");
    } else {
      await loadSeed();
    }
    renderAll();
    document.body.classList.add("app-ready");
  } catch (error) {
    console.error(error);
    document.body.classList.remove("app-ready");
    showStartupError(error);
  }
}

function wireEvents() {
  el.searchInput.addEventListener("input", () => {
    state.search = el.searchInput.value;
    renderAll();
  });
  el.statusFilter.addEventListener("change", () => {
    state.status = el.statusFilter.value;
    renderAll();
  });
  el.rootFilter.addEventListener("change", () => {
    state.root = el.rootFilter.value;
    renderAll();
  });
  el.archiveFilter.addEventListener("change", () => {
    state.archive = el.archiveFilter.value;
    renderAll();
  });
  el.sortSelect.addEventListener("change", () => {
    state.sort = el.sortSelect.value;
    renderAll();
  });
  document.querySelector("#reviewBtn").addEventListener("click", () => {
    state.status = "review";
    state.archive = "all";
    renderAll();
  });
  el.promptList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-prompt-id]");
    if (!row) return;
    state.selectedId = row.dataset.promptId;
    state.activeTab = "detail";
    renderAll();
  });
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
    });
  });
  el.detailTab.addEventListener("change", handleDetailChange);
  el.detailTab.addEventListener("click", handleDetailClick);
  el.lineageTab.addEventListener("change", handleLineageChange);
  el.lineageTab.addEventListener("click", handleLineageClick);
  el.exportTab.addEventListener("click", handleExportClick);
  el.copyCurrentBtn.addEventListener("click", () => copyCurrentPrompt());
  el.exportJsonBtn.addEventListener("click", () => exportJson());
  el.exportCsvBtn.addEventListener("click", () => exportCsvBundle());
  el.importFile.addEventListener("change", importJsonFile);
}

async function loadSeed() {
  const embeddedSeed = window.PROMPT_LINEAGE_SEED;
  try {
    const response = await fetch(SEED_PATH);
    if (!response.ok) throw new Error("seed json not found");
    state.data = normalizeData(await response.json());
    saveData("seed JSONから読み込み");
  } catch (error) {
    if (!embeddedSeed) throw error;
    state.data = normalizeData(cloneData(embeddedSeed));
    saveData("同梱seedから読み込み");
  }
}

function cloneData(data) {
  return typeof structuredClone === "function"
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));
}

function showStartupError(error) {
  const message = escapeHtml(error?.message || "読み込みに失敗しました");
  setSaveState("読み込みエラー");
  el.promptList.innerHTML = "";
  el.detailTab.innerHTML = `
    <div class="empty-state">
      <h2>読み込みに失敗しました</h2>
      <p>${message}</p>
      <button type="button" data-action="import-from-error">Import JSON</button>
    </div>
  `;
}

function normalizeData(data) {
  const next = {
    version: data.version || "0.1",
    generated_from: data.generated_from || "",
    roots: Array.isArray(data.roots) ? data.roots : [],
    prompts: Array.isArray(data.prompts) ? data.prompts : [],
    relationships: Array.isArray(data.relationships) ? data.relationships : [],
  };
  next.prompts = next.prompts.map((prompt) => ({
    id: "",
    title: "",
    body: "",
    category: "",
    date: "",
    sourceConversation: "",
    duplicateCount: 1,
    lineageRoot: "",
    curationStatus: "review",
    subject: "",
    tags: [],
    notes: "",
    ...prompt,
    tags: Array.isArray(prompt.tags)
      ? prompt.tags
      : String(prompt.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
  }));
  next.relationships = next.relationships.map((rel) => ({
    from: "",
    to: "",
    type: "legacy_seed",
    confidence: "medium",
    note: "",
    ...rel,
  }));
  return next;
}

function saveData(message = "保存済み") {
  const saved = writeStoredData(JSON.stringify(state.data));
  const suffix = saved ? "" : "（一時保存）";
  setSaveState(`${message}${suffix} · ${new Date().toLocaleTimeString("ja-JP")}`);
}

function readStoredData() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryStore;
  }
}

function writeStoredData(value) {
  memoryStore = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

function clearStoredData() {
  memoryStore = "";
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Local file contexts can reject storage access. */
  }
}

function setSaveState(message) {
  el.saveState.textContent = message;
}

function renderAll() {
  renderFilters();
  const prompts = filteredPrompts();
  if (!state.selectedId || !prompts.some((prompt) => prompt.id === state.selectedId)) {
    state.selectedId = prompts[0]?.id || "";
  }
  renderList(prompts);
  renderDetail();
  renderLineage();
  renderExport();
  renderTabs();
}

function renderFilters() {
  const statuses = ["all", ...unique([...DEFAULT_STATUSES, ...state.data.prompts.map((p) => p.curationStatus)])];
  el.statusFilter.innerHTML = statuses
    .map((status) => optionHtml(status, status === state.status))
    .join("");
  const roots = [
    { id: "all", name: "all roots" },
    ...state.data.roots.map((root) => ({ id: root.id, name: `${root.id} · ${root.name}` })),
  ];
  el.rootFilter.innerHTML = roots
    .map((root) => optionHtml(root.id, root.id === state.root, root.name))
    .join("");
  el.archiveFilter.value = state.archive;
  el.sortSelect.value = state.sort;
  el.searchInput.value = state.search;
}

function renderList(prompts) {
  el.resultCount.textContent = `${prompts.length} prompts`;
  if (!prompts.length) {
    el.promptList.innerHTML = `<div class="empty-state"><p>該当するプロンプトはありません。</p></div>`;
    return;
  }
  el.promptList.innerHTML = prompts
    .map((prompt) => {
      const parent = getParentLabel(prompt.id);
      const status = prompt.curationStatus || "review";
      return `
        <button class="prompt-row ${prompt.id === state.selectedId ? "active" : ""}" data-prompt-id="${escapeAttr(prompt.id)}" type="button">
          <span class="row-main">
            <span class="prompt-id">${escapeHtml(prompt.id)}</span>
            <span class="prompt-title">${escapeHtml(prompt.title || "(untitled)")}</span>
          </span>
          <span class="row-meta">
            <span class="chip ${statusClass(status)}">${escapeHtml(status)}</span>
            ${isMaster(prompt) ? `<span class="chip master">master</span>` : ""}
            <span>${escapeHtml(prompt.category || "uncategorized")}</span>
            <span>${escapeHtml(parent)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderDetail() {
  const prompt = getSelectedPrompt();
  if (!prompt) {
    el.detailTab.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }
  const rel = getPrimaryRelationship(prompt.id);
  const statusOptions = unique([...DEFAULT_STATUSES, ...state.data.prompts.map((p) => p.curationStatus), prompt.curationStatus]);
  el.detailTab.innerHTML = `
    <div class="detail-grid">
      <article class="surface pad">
        <div class="detail-title">
          <div>
            <div class="row-meta">
              <span class="chip">${escapeHtml(prompt.id)}</span>
              <span class="chip ${statusClass(prompt.curationStatus)}">${escapeHtml(prompt.curationStatus)}</span>
              ${isMaster(prompt) ? `<span class="chip master">master</span>` : ""}
            </div>
            <h2>${escapeHtml(prompt.title || "(untitled)")}</h2>
          </div>
          <div class="detail-actions">
            <button class="primary" type="button" data-action="copy-body">Copy</button>
            <button type="button" data-action="copy-json">Copy JSON</button>
            <button class="danger" type="button" data-action="archive">Archive</button>
          </div>
        </div>
        <pre class="body-text">${escapeHtml(prompt.body)}</pre>
      </article>

      <aside class="surface pad field-stack">
        <label>
          <span>Title</span>
          <textarea data-field="title">${escapeHtml(prompt.title)}</textarea>
        </label>
        <div class="two-col">
          <label>
            <span>Status</span>
            <select data-field="curationStatus">
              ${statusOptions.map((status) => optionHtml(status, status === prompt.curationStatus)).join("")}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input data-field="date" value="${escapeAttr(prompt.date)}" />
          </label>
        </div>
        <label>
          <span>Parent</span>
          <select data-parent-select>
            ${parentOptions(prompt.id, rel)}
          </select>
        </label>
        <div class="two-col">
          <label>
            <span>Relation type</span>
            <input data-rel-field="type" value="${escapeAttr(rel?.type || "manual_parent")}" />
          </label>
          <label>
            <span>Confidence</span>
            <select data-rel-field="confidence">
              ${["high", "medium", "low"].map((value) => optionHtml(value, value === (rel?.confidence || "medium"))).join("")}
            </select>
          </label>
        </div>
        <label>
          <span>Relation note</span>
          <textarea data-rel-field="note">${escapeHtml(rel?.note || "")}</textarea>
        </label>
        <label>
          <span>Category</span>
          <input data-field="category" value="${escapeAttr(prompt.category)}" />
        </label>
        <label>
          <span>Subject</span>
          <input data-field="subject" value="${escapeAttr(prompt.subject)}" />
        </label>
        <label>
          <span>Tags</span>
          <input data-field="tags" value="${escapeAttr((prompt.tags || []).join(", "))}" />
        </label>
        <label>
          <span>Notes</span>
          <textarea data-field="notes">${escapeHtml(prompt.notes)}</textarea>
        </label>
      </aside>
    </div>
  `;
}

function renderLineage() {
  const selected = getSelectedPrompt();
  const selectedRoot =
    state.lineageRoot ||
    selected?.lineageRoot ||
    (state.root !== "all" ? state.root : state.data.roots[0]?.id);
  const roots = state.data.roots.map((root) => optionHtml(root.id, root.id === selectedRoot, `${root.id} · ${root.name}`)).join("");
  const root = state.data.roots.find((item) => item.id === selectedRoot) || state.data.roots[0];
  el.lineageTab.innerHTML = `
    <div class="lineage-layout">
      <div class="surface pad lineage-tools">
        <label>
          <span>Root</span>
          <select id="lineageRootSelect">${roots}</select>
        </label>
        <button type="button" data-lineage-action="select-root">${root ? "Select root" : "No root"}</button>
      </div>
      <div class="surface pad">
        <h2>${escapeHtml(root?.name || "Lineage")}</h2>
        <p class="muted">${escapeHtml(root?.description || "")}</p>
        <div class="tree">${root ? renderTree(root.id, new Set()) : ""}</div>
      </div>
    </div>
  `;
}

function renderExport() {
  const archived = state.data.prompts.filter(isArchived).length;
  const masters = state.data.prompts.filter(isMaster).length;
  el.exportTab.innerHTML = `
    <div class="export-layout">
      <div class="stats-grid">
        <div class="stat"><b>${state.data.prompts.length}</b><span>prompts</span></div>
        <div class="stat"><b>${state.data.roots.length}</b><span>roots</span></div>
        <div class="stat"><b>${state.data.relationships.length}</b><span>relationships</span></div>
        <div class="stat"><b>${archived}</b><span>archived · ${masters} masters</span></div>
      </div>
      <div class="surface pad">
        <div class="export-actions">
          <button class="primary" type="button" data-export="json">Export JSON</button>
          <button type="button" data-export="prompts-csv">Export prompts CSV</button>
          <button type="button" data-export="relationships-csv">Export relationships CSV</button>
          <button type="button" data-export="import">Import JSON</button>
          <button class="danger" type="button" data-export="reset">Reset to seed</button>
        </div>
      </div>
    </div>
  `;
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
  [
    ["detail", el.detailTab],
    ["lineage", el.lineageTab],
    ["export", el.exportTab],
  ].forEach(([name, panel]) => {
    panel.classList.toggle("active", name === state.activeTab);
  });
}

function filteredPrompts() {
  const query = normalizeText(state.search);
  const terms = query.split(/\s+/).filter(Boolean);
  let prompts = state.data.prompts.filter((prompt) => {
    if (state.status !== "all" && prompt.curationStatus !== state.status) return false;
    if (state.root !== "all" && prompt.lineageRoot !== state.root) return false;
    if (state.archive === "active" && isArchived(prompt)) return false;
    if (state.archive === "archived" && !isArchived(prompt)) return false;
    if (!terms.length) return true;
    const haystack = normalizeText(searchText(prompt));
    return terms.every((term) => haystack.includes(term));
  });
  prompts = [...prompts].sort((a, b) => {
    if (state.sort === "date_desc") return String(b.date).localeCompare(String(a.date)) || a.id.localeCompare(b.id);
    if (state.sort === "status") return String(a.curationStatus).localeCompare(String(b.curationStatus)) || a.id.localeCompare(b.id);
    if (state.sort === "root") return String(a.lineageRoot).localeCompare(String(b.lineageRoot)) || a.id.localeCompare(b.id);
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
  return prompts;
}

function searchText(prompt) {
  const rel = getPrimaryRelationship(prompt.id);
  return [
    prompt.id,
    prompt.title,
    prompt.body,
    prompt.category,
    prompt.date,
    prompt.sourceConversation,
    prompt.curationStatus,
    prompt.subject,
    (prompt.tags || []).join(" "),
    prompt.notes,
    prompt.lineageRoot,
    rel?.from,
    rel?.type,
    rel?.note,
  ].join(" ");
}

function handleDetailChange(event) {
  const prompt = getSelectedPrompt();
  if (!prompt) return;
  const target = event.target;
  if (target.matches("[data-field]")) {
    const field = target.dataset.field;
    prompt[field] = field === "tags" ? splitTags(target.value) : target.value;
    if (field === "curationStatus" && target.value.startsWith("archive")) {
      prompt.archived = true;
    }
    saveData("編集を保存");
    renderAll();
  }
  if (target.matches("[data-parent-select]")) {
    updateParent(prompt.id, target.value);
    saveData("系譜を保存");
    renderAll();
  }
  if (target.matches("[data-rel-field]")) {
    const rel = ensureRelationship(prompt.id);
    rel[target.dataset.relField] = target.value;
    saveData("系譜を保存");
    renderAll();
  }
}

function handleDetailClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "import-from-error") {
    el.importFile.click();
    return;
  }
  const prompt = getSelectedPrompt();
  if (!action || !prompt) return;
  if (action === "copy-body") copyText(prompt.body, "プロンプトをコピー");
  if (action === "copy-json") copyText(JSON.stringify(prompt, null, 2), "JSONをコピー");
  if (action === "archive") {
    prompt.curationStatus = prompt.curationStatus === "archive" ? "review" : "archive";
    prompt.archived = prompt.curationStatus === "archive";
    saveData("アーカイブ状態を保存");
    renderAll();
  }
}

function handleLineageChange(event) {
  if (event.target.id === "lineageRootSelect") {
    state.lineageRoot = event.target.value;
    renderLineage();
    state.activeTab = "lineage";
    renderTabs();
  }
}

function handleLineageClick(event) {
  const node = event.target.closest("[data-tree-id]");
  if (node) {
    const id = node.dataset.treeId;
    if (getPrompt(id)) {
      state.selectedId = id;
      renderAll();
      state.activeTab = "lineage";
      renderTabs();
    }
  }
}

function handleExportClick(event) {
  const action = event.target.closest("[data-export]")?.dataset.export;
  if (!action) return;
  if (action === "json") exportJson();
  if (action === "prompts-csv") exportPromptsCsv();
  if (action === "relationships-csv") exportRelationshipsCsv();
  if (action === "import") el.importFile.click();
  if (action === "reset" && confirm("ローカル編集を破棄してseed JSONに戻しますか？")) {
    clearStoredData();
    loadSeed().then(renderAll);
  }
}

function getSelectedPrompt() {
  return getPrompt(state.selectedId);
}

function getPrompt(id) {
  return state.data.prompts.find((prompt) => prompt.id === id);
}

function getPrimaryRelationship(id) {
  return state.data.relationships.find((rel) => rel.to === id);
}

function ensureRelationship(id) {
  let rel = getPrimaryRelationship(id);
  if (!rel) {
    const prompt = getPrompt(id);
    rel = {
      from: prompt?.lineageRoot || state.data.roots[0]?.id || "",
      to: id,
      type: "manual_parent",
      confidence: "high",
      note: "Edited in Prompt Lineage Library.",
    };
    state.data.relationships.push(rel);
  }
  return rel;
}

function updateParent(id, value) {
  const prompt = getPrompt(id);
  if (!prompt) return;
  const [kind, ...rest] = value.split(":");
  const parentId = rest.join(":");
  if (!parentId || parentId === id || getDescendants(id).has(parentId)) return;
  const rel = ensureRelationship(id);
  rel.from = parentId;
  if (!rel.type) rel.type = kind === "root" ? "legacy_seed" : "manual_parent";
  const rootId = kind === "root" ? parentId : getPrompt(parentId)?.lineageRoot || inferRoot(parentId);
  if (rootId) updateSubtreeRoot(id, rootId);
}

function updateSubtreeRoot(id, rootId, seen = new Set()) {
  if (seen.has(id)) return;
  seen.add(id);
  const prompt = getPrompt(id);
  if (prompt) prompt.lineageRoot = rootId;
  state.data.relationships
    .filter((rel) => rel.from === id)
    .forEach((childRel) => updateSubtreeRoot(childRel.to, rootId, seen));
}

function inferRoot(id) {
  const rootIds = new Set(state.data.roots.map((root) => root.id));
  let cursor = id;
  const seen = new Set();
  while (cursor && !seen.has(cursor)) {
    if (rootIds.has(cursor)) return cursor;
    seen.add(cursor);
    cursor = getPrimaryRelationship(cursor)?.from;
  }
  return "";
}

function parentOptions(id, rel) {
  const current = rel?.from || getPrompt(id)?.lineageRoot || "";
  const descendants = getDescendants(id);
  const rootOptions = state.data.roots
    .map((root) => optionHtml(`root:${root.id}`, current === root.id, `${root.id} · ${root.name}`))
    .join("");
  const promptOptions = state.data.prompts
    .filter((prompt) => prompt.id !== id)
    .map((prompt) => {
      const disabled = descendants.has(prompt.id);
      const label = `${prompt.id} · ${trim(prompt.title || "(untitled)", 84)}`;
      return optionHtml(`prompt:${prompt.id}`, current === prompt.id, label, disabled);
    })
    .join("");
  return `<optgroup label="Roots">${rootOptions}</optgroup><optgroup label="Prompts">${promptOptions}</optgroup>`;
}

function getDescendants(id, seen = new Set()) {
  state.data.relationships
    .filter((rel) => rel.from === id)
    .forEach((rel) => {
      if (!seen.has(rel.to)) {
        seen.add(rel.to);
        getDescendants(rel.to, seen);
      }
    });
  return seen;
}

function renderTree(id, seen) {
  if (seen.has(id)) return `<p class="muted">Cycle detected at ${escapeHtml(id)}</p>`;
  seen.add(id);
  const children = state.data.relationships
    .filter((rel) => rel.from === id)
    .map((rel) => getPrompt(rel.to))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  if (!children.length) return `<p class="muted">No children</p>`;
  return `<ul>${children
    .map((child) => {
      const status = child.curationStatus || "review";
      const nested = renderTree(child.id, new Set(seen));
      return `
        <li>
          <button type="button" data-tree-id="${escapeAttr(child.id)}" class="${child.id === state.selectedId ? "selected-node" : ""}">
            ${escapeHtml(child.id)} · ${escapeHtml(trim(child.title || "(untitled)", 96))}
          </button>
          <span class="chip ${statusClass(status)}">${escapeHtml(status)}</span>
          ${nested.includes("No children") ? "" : nested}
        </li>
      `;
    })
    .join("")}</ul>`;
}

function getParentLabel(id) {
  const rel = getPrimaryRelationship(id);
  if (!rel) return "no parent";
  const root = state.data.roots.find((item) => item.id === rel.from);
  if (root) return root.name;
  return rel.from;
}

function isMaster(prompt) {
  const status = String(prompt.curationStatus || "");
  const rel = getPrimaryRelationship(prompt.id);
  return status.includes("master") || String(rel?.type || "").includes("master");
}

function isArchived(prompt) {
  const status = String(prompt.curationStatus || "");
  return prompt.archived === true || status.startsWith("archive");
}

function statusClass(status) {
  if (String(status).startsWith("archive")) return "archive";
  if (String(status).includes("review")) return "review";
  if (String(status).includes("master")) return "master";
  return "";
}

function copyCurrentPrompt() {
  const prompt = getSelectedPrompt();
  if (prompt) copyText(prompt.body, "プロンプトをコピー");
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  setSaveState(`${message} · ${new Date().toLocaleTimeString("ja-JP")}`);
}

function exportJson() {
  downloadFile("prompt_lineage_export.json", JSON.stringify(state.data, null, 2), "application/json");
}

function exportCsvBundle() {
  exportPromptsCsv();
  exportRelationshipsCsv();
}

function exportPromptsCsv() {
  const rows = state.data.prompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    body: prompt.body,
    category: prompt.category,
    date: prompt.date,
    sourceConversation: prompt.sourceConversation,
    duplicateCount: prompt.duplicateCount,
    lineageRoot: prompt.lineageRoot,
    curationStatus: prompt.curationStatus,
    subject: prompt.subject,
    tags: (prompt.tags || []).join("|"),
    notes: prompt.notes,
    archived: isArchived(prompt) ? "true" : "false",
  }));
  downloadFile("prompt_lineage_prompts.csv", toCsv(rows), "text/csv");
}

function exportRelationshipsCsv() {
  const rows = state.data.relationships.map((rel) => ({
    from: rel.from,
    to: rel.to,
    type: rel.type,
    confidence: rel.confidence,
    note: rel.note,
  }));
  downloadFile("prompt_lineage_relationships.csv", toCsv(rows), "text/csv");
}

async function importJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  state.data = normalizeData(JSON.parse(text));
  state.selectedId = state.data.prompts[0]?.id || "";
  saveData("JSONをインポート");
  event.target.value = "";
  renderAll();
}

function downloadFile(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function splitTags(value) {
  return value
    .split(/[,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function optionHtml(value, selected, label = value, disabled = false) {
  return `<option value="${escapeAttr(value)}"${selected ? " selected" : ""}${disabled ? " disabled" : ""}>${escapeHtml(label)}</option>`;
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ""))];
}

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase("ja-JP");
}

function trim(value, length) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
