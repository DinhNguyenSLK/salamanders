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
  let initialized = false;
  let refreshing = false;
  let revision = 0;
  let realtimeReady = false;
  let pingTimer = null;
  const sending = new Set();
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
        text: "QA-" + String(item.answer || "").trim() + "-" + item.videoId + "-" + item.timestampMs,
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

  async function copyPayloadText(text) {
    if (window.isSecureContext && window.navigator?.clipboard?.writeText) {
      try {
        await window.navigator.clipboard.writeText(text);
        return;
      } catch (_) {
        // Some browsers block the Clipboard API but still allow selection copying.
      }
    }
    const previousFocus = document.activeElement;
    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;";
    document.body.appendChild(field);
    try {
      field.focus();
      field.select();
      if (!document.execCommand("copy")) throw new Error("The browser denied clipboard access.");
    } finally {
      field.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }
  }

  async function copyDresPayload(item, button) {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await copyPayloadText(JSON.stringify(payloadFor(item), null, 2));
      button.textContent = "Copied!";
      window.setTimeout(function () {
        if (button.isConnected) button.textContent = "Copy JSON";
      }, 1600);
    } catch (error) {
      window.showKISServerResponse("Cannot copy JSON", error.message, true);
    } finally {
      button.disabled = false;
    }
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
    const clearButton = document.getElementById("hostQueueClear");
    if (clearButton) clearButton.hidden = !(visible && memberInfo?.isAdmin && records.size);
    if (!visible) {
      const count = document.getElementById("submitted_num");
      if (count && typeof avsSubmitted !== "undefined") count.textContent = String(avsSubmitted.size);
      return;
    }
    sidebar.style.display = "block";
    const items = Array.from(records.values()).sort(function (a, b) {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    const count = document.getElementById("submitted_num");
    if (count) count.textContent = String(items.length);
    const list = document.getElementById("hostQueueList");
    list.replaceChildren();
    if (!items.length) {
      list.appendChild(createText("p", "host-queue-empty", "No answers on the host yet."));
      return;
    }
    items.forEach(function (item) {
      const card = createText("article", "host-queue-item", "");
      const frameId = String(item.frameId || item.imageId || "").replace(/\.(?:jpe?g|png|webp)$/i, "");
      const result = {
        videoId: item.videoId,
        imgId: frameId,
        frameName: frameId,
        videoUrl: (window.videoUrlPrefix || "") + item.videoId + ".mp4",
        thumb: item.hasImage ? serviceUrl + "/host-submissions/" + encodeURIComponent(item.id) + "/image" : "",
      };
      const meta = createText("div", "host-queue-meta", "");
      meta.title = (item.fileName || "") + " ? " + frameId + " ? " + item.status;
      meta.appendChild(createText("span", "host-queue-task", String(item.taskType || "").toLowerCase()));
      meta.appendChild(createText("span", "", " - "));
      const frameLink = createText("a", "host-queue-frame-id", frameId);
      frameLink.href = "indexedData.html?videoId=" + encodeURIComponent(item.videoId) + "&id=" + encodeURIComponent(frameId);
      frameLink.target = "_blank";
      frameLink.rel = "noopener";
      frameLink.title = "View image information: " + frameId;
      frameLink.addEventListener("click", function () { window.markResultLightboxItemAsViewed(result); });
      meta.appendChild(frameLink);
      meta.appendChild(createText("span", "", " - "));
      meta.appendChild(createText("span", "host-queue-item-status", item.status));
      card.appendChild(meta);
      const media = createText("div", "host-queue-media", "");
      const author = createText("span", "host-queue-submitter", item.createdBy);
      author.title = "Submitted by " + item.createdBy;
      if (item.hasImage) {
        const image = document.createElement("img");
        image.loading = "lazy";
        image.decoding = "async";
        image.alt = frameId || item.videoId;
        image.src = result.thumb;
        media.appendChild(image);
      }
      media.appendChild(author);
      const toolbar = createText("div", "host-queue-media-tools", "");
      function addMediaAction(label, iconClass, handler) {
        const action = createText("button", "host-queue-media-action", "");
        action.type = "button";
        action.title = label;
        action.setAttribute("aria-label", label);
        const icon = createText("i", "fas " + iconClass, "");
        icon.setAttribute("aria-hidden", "true");
        action.appendChild(icon);
        action.addEventListener("click", handler);
        toolbar.appendChild(action);
      }
      if (frameId && item.videoId) {
        addMediaAction("Nearly keyframes", "fa-th-large", function () { window.openNearbyKeyframes(result); });
        addMediaAction("Play video", "fa-play", function () { window.playVideoWindow(result.videoUrl, item.videoId, frameId); });
        addMediaAction("Image similarity", "fa-clone", function () {
          window.searchByLink(window.isAdvanced === false ? { comboVisualSim: frameId } : { vf: frameId });
        });
      }
      media.appendChild(toolbar);
      card.appendChild(media);
      if (item.answer) card.appendChild(createText("div", "host-queue-answer", "Answer: " + item.answer));
      if (item.status === "pending" || item.status === "failed") {
        const actions = createText("div", "host-queue-actions", "");
        const button = createText("button", "host-queue-submit", "Submit");
        button.type = "button";
        button.title = "Submit to DRES";
        button.disabled = sending.has(item.id);
        button.addEventListener("click", function () { submitToDres(item, button); });
        const editButton = createText(
          "button",
          "host-queue-edit" + (editedPayloads.has(item.id) ? " is-edited" : ""),
          editedPayloads.has(item.id) ? "Edit ✓" : "Edit",
        );
        editButton.type = "button";
        editButton.disabled = sending.has(item.id);
        editButton.addEventListener("click", async function () {
          if (await editDresPayload(item)) render();
        });
        actions.appendChild(button);
        actions.appendChild(editButton);
        const copyButton = createText("button", "host-queue-copy", "Copy JSON");
        copyButton.type = "button";
        copyButton.title = "Copy DRES JSON, including saved edits";
        copyButton.disabled = sending.has(item.id);
        copyButton.addEventListener("click", function () { return copyDresPayload(item, copyButton); });
        actions.appendChild(copyButton);
        card.appendChild(actions);
      }
      list.appendChild(card);
    });
  }

  async function refresh() {
    if (!serviceUrl || refreshing) return;
    refreshing = true;
    try {
      if (!memberInfo) memberInfo = await request("/me");
      const before = revision;
      const items = await request("");
      // A realtime/local change after this snapshot started is newer.
      if (before !== revision) return;
      records.clear();
      items.forEach(function (item) { records.set(item.id, item); });
      for (const id of editedPayloads.keys()) {
        if (!records.has(id) || records.get(id).status === "submitted") editedPayloads.delete(id);
      }
      render();
      setStatus(realtimeReady ? "Live host queue" : "Host queue refreshed; realtime reconnecting...");
    } catch (error) {
      setStatus(error.message);
    } finally {
      refreshing = false;
    }
  }

  async function submitToDres(item, button) {
    if (sending.has(item.id)) return;
    if (!confirm("Submit " + item.fileName + " to DRES now?")) return;
    sending.add(item.id);
    button.disabled = true;
    button.textContent = "Submitting...";
    render();
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
      revision++;
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
      sending.delete(item.id);
      button.disabled = false;
      render();
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
      revision++;
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
        clearInterval(pingTimer);
        pingTimer = setInterval(function () {
          if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 6 }) + separator);
        }, 15000);
      };
      socket.onmessage = function (event) {
        String(event.data).split(separator).filter(Boolean).forEach(function (part) {
          let message;
          try { message = JSON.parse(part); } catch (_) { return; }
          if (message.type === 1 && message.target === "ready") {
            realtimeReady = true;
            refresh();
          } else if (message.type === 1 && message.target === "submissionChanged") {
            const item = message.arguments?.[0]?.submission;
            if (item && (!records.has(item.id) || records.get(item.id).version <= item.version)) {
              revision++;
              records.set(item.id, item);
              render();
            }
          } else if (message.type === 1 && message.target === "submissionsCleared") {
            revision++;
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
      socket.onclose = function () {
        realtimeReady = false;
        clearInterval(pingTimer);
        scheduleReconnect();
      };
    } catch (error) {
      setStatus(error.message);
      scheduleReconnect();
    }
  }

  // Bind independently of host connectivity; collapsing also works for AVS.
  const submissionToggle = document.getElementById("submissionToggle");
  if (submissionToggle) {
    let collapsed = false;
    submissionToggle.addEventListener("click", function () {
      collapsed = !collapsed;
      document.getElementById("submitted_bar").setAttribute("data-collapsed", String(collapsed));
      submissionToggle.setAttribute("aria-expanded", String(!collapsed));
      const label = collapsed ? "Show submission panel" : "Hide submission panel";
      submissionToggle.setAttribute("aria-label", label);
      submissionToggle.title = label;
      submissionToggle.textContent = collapsed ? "\u2039" : "\u203a";
    });
  }

  window.refreshHostQueue = refresh;
  window.initHostQueue = async function () {
    if (initialized) return;
    const response = await fetch("js/conf.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load js/conf.json: HTTP " + response.status);
    const config = await response.json();
    serviceUrl = String(config.serviceUrl || "").trim().replace(/\/$/, "");
    if (!serviceUrl) throw new Error("serviceUrl is not configured");
    initialized = true;
    const clearButton = document.getElementById("hostQueueClear");
    if (clearButton) clearButton.addEventListener("click", clearAll);
    render();
    await refresh();
    connectRealtime();
    setInterval(refresh, 15000);
    window.addEventListener("storage", function (event) {
      if (event.key === "taskType") render();
    });
    window.addEventListener("submission-task-changed", render);
  };
})();
