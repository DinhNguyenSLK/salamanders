(function () {
  "use strict";

  const slots = ["", "", "", ""];
  let sending = false;

  function isTrake() { return localStorage.getItem("taskType") === "trake"; }
  function videoId() { return $.urlParam("videoid"); }
  function currentFrame() {
    if (!window.myPlayer && !window.youtubePlayer) throw new Error("Video is not ready yet.");
    const time = window.youtubeFallbackActive
      ? (window.youtubePlayer && window.youtubePlayer.getCurrentTime ? window.youtubePlayer.getCurrentTime() : window.currentSeekTime)
      : window.myPlayer.currentTime();
    return String(window.ffmpegFrameIndex(time, window.videoFps));
  }

  function unpadFrame(value) { return value.replace(/^0+(?=\d)/, ""); }

  function renderSlots() {
    const container = document.getElementById("trakeSlots");
    container.replaceChildren();
    slots.forEach(function (value, index) {
      const row = document.createElement("div");
      row.className = "trake-slot";
      const label = document.createElement("label");
      label.textContent = "Event " + (index + 1);
      label.htmlFor = "trakeFrame" + index;
      const input = document.createElement("input");
      input.id = label.htmlFor;
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]+";
      input.placeholder = "Frame ID (blank = 1)";
      input.value = value;
      input.addEventListener("input", function () { slots[index] = input.value.trim(); });
      const fill = document.createElement("button");
      fill.type = "button";
      fill.textContent = "Use current frame";
      fill.setAttribute("aria-label", "Use current frame for event " + (index + 1));
      fill.addEventListener("click", function () {
        try { slots[index] = currentFrame(); input.value = slots[index]; }
        catch (error) { showError(error.message); }
      });
      row.append(label, input, fill);
      if (index >= 4) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.setAttribute("aria-label", "Remove event " + (index + 1));
        remove.addEventListener("click", function () { slots.splice(index, 1); renderSlots(); });
        row.appendChild(remove);
      }
      container.appendChild(row);
    });
  }

  function showError(message) {
    document.getElementById("trakeError").textContent = message;
    document.getElementById("trakeConfirmError").textContent = message;
  }

  function validatePayload(payload) {
    const answers = payload && payload.answerSets;
    const answer = Array.isArray(answers) && answers.length === 1 && answers[0].answers;
    const text = Array.isArray(answer) && answer.length === 1 && answer[0].text;
    const prefix = "TR-" + videoId() + "-";
    if (typeof text !== "string" || !text.startsWith(prefix) || !/^(?:0|[1-9][0-9]*)(?:,(?:0|[1-9][0-9]*))*$/.test(text.slice(prefix.length))) {
      throw new Error("Expected unpadded frame IDs: TR-" + videoId() + "-3260,3766,...");
    }
  }

  function openConfirm() {
    if (!isTrake()) return;
    showError("");
    if (!videoId()) { showError("Missing video ID."); return; }
    if (slots.some(function (value) { return value !== "" && !/^[0-9]+$/.test(value); })) {
      showError("Enter a numeric frame ID or leave the event blank to use 1.");
      return;
    }
    slots.forEach(function (value, index) { slots[index] = unpadFrame(value || "1"); });
    renderSlots();
    const payload = { answerSets: [{ answers: [{ text: "TR-" + videoId() + "-" + slots.join(",") }] }] };
    document.getElementById("trakeJson").value = JSON.stringify(payload, null, 2);
    document.getElementById("trakeConfirm").hidden = false;
    document.getElementById("trakeJson").focus();
  }

  async function send() {
    if (sending || !isTrake()) return;
    let payload;
    try {
      payload = JSON.parse(document.getElementById("trakeJson").value);
      validatePayload(payload);
    } catch (error) { showError(error.message); return; }
    if (!window.urlVBSService) { showError("Backend configuration is not ready."); return; }
    sending = true;
    const button = document.getElementById("trakeSend");
    button.disabled = true;
    button.textContent = "Submitting...";
    showError("");
    try {
      const response = await fetch(window.urlVBSService.replace(/\/$/, "") + "/trake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId(), payload: payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.dres_response || result.detail || "HTTP " + response.status);
      document.getElementById("trakeConfirm").hidden = true;
      showKISServerResponse("DRES accepted", result.dres_response || "HTTP " + result.dres_http_status, false);
    } catch (error) { showError("DRES submission failed: " + error.message); }
    finally { sending = false; button.disabled = false; button.textContent = "Submit to DRES"; }
  }

  function syncTask() {
    const active = isTrake();
    document.getElementById("trakePanel").hidden = !active;
    document.getElementById("submit").hidden = active;
    if (!active) document.getElementById("trakeConfirm").hidden = true;
  }

  window.openTrakeConfirm = openConfirm;
  document.addEventListener("DOMContentLoaded", function () {
    renderSlots();
    document.getElementById("trakeAdd").addEventListener("click", function () { slots.push(""); renderSlots(); });
    document.getElementById("trakeSubmit").addEventListener("click", openConfirm);
    document.getElementById("trakeCancel").addEventListener("click", function () { if (!sending) document.getElementById("trakeConfirm").hidden = true; });
    document.getElementById("trakeSend").addEventListener("click", send);
    window.addEventListener("storage", function (event) { if (event.key === "taskType") syncTask(); });
    syncTask();
  });
})();
