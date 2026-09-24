(function () {
  "use strict";

  const originalSubmitVersion2 = window.submitVersion2;

  function numericImageId(frameId) {
    const match = String(frameId || "").match(/(?:^|-)(\d+)(?:\.[^.]+)?$/);
    if (!match) throw new Error("Cannot determine image ID from frame " + frameId);
    const value = Number(match[1]);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid frame ID " + frameId);
    return value;
  }

  function idempotencyKey() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  async function serviceUrl() {
    const response = await fetch("js/conf.json?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load js/conf.json: HTTP " + response.status);
    const config = await response.json();
    const value = String(config.serviceUrl || "").trim().replace(/\/$/, "");
    if (!value) throw new Error("serviceUrl is missing from js/conf.json");
    return value;
  }

  async function buildPayload(frameId, videoId, taskType) {
    const timestampMs = window.getFrameTimestampMs(frameId, videoId);
    const payload = {
      file_name: "manual-" + taskType,
      query_content: "",
      img_id: numericImageId(frameId),
      video_id: videoId,
      frame_id: frameId,
    };
    if (taskType === "qa") {
      payload.timestamp_ms = timestampMs;
      payload.answer = await window.askQAAnswer(videoId, timestampMs);
    } else {
      payload.start_ms = timestampMs;
      payload.end_ms = timestampMs;
    }
    return payload;
  }

  async function saveToHost(frameId, videoId, taskType) {
    const payload = await buildPayload(frameId, videoId, taskType);
    const backend = await serviceUrl();
    window.showKISServerResponse("Sending to shared host", "Saving the selected answer...", false);
    const response = await fetch(backend + "/host-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey() },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch (_) { body = { detail: text }; }
    if (!response.ok) {
      const detail = body.detail || body.error || "HTTP " + response.status;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    if (typeof window.refreshHostQueue === "function") await window.refreshHostQueue();
    return "Saved on host with status " + body.status + ".";
  }

  window.queueHostSubmissionFrame = function (frameId, videoId) {
    const taskType = localStorage.getItem("taskType");
    if (taskType !== "kis" && taskType !== "qa") {
      return Promise.reject(new Error("Shared host submission is only available for KIS and QA."));
    }
    return saveToHost(frameId, videoId, taskType);
  };

  window.submitVersion2 = function (selectedItem) {
    const taskType = localStorage.getItem("taskType");
    if (taskType !== "kis" && taskType !== "qa") return originalSubmitVersion2.apply(this, arguments);
    window.queueHostSubmissionFrame(selectedItem.imgId, selectedItem.videoId)
      .then(function (message) { window.showKISServerResponse("Saved on host", message, false); })
      .catch(function (error) {
        if (!error.cancelled) {
          console.error("Host submit failed:", error);
          window.showKISServerResponse("Host submission failed", error.message, true);
        }
      });
    return null;
  };
})();
