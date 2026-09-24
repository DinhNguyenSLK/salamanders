(function () {
  "use strict";

  const records = new Map();
  const editedPayloads = new Map();
  const separator = "\u001e";
  let serviceUrl = "";
  let socket = null;
  let reconnectTimer = null;
  let reconnectDelay = 1000;
  let memberInfo = null;
  let clearing = false;
  const submittedDefaultWidth = 220;
  const submittedMinWidth = 190;
  const submittedMaxWidth = 520;

  function maxSubmittedWidth() {
    const searchSidebar = document.getElementById("searchSidebar");
    const searchWidth = searchSidebar ? searchSidebar.getBoundingClientRect().width : 280;
    return Math.max(
      submittedMinWidth,
      Math.min(submittedMaxWidth, window.innerWidth - searchWidth - 360),
    );
  }

  function clampSubmittedWidth(value) {
    const numeric = value === null || value === "" ? submittedDefaultWidth : Number(value);
    const width = Number.isFinite(numeric) ? numeric : submittedDefaultWidth;
    return Math.round(Math.min(maxSubmittedWidth(), Math.max(submittedMinWidth, width)));
  }

  function savedSubmittedWidth() {
    return clampSubmittedWidth(localStorage.getItem("submittedSidebarWidth"));
  }

  function setSubmittedWidth(value, persist) {
    const width = clampSubmittedWidth(value);
    const sidebar = document.getElementById("submitted_bar");
    const handle = document.getElementById("submittedResizeHandle");
    if (sidebar) {
      sidebar.style.width = width + "px";
      sidebar.style.minWidth = width + "px";
      sidebar.style.maxWidth = width + "px";
    }
    if (handle) handle.setAttribute("aria-valuenow", String(width));
    if (persist) localStorage.setItem("submittedSidebarWidth", String(width));
    return width;
  }

  function initSubmittedResizer() {
    const handle = document.getElementById("submittedResizeHandle");
    const sidebar = document.getElementById("submitted_bar");
    const body = document.querySelector(".bodyGrid");
    if (!handle || !sidebar || !body || handle.dataset.bound === "1") return;
    handle.dataset.bound = "1";
    let dragging = false;
    let rightEdge = 0;
    let currentWidth = setSubmittedWidth(savedSubmittedWidth(), false);

    function resizeFromPointer(event) {
      currentWidth = setSubmittedWidth(rightEdge - event.clientX, false);
    }

    function finishResize(event) {
      if (!dragging) return;
      dragging = false;
      body.classList.remove("submitted-sidebar-resizing");
      setSubmittedWidth(currentWidth, true);
      if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    }

    handle.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      rightEdge = sidebar.getBoundingClientRect().right;
      body.classList.add("submitted-sidebar-resizing");
      handle.setPointerCapture(event.pointerId);
      resizeFromPointer(event);
    });
    handle.addEventListener("pointermove", function (event) {
      if (dragging) resizeFromPointer(event);
    });
    handle.addEventListener("pointerup", finishResize);
    handle.addEventListener("pointercancel", finishResize);
    handle.addEventListener("dblclick", function () {
      currentWidth = setSubmittedWidth(submittedDefaultWidth, true);
    });
    handle.addEventListener("keydown", function (event) {
      let next = savedSubmittedWidth();
      if (event.key === "ArrowLeft") next += 20;
      else if (event.key === "ArrowRight") next -= 20;
      else if (event.key === "Home") next = submittedMinWidth;
      else if (event.key === "End") next = maxSubmittedWidth();
      else return;
      event.preventDefault();
      currentWidth = setSubmittedWidth(next, true);
    });
    window.addEventListener("resize", function () {
      currentWidth = setSubmittedWidth(savedSubmittedWidth(), false);
    });
  }

  function queueVisible() {
    const task = localStorage.getItem("taskType");
    return task === "kis" || task === "qa";
  }

  function setStatus(message) {
    const node = document.getElementById("hostQueueStatus");
    if (node) node.textContent = message;
  }

  async function request(path, options) {
    const response = await fetch(serviceUrl + "/host-submissions" + path, options);
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch (_) { body = { detail: text }; }
    if (!response.ok) {
      const detail = body.detail || body.error || "HTTP " + response.status;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    return body;
  }

  function createText(tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value == null ? "" : String(value);
    return element;
  }

  function defaultDresPayload(item) {
    let answer;
    if (String(item.taskType).toLowerCase() === "qa") {
      answer = {
        text: String(item.answer || "").trim() + "-" + item.videoId + "-" + item.timestampMs,
      };
    } else {
      answer = {
        mediaItemName: item.videoId,
        start: item.startMs,
        end: item.endMs,
      };
    }
    return { answerSets: [{ answers: [answer] }] };
  }

  function payloadFor(item) {
    return editedPayloads.has(item.id) ? editedPayloads.get(item.id) : defaultDresPayload(item);
  }

  function editDresPayload(item) {
    const modal = document.getElementById("editDresPayloadModal");
    const textarea = document.getElementById("editDresPayloadText");
    const errorNode = document.getElementById("editDresPayloadError");
    const saveButton = document.getElementById("editDresPayloadSave");
    if (!modal || !textarea || !errorNode || !saveButton) return Promise.resolve(false);

    textarea.value = JSON.stringify(payloadFor(item), null, 2);
    errorNode.textContent = "";
    modal.hidden = false;
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    return new Promise(function (resolve) {
      let finished = false;
      function finish(saved) {
        if (finished) return;
        finished = true;
        modal.hidden = true;
        modal.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKeyDown);
        saveButton.removeEventListener("click", onSave);
        resolve(saved);
      }
      function onSave() {
        let parsed;
        try {
          parsed = JSON.parse(textarea.value);
        } catch (error) {
          errorNode.textContent = "Invalid JSON: " + error.message;
          textarea.focus();
          return;
        }
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          errorNode.textContent = "The DRES payload must be a JSON object.";
          textarea.focus();
          return;
        }
        editedPayloads.set(item.id, parsed);
        finish(true);
      }
      function onClick(event) {
        if (event.target === modal || event.target.closest("[data-payload-cancel]")) finish(false);
      }
      function onKeyDown(event) {
        if (event.key === "Escape") finish(false);
        else if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onSave();
      }
      modal.addEventListener("click", onClick);
      document.addEventListener("keydown", onKeyDown);
      saveButton.addEventListener("click", onSave);
    });
  }

  function render() {
    const sidebar = document.getElementById("submitted_bar");
    const panel = document.getElementById("hostQueuePanel");
    const avsPanel = document.getElementById("avsSubmittedTab");
    if (!panel || !sidebar) return;
    const visible = queueVisible();
    panel.hidden = !visible;
    if (avsPanel) avsPanel.hidden = visible;
    if (!visible) return;
    sidebar.style.display = "block";
    const items = Array.from(records.values()).sort(function (a, b) {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    const count = document.getElementById("submitted_num");
    if (count) count.textContent = String(items.length);
    const clearButton = document.getElementById("hostQueueClear");
    if (clearButton) clearButton.hidden = !(visible && memberInfo?.isAdmin && items.length);
    const list = document.getElementById("hostQueueList");
    list.replaceChildren();
    if (!items.length) {
      list.appendChild(createText("p", "host-queue-empty", "No answers on the host yet."));
      return;
    }
    items.forEach(function (item) {
      const card = createText("article", "host-queue-item", "");
      card.appendChild(createText("strong", "", item.fileName || item.taskType.toUpperCase()));
      card.appendChild(createText("div", "", item.videoId + " · " + (item.frameId || item.imageId)));
      card.appendChild(createText("div", "host-queue-submitter", item.createdBy));
      if (item.answer) card.appendChild(createText("div", "", "Answer: " + item.answer));
      if (item.hasImage) {
        const image = document.createElement("img");
        image.loading = "lazy";
        image.alt = item.frameId || item.videoId;
        image.src = serviceUrl + "/host-submissions/" + encodeURIComponent(item.id) + "/image";
        card.appendChild(image);
      }
      if (item.status === "pending" || item.status === "failed") {
        const actions = createText("div", "host-queue-actions", "");
        const button = createText("button", "host-queue-submit", "Submit to DRES");
        button.type = "button";
        button.addEventListener("click", function () { submitToDres(item, button); });
        const editButton = createText(
          "button",
          "host-queue-edit" + (editedPayloads.has(item.id) ? " is-edited" : ""),
          editedPayloads.has(item.id) ? "Edit ✓" : "Edit",
        );
        editButton.type = "button";
        editButton.addEventListener("click", async function () {
          if (await editDresPayload(item)) render();
        });
        actions.appendChild(button);
        actions.appendChild(editButton);
        card.appendChild(actions);
      }
      list.appendChild(card);
    });
  }

  async function refresh() {
    if (!serviceUrl) return;
    try {
      const items = await request("");
      records.clear();
      items.forEach(function (item) { records.set(item.id, item); });
      render();
      setStatus("Live host queue");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function submitToDres(item, button) {
    if (!confirm("Submit " + item.fileName + " to DRES now?")) return;
    button.disabled = true;
    button.textContent = "Submitting...";
    try {
      const options = {
        method: "POST",
      };
      if (editedPayloads.has(item.id)) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ dres_payload: editedPayloads.get(item.id) });
      }
      const result = await request("/" + encodeURIComponent(item.id) + "/submit-dres", options);
      const saved = result.submission;
      if (saved) records.set(saved.id, saved);
      if (saved && saved.status === "submitted") editedPayloads.delete(saved.id);
      render();
      window.showKISServerResponse(
        saved && saved.status === "submitted" ? "DRES accepted" : "DRES response",
        "Status: " + (saved ? saved.status : "unknown") + "\n" + (result.dres_response || ""),
        !saved || saved.status !== "submitted",
      );
    } catch (error) {
      await refresh();
      window.showKISServerResponse("DRES submit needs review", error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  function confirmClearAll(count) {
    const modal = document.getElementById("clearSubmissionsModal");
    const message = document.getElementById("clearSubmissionsMessage");
    const confirmButton = document.getElementById("clearSubmissionsConfirm");
    if (!modal || !message || !confirmButton) return Promise.resolve(false);
    message.textContent = "Clear all " + count + " submitted answers for the whole team?";
    modal.hidden = false;
    confirmButton.focus();
    return new Promise(function (resolve) {
      let finished = false;
      function finish(confirmed) {
        if (finished) return;
        finished = true;
        modal.hidden = true;
        modal.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKeyDown);
        resolve(confirmed);
      }
      function onClick(event) {
        if (event.target === modal || event.target.closest("[data-clear-cancel]")) finish(false);
        else if (event.target.closest("[data-clear-confirm]")) finish(true);
      }
      function onKeyDown(event) {
        if (event.key === "Escape") finish(false);
        else if (event.key === "Enter") finish(true);
      }
      modal.addEventListener("click", onClick);
      document.addEventListener("keydown", onKeyDown);
    });
  }

  async function clearAll() {
    if (clearing || !memberInfo?.isAdmin || !records.size) return;
    if (!await confirmClearAll(records.size)) return;
    clearing = true;
    const button = document.getElementById("hostQueueClear");
    if (button) button.disabled = true;
    try {
      const result = await request("", { method: "DELETE" });
      records.clear();
      editedPayloads.clear();
      render();
      setStatus("Cleared " + result.deleted + " submissions");
    } catch (error) {
      await refresh();
      window.showKISServerResponse("Cannot clear submissions", error.message, true);
    } finally {
      clearing = false;
      if (button) button.disabled = false;
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    setStatus("Realtime disconnected; reconnecting...");
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      connectRealtime();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }

  async function connectRealtime() {
    try {
      const ticket = await request("/realtime-ticket");
      const url = new URL(ticket.hubUrl);
      url.searchParams.set("access_token", ticket.token);
      socket = new WebSocket(url.href);
      socket.onopen = function () {
        reconnectDelay = 1000;
        socket.send(JSON.stringify({ protocol: "json", version: 1 }) + separator);
      };
      socket.onmessage = function (event) {
        String(event.data).split(separator).filter(Boolean).forEach(function (part) {
          let message;
          try { message = JSON.parse(part); } catch (_) { return; }
          if (message.type === 1 && message.target === "ready") {
            refresh();
          } else if (message.type === 1 && message.target === "submissionChanged") {
            const item = message.arguments?.[0]?.submission;
            if (item && (!records.has(item.id) || records.get(item.id).version <= item.version)) {
              records.set(item.id, item);
              render();
            }
          } else if (message.type === 1 && message.target === "submissionsCleared") {
            records.clear();
            editedPayloads.clear();
            render();
            setStatus("Live host queue");
          } else if (message.type === 7) {
            socket.close();
          }
        });
      };
      socket.onerror = function () { socket.close(); };
      socket.onclose = scheduleReconnect;
    } catch (error) {
      setStatus(error.message);
      scheduleReconnect();
    }
  }

  window.refreshHostQueue = refresh;
  window.initHostQueue = async function () {
    const response = await fetch("js/conf.json", { cache: "no-store" });
    const config = await response.json();
    serviceUrl = String(config.serviceUrl || "").trim().replace(/\/$/, "");
    if (!serviceUrl) throw new Error("serviceUrl is not configured");
    initSubmittedResizer();
    memberInfo = await request("/me");
    const clearButton = document.getElementById("hostQueueClear");
    if (clearButton) clearButton.addEventListener("click", clearAll);
    render();
    await refresh();
    connectRealtime();
    setInterval(refresh, 15000);
    window.addEventListener("storage", function (event) {
      if (event.key === "taskType") render();
    });
  };
})();
