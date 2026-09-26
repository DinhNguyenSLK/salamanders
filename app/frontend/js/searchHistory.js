// Search history stays in this browser; no history endpoint is used.
var searchHistoryRecords = [];
var searchHistoryLimit = 5;
var searchHistoryKey = "";
var searchHistoryPersistent = true;

function validHistoryRecord(record) {
  const p = record?.payload;
  return Number.isFinite(record?.time) && p && Array.isArray(p.query) &&
    Array.isArray(p.parameters) && p.query.length > 0 &&
    p.query.length <= MAX_TEMPORAL_SCENES && p.query.length === p.parameters.length &&
    p.query.every(q => q && typeof q === "object" && !Array.isArray(q) &&
      ["textual", "ocr", "asr", "qbe", "object_pos", "vf", "comboVisualSim"].every(key =>
        q[key] == null || typeof q[key] === "string") &&
      (q.tags == null || (Array.isArray(q.tags) && q.tags.every(tag => typeof tag === "string"))) &&
      (q.object_count == null || (Array.isArray(q.object_count) && q.object_count.every(o =>
        o && typeof o.label === "string" && Number.isFinite(o.count))))) &&
    p.parameters.every(p => p && typeof p === "object" && !Array.isArray(p));
}

function persistSearchHistory() {
  try {
    localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryRecords));
    searchHistoryPersistent = true;
  } catch (_) {
    // Large image examples or blocked storage must never prevent searching.
    searchHistoryPersistent = false;
  }
}

function initSearchHistory() {
  const limit = Number(config?.ui?.["top-record"] ?? 5);
  searchHistoryLimit = Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : 5;
  searchHistoryKey = "salamanders.searchHistory.v1:" + location.pathname + ":" + collectionName;
  try {
    const saved = JSON.parse(localStorage.getItem(searchHistoryKey) || "[]");
    searchHistoryRecords = Array.isArray(saved) ? saved.filter(validHistoryRecord).slice(0, searchHistoryLimit) : [];
  } catch (_) {
    searchHistoryRecords = [];
  }
  persistSearchHistory();
  const menu = document.getElementById("searchHistory");
  document.getElementById("clearSearchHistory").addEventListener("click", function () {
    searchHistoryRecords = [];
    persistSearchHistory();
    renderSearchHistory();
  });
  document.addEventListener("pointerdown", event => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  menu.addEventListener("toggle", () => {
    if (menu.open) document.querySelectorAll("#utilityActions > details").forEach(other => {
      if (other !== menu) other.open = false;
    });
  });
  renderSearchHistory();
}

function recordSearchHistory(payload) {
  if (!searchHistoryKey || !searchHistoryLimit) return;
  const record = { time: Date.now(), payload: JSON.parse(JSON.stringify(payload)) };
  if (!validHistoryRecord(record)) return;
  // Repeated identical requests move to the top instead of filling the list.
  const signature = JSON.stringify(record.payload);
  searchHistoryRecords = [record, ...searchHistoryRecords.filter(r => JSON.stringify(r.payload) !== signature)]
    .slice(0, searchHistoryLimit);
  persistSearchHistory();
  renderSearchHistory();
}

function historyQueryLabel(query) {
  return query.map(q => [q.textual, q.ocr && "OCR: " + q.ocr, q.asr && "ASR: " + q.asr,
    q.tags?.length && "Tags: " + q.tags.join(", "),
    q.object_count?.length && q.object_count.map(o => o.count + " " + o.label).join(", "),
    q.object_pos && "Localized objects", q.qbe && "Image example",
    (q.vf || q.comboVisualSim) && "Similar to " + (q.vf || q.comboVisualSim)]
    .filter(Boolean).join(" · ")).join(" → ");
}

function renderSearchHistory() {
  const list = document.getElementById("searchHistoryList");
  list.replaceChildren();
  document.getElementById("searchHistoryCount").textContent = searchHistoryRecords.length;
  document.getElementById("clearSearchHistory").disabled = !searchHistoryRecords.length;
  document.getElementById("searchHistoryHint").textContent = searchHistoryPersistent
    ? "Saved in this browser. Select to restore, then Search."
    : "Browser storage is unavailable or full. New history lasts for this page only.";
  if (!searchHistoryRecords.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = searchHistoryLimit ? "Your searches will appear here." : "History is disabled in config.yaml.";
    list.appendChild(empty);
  }
  searchHistoryRecords.forEach(record => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-entry";
    const title = document.createElement("span");
    title.className = "history-query";
    title.textContent = historyQueryLabel(record.payload.query);
    const meta = document.createElement("span");
    meta.className = "history-meta";
    const p = record.payload;
    meta.textContent = [...new Set(p.parameters.map(p => p.textual_model)), p.video_type || "all",
      ...new Set(p.parameters.map(p => p.textual_language === "en" ? "English (direct)" : "Vietnamese → English")),
      "K " + p.k, p.query.length + (p.query.length === 1 ? " scene" : " scenes")].join(" · ");
    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = new Date(record.time).toLocaleString();
    button.title = title.textContent;
    button.append(title, meta, time);
    button.addEventListener("click", () => restoreSearchHistory(record));
    list.appendChild(button);
  });
}

function restoreSearchHistory(record) {
  if (!validHistoryRecord(record)) return;
  const payload = record.payload;
  canvases.forEach(canvas => canvas?.dispose());
  initSearchScenes();
  while (tempSearchForms < payload.query.length) addSearchScene();
  payload.query.forEach((query, idx) => {
    const params = payload.parameters[idx];
    const setValue = (prefix, value) => {
      const el = document.getElementById(prefix + idx);
      if (el) el.value = value ?? "";
    };
    setValue("textual", query.textual);
    setValue("textualLanguage", params.textual_language === "en" ? "en" : "vi");
    setValue("ocr", query.ocr);
    setValue("asr", query.asr);
    setValue("tags", (query.tags || []).join(", "));
    setValue("not", (query.object_count || []).map(o => o.count + " " + o.label).join(" "));
    textualMode[idx] = params.textual_model || textualMode[idx];
    occur[idx] = params.operator || "and";
    document.querySelectorAll('input[name="textualMode' + idx + '"]').forEach(el => el.checked = el.value === textualMode[idx]);
    document.querySelectorAll('input[name="occur' + idx + '"]').forEach(el => el.checked = el.value === occur[idx]);
    ["ocr", "asr"].forEach(field => {
      const mode = document.getElementById(field + "Mode" + idx);
      if (mode.dataset.mode !== (params[field + "_mode"] || "text")) toggleFieldMode(mode);
      const operator = document.getElementById(field + "Operator" + idx);
      if (operator.dataset.operator !== (params[field + "_operator"] || "or")) toggleFieldOperator(operator);
      setValue(field + "Fuzziness", params[field + "_fuzziness"] ?? 0);
    });
    const range = params.range || "eq";
    document.getElementById("not" + idx).dataset.range = range;
    document.querySelectorAll("#panel_not" + idx + " .object-count-range-btn").forEach(button => {
      const active = button.dataset.range === range;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    enableCanvas(idx, false);
    if (query.qbe) {
      renderSceneImage(idx, query.qbe);
      if (!query.qbe.startsWith("data:")) setValue("sceneImageUrl", query.qbe);
    }
    // Recreate the occupied grid cells, preserving the exact object query.
    (query.object_pos || "").split(/\s+/).filter(Boolean).forEach(token => {
      const match = token.match(/^(\d+)([a-z])(.+)$/);
      if (!match) return;
      const shape = new fabric.Rect({ left: (match[2].charCodeAt(0) - 97) * cellWidth + 1,
        top: Number(match[1]) * cellHeight + 1, width: cellWidth - 2, height: cellHeight - 2,
        fill: "rgba(170, 137, 80, 0.18)", stroke: "#92744b", strokeWidth: 1, uuid: generateUUID() });
      canvases[idx].add(shape);
      shape.setCoords();
      const label = document.createElement("span");
      label.id = shape.uuid;
      label.title = match[3];
      label.textContent = match[3];
      label.className = "history-object-label";
      label.style.left = shape.left + "px";
      label.style.top = shape.top + "px";
      canvases[idx].wrapperEl.appendChild(label);
    });
    canvases[idx].renderAll();
    const kind = query.vf ? "vf" : query.comboVisualSim ? "comboVisualSim" : null;
    if (kind) {
      const reference = document.createElement("button");
      reference.type = "button";
      reference.id = "historyReference" + idx;
      reference.className = "history-reference";
      reference.dataset.kind = kind;
      reference.dataset.value = query[kind];
      reference.textContent = "Similar to " + query[kind] + " ×";
      reference.title = "Remove visual similarity reference";
      reference.addEventListener("click", () => reference.remove());
      document.getElementById("canvasTab" + idx).appendChild(reference);
    }
    const visible = { image: query.qbe, ocr: query.ocr, asr: query.asr, tags: query.tags?.length,
      not: query.object_count?.length, objects: query.object_pos };
    sceneChannels.forEach(([channel]) => setSceneChannel(idx, channel, Boolean(visible[channel])));
    const clear = document.getElementById("cancelText" + idx);
    if (clear) clear.style.display = query.textual ? "" : "none";
  });
  videoType = payload.video_type || "all";
  const select = document.getElementById("videoTypeSelect");
  if (![...select.options].some(option => option.value === videoType)) select.add(new Option(videoType, videoType));
  select.value = videoType;
  select.dispatchEvent(new Event("change"));
  setTopK(payload.k, false);
  numResultsPerVideo = payload.n_frames_per_round || numResultsPerVideo;
  rearrange = Boolean(payload.rearrange);
  document.getElementById("rearrangeToggle").setAttribute("aria-pressed", String(rearrange));
  activeCanvasIdx = 0;
  activeCanvas = canvases[0];
  document.getElementById("searchHistory").open = false;
  document.getElementById("textual0").focus();
}
