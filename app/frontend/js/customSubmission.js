(function () {
  "use strict";

  const MAX_ZIP_BYTES = 5 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 500;
  const MAX_QUERY_BYTES = 256 * 1024;
  const MAX_TOTAL_QUERY_BYTES = 2 * 1024 * 1024;

  const originalOpenSubmitSettings = window.openSubmitSettings;

  // Uploaded queries live only until this page is reloaded.
  let queries = [];
  let zipName = "";
  let zipIsLoading = false;
  let selectedKisQueryName = "";
  let crc32Table = null;

  function ensureSettingsUi() {
    if (document.getElementById("customQueryZip")) return;
    let modal = document.getElementById("submitSettingsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "submitSettingsModal";
      modal.className = "submit-settings-modal";
      modal.hidden = true;
      modal.innerHTML = '<div class="submit-settings-card"><div class="submit-settings-header">Query ZIP</div><div class="submit-settings-actions"><button type="button" onclick="closeSubmitSettings()">Close</button></div></div>';
      document.body.appendChild(modal);
    }
    const actions = modal.querySelector(".submit-settings-actions");
    const settings = document.createElement("div");
    settings.className = "custom-submit-settings";
    settings.innerHTML = '<label>Query ZIP<input id="customQueryZip" type="file" accept=".zip,application/zip,application/x-zip-compressed"></label><p id="customQueryZipStatus" class="custom-query-zip-status" aria-live="polite"></p><label id="customKisQueryLabel" hidden>KIS query<select id="customKisQuerySelect" class="custom-query-select"></select></label>';
    actions.insertAdjacentElement("beforebegin", settings);
    document.getElementById("customQueryZip").addEventListener("change", handleZipSelection);
    document.getElementById("customKisQuerySelect").addEventListener("change", function (event) {
      selectedKisQueryName = event.target.value;
    });
  }

  function setZipStatus(message, state) {
    const status = document.getElementById("customQueryZipStatus");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function renderZipStatus() {
    const kisQueries = queries.filter(function (query) { return query.query_type === "kis"; });
    const kisSelect = document.getElementById("customKisQuerySelect");
    const kisLabel = document.getElementById("customKisQueryLabel");
    kisSelect.replaceChildren();
    kisQueries.forEach(function (query) {
      const option = document.createElement("option");
      option.value = query.file_name;
      option.textContent = query.file_name + " - " + query.query_content.replace(/\s+/g, " ");
      kisSelect.appendChild(option);
    });
    if (!kisQueries.some(function (query) { return query.file_name === selectedKisQueryName; })) {
      selectedKisQueryName = kisQueries.length ? kisQueries[0].file_name : "";
    }
    kisSelect.value = selectedKisQueryName;
    kisLabel.hidden = kisQueries.length < 2;
    if (!queries.length) {
      setZipStatus("Choose a ZIP containing *-kis.txt and/or *-qa.txt files.", "");
      return;
    }
    const kisCount = queries.filter(function (query) {
      return query.query_type === "kis";
    }).length;
    const qaCount = queries.filter(function (query) {
      return query.query_type === "qa";
    }).length;
    setZipStatus(
      (zipName || "Query ZIP") + ": loaded " + kisCount + " KIS and " + qaCount + " QA queries.",
      "success",
    );
  }

  window.openSubmitSettings = function () {
    ensureSettingsUi();
    originalOpenSubmitSettings.apply(this, arguments);
    if (!zipIsLoading) renderZipStatus();
  };

  // Child windows can use the main tab's in-memory ZIP without moving dialogs.
  window.getHostSubmissionQueries = function () { return queries.slice(); };
  window.getHostKisQuery = function () {
    return queries.find(function (query) { return query.query_type === "kis" && query.file_name === selectedKisQueryName; }) ||
      queries.find(function (query) { return query.query_type === "kis"; });
  };
  window.isHostSubmissionZipLoading = function () { return zipIsLoading; };
  function querySource() {
    if (queries.length || zipIsLoading) return window;
    try {
      const parent = window.opener;
      if (parent && !parent.closed && typeof parent.getHostSubmissionQueries === "function") return parent;
    } catch (_) {}
    return window;
  }

  async function handleZipSelection(event) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;
    queries = [];
    zipName = "";
    selectedKisQueryName = "";
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setZipStatus("Only .zip files are accepted.", "error");
      input.value = "";
      return;
    }

    zipIsLoading = true;
    input.disabled = true;
    setZipStatus("Reading and validating " + file.name + "...", "");
    try {
      const parsed = await parseQueryZip(file);
      queries = parsed.queries;
      zipName = file.name;
      renderZipStatus();
    } catch (error) {
      console.error("CUSTOM query ZIP failed:", error);
      setZipStatus(error.message || "Cannot read the ZIP file.", "error");
      input.value = "";
    } finally {
      zipIsLoading = false;
      input.disabled = false;
    }
  }

  function findEndOfCentralDirectory(view) {
    const minimumOffset = Math.max(0, view.byteLength - 65557);
    for (let offset = view.byteLength - 22; offset >= minimumOffset; offset--) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    return -1;
  }

  function calculateCrc32(bytes) {
    if (!crc32Table) {
      crc32Table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let value = i;
        for (let bit = 0; bit < 8; bit++) {
          value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }
        crc32Table[i] = value >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function decompressEntry(compressedBytes, compressionMethod) {
    if (compressionMethod === 0) return new Uint8Array(compressedBytes);
    if (compressionMethod !== 8) {
      throw new Error("Unsupported ZIP compression method: " + compressionMethod);
    }
    if (typeof DecompressionStream !== "function") {
      throw new Error("This browser cannot decompress ZIP files. Use a current Chrome or Edge version.");
    }
    try {
      const stream = new Blob([compressedBytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (error) {
      throw new Error("Cannot decompress a query file in the ZIP archive.");
    }
  }

  async function parseQueryZip(file) {
    if (!file.size) throw new Error("The ZIP file is empty.");
    if (file.size > MAX_ZIP_BYTES) throw new Error("The ZIP file exceeds the 5 MB limit.");

    const archiveBytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(
      archiveBytes.buffer,
      archiveBytes.byteOffset,
      archiveBytes.byteLength,
    );
    const endOffset = findEndOfCentralDirectory(view);
    if (endOffset < 0) throw new Error("The selected file is not a valid ZIP archive.");

    const diskNumber = view.getUint16(endOffset + 4, true);
    const centralDirectoryDisk = view.getUint16(endOffset + 6, true);
    const entriesOnDisk = view.getUint16(endOffset + 8, true);
    const entryCount = view.getUint16(endOffset + 10, true);
    const centralDirectorySize = view.getUint32(endOffset + 12, true);
    const centralDirectoryOffset = view.getUint32(endOffset + 16, true);
    if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== entryCount) {
      throw new Error("Multi-volume ZIP archives are not supported.");
    }
    if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff) {
      throw new Error("ZIP64 archives are not supported.");
    }
    if (entryCount > MAX_ZIP_ENTRIES) {
      throw new Error("The ZIP archive contains too many entries.");
    }
    if (centralDirectoryOffset + centralDirectorySize > archiveBytes.length) {
      throw new Error("The ZIP central directory is invalid.");
    }

    const queries = [];
    const seenFileNames = new Set();
    const nameDecoder = new TextDecoder("utf-8");
    const contentDecoder = new TextDecoder("utf-8", { fatal: true });
    let totalQueryBytes = 0;
    let centralOffset = centralDirectoryOffset;

    for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
      if (centralOffset + 46 > archiveBytes.length || view.getUint32(centralOffset, true) !== 0x02014b50) {
        throw new Error("The ZIP central directory is invalid.");
      }
      const flags = view.getUint16(centralOffset + 8, true);
      const compressionMethod = view.getUint16(centralOffset + 10, true);
      const expectedCrc32 = view.getUint32(centralOffset + 16, true);
      const compressedSize = view.getUint32(centralOffset + 20, true);
      const uncompressedSize = view.getUint32(centralOffset + 24, true);
      const fileNameLength = view.getUint16(centralOffset + 28, true);
      const extraLength = view.getUint16(centralOffset + 30, true);
      const commentLength = view.getUint16(centralOffset + 32, true);
      const localHeaderOffset = view.getUint32(centralOffset + 42, true);
      const recordEnd = centralOffset + 46 + fileNameLength + extraLength + commentLength;
      if (recordEnd > archiveBytes.length) throw new Error("The ZIP entry metadata is invalid.");

      const archiveName = nameDecoder.decode(
        archiveBytes.subarray(centralOffset + 46, centralOffset + 46 + fileNameLength),
      );
      centralOffset = recordEnd;
      const baseName = archiveName.replace(/\\/g, "/").split("/").pop();
      const nameMatch = baseName.match(
        /^([A-Za-z0-9][A-Za-z0-9._-]{0,254})-(kis|qa)\.txt$/i,
      );
      if (!nameMatch) continue;
      if (flags & 0x1) throw new Error("Encrypted query files are not supported: " + baseName);
      if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
        throw new Error("ZIP64 query entries are not supported: " + baseName);
      }
      if (uncompressedSize > MAX_QUERY_BYTES) {
        throw new Error("Query file exceeds the 256 KB limit: " + baseName);
      }
      totalQueryBytes += uncompressedSize;
      if (totalQueryBytes > MAX_TOTAL_QUERY_BYTES) {
        throw new Error("The query files exceed the 2 MB total limit.");
      }
      if (localHeaderOffset + 30 > archiveBytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        throw new Error("Invalid local ZIP header for " + baseName);
      }

      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataOffset + compressedSize;
      if (dataEnd > archiveBytes.length) throw new Error("Truncated ZIP data for " + baseName);

      const queryBytes = await decompressEntry(
        archiveBytes.subarray(dataOffset, dataEnd),
        compressionMethod,
      );
      if (queryBytes.length !== uncompressedSize) {
        throw new Error("Unexpected uncompressed size for " + baseName);
      }
      if (calculateCrc32(queryBytes) !== expectedCrc32) {
        throw new Error("CRC check failed for " + baseName);
      }

      let queryContent;
      try {
        queryContent = contentDecoder.decode(queryBytes).replace(/^\uFEFF/, "").trim();
      } catch (error) {
        throw new Error("Query file is not UTF-8: " + baseName);
      }
      if (!queryContent) throw new Error("Query file is empty: " + baseName);

      const queryType = nameMatch[2].toLowerCase();
      const fileName = nameMatch[1] + "-" + queryType;
      if (seenFileNames.has(fileName.toLowerCase())) {
        throw new Error("Duplicate query file: " + fileName);
      }
      seenFileNames.add(fileName.toLowerCase());
      queries.push({
        file_name: fileName,
        query_content: queryContent,
        query_type: queryType,
      });
    }

    if (!queries.length) {
      throw new Error("The ZIP archive contains no *-kis.txt or *-qa.txt query files.");
    }
    queries.sort(function (left, right) {
      return left.file_name.localeCompare(right.file_name, undefined, { numeric: true });
    });
    return { queries: queries };
  }

  function getNumericImageId(frameId) {
    const match = String(frameId || "").match(/(?:^|-)(\d+)(?:\.[^.]+)?$/);
    if (!match) throw new Error("Cannot determine numeric image ID from frame " + frameId);
    const imageId = Number(match[1]);
    if (!Number.isSafeInteger(imageId) || imageId < 0) {
      throw new Error("Invalid image ID in frame " + frameId);
    }
    return imageId;
  }

  function askCustomAnswer(queryType, videoId, frameId, sourceQueries) {
    const availableQueries = sourceQueries.filter(function (query) {
      return query.query_type === queryType;
    });
    if (!availableQueries.length) {
      alert("The uploaded ZIP contains no " + queryType.toUpperCase() + " queries.");
      window.openSubmitSettings();
      const error = new Error("No " + queryType.toUpperCase() + " query is available");
      error.cancelled = true;
      return Promise.reject(error);
    }

    return new Promise(function (resolve, reject) {
      let modal = document.getElementById("customSubmissionModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "customSubmissionModal";
        modal.className = "submit-settings-modal kis-submit-confirm-modal";
        modal.innerHTML =
          '<div class="submit-settings-card kis-submit-confirm-card qa-answer-card">' +
          '<div class="submit-settings-header"><span id="customSubmissionTitle"></span><button type="button" class="submit-settings-close" data-custom-cancel>&times;</button></div>' +
          '<div id="customSubmissionContext" class="qa-answer-context"></div>' +
          '<label>Query<select id="customQuerySelect" class="custom-query-select"></select></label>' +
          '<pre id="customQueryPreview" class="custom-query-preview"></pre>' +
          '<div id="customAnswerField" class="custom-answer-field"><label>Answer<textarea id="customAnswerInput" rows="4" placeholder="Type your answer..."></textarea></label></div>' +
          '<div class="submit-settings-actions"><button type="button" data-custom-cancel>Cancel</button><button type="button" class="submit-settings-save" data-custom-submit>Submit</button></div>' +
          '</div>';
        document.body.appendChild(modal);
      }

      const select = document.getElementById("customQuerySelect");
      const preview = document.getElementById("customQueryPreview");
      const answerField = document.getElementById("customAnswerField");
      const answerInput = document.getElementById("customAnswerInput");
      select.replaceChildren();
      availableQueries.forEach(function (query, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = query.file_name + " - " + query.query_content.replace(/\s+/g, " ");
        select.appendChild(option);
      });

      function updatePreview() {
        const selectedQuery = availableQueries[Number(select.value) || 0];
        preview.textContent = selectedQuery ? selectedQuery.query_content : "";
      }

      select.onchange = updatePreview;
      updatePreview();
      document.getElementById("customSubmissionTitle").textContent =
        "Save " + queryType.toUpperCase() + " on host";
      document.getElementById("customSubmissionContext").textContent =
        videoId + " - frame " + frameId;
      answerField.hidden = queryType !== "qa";
      answerInput.value = "";
      modal.hidden = false;

      $(modal).off("click.customSubmission").on("click.customSubmission", function (event) {
        if (event.target === modal || $(event.target).is("[data-custom-cancel]")) {
          modal.hidden = true;
          const error = new Error("CUSTOM submission cancelled");
          error.cancelled = true;
          reject(error);
          return;
        }
        if (!$(event.target).is("[data-custom-submit]")) return;

        const selectedQuery = availableQueries[Number(select.value) || 0];
        const answer = answerInput.value.trim();
        if (!selectedQuery) {
          alert("Please select a query.");
          return;
        }
        if (queryType === "qa" && !answer) {
          alert("Please enter an answer.");
          answerInput.focus();
          return;
        }
        modal.hidden = true;
        resolve({ query: selectedQuery, answer: queryType === "qa" ? answer : null });
      });
    });
  }

  const pendingFrames = new Map();

  async function saveToHost(frameId, videoId, taskType) {
    const source = querySource();
    if (source.isHostSubmissionZipLoading()) throw new Error("Wait for the query ZIP to finish loading.");
    const sourceQueries = source.getHostSubmissionQueries();
    const timestampMs = window.getFrameTimestampMs(frameId, videoId);
    let selection;
    if (!sourceQueries.length) {
      selection = { query: { file_name: "manual-" + taskType, query_content: "" },
        answer: taskType === "qa" ? await window.askQAAnswer(videoId, timestampMs) : null };
    } else if (taskType === "kis" && sourceQueries.some(function (query) { return query.query_type === "kis"; })) {
      const query = typeof source.getHostKisQuery === "function"
        ? source.getHostKisQuery()
        : sourceQueries.find(function (entry) { return entry.query_type === "kis"; });
      selection = { query: query, answer: null };
    } else {
      selection = await askCustomAnswer(taskType, videoId, frameId, sourceQueries);
    }
    const payload = {
      file_name: selection.query.file_name,
      query_content: selection.query.query_content,
      img_id: getNumericImageId(frameId), video_id: videoId, frame_id: frameId,
    };
    if (taskType === "qa") {
      payload.timestamp_ms = timestampMs;
      payload.answer = selection.answer;
    } else {
      payload.start_ms = timestampMs;
      payload.end_ms = timestampMs;
    }
    const configResponse = await fetch("js/conf.json?v=" + Date.now(), { cache: "no-store" });
    if (!configResponse.ok) throw new Error("Cannot load js/conf.json: HTTP " + configResponse.status);
    const runtime = await configResponse.json();
    const backend = String(runtime.serviceUrl || "").trim().replace(/\/$/, "");
    if (!backend) throw new Error("serviceUrl is missing from js/conf.json");
    const key = window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2);
    window.showKISServerResponse("Sending to shared host", "Saving the selected answer...", false);
    const response = await fetch(backend + "/host-submissions", {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key },
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
    if (taskType !== "kis" && taskType !== "qa") return Promise.reject(new Error("Select KIS or QA to save on host."));
    const key = JSON.stringify([taskType, videoId, frameId]);
    if (pendingFrames.has(key)) return pendingFrames.get(key);
    const request = saveToHost(frameId, videoId, taskType).finally(function () { pendingFrames.delete(key); });
    pendingFrames.set(key, request);
    return request;
  };
})();
