(function () {
  "use strict";

  const DRES_TYPE = "DRES";
  const CUSTOM_TYPE = "CUSTOM";
  const TYPE_STORAGE_KEY = "submissionType";
  const QUERY_STORAGE_KEY = "customSubmissionQueries";
  const ZIP_NAME_STORAGE_KEY = "customSubmissionZipName";
  const MAX_ZIP_BYTES = 5 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 500;
  const MAX_QUERY_BYTES = 256 * 1024;
  const MAX_TOTAL_QUERY_BYTES = 2 * 1024 * 1024;

  const originalOpenSubmitSettings = window.openSubmitSettings;
  const originalSaveSubmitSettings = window.saveSubmitSettings;
  const originalSubmitVersion2 = window.submitVersion2;

  let savedQueries = readSavedQueries();
  let savedZipName = readStoredValue(ZIP_NAME_STORAGE_KEY);
  let draftQueries = [];
  let draftZipName = "";
  let zipIsLoading = false;
  let crc32Table = null;

  if (savedQueries.length) persistSavedState();

  function readStoredValue(key) {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function readSavedQueries() {
    try {
      const serialized = localStorage.getItem(QUERY_STORAGE_KEY) ||
        sessionStorage.getItem(QUERY_STORAGE_KEY) || "[]";
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidQuery);
    } catch (error) {
      return [];
    }
  }

  function persistSavedState() {
    const serializedQueries = JSON.stringify(savedQueries);
    try {
      sessionStorage.setItem(QUERY_STORAGE_KEY, serializedQueries);
      sessionStorage.setItem(ZIP_NAME_STORAGE_KEY, savedZipName);
    } catch (error) {
      console.warn("Cannot persist CUSTOM queries in this tab:", error);
    }
    try {
      localStorage.setItem(QUERY_STORAGE_KEY, serializedQueries);
      localStorage.setItem(ZIP_NAME_STORAGE_KEY, savedZipName);
    } catch (error) {
      console.warn("Cannot persist CUSTOM queries for cross-tab use:", error);
    }
  }

  function isValidQuery(query) {
    return query &&
      typeof query.file_name === "string" &&
      typeof query.query_content === "string" &&
      (query.query_type === "kis" || query.query_type === "qa");
  }

  function getSubmissionType() {
    return localStorage.getItem(TYPE_STORAGE_KEY) === CUSTOM_TYPE
      ? CUSTOM_TYPE
      : DRES_TYPE;
  }

  function ensureSettingsUi() {
    if (document.getElementById("customSubmitTypeOptions")) return;

    const modal = document.getElementById("submitSettingsModal");
    const card = modal && modal.querySelector(".submit-settings-card");
    const header = card && card.querySelector(".submit-settings-header");
    const actions = card && card.querySelector(".submit-settings-actions");
    if (!card || !header || !actions) return;

    card.classList.add("custom-submit-settings-card");
    ["submitSessionId", "submitEvaluationId"].forEach(function (id) {
      const input = document.getElementById(id);
      const label = input && input.closest("label");
      if (label) label.classList.add("dres-submit-setting");
    });

    const typeOptions = document.createElement("fieldset");
    typeOptions.id = "customSubmitTypeOptions";
    typeOptions.className = "custom-submit-type-options";
    typeOptions.innerHTML =
      '<legend>Submission type</legend>' +
      '<label class="custom-submit-type-option"><input type="radio" name="submission-type" value="DRES"><span>DRES</span></label>' +
      '<label class="custom-submit-type-option"><input type="radio" name="submission-type" value="CUSTOM"><span>CUSTOM</span></label>';
    header.insertAdjacentElement("afterend", typeOptions);

    const customSettings = document.createElement("div");
    customSettings.id = "customSubmitSettings";
    customSettings.className = "custom-submit-settings";
    customSettings.hidden = true;
    customSettings.innerHTML =
      '<label>Query ZIP<input id="customQueryZip" type="file" accept=".zip,application/zip,application/x-zip-compressed"></label>' +
      '<p id="customQueryZipStatus" class="custom-query-zip-status" aria-live="polite"></p>';
    actions.insertAdjacentElement("beforebegin", customSettings);

    typeOptions.addEventListener("change", updateSettingsMode);
    document.getElementById("customQueryZip").addEventListener("change", handleZipSelection);
  }

  function updateSettingsMode() {
    const selected = document.querySelector('input[name="submission-type"]:checked');
    const type = selected ? selected.value : DRES_TYPE;
    const card = document.querySelector("#submitSettingsModal .submit-settings-card");
    const customSettings = document.getElementById("customSubmitSettings");
    if (card) card.dataset.submissionType = type;
    if (customSettings) customSettings.hidden = type !== CUSTOM_TYPE;
  }

  function setZipStatus(message, state) {
    const status = document.getElementById("customQueryZipStatus");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function renderZipStatus() {
    if (!draftQueries.length) {
      setZipStatus("Choose a ZIP containing *-kis.txt and/or *-qa.txt files.", "");
      return;
    }
    const kisCount = draftQueries.filter(function (query) {
      return query.query_type === "kis";
    }).length;
    const qaCount = draftQueries.filter(function (query) {
      return query.query_type === "qa";
    }).length;
    setZipStatus(
      (draftZipName || "Query ZIP") + ": loaded " + kisCount + " KIS and " + qaCount + " QA queries.",
      "success",
    );
  }

  window.openSubmitSettings = function () {
    const result = originalOpenSubmitSettings.apply(this, arguments);
    ensureSettingsUi();
    draftQueries = savedQueries.slice();
    draftZipName = savedZipName;
    zipIsLoading = false;

    const input = document.getElementById("customQueryZip");
    if (input) input.value = "";
    const type = getSubmissionType();
    const radio = document.querySelector('input[name="submission-type"][value="' + type + '"]');
    if (radio) radio.checked = true;
    updateSettingsMode();
    renderZipStatus();
    return result;
  };

  window.saveSubmitSettings = function () {
    const selected = document.querySelector('input[name="submission-type"]:checked');
    const type = selected ? selected.value : DRES_TYPE;
    if (type !== CUSTOM_TYPE) {
      localStorage.setItem(TYPE_STORAGE_KEY, DRES_TYPE);
      return originalSaveSubmitSettings.apply(this, arguments);
    }
    if (zipIsLoading) {
      setZipStatus("Wait for the ZIP file to finish loading.", "error");
      return;
    }
    if (!draftQueries.length) {
      setZipStatus("Upload a valid query ZIP before saving CUSTOM mode.", "error");
      return;
    }

    savedQueries = draftQueries.slice();
    savedZipName = draftZipName;
    persistSavedState();
    localStorage.setItem(TYPE_STORAGE_KEY, CUSTOM_TYPE);
    window.closeSubmitSettings();
  };

  async function handleZipSelection(event) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;
    draftQueries = [];
    draftZipName = "";
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setZipStatus("Only .zip files are accepted.", "error");
      input.value = "";
      return;
    }

    zipIsLoading = true;
    setZipStatus("Reading and validating " + file.name + "...", "");
    try {
      const parsed = await parseQueryZip(file);
      draftQueries = parsed.queries;
      draftZipName = file.name;
      renderZipStatus();
    } catch (error) {
      console.error("CUSTOM query ZIP failed:", error);
      setZipStatus(error.message || "Cannot read the ZIP file.", "error");
      input.value = "";
    } finally {
      zipIsLoading = false;
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

  function askCustomAnswer(queryType, videoId, frameId) {
    const availableQueries = savedQueries.filter(function (query) {
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
        "CUSTOM " + queryType.toUpperCase() + " submission";
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

  async function loadRuntimeSubmissionConfig() {
    const response = await fetch("js/conf.json?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load js/conf.json: HTTP " + response.status);
    const runtimeConfig = await response.json();
    const endpoint = String(runtimeConfig.customSubmissionUrl || "").trim();
    const apiKey = String(runtimeConfig.customSubmissionApiKey || "").trim();
    const serviceUrl = String(runtimeConfig.serviceUrl || "").trim().replace(/\/$/, "");
    if (!endpoint || !apiKey || !serviceUrl) {
      throw new Error("serviceUrl, customSubmissionUrl and customSubmissionApiKey are required in js/conf.json");
    }
    return {
      endpoint: endpoint,
      apiKey: apiKey,
      proxyUrl: serviceUrl + "/custom-submission-proxy",
    };
  }

  function formatCustomResponse(response, body) {
    const statusText = response.statusText ? " " + response.statusText : "";
    return "HTTP " + response.status + statusText + "\n\n" +
      (body || "(submission server returned an empty response)");
  }

  function buildCustomPayload(selectedItem, queryType, selection, submitter) {
    const payload = {
      file_name: selection.query.file_name,
      query_content: selection.query.query_content,
      img_id: getNumericImageId(selectedItem.imgId),
      video_id: selectedItem.videoId,
      submitter: submitter,
    };
    if (queryType === "qa") payload.answer = selection.answer;
    return payload;
  }

  async function submitCustomResult(selectedItem, queryType) {
    const submitter = String(window.config?.ui?.["user-name"] || "").trim();
    if (!submitter) throw new Error("ui.user-name is required for CUSTOM submission");
    const selection = await askCustomAnswer(queryType, selectedItem.videoId, selectedItem.imgId);
    const runtimeConfig = await loadRuntimeSubmissionConfig();
    const payload = buildCustomPayload(selectedItem, queryType, selection, submitter);

    window.showKISServerResponse(
      "Submitting CUSTOM " + queryType.toUpperCase(),
      "Waiting for the submission server response...",
      false,
    );
    const response = await fetch(runtimeConfig.proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_url: runtimeConfig.endpoint,
        api_key: runtimeConfig.apiKey,
        payload: payload,
        video_id: selectedItem.videoId,
        frame_id: selectedItem.imgId,
      }),
    });
    const responseText = await response.text();
    const serverResponse = formatCustomResponse(response, responseText);
    if (!response.ok) throw new Error(serverResponse);
    return serverResponse;
  }

  window.submitVersion2 = function (selectedItem) {
    const taskType = localStorage.getItem("taskType");
    if (getSubmissionType() !== CUSTOM_TYPE || (taskType !== "kis" && taskType !== "qa")) {
      return originalSubmitVersion2.apply(this, arguments);
    }

    submitCustomResult(selectedItem, taskType)
      .then(function (response) {
        window.showKISServerResponse("CUSTOM server response", response, false);
      })
      .catch(function (error) {
        if (error.cancelled) return;
        console.error("CUSTOM submit failed:", error);
        window.showKISServerResponse("CUSTOM submission failed", error.message, true);
      });
    return null;
  };
})();
