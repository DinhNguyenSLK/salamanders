var regex_to_match_keyframe_number = /_(\d+(?:_\d+)?)(?:-(\d+))?$|-(\d+)$/;
var cells = 49;
var canvasWidth = 275;
var canvasHeight = 154;

CELL_COLS = 7;
CELL_ROWS = 7;

var cellWidth = canvasWidth / CELL_COLS;
var cellHeight = canvasHeight / CELL_ROWS;

var borderColors = [
  "#63b598",
  "#ce7d78",
  "#ea9e70",
  "#a48a9e",
  "#c6e1e8",
  "#648177",
  "#0d5ac1",
  "#f205e6",
  "#1c0365",
  "#14a9ad",
  "#4ca2f9",
  "#a4e43f",
  "#d298e2",
  "#6119d0",
  "#d2737d",
  "#c0a43c",
  "#f2510e",
  "#651be6",
  "#79806e",
  "#61da5e",
  "#cd2f00",
  "#9348af",
  "#01ac53",
  "#c5a4fb",
  "#996635",
  "#b11573",
  "#4bb473",
  "#75d89e",
  "#2f3f94",
  "#2f7b99",
  "#da967d",
  "#34891f",
  "#b0d87b",
  "#ca4751",
  "#7e50a8",
  "#c4d647",
  "#e0eeb8",
  "#11dec1",
  "#289812",
  "#566ca0",
  "#ffdbe1",
  "#2f1179",
  "#935b6d",
  "#916988",
  "#513d98",
  "#aead3a",
  "#9e6d71",
  "#4b5bdc",
  "#0cd36d",
  "#250662",
  "#cb5bea",
  "#228916",
  "#ac3e1b",
  "#df514a",
  "#539397",
  "#880977",
  "#f697c1",
  "#ba96ce",
  "#679c9d",
  "#c6c42c",
  "#5d2c52",
  "#48b41b",
  "#e1cf3b",
  "#5be4f0",
  "#57c4d8",
  "#a4d17a",
  "#225b8",
  "#be608b",
  "#96b00c",
  "#088baf",
  "#f158bf",
  "#e145ba",
  "#ee91e3",
  "#05d371",
  "#5426e0",
  "#4834d0",
  "#802234",
  "#6749e8",
  "#0971f0",
  "#8fb413",
  "#b2b4f0",
  "#c3c89d",
  "#c9a941",
  "#41d158",
  "#fb21a3",
  "#51aed9",
  "#5bb32d",
  "#807fb",
  "#21538e",
  "#89d534",
  "#d36647",
  "#7fb411",
  "#0023b8",
  "#3b8c2a",
  "#986b53",
  "#f50422",
  "#983f7a",
  "#ea24a3",
  "#79352c",
  "#521250",
  "#c79ed2",
  "#d6dd92",
  "#e33e52",
  "#b2be57",
  "#fa06ec",
  "#1bb699",
  "#6b2e5f",
  "#64820f",
  "#1c271",
  "#21538e",
  "#89d534",
  "#d36647",
  "#7fb411",
  "#0023b8",
  "#3b8c2a",
  "#986b53",
  "#f50422",
  "#983f7a",
  "#ea24a3",
  "#79352c",
  "#521250",
  "#c79ed2",
  "#d6dd92",
  "#e33e52",
  "#b2be57",
  "#fa06ec",
  "#1bb699",
  "#6b2e5f",
  "#64820f",
  "#1c271",
  "#9cb64a",
  "#996c48",
  "#9ab9b7",
  "#06e052",
  "#e3a481",
  "#0eb621",
  "#fc458e",
  "#b2db15",
  "#aa226d",
  "#792ed8",
  "#73872a",
  "#520d3a",
  "#cefcb8",
  "#a5b3d9",
  "#7d1d85",
  "#c4fd57",
  "#f1ae16",
  "#8fe22a",
  "#ef6e3c",
  "#243eeb",
  "#1dc18",
  "#dd93fd",
  "#3f8473",
  "#e7dbce",
  "#421f79",
  "#7a3d93",
  "#635f6d",
  "#93f2d7",
  "#9b5c2a",
  "#15b9ee",
  "#0f5997",
  "#409188",
  "#911e20",
  "#1350ce",
  "#10e5b1",
  "#fff4d7",
  "#cb2582",
  "#ce00be",
  "#32d5d6",
  "#17232",
  "#608572",
  "#c79bc2",
  "#00f87c",
  "#77772a",
  "#6995ba",
  "#fc6b57",
  "#f07815",
  "#8fd883",
  "#060e27",
  "#96e591",
  "#21d52e",
  "#d00043",
  "#b47162",
  "#1ec227",
  "#4f0f6f",
  "#1d1d58",
  "#947002",
  "#bde052",
  "#e08c56",
  "#28fcfd",
  "#bb09b",
  "#36486a",
  "#d02e29",
  "#1ae6db",
  "#3e464c",
  "#a84a8f",
  "#911e7e",
  "#3f16d9",
  "#0f525f",
  "#ac7c0a",
  "#b4c086",
  "#c9d730",
  "#30cc49",
  "#3d6751",
  "#fb4c03",
  "#640fc1",
  "#62c03e",
  "#d3493a",
  "#88aa0b",
  "#406df9",
  "#615af0",
  "#4be47",
  "#2a3434",
  "#4a543f",
  "#79bca0",
  "#a8b8d4",
  "#00efd4",
  "#7ad236",
  "#7260d8",
  "#1deaa7",
  "#06f43a",
  "#823c59",
  "#e3d94c",
  "#dc1c06",
  "#f53b2a",
  "#b46238",
  "#2dfff6",
  "#a82b89",
  "#1a8011",
  "#436a9f",
  "#1a806a",
  "#4cf09d",
  "#c188a2",
  "#67eb4b",
  "#b308d3",
  "#fc7e41",
  "#af3101",
  "#ff065",
  "#71b1f4",
  "#a2f8a5",
  "#e23dd0",
  "#d3486d",
  "#00f7f9",
  "#474893",
  "#3cec35",
  "#1c65cb",
  "#5d1d0c",
  "#2d7d2a",
  "#ff3420",
  "#5cdd87",
  "#a259a4",
  "#e4ac44",
  "#1bede6",
  "#8798a4",
  "#d7790f",
  "#b2c24f",
  "#de73c2",
  "#d70a9c",
  "#25b67",
  "#88e9b8",
  "#c2b0e2",
  "#86e98f",
  "#ae90e2",
  "#1a806b",
  "#436a9e",
  "#0ec0ff",
  "#f812b3",
  "#b17fc9",
  "#8d6c2f",
  "#d3277a",
  "#2ca1ae",
  "#9685eb",
  "#8a96c6",
  "#dba2e6",
  "#76fc1b",
  "#608fa4",
  "#20f6ba",
  "#07d7f6",
  "#dce77a",
  "#77ecca",
];

var colorMap = {
  white:
    'style="background-color: white; color: rgb(0,0,0);  border: 1px solid #000;"',
  black: 'style="background-color: black; color: rgb(255,255,255);"',
  blue: 'style="background-color: blue; color: rgb(255,255,255);"',
  brown: 'style="background-color: brown; color: rgb(255,255,255);"',
  green: 'style="background-color: green; color: rgb(255,255,255);"',
  grey: 'style="background-color: grey; color: rgb(255,255,255);"',
  orange: 'style="background-color: orange; color: rgb(255,255,255);"',
  pink: 'style="background-color: pink; color: rgb(255,255,255);"',
  purple: 'style="background-color: purple; color: rgb(255,255,255);"',
  red: 'style="background-color: red; color: rgb(255,255,255);"',
  yellow: 'style="background-color: yellow; color: rgb(0,0,0);"',
};

var availableTags = null;

var rect, origX, origY, textVal, activeObj, overObj;
var prevQuery = [];

var isDrawing = false;
var draggedLabel = "";
var isDragging = false;
var prevTextual = [];
var prevCLIP = [];
var prevNotField = [];
var prevOcrField = [];
var prevAsrField = [];
var prevTagsField = [];
var prevCanvasObjects = [];
var isCanvasClean = [];
var isReset = false;

var prevIs43 = false;
var prevIs169 = false;
var prevIsColor = [];
var prevIsGray = [];

var results = null;
var resultsSortedByVideo = null;
var res = null;
var isGray = [];
var isColor = [];
var occur = [];
var textualMode = [];
var videoType = "all";
var topK = 1000;

//var qbeUrl = ''
var is43 = false;
var is169 = false;

var urlVBSService = "";
var translateService = "";
var thumbnailUrl = "";
var keyFramesUrl = "";
var activeCanvasIdx = 0;
var activeCanvas = "";
var isCanvasEnabled = [];
var prevIsCanvasEnabled = [];
var prevOccur = [];
var prevTextualMode = [];

var prevQBE = "";

var tempSearchForms = 0;
var canvases = [];
var canvas0 = null;
var canvas1 = null;
var MAX_SCENES =
  typeof MAX_TEMPORAL_SCENES !== "undefined" ? MAX_TEMPORAL_SCENES : 5;
var latestQuery = "";
var setDisplayTo = "block";
var isAdvanced = true;
var resCursor = 0;
var resMatrix = [];
var colIdx = 1;
var rowIdx = 0;

var config = null;
var loadingSpinner = null;
var numResultsPerVideo = 10;
var defaultLanguage = "ita";
var defaultTaskType = "kis";
var framesCache = [];
var collectionName;

function syncCanvasAliases() {
  canvas0 = canvases[0] || null;
  canvas1 = canvases[1] || null;
  for (let i = 0; i < canvases.length; i++) {
    window["canvas" + i] = canvases[i];
  }
}

function ensureSceneState(idx) {
  const defaultMode =
    config &&
    config.ui &&
    config.ui["textual-modes"] &&
    config.ui["textual-modes"][0]
      ? config.ui["textual-modes"][0].mode
      : "all";
  while (textualMode.length <= idx) textualMode.push(defaultMode);
  while (occur.length <= idx) occur.push("and");
  while (isCanvasEnabled.length <= idx) isCanvasEnabled.push(true);
  while (isCanvasClean.length <= idx) isCanvasClean.push(false);
  while (prevIsCanvasEnabled.length <= idx) prevIsCanvasEnabled.push(true);
  while (prevOccur.length <= idx) prevOccur.push(true);
  while (prevTextualMode.length <= idx) prevTextualMode.push(defaultMode);
  while (prevTextual.length <= idx) prevTextual.push("");
  while (prevNotField.length <= idx) prevNotField.push("");
  while (prevOcrField.length <= idx) prevOcrField.push("");
  while (prevAsrField.length <= idx) prevAsrField.push("");
  while (prevTagsField.length <= idx) prevTagsField.push("");
  while (prevCanvasObjects.length <= idx) prevCanvasObjects.push([]);
  while (prevIsColor.length <= idx) prevIsColor.push(false);
  while (prevIsGray.length <= idx) prevIsGray.push(false);
  while (isColor.length <= idx) isColor.push(false);
  while (isGray.length <= idx) isGray.push(false);
}

function bindCanvasDropTargets(idx) {
  const block = document.getElementById("canvasBlock" + idx);
  if (!block || !canvases[idx]) return;
  const targets = [
    block,
    document.getElementById("canvasdiv" + idx),
    canvases[idx].upperCanvasEl,
    canvases[idx].lowerCanvasEl,
  ];
  targets.forEach(function (el) {
    if (!el || el._dndBound) return;
    el._dndBound = true;
    el.addEventListener("dragover", allowCanvasDrop);
    el.addEventListener("drop", function (ev) {
      dropOnObjectCanvas(ev, idx);
    });
  });
}

function refreshSceneChrome() {
  const max =
    typeof MAX_TEMPORAL_SCENES !== "undefined"
      ? MAX_TEMPORAL_SCENES
      : MAX_SCENES;
  for (let i = 0; i < tempSearchForms; i++) {
    const btn = document.getElementById("removeScene" + i);
    if (!btn) continue;
    btn.style.display =
      tempSearchForms > 1 && i === tempSearchForms - 1 ? "" : "none";
  }
  const addBtn = document.getElementById("addNewCanvas");
  const hint = document.getElementById("addSceneHint");
  if (addBtn) {
    addBtn.disabled = tempSearchForms >= max;
    addBtn.classList.toggle("disabled", tempSearchForms >= max);
  }
  if (hint) {
    hint.textContent =
      tempSearchForms >= max
        ? "Maximum " + max + " temporal scenes"
        : tempSearchForms + " / " + max + " scenes";
  }
}

function mountSearchScene(idx) {
  ensureSceneState(idx);
  const $bar = $("#addSceneBar");
  const html = searchForm(idx);
  if ($bar.length) {
    $bar.before(html);
  } else {
    $("#searchTab").append(html);
  }
  orderScenePanels(idx);
  const canvas = get_canvas(idx);
  canvases[idx] = canvas;
  syncCanvasAliases();
  bindCanvasDropTargets(idx);
  try {
    canvas.renderAll();
  } catch (e) {}
}

function addSearchScene() {
  const max =
    typeof MAX_TEMPORAL_SCENES !== "undefined"
      ? MAX_TEMPORAL_SCENES
      : MAX_SCENES;
  if (tempSearchForms >= max) return;
  const idx = tempSearchForms;
  tempSearchForms += 1;
  mountSearchScene(idx);
  refreshSceneChrome();
  const el = document.getElementById("canvasTab" + idx);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function removeLastSearchScene() {
  if (tempSearchForms <= 1) return;
  const idx = tempSearchForms - 1;
  try {
    if (canvases[idx]) canvases[idx].dispose();
  } catch (e) {}
  $("#canvasTab" + idx).remove();
  canvases.pop();
  textualMode.pop();
  occur.pop();
  isCanvasEnabled.pop();
  isCanvasClean.pop();
  prevIsCanvasEnabled.pop();
  prevOccur.pop();
  prevTextualMode.pop();
  prevTextual.pop();
  prevNotField.pop();
  prevOcrField.pop();
  prevAsrField.pop();
  prevTagsField.pop();
  prevCanvasObjects.pop();
  prevIsColor.pop();
  prevIsGray.pop();
  isColor.pop();
  isGray.pop();
  tempSearchForms -= 1;
  if (activeCanvasIdx >= tempSearchForms) {
    activeCanvasIdx = Math.max(0, tempSearchForms - 1);
    activeCanvas = canvases[activeCanvasIdx] || "";
  }
  syncCanvasAliases();
  refreshSceneChrome();
  searchByForm();
}

function initSearchScenes() {
  tempSearchForms = 0;
  canvases = [];
  $("#searchTab").empty();
  $("#searchTab").append(addSceneButtonHtml());
  $("#searchTab").append(imageGenerationPanelHtml());
  addSearchScene();
  bindSearchSceneDelegates();
}

function bindSearchSceneDelegates() {
  const $tab = $("#searchTab");
  $tab.off(".sceneDyn");

  $tab.on("click.sceneDyn", ".field-clear-btn", function (event) {
    event.preventDefault();
    event.stopPropagation();
    const idx = parseInt($(this).attr("data-scene-idx"), 10);
    const field = $(this).attr("data-clear-field");
    if (isNaN(idx) || !field) return;

    if (field === "objects") {
      const canvas = canvases[idx];
      if (canvas) {
        canvas.discardActiveObject();
        canvas.getObjects().slice().forEach(function (object) {
          if (object.get("type") !== "line") {
            $("#" + object.get("uuid")).hide();
            canvas.remove(object);
          }
        });
        canvas.renderAll();
      }
    } else {
      $("#" + field + idx).val("");
      if (field === "textual") {
        $("#cancelText" + idx).hide();
      }
    }
    isCanvasClean[idx] = false;
    searchByForm();
  });

  function sceneIdxFromFieldId(id, prefix) {
    return parseInt(String(id).replace(prefix, ""), 10);
  }

  function markSceneDirty(idx) {
    if (!isNaN(idx)) isCanvasClean[idx] = false;
  }

  $tab.on(
    "input.sceneDyn change.sceneDyn",
    'textarea[id^="textual"],textarea[id^="not"],textarea[id^="ocr"],textarea[id^="asr"],textarea[id^="tags"]',
    function () {
      const id = this.id;
      let idx = NaN;
      if (id.indexOf("textual") === 0) idx = sceneIdxFromFieldId(id, "textual");
      else if (id.indexOf("not") === 0) idx = sceneIdxFromFieldId(id, "not");
      else if (id.indexOf("ocr") === 0) idx = sceneIdxFromFieldId(id, "ocr");
      else if (id.indexOf("asr") === 0) idx = sceneIdxFromFieldId(id, "asr");
      else if (id.indexOf("tags") === 0) idx = sceneIdxFromFieldId(id, "tags");
      markSceneDirty(idx);
    },
  );

  $tab.on("keydown.sceneDyn", 'textarea[id^="textual"]', function (event) {
    const idx = parseInt(this.id.replace("textual", ""), 10);
    if (isNaN(idx)) return;
    markSceneDirty(idx);
    const cancel = document.getElementById("cancelText" + idx);
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if ($(this).val().trim().length > 0) searchByForm();
      $(this).blur();
      return false;
    }
    if (cancel) cancel.style.display = $(this).val() === "" ? "none" : "block";
  });

  $tab.on("click.sceneDyn", '[id^="cancelText"]', function () {
    const idx = parseInt(this.id.replace("cancelText", ""), 10);
    if (isNaN(idx)) return;
    $("#textual" + idx).val("");
    this.style.display = "none";
    markSceneDirty(idx);
    searchByForm();
  });

  $tab.on("click.sceneDyn", '[id^="clean"]', function () {
    const idx = parseInt(this.id.replace("clean", ""), 10);
    if (isNaN(idx)) return;
    if (!sceneHasContent(idx)) return;
    sceneClean(idx);
    isCanvasClean[idx] = true;
    searchByForm();
  });

  $tab.on("click.sceneDyn", '[id^="undo"]', function () {
    const idx = parseInt(this.id.replace("undo", ""), 10);
    if (isNaN(idx) || !isCanvasClean[idx]) return;
    isCanvasClean[idx] = false;
    sceneCleanUndo(idx);
    searchByForm();
  });

  $tab.on(
    "keydown.sceneDyn",
    'textarea[id^="not"],textarea[id^="ocr"],textarea[id^="asr"],textarea[id^="tags"]',
    function (event) {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        searchByForm();
        $(this).blur();
      }
    },
  );

  $tab.on("click.sceneDyn", '[id^="rewriteBtn"]', function () {
    const idx = parseInt(this.id.replace("rewriteBtn", ""), 10);
    if (isNaN(idx)) return;
    rewriteSceneQuery(idx);
  });

  $tab.on("click.sceneDyn", '[id^="applyRewrite"]', function () {
    const idx = parseInt(this.id.replace("applyRewrite", ""), 10);
    if (isNaN(idx)) return;
    applyRewriteToTextual(idx);
  });

  $tab.on("click.sceneDyn", ".object-count-range-btn", function () {
    const $btn = $(this);
    const $group = $btn.closest(".object-count-range");
    const $panel = $btn.closest(".field-panel-body");
    const $textarea = $panel.find('textarea[id^="not"]');
    
    $group.find(".object-count-range-btn").removeClass("active").attr("aria-pressed", "false");
    $btn.addClass("active").attr("aria-pressed", "true");
    
    const rangeVal = $btn.attr("data-range");
    $textarea.attr("data-range", rangeVal);
    
    const idx = parseInt($textarea.attr("id").replace("not", ""), 10);
    markSceneDirty(idx);
    searchByForm();
  });

  $tab.on("click.sceneDyn", "#imageGenerationBtn", function () {
    generateImage();
  });

  $tab.on("click.sceneDyn", "#clearImageGeneration", function () {
    clearGeneratedImage();
  });

  $tab.on("click.sceneDyn", "#imageGenerationPreview", function () {
    openImagePreview();
  });
}

function openImagePreview() {
  const image = document.getElementById("imageGenerationImage");
  const modal = document.getElementById("imagePreviewModal");
  const modalImage = document.getElementById("imagePreviewModalImage");
  const download = document.getElementById("imagePreviewDownload");

  if (!image?.src || !modal || !modalImage || !download) return;

  modalImage.src = image.src;
  download.href = image.src;
  download.download =
    image.dataset.downloadName || "generated-image.png";
  modal.hidden = false;
  document.body.classList.add("image-preview-open");
  document.getElementById("imagePreviewClose")?.focus();
}

function closeImagePreview() {
  const modal = document.getElementById("imagePreviewModal");
  const modalImage = document.getElementById("imagePreviewModalImage");

  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.classList.remove("image-preview-open");
  if (modalImage) modalImage.removeAttribute("src");
  document.getElementById("imageGenerationPreview")?.focus();
}

function clearGeneratedImage() {
  const result = document.getElementById("imageGenerationResult");
  const image = document.getElementById("imageGenerationImage");
  const status = document.getElementById("imageGenerationStatus");

  closeImagePreview();
  if (image) {
    image.removeAttribute("src");
    delete image.dataset.downloadName;
  }
  if (result) result.hidden = true;
  if (status) status.textContent = "";
}

document.addEventListener("click", function (event) {
  if (event.target.closest("[data-image-preview-close]")) {
    closeImagePreview();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeImagePreview();
});

function generateImage() {
  const prompt = (document.getElementById("imageGenerationPrompt")?.value || "").trim();
  const mode =
    document.querySelector('input[name="imageGenerationMode"]:checked')?.value ||
    "single";
  const btn = document.getElementById("imageGenerationBtn");
  const status = document.getElementById("imageGenerationStatus");
  const result = document.getElementById("imageGenerationResult");
  const image = document.getElementById("imageGenerationImage");

  if (!prompt) {
    if (status) status.textContent = "Enter a prompt first.";
    return;
  }
  if (!urlVBSService) {
    if (status) status.textContent = "Image generation service URL is not configured.";
    return;
  }

  const url =
    urlVBSService.replace(/\/$/, "") +
    "/image_generation/" +
    encodeURIComponent(mode);
  if (btn) btn.disabled = true;
  if (status) status.textContent = "Generating...";
  if (result) result.hidden = true;

  fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_prompt: prompt }),
    },
    120000,
  )
    .then(async function (response) {
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      if (!response.ok) throw new Error("HTTP " + response.status);
      return data;
    })
    .then(function (data) {
      const imageBase64 = data && data.image_base64;
      if (!imageBase64) {
        throw new Error("Response does not contain image_base64");
      }

      const imageUrl = String(imageBase64).startsWith("data:")
        ? String(imageBase64)
        : "data:image/png;base64," + String(imageBase64);
      if (image) {
        image.src = imageUrl;
        image.dataset.downloadName = "generated-image-" + mode + ".png";
      }
      if (result) result.hidden = false;
      if (status) status.textContent = "Image generated successfully.";
    })
    .catch(function (err) {
      console.error("image generation failed:", err);
      if (status) status.textContent = "Image generation failed: " + err.message;
    })
    .finally(function () {
      if (btn) btn.disabled = false;
    });
}

function handler(myObj) {
  urlVBSService = myObj.serviceUrl;
  speech2TextService = myObj.speech2Text;
  translateService = myObj.translate;

  thumbnailUrl = myObj.thumbnailUrl;
  keyFramesUrl = myObj.keyFramesUrl;
  videoUrlPrefix = myObj.videoUrl;
  videoshrinkUrl = myObj.videoshrinkUrl;

  //document.cookie = 'isQA=' + isQA + '; path=/';

  //localStorage.setItem('isQA', isQA);
}

/*
function setAVS(isAvsSel) {
	isAVS = isAvsSel;
	isQA = false;
	localStorage.setItem('isQA', isQA);
	//document.cookie = 'isQA=' + isQA + '; path=/';

}

function setQA(isQASel) {
	isQA = isQASel;
	isAVS = false;
	localStorage.setItem('isQA', isQA);
	//document.cookie = 'isQA=' + isQA + '; path=/';

}*/

function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

function rewriteSceneQuery(idx) {
  const query = ($("#textual" + idx).val() || "").trim();
  const out = document.getElementById("rewrite" + idx);
  const btn = document.getElementById("rewriteBtn" + idx);
  if (!query) {
    if (out) out.value = "";
    if (out) out.placeholder = "Enter a textual query above first";
    return;
  }
  if (!urlVBSService) {
    if (out) out.value = "";
    if (out) out.placeholder = "Search service URL is not configured";
    return;
  }

  const mode =
    $('input[name="rewriteMode' + idx + '"]:checked').val() || "exploit";
  const base = urlVBSService.replace(/\/$/, "");
  const url =
    base +
    "/rewrite/" +
    encodeURIComponent(mode) +
    "?" +
    new URLSearchParams({ query: query }).toString();

  if (btn) btn.disabled = true;
  if (out) {
    out.value = "";
    out.placeholder = "Rewriting...";
  }

  fetchWithTimeout(url, { method: "GET" }, 65000)
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      const text = data && data.rewriting != null ? String(data.rewriting) : "";
      if (out) {
        out.value = text;
        out.placeholder =
          "Rewritten query appears here — edit, then apply to textual above";
      }
    })
    .catch(function (err) {
      console.error("rewrite failed:", err);
      if (out) {
        out.value = "";
        out.placeholder = "Rewrite failed — check backend /rewrite/" + mode;
      }
    })
    .finally(function () {
      if (btn) btn.disabled = false;
    });
}

function applyRewriteToTextual(idx) {
  const text = ($("#rewrite" + idx).val() || "").trim();
  if (!text) return;
  $("#textual" + idx).val(text);
  const cancel = document.getElementById("cancelText" + idx);
  if (cancel) cancel.style.display = "block";
  isCanvasClean[idx] = false;
}

function loadConfig() {
  // Bust browser cache so ui.textual-modes renames (e.g. clip → openclip) show up.
  const cacheBust = "v=" + Date.now();
  const promise1 = fetchWithTimeout("config.yaml?" + cacheBust)
    .then((response) => {
      if (!response.ok) throw new Error("config.yaml HTTP " + response.status);
      return response.text();
    })
    .then((data) => {
      config = jsyaml.load(data);
    });
  const promise2 = fetchWithTimeout("js/conf.json?" + cacheBust)
    .then((response) => {
      if (!response.ok) throw new Error("conf.json HTTP " + response.status);
      return response.json();
    })
    .then(handler);
  return Promise.all([promise1, promise2]).catch((err) => {
    console.error("loadConfig failed:", err);
    config = config || {};
  });
}

function setSpeech(speechRes, idx) {
  if (speechRes == null) {
    console.log("Warning, speechRes is " + speechRes);
    prevTextual[idx] = $("#textual" + idx).val();
    //$("#textual" + idx).val('');
    //document.getElementById('cancelText' + idx).style.display = 'none'
    //searchByForm();
  } else {
    console.log(speechRes);
    let jsonSpeech = JSON.parse(speechRes);

    $("#textual" + idx).val(jsonSpeech.translation);
    document.getElementById("cancelText" + idx).style.display = "block";

    //searchByForm();
  }
  searchByForm();
}

function setTranslate(speechRes, idx) {
  if (speechRes == null) {
    console.log("Warning, speechRes is " + speechRes);
    prevTextual[idx] = $("#textual" + idx).val();
    //$("#textual" + idx).val('');
    //document.getElementById('cancelText' + idx).style.display = 'none'
    //searchByForm();
  } else {
    console.log(speechRes);
    let jsonTranslate = JSON.parse(speechRes);

    if (jsonTranslate.is_translated == "True") {
      $("#textual" + idx).val(jsonTranslate.translated_text);
      document.getElementById("cancelText" + idx).style.display = "block";

      let toLog = {
        query: [],
        parameters: [],
      };
      toLog.query.push({ translate: "" });
      //to fix a boolean parse error
      //toLog.parameters.push({"detected_language":jsonTranslate.detected_language,"original_text":jsonTranslate.original_text,"translated_text":jsonTranslate.translated_text,"translation_model":jsonTranslate.translation_model})
      toLog.parameters.push(jsonTranslate);
      toLog = JSON.stringify(toLog);
      console.log(toLog);
      log(toLog);
    }

    //searchByForm();
  }
  searchByForm();
}

function playVideo(id) {
  alert(id);
  alert(getStartTime(id + ".jpg"));
}

function split(val) {
  return val.split(" ");
}

function extractLast(term) {
  return split(term).pop();
}

function extractprev(term) {
  return split(term).pop();
}

$.get("objects_doc_freq.csv", function (data) {
  availableTags = data.split("\n");
  //availableTags = [];
});

draggedLabel = "";

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
  ev.dataTransfer.effectAllowed = "copy";
  draggedLabel = ev.target.title || ev.target.id;
}

function allowCanvasDrop(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = "copy";
  }
  return false;
}

function placeObjectOnCanvas(canvasIdx, clientX, clientY) {
  if (!draggedLabel || !canvases || !canvases[canvasIdx]) return false;
  if (!isCanvasEnabled[canvasIdx]) return false;

  const active = canvases[canvasIdx];
  activeCanvas = active;
  activeCanvasIdx = canvasIdx;

  const imgElement = document.getElementById(draggedLabel);
  if (!imgElement) return false;

  const canvasEl =
    active.upperCanvasEl || active.lowerCanvasEl || active.getElement();
  const rectBox = canvasEl.getBoundingClientRect();
  let origX = clientX - rectBox.left;
  let origY = clientY - rectBox.top;

  // Scale to fabric canvas coords if CSS size differs from fabric size
  origX = origX * (active.width / rectBox.width);
  origY = origY * (active.height / rectBox.height);

  const color = imgElement.alt == "color" ? true : false;
  // Default icon size on paste (~1 cell); was 14px and looked too small on the grid
  const scale = 32;
  const half = scale / 2;

  const obj = new fabric.Image(imgElement, {
    left: origX - half,
    top: origY - half,
    fill: "",
    stroke: "black",
    type: "rect",
    uuid: generateUUID(color),
    strokeWidth: 1,
    scaleX: scale / Math.max(1, imgElement.naturalWidth || imgElement.width),
    scaleY: scale / Math.max(1, imgElement.naturalHeight || imgElement.height),
  });

  active.add(obj);
  active.discardActiveObject();
  active.renderAll();

  addDeleteBtn(draggedLabel, obj);
  activeObj = obj;
  isCanvasClean[canvasIdx] = false;
  isReset = false;
  searchByForm();
  return true;
}

function dropOnObjectCanvas(ev, canvasIdx) {
  ev.preventDefault();
  ev.stopPropagation();

  if (draggedLabel == "" && ev.dataTransfer) {
    const id = ev.dataTransfer.getData("text");
    if (id) draggedLabel = id;
  }

  const clientX = ev.clientX;
  const clientY = ev.clientY;
  placeObjectOnCanvas(canvasIdx, clientX, clientY);

  isDragging = false;
  draggedLabel = "";
  return false;
}

dropImage = function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (draggedLabel == "") return;

  const oe = e.originalEvent || e;
  let idx = 0;
  for (let i = 0; i < (canvases || []).length; i++) {
    if (!canvases[i]) continue;
    const cEl = canvases[i].upperCanvasEl || canvases[i].getElement();
    const r = cEl.getBoundingClientRect();
    if (
      oe.clientX >= r.left &&
      oe.clientX <= r.right &&
      oe.clientY >= r.top &&
      oe.clientY <= r.bottom
    ) {
      idx = i;
      break;
    }
  }
  placeObjectOnCanvas(idx, oe.clientX, oe.clientY);
  isDragging = false;
  draggedLabel = "";
};

function getText(id, field) {
  return $.ajax({
    type: "GET",
    url:
      urlVBSService +
      "/getField?id=" +
      encodeURIComponent(id) +
      "&field=" +
      encodeURIComponent(field),
    async: false,
  }).responseText;
}

function getAllVideoKeyframes(videoId) {
  return $.ajax({
    type: "GET",
    url: urlVBSService + "/getAllVideoKeyframes?videoId=" + videoId,
    async: false,
  }).responseText;
}

function getField(id, field) {
  return $.ajax({
    type: "GET",
    url:
      urlVBSService +
      "/getField?id=" +
      encodeURIComponent(id) +
      "&field=" +
      encodeURIComponent(field),
    async: false,
  }).responseText;
}

function getFps(videoId) {
  return $.ajax({
    type: "GET",
    url: urlVBSService + "/getFps?videoId=" + encodeURIComponent(videoId),
    async: false,
  }).responseText;
}

function getStartTime(id) {
  var selected = getField(id, "selectedtime");
  if (selected != null && String(selected).trim() !== "") return selected;
  var start = getField(id, "starttime");
  return start != null ? start : "";
}

function getEndTime(id) {
  return getField(id, "endtime");
}

function getMiddleTimestamp(id) {
  var selected = getField(id, "selectedtime");
  if (selected != null && String(selected).trim() !== "") return selected;
  return getField(id, "middletime");
}

/*
function submitWithAlert(id, videoId) {
	if (!isAVS) {
		if (confirm('Are you sure you want to submit?')) {
			res = submitResult(id, videoId);
			console.log(res);
			alert('Server response: ' + res);
		}
	} else {
		res = submitResult(id, videoId);
	}
}

function submitWithAlert2(selectedItem, isConfirm) {
	if (isConfirm) {
		if (confirm('Are you sure you want to submit?')) {
			res = submitResult(selectedItem.imageId, selectedItem.videoId);
			console.log(res);
			alert('Server response: ' + res);
		}
	} else {
		res = submitResult(selectedItem.imageId, selectedItem.videoId);
		console.log(res);
	}
	avsSubmitted.set(selectedItem.videoId, selectedItem);
	avsSubmittedTab(selectedItem);
}
*/

//to remove
function startNewSession() {
  if (confirm("Are you sure you want to start a new session?")) {
    location.reload();
    $.ajax({
      type: "GET",
      async: false,
      url: urlVBSService + "/init",
    }).responseText;
  }
}

function startNewKISSession() {
  //if (confirm('Starting a new KIS session?')) {
  location.href = "index_V3C.html";
  $.ajax({
    type: "GET",
    async: false,
    url: urlVBSService + "/init",
  }).responseText;
  //}
}

function startNewAVSSession() {
  //if (confirm('Starting a new AVS session?')) {
  location.href = "index_V3C_AVS.html";
  $.ajax({
    type: "GET",
    async: false,
    url: urlVBSService + "/init",
  }).responseText;
  loadConfig();
  //}
}

/*function log(query) {
	return $.ajax({
		type: "GET",
		async: false,
		url: urlVBSService + "/log?query=" + query,
	}).responseText;
}*/

function log(query) {
  $.ajax({
    type: "POST",
    async: true,
    crossDomain: false,
    data: { query: query },
    dataType: "text",
    url: urlVBSService + "/log",
    success: function (data) {
      console.log(data);
    },
    error: function (data) {
      console.log("Error logging " + data);
    },
  });
}

function addDeleteBtn(label, rect) {
  var id = rect.get("uuid");

  var x = rect.aCoords.tr.x;
  var y = rect.aCoords.tr.y;
  var left = rect.left;

  if (rect.group) {
    var point = rect.getCenterPoint();
    x = rect.group.left;
    y = rect.group.top;
    left = rect.group.left;
  }

  var btnLeft = x - 7;
  var btnTop = y - 5;
  var labelLeft = rect.left;
  var labelTop = y - 22;

  var deleteBtn =
    '<div id="' +
    id +
    '" title="' +
    label +
    '"><span style="color: DarkSlateGray; font-size: 1.3em; position:absolute;top:' +
    labelTop +
    "px;left:" +
    labelLeft +
    'px;">' +
    label +
    '</span><img id="' +
    id +
    '" src="img/Actions-dialog-close-icon.png" class="deleteBtn" style="position:absolute;top:' +
    btnTop +
    "px;left:" +
    btnLeft +
    'px;cursor:pointer;width:16px;height:16px;"/></div>';
  $(".canvas-container").eq(activeCanvasIdx).append(deleteBtn);
}

function parseObjectCountField(text) {
  const items = text.trim().split(/\s+/).filter(Boolean);
  const result = [];
  for (let i = 0; i < items.length; ) {
    if (!isNaN(items[i]) && i + 1 < items.length) {
      result.push({
        label: items[i + 1],
        count: Math.max(0, parseInt(items[i], 10)),
      });
      i += 2;
    } else {
      i += 1;
    }
  }
  return result.length ? result : null;
}

function parseTagsField(text) {
  return text
    .split(",")
    .map((t) => t.trim().replace(/^<|>$/g, "").replace(/\s+/g, "_"))
    .filter(Boolean);
}

function normalizeQueryText(text) {
  return (text || "")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cell2Text(idx) {
  // Builds one QueryItems + ParamItems pair (schemas/_request.py) for scene idx.
  let queryObj = {};
  let queryParameters = {
    textual_model: textualMode[idx] || "all",
    operator: occur[idx] || "and",
  };

  let textual = "";
  let element = $("#textual" + idx);
  if (element.length > 0) {
    textual = normalizeQueryText(element.val());
  }
  if (textual != "") {
    queryObj.textual = textual;
  }

  let ocrEl = $("#ocr" + idx);
  if (ocrEl.length > 0) {
    let ocr = ocrEl.val().trim();
    if (ocr) {
      queryObj.ocr = ocr.toLowerCase();
      queryParameters.ocr_mode =
        $('input[name="ocrMode' + idx + '"]:checked').val() || "text";
    }
  }

  let asrEl = $("#asr" + idx);
  if (asrEl.length > 0) {
    let asr = asrEl.val().trim();
    if (asr) {
      queryObj.asr = asr.toLowerCase();
      queryParameters.asr_mode =
        $('input[name="asrMode' + idx + '"]:checked').val() || "text";
    }
  }

  let tagsEl = $("#tags" + idx);
  if (tagsEl.length > 0) {
    let tagsRaw = tagsEl.val().trim();
    if (tagsRaw) {
      let tags = parseTagsField(tagsRaw);
      if (tags.length) queryObj.tags = tags;
    }
  }

  let notEl = $("#not" + idx);
  if (notEl.length > 0) {
    let notField = normalizeQueryText(notEl.val());
    if (notField) {
      let objectCount = parseObjectCountField(notField);
      if (objectCount) {
        queryObj.object_count = objectCount;
        queryParameters.range = notEl.attr("data-range") || "eq";
      }
    }
  }

  if (isCanvasEnabled[idx] && canvases && canvases[idx]) {
    isColor[idx] = $("#isColor" + idx).is(":checked");
    isGray[idx] = $("#isGray" + idx).is(":checked");

    let txt = "";
    canvases[idx].getObjects().forEach(function (o) {
      if (o.get("type") != "rect") return;

      let startCol, endCol, startRow, endRow;
      if (o && o.oCoords) {
        startCol = Math.floor(Math.max(0, o.oCoords.tl.x) / cellWidth);
        endCol = Math.ceil(Math.min(canvasWidth, o.oCoords.tr.x) / cellWidth);
        startRow = Math.floor(Math.max(0, o.oCoords.tr.y) / cellHeight);
        endRow = Math.ceil(Math.min(canvasHeight, o.oCoords.br.y) / cellHeight);
      } else {
        startCol = Math.floor(Math.max(0, o.left) / cellWidth);
        endCol = Math.ceil(Math.min(canvasWidth, o.left + o.width) / cellWidth);
        startRow = Math.floor(Math.max(0, o.top) / cellHeight);
        endRow = Math.ceil(
          Math.min(canvasHeight, o.top + o.height) / cellHeight,
        );
      }
      let label = $("#" + o.uuid).attr("title");
      if (!label) return;
      label = label.trim();

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          txt += row + String.fromCharCode(97 + col) + label + " ";
        }
      }
    });

    if (txt != "" && isAdvanced) {
      queryObj.object_pos = txt.trim();
    }

    if (isAdvanced) {
      let occurVal = $('input[name="occur' + idx + '"]:checked').val();
      if (occurVal) {
        occur[idx] = occurVal;
        queryParameters.operator = occurVal;
      }
    }
  }

  if (Object.keys(queryObj).length === 0) return null;
  return [queryObj, queryParameters];
}

function timestamp() {
  let time = Math.floor(new Date() / 1000);
  console.log(" DATE " + time);
  return;
}

/**
 * SearchParams payload (schemas/_request.py):
 *   { query: QueryItems[], parameters: ParamItems[], video_type, k, n_frames_per_round }
 * query.length === parameters.length; mỗi phần tử = 1 temporal scene.
 */
function buildSearchPayload(queryItems, paramItems) {
  const payload = {
    query: queryItems,
    parameters: paramItems,
    video_type: videoType || "all",
    k: topK || 1000,
    n_frames_per_round: numResultsPerVideo || 10,
  };
  const videoIdInput = document.getElementById("videoIdInput");
  const videoId = videoIdInput ? videoIdInput.value.trim().toUpperCase() : "";
  if (videoId) payload.video_id = videoId;
  return payload;
}

/** Gom mọi scene temporal (có nội dung) thành 1 cặp query[] / parameters[]. */
function collectTemporalSearchItems() {
  const queryItems = [];
  const paramItems = [];
  for (let cellIndex = 0; cellIndex < tempSearchForms; cellIndex++) {
    const cellQuery = cell2Text(cellIndex);
    if (cellQuery == null) continue;
    queryItems.push(cellQuery[0]);
    paramItems.push(cellQuery[1]);
  }
  return { queryItems, paramItems };
}

function searchByLink(queryID) {
  if (queryID != null) {
    // vf / qbe: vẫn 1 POST SearchParams (1 phần tử trong query[])
    search2(
      buildSearchPayload(
        [queryID],
        [
          {
            textual_model: textualMode[0] || "all",
            operator: occur[0] || "and",
          },
        ],
      ),
    );
  } else {
    $("#imgGridResults").remove();
  }
}

function searchByForm() {
  const utilityFilter = document.querySelector(".utility-filter");
  if (utilityFilter) utilityFilter.open = false;
  // Một request duy nhất cho toàn bộ temporal scenes — không gọi API từng scene.
  const { queryItems, paramItems } = collectTemporalSearchItems();
  prevQuery = queryItems;
  if (queryItems.length === 0) {
    const videoIdInput = document.getElementById("videoIdInput");
    if (videoIdInput && videoIdInput.value.trim()) {
      // With only a Video ID, return the indexed frames for that one video.
      search2(buildSearchPayload([{}], [{}]));
      return;
    }
    search2(null);
    return;
  }
  if (queryItems.length !== paramItems.length) {
    console.error(
      "searchByForm: query/parameters length mismatch",
      queryItems.length,
      paramItems.length,
    );
    return;
  }
  search2(buildSearchPayload(queryItems, paramItems));
}

function setResults(data) {
  results = data;
  // Backend _slice interleaves videos in rounds (n_frames_per_round each),
  // so the same videoId reappears later. Collapse to one contiguous block
  // per video (order = first appearance = best-score video order).
  resultsSortedByVideo = groupResultsByVideo(data);
  groupResults(document.getElementById("group"));
}

function groupResultsByVideo(data) {
  if (!data) return [];
  let list = data;
  if (typeof data === "string") {
    try {
      list = data.trim() ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(list) || list.length === 0) return [];

  const groups = new Map();
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const vid = item.videoId;
    if (!groups.has(vid)) groups.set(vid, { frames: [], firstIndex: i });
    groups.get(vid).frames.push(item);
  }

  const rankedGroups = Array.from(groups.values());
  rankedGroups.forEach(function (group) {
    group.frames.sort(function (a, b) {
      return (b.score || 0) - (a.score || 0);
    });
    group.bestScore = group.frames.length ? group.frames[0].score || 0 : 0;
  });
  rankedGroups.sort(function (a, b) {
    return b.bestScore - a.bestScore || a.firstIndex - b.firstIndex;
  });

  const ordered = [];
  for (const group of rankedGroups) {
    for (let j = 0; j < group.frames.length; j++) ordered.push(group.frames[j]);
  }
  return ordered;
}

function hideLoadingSpinner() {
  loadingSpinner = document.getElementById("loading-spinner");
  if (loadingSpinner) loadingSpinner.style.display = "none";
}

var _searchXhr = null;

function setSearchLatency(milliseconds, state) {
  const badge = document.getElementById("searchLatency");
  const value = document.getElementById("searchLatencyValue");
  if (!badge || !value) return;

  badge.dataset.state = state || "ready";
  if (state === "loading") value.textContent = "...";
  else if (state === "error") value.textContent = "error";
  else value.textContent = (milliseconds / 1000).toFixed(3) + "s";
}

function search2(payload) {
  res = null;
  try {
    loadingSpinner = document.getElementById("loading-spinner");
    if (loadingSpinner) loadingSpinner.style.display = "block";

    if (!payload) {
      if (_searchXhr && _searchXhr.readyState !== 4) {
        try {
          _searchXhr.abort();
        } catch (e) {}
      }
      _searchXhr = null;
      setResults("");
      return;
    }

    // Guard: đúng schema SearchParams — 1 payload, N temporal trong query[]
    if (
      !Array.isArray(payload.query) ||
      !Array.isArray(payload.parameters) ||
      payload.query.length === 0 ||
      payload.query.length !== payload.parameters.length
    ) {
      console.error("Invalid SearchParams payload", payload);
      hideLoadingSpinner();
      return;
    }

    cancelBackgroundResultRendering();
    resultsRenderGeneration++;
    latestQuery = JSON.stringify(payload);
    console.log("POST /search/ scenes=" + payload.query.length, payload);
    const requestStartedAt = performance.now();
    setSearchLatency(null, "loading");

    if (_searchXhr && _searchXhr.readyState !== 4) {
      try {
        _searchXhr.abort();
      } catch (e) {}
    }

    _searchXhr = $.ajax({
      type: "POST",
      async: true,
      timeout: 15000,
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(payload),
      url: urlVBSService.replace(/\/$/, "") + "/search/",
      success: function (data) {
        _searchXhr = null;
        setSearchLatency(performance.now() - requestStartedAt, "ready");
        setResults(data);
      },
      error: function (xhr, status, error) {
        if (status === "abort") return;
        _searchXhr = null;
        setSearchLatency(null, "error");
        console.error("search failed:", status, error, xhr && xhr.responseText);
        hideLoadingSpinner();
        setResults("");
      },
    });
  } catch (err) {
    hideLoadingSpinner();
  }
}

function searchByALADINSimilarity(query) {
  $.ajax({
    type: "POST",
    data: { query: query },
    dataType: "text",
    url: urlVBSService + "/search",
    success: function (data) {
      results = data;
      //results = sortByVideo(data);
      resultsSortedByVideo = groupResultsByVideo(data);
      groupResults(document.getElementById("group"));
      // history.pushState(JSON.stringify($(this)),'List',window.location.href);
    },
    error: function (data) {
      $("#imgGridResults").remove();
    },
  });
}

function searchByCLIPSimilarity(query) {
  $.ajax({
    type: "POST",
    data: { query: query },
    dataType: "text",
    url: urlVBSService + "/search",
    success: function (data) {
      results = data;
      //results = sortByVideo(data);
      resultsSortedByVideo = groupResultsByVideo(data);
      groupResults(document.getElementById("group"));
      // history.pushState(JSON.stringify($(this)),'List',window.location.href);
    },
    error: function (data) {
      $("#imgGridResults").remove();
    },
  });
}

function sortByVideo(data) {
  resultsSortedByVideo = [];
  if (data != null && data.trim() != "") {
    let res = JSON.parse(data);

    console.log("Sort By Video " + res.length);
    if (res.length != 0) {
      let dataDict = {};

      let keys = [];

      for (i = 0; i < res.length; i++) {
        let imgId = res[i].imgId;
        let videoId = res[i].videoId;
        let score = res[i].score;

        let value = dataDict[videoId];
        if (value == null) {
          value = [];
          keys[keys.length] = videoId;
        }
        value.push(res[i]);
        // console.log(res[i] + ' ' + res[i + 1] + ' ');
        dataDict[videoId] = value;
      }
      // console.log(keys);
      for (i = 0; i < keys.length; i++) {
        // console.log(i + " " + dataDict[keys[i]]);
        let resPerVideo = dataDict[keys[i]];
        for (j = 0; j < resPerVideo.length; j++) {
          resultsSortedByVideo.push(resPerVideo[j]);
        }
      }
    }
  }
  resultsSortedByVideo = JSON.stringify(resultsSortedByVideo);

  return resultsSortedByVideo;
}

function groupResults(checkbox) {
  /*if(checkBox = document.getElementById("group").checked) {
		showResults(resultsSortedByVideo);
	}
	else {
		showResults(results);
	}*/
  showResults(resultsSortedByVideo);
}

function setGray(checkboxId) {
  if ((checkBox = document.getElementById("isGray" + checkboxId).checked)) {
    isGray[checkboxId] = true;
    document.getElementById("isColor" + checkboxId).checked = false;
    isColor[checkboxId] = false;
  } else isGray[checkboxId] = false;
  searchByForm();
}

function setOccur(radioButton, canvasId) {
  occur[canvasId] = $('input[name="occur' + canvasId + '"]:checked').val();
  console.log(occur);

  searchByForm();
}
/*
function setTextualMode(checkboxId, mode) {
	if (textualMode[checkboxId].includes(mode))
		textualMode[checkboxId] = textualMode[checkboxId].replace(mode, "")
	else
		textualMode[checkboxId] += mode;
	searchByForm();
}*/

function setTextualMode(checkboxId, mode) {
  textualMode[checkboxId] = mode;
  textQuery = $("#textual" + checkboxId).val();
  if (textQuery && textQuery.length > 0) {
    searchByForm();
  }
}
/*
function setTextualMode(checkboxId) {
	if(checkBox = document.getElementById("textualMode" + checkboxId).checked) {
		textualMode[checkboxId] = "aladin";
	}
	else
		textualMode[checkboxId] = "clip";
	searchByForm();
}
*/
function enableCanvas(canvasId, storePrev) {
  const overlay = document.getElementById("overlay" + canvasId);
  if (overlay) overlay.style.display = "none";
  const radios = $("input:radio[name=canvas" + canvasId + "]");
  if (radios[0]) radios[0].checked = true;
  if (storePrev) prevIsCanvasEnabled[canvasId] = isCanvasEnabled[canvasId];
  isCanvasEnabled[canvasId] = true;
}

function disableCanvas(canvasId, storePrev) {
  const overlay = document.getElementById("overlay" + canvasId);
  if (overlay) overlay.style.display = "block";
  const radios = $("input:radio[name=canvas" + canvasId + "]");
  if (radios[1]) radios[1].checked = true;

  if (storePrev) prevIsCanvasEnabled[canvasId] = isCanvasEnabled[canvasId];
  isCanvasEnabled[canvasId] = false;
}

function resetCanvas() {
  for (let i = 0; i < tempSearchForms; i++) {
    enableCanvas(i, true);
  }
  searchByForm();
}

function undoCanvas() {
  for (let i = 0; i < tempSearchForms; i++) {
    if (prevIsCanvasEnabled[i]) {
      enableCanvas(i, true);
    } else {
      disableCanvas(i, true);
    }
  }
  searchByForm();
}

function setCanvasState(canvasId) {
  const state = $('input[name="canvas' + canvasId + '"]:checked').val();
  if (state == "enabled") {
    enableCanvas(canvasId, true);
  } else {
    disableCanvas(canvasId, true);
  }
  searchByForm();
}

function setVideoType(value) {
  videoType = value || "all";
}

function setTopK(value, triggerSearch = false) {
  topK = Math.max(100, Math.min(10000, parseInt(value, 10) || 1000));
  const label = document.getElementById("kValue");
  if (label) label.textContent = topK;
  const slider = document.getElementById("kSlider");
  if (slider) {
    if (String(slider.value) !== String(topK)) slider.value = topK;
    const min = parseFloat(slider.min) || 100;
    const max = parseFloat(slider.max) || 10000;
    const progress = Math.max(0, Math.min(100, ((topK - min) / (max - min)) * 100));
    slider.style.setProperty("--range-progress", progress + "%");
  }
  if (triggerSearch) searchByForm();
}

function setColor(checkboxId) {
  if ((checkBox = document.getElementById("isColor" + checkboxId).checked)) {
    isColor[checkboxId] = true;
    document.getElementById("isGray" + checkboxId).checked = false;
    isGray[checkboxId] = false;
  } else isColor[checkboxId] = false;
  searchByForm();
}

function set43(checkbox) {
  if ((checkBox = document.getElementById("is43").checked)) {
    is43 = true;
    document.getElementById("is169").checked = false;
    is169 = false;
  } else is43 = false;
  searchByForm();
}

function set169(checkbox) {
  if ((checkBox = document.getElementById("is169").checked)) {
    is169 = true;
    document.getElementById("is43").checked = false;
    is43 = false;
  } else is169 = false;
  query = [];
  for (i = 0; i < tempSearchForms; i++) {
    if (cell2Text(i) != null) query.push(cell2Text(i));
  }
  query;
}

function queryByExample(imgUrl) {
  let queryObj = new Object();
  queryObj.qbe = imgUrl;
  searchByLink(queryObj);
}

function queryByCLIP() {
  searchByForm();
}

function fromIDtoColor(id, numberborderColors) {
  // FRANCA
  let borderColorsIdx = id.hashCode() % numberborderColors;
  return borderColorsIdx;
}

String.prototype.hashCode = function () {
  // FRANCA
  let hash = 0;
  if (this.length == 0) return hash;
  for (let j = 0; j < this.length; j++) {
    let char = this.charCodeAt(j);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
};

function displaySimplifiedUI() {
  // Keep sidebar query panels visible; do not relocate textual fields.
  $("#visionelogo").addClass("visioneLogo");
  if (document.getElementById("visionelogoImg")) {
    document.getElementById("visionelogoImg").className = "visionelogoImg";
  }
}

function showResults(data) {
  try {
    cancelBackgroundResultRendering();
    resultsRenderGeneration++;
    //to avoid textual boxes overlap. Why???
    displayAdvanced(true);
    //temporary!!!!!!!!!!!
    avsCleanManuallySelected();

    /*if ($('meta[name=task]').attr('content') == "AVS") {
			avsCleanManuallySelected();
			avsRemoveAutoselected();
		}*/
    //empty avsFirstCol
    //avsAutoSelected.length = 0
    $("#imgGridResults").empty();
    const resultsPane = document.getElementById("results");
    if (resultsPane) resultsPane.scrollTop = 0;
    resMatrix = [];
    colIdx = 1;
    rowIdx = -1;
    visibleImages = 0;
    framesCache = [];
    lastLoadedVideoId = "";
    resColIdx = 1;
    resrowIdx = 0;

    if ((data == null || data == "") && latestQuery != "") {
      noResultsOutput();
    } else if (data != null && data != "") {
      if (!isAdvanced) displaySimplifiedUI();
      try {
        res = typeof data === "string" ? JSON.parse(data) : data;
        if (!Array.isArray(res) || res.length == 0) noResultsOutput();
        else {
          noResultsOutput(false);
          resColIdx = 1;
          resrowIdx = 0;
          visibleImages = 0;
          loadImages(0, getVideoBatchEndIndex(0, videoBatchSize));
        }
      } catch (e) {
        console.log(e);
        noResultsOutput();
      }
    }
    //if ($('meta[name=task]').attr('content') == "AVS") {
    if (localStorage.getItem("taskType") === "avs") avsHideSubmittedVideos();
    else avsHilightlighSubmittedVideos();
    //avsReloadManuallySelected();
    //avsAddAutoselected();
    //}
    updateAVSInfo();
    //repetita iuvant!!
  } finally {
    loadingSpinner.style.display = "none";
  }
}

var videoBatchSize = 4;
var backgroundVideoBatchSize = 6;
var visibleImages = 0;
var resColIdx = 1;
var resrowIdx = 0;
var lastLoadedVideoId = "";
var resultsBackgroundHandle = null;
var resultsBackgroundUsesIdleCallback = false;
var resultsRenderGeneration = 0;

function getVideoBatchEndIndex(startIndex, videoLimit) {
  if (!Array.isArray(res) || startIndex >= res.length) return startIndex;
  var currentVideoId = null;
  var videoCount = 0;
  var index = startIndex;

  for (; index < res.length; index++) {
    var videoId = res[index].videoId;
    if (videoId !== currentVideoId) {
      if (videoCount >= videoLimit) break;
      currentVideoId = videoId;
      videoCount++;
    }
  }

  return Math.max(startIndex, index - 1);
}

function cancelBackgroundResultRendering() {
  if (resultsBackgroundHandle == null) return;
  if (resultsBackgroundUsesIdleCallback && window.cancelIdleCallback) {
    window.cancelIdleCallback(resultsBackgroundHandle);
  } else {
    clearTimeout(resultsBackgroundHandle);
  }
  resultsBackgroundHandle = null;
  resultsBackgroundUsesIdleCallback = false;
}

function scheduleFillResultsViewport() {
  if (
    resultsBackgroundHandle != null ||
    !Array.isArray(res) ||
    visibleImages >= res.length
  ) {
    return;
  }

  var renderGeneration = resultsRenderGeneration;
  var renderNextBatch = function () {
    resultsBackgroundHandle = null;
    resultsBackgroundUsesIdleCallback = false;
    if (
      renderGeneration !== resultsRenderGeneration ||
      !Array.isArray(res) ||
      visibleImages >= res.length
    ) {
      return;
    }

    loadImages(
      visibleImages,
      getVideoBatchEndIndex(visibleImages, backgroundVideoBatchSize),
    );
  };

  if (window.requestIdleCallback) {
    resultsBackgroundUsesIdleCallback = true;
    resultsBackgroundHandle = window.requestIdleCallback(renderNextBatch, {
      timeout: 250,
    });
  } else {
    resultsBackgroundHandle = window.setTimeout(renderNextBatch, 40);
  }
}

function loadImages(startIndex, endIndex) {
  if (resrowIdx == 0 && !resMatrix[0]) resMatrix[resrowIdx] = [];

  // Finish the current video even past endIndex so one video stays on one row.
  var extendedBatch = Math.min(endIndex + numResultsPerVideo - 1, res.length);
  let $currentFrames = null;

  for (var i = startIndex; i < extendedBatch; i++) {
    let imgId = res[i].imgId;
    let videoId = res[i].videoId;
    let score = res[i].score;
    let path = videoId + "/" + imgId;
    let result = imgId.match(regex_to_match_keyframe_number);
    let frameNumber = result ? result[1] || result[2] || result[3] : null;
    let keyframePath = keyFramesUrl + path + ".jpg";

    if (videoId != lastLoadedVideoId) {
      if (i > endIndex && lastLoadedVideoId != "") break;

      if (lastLoadedVideoId != "") {
        resMatrix[++resrowIdx] = [];
        resColIdx = 1;
      } else if (!resMatrix[resrowIdx]) {
        resMatrix[resrowIdx] = [];
      }

      let rowHtml =
        '<div class="video-result-row" data-videoid="' +
        videoId +
        '">' +
        '<div data-videoid="' +
        videoId +
        '" class="video-id-cell item"><a href="showVideoKeyframes.html?videoId=' +
        videoId +
        "&id=" +
        imgId +
        '" target="_blank">' +
        videoId +
        "</a></div>" +
        '<div class="video-frames-scroll" data-videoid="' +
        videoId +
        '"></div>' +
        "</div>" +
        '<div data-videoid="' +
        videoId +
        '" class="hline"></div>';
      $("#imgGridResults").append(rowHtml);
      $currentFrames = $(
        '#imgGridResults .video-frames-scroll[data-videoid="' + videoId + '"]',
      ).last();

      lastLoadedVideoId = videoId;
    } else if (!$currentFrames || !$currentFrames.length) {
      $currentFrames = $(
        '#imgGridResults .video-frames-scroll[data-videoid="' + videoId + '"]',
      ).last();
    }

    let borderColorsIdx = fromIDtoColor(videoId, borderColors.length);
    let videoUrl = videoUrlPrefix + videoId + ".mp4";
    videoUrlPreview = videoshrinkUrl + videoId + ".mp4";
    let thumbnailPath = thumbnailUrl + path + ".webp";
    keyframePath = keyFramesUrl + path + ".jpg";
    resultData = getResultData(
      videoId,
      imgId,
      thumbnailPath,
      imgId,
      frameNumber,
      keyframePath,
      score,
      videoUrl,
      videoUrlPreview,
      resrowIdx,
      resColIdx - 1,
    );

    let isHighPriorityVideo = resrowIdx < videoBatchSize;
    let isTopFrameOfVideo = resColIdx === 1;
    let imgLoading = isHighPriorityVideo || isTopFrameOfVideo ? "eager" : "lazy";
    let imgFetchPriority = isHighPriorityVideo ? "high" : "low";

    let frameHtml =
      '<div data-videoid="' +
      videoId +
      '" id="res_' +
      imgId +
      '" data-row="' +
      resrowIdx +
      '" data-col="' +
      (resColIdx - 1) +
      '" class="item">' +
      imgResult(
        resultData,
        borderColors[borderColorsIdx],
        imgLoading,
        imgFetchPriority,
      ) +
      "</div>";
    $currentFrames.append(frameHtml);
    resMatrix[resrowIdx][resColIdx - 1] = res[i];
    resColIdx++;
    visibleImages++;
  }

  resultsVisualization();

  for (var i = startIndex; i < visibleImages; i++) {
    let imgId = res[i].imgId;
    let score = res[i].score;

    let cip = $("#" + imgId).hover(hoverVideo, hideVideo);

    function hoverVideo(e) {
      id4Regex = this.id.replaceAll("/", "\\/").replaceAll(".", "\\.");
      $("#" + id4Regex).contextmenu(function () {
        imgId = "img" + id4Regex;
        langInfo = this.lang.split("|");
        videoId = langInfo[0];
        videourl = langInfo[1];
        playerId = "video" + videoId;

        var elementExists = document.getElementById(playerId);

        //var startTime = getStartTime(this.id);
        //var endTime = getEndTime(this.id);
        var middleTime = getMiddleTimestamp(this.id);
        var startTime = middleTime - 2;
        var endTime = middleTime + 2;
        if (elementExists != null) {
          var player = $("#" + playerId).get(0);
          player.pause();
          player.src = videourl + "#t=" + startTime + "," + endTime;
          player.load();
          player.play();
          return;
        }
        backgroundImg =
          "background-image: url('" + thumbnailUrl + "/" + this.id + "')";

        //imgGridResults = '<div class="video"><video style="' + backgroundImg + '" id="' + playerId + '" title="'+ this.alt+ '" class="myimg-thumbnail" loop preload="none"><source src="' + this.title + '" type="video/mp4"></video></div>'
        //imgGridResults = '<video style="' + backgroundImg + '" id="' + playerId + '" title="'  + this.title + '" class="myimg video" loop muted preload="none"><source src="' + videourl + '" type="video/mp4"></video>'
        //imgGridResults = '<video style="' + backgroundImg + '" id="' + playerId + '" class="myimg video" loop muted preload="none"><source src="' + videourl + '" type="video/mp4"></video>'
        imgGridResults =
          '<video id="' +
          playerId +
          '" class="myimg video" autoplay loop muted preload="none"><source src="' +
          videourl +
          "#t=" +
          startTime +
          "," +
          endTime +
          '" type="video/mp4"></video>';
        $("#" + imgId).css("display", "none");
        $("#" + id4Regex).append(imgGridResults);
        //$('#'+ playerId).get(0).currentTime = time-1;
        //$('#'+ playerId).get(0).play();
        return false;
      });
    }

    function hideVideo(e) {
      id4Regex = this.id.replaceAll("/", "\\/").replaceAll(".", "\\.");

      imgId = "img" + id4Regex;
      langInfo = this.lang.split("|");
      videoId = langInfo[0];
      videourl = langInfo[1];
      playerId = "video" + videoId;

      var elementExists = document.getElementById(playerId);
      if (elementExists != null) {
        $("#" + playerId).remove();
        $("#" + imgId).css("display", "block");
      }
    }
  }

  scheduleFillResultsViewport();
}

function getResultData(
  videoId,
  imgId,
  thumb,
  frameName,
  frameNumber,
  keyframePath,
  score,
  videoUrl,
  videoUrlPreview,
  rowIdx,
  colIdx,
) {
  let resultData = new Object();
  resultData.videoId = videoId;
  resultData.imgId = imgId;
  resultData.thumb = thumb;
  resultData.frameName = frameName;
  resultData.frameNumber = frameNumber;
  resultData.keyframe = keyframePath;

  resultData.score = score;
  resultData.videoUrl = videoUrl;
  resultData.videoUrlPreview = videoUrlPreview;
  resultData.rowIdx = rowIdx;
  resultData.colIdx = colIdx;
  return resultData;
}

function getTaskType() {
  return localStorage.getItem("taskType");
}

function setTaskType(taskType) {
  if (taskType == null) sessionStorage.setItem("taskType", defaultTaskType);
  else sessionStorage.setItem("taskType", taskType);

  localStorage.setItem("taskType", sessionStorage.getItem("taskType"));
  $('input[name="option"][value="' + getTaskType() + '"]').prop(
    "checked",
    true,
  );
  $('input[name="utility-option"][value="' + getTaskType() + '"]').prop(
    "checked",
    true,
  );
  $("#taskTypeLabel").text(getTaskType().toUpperCase());
}

function submitResult(id, videoId, textAnswer = null, isAsync = false) {
  return $.ajax({
    type: "GET",
    async: isAsync,
    url:
      urlVBSService +
      "/submitResult?id=" +
      id +
      "&videoid=" +
      videoId +
      "&textAnswer=" +
      textAnswer +
      "&taskType=" +
      getTaskType(),
  }).responseText;
}

function openUserInfo() {
  const userName = String(config?.ui?.["user-name"] || "User").trim() || "User";
  const userInfoName = document.getElementById("userInfoName");
  if (userInfoName) userInfoName.textContent = userName;
  $("#userInfoModal").prop("hidden", false);
}

function closeUserInfo() {
  $("#userInfoModal").prop("hidden", true);
}

function getFrameIndexFromId(frameId) {
  const match = String(frameId || "").match(/-(\d+)(?:\.[^.]+)?$/);
  return match ? parseInt(match[1], 10) : NaN;
}

function getExternalSubmissionFrameId(selectedItem) {
  const frameId = getFrameIndexFromId(selectedItem && selectedItem.imgId);
  if (isFinite(frameId)) return frameId;

  const frameNumber = parseInt(selectedItem && selectedItem.frameNumber, 10);
  return isFinite(frameNumber) ? frameNumber : NaN;
}

function formatExternalSubmissionResponse(response, body) {
  const statusText = response.statusText ? " " + response.statusText : "";
  const content = body ? JSON.stringify(body, null, 2) : "(empty response)";
  return "HTTP " + response.status + statusText + "\n\n" + content;
}

function getSubmissionQueryName() {
  const localInput = document.getElementById("queryName");
  let val = localInput ? localInput.value.trim() : "";

  if (!val) {
    try {
      val = (localStorage.getItem("queryName") || "").trim();
    } catch (_) {}
  }

  if (!val) {
    try {
      val = window.opener?.document?.getElementById("queryName")?.value.trim() || "";
    } catch (_) {}
  }

  if (!val) {
    try {
      val = (window.opener?.localStorage?.getItem("queryName") || "").trim();
    } catch (_) {}
  }

  if (!val) {
    const inputVal = prompt("Enter Query name before submitting:", "");
    if (inputVal && inputVal.trim()) {
      val = inputVal.trim();
    }
  }

  if (val) {
    try {
      localStorage.setItem("queryName", val);
    } catch (_) {}
    if (localInput && localInput.value !== val) {
      localInput.value = val;
    }
  }

  return val;
}

$(document).on("input change keyup", "#queryName", function () {
  const val = $(this).val().trim();
  try {
    if (val) {
      localStorage.setItem("queryName", val);
    } else {
      localStorage.removeItem("queryName");
    }
  } catch (_) {}
});

window.addEventListener("storage", function (event) {
  if (event.key === "queryName") {
    const val = event.newValue || "";
    const localInput = document.getElementById("queryName");
    if (localInput && localInput.value !== val) {
      localInput.value = val;
    }
  }
});

$(function () {
  const localInput = document.getElementById("queryName");
  if (localInput) {
    try {
      const saved = (localStorage.getItem("queryName") || "").trim();
      if (saved) {
        localInput.value = saved;
      } else if (localInput.value.trim()) {
        localStorage.setItem("queryName", localInput.value.trim());
      }
    } catch (_) {}
  }
});

function getSubmissionImageUrl(selectedItem) {
  if (selectedItem?.image_url) return selectedItem.image_url;
  if (selectedItem?.thumb) return selectedItem.thumb;
  if (selectedItem?.keyframe) return selectedItem.keyframe;
  if (selectedItem?.videoId && selectedItem?.imgId && keyFramesUrl) {
    return keyFramesUrl + selectedItem.videoId + "/" + selectedItem.imgId + ".jpg";
  }
  return "";
}

function submitExternalResult(selectedItem) {
  const fileName = getSubmissionQueryName();
  const imgId = getExternalSubmissionFrameId(selectedItem);

  if (!fileName) {
    return Promise.reject(new Error("Enter a Query name before submitting."));
  }
  if (!selectedItem || !selectedItem.videoId || !isFinite(imgId)) {
    return Promise.reject(new Error("The selected result does not contain a valid video or frame ID."));
  }
  const imageUrl = getSubmissionImageUrl(selectedItem);
  if (!imageUrl && !selectedItem?.image_base64) {
    return Promise.reject(new Error("The selected result does not contain an image to submit."));
  }
  if (!urlVBSService) {
    return Promise.reject(new Error("Submission service URL is not configured."));
  }

  const payload = {
    file_name: fileName,
    video_id: selectedItem.videoId,
    img_id: imgId,
    submitter: "external",
  };
  if (imageUrl) payload.image_url = imageUrl;
  if (selectedItem?.image_base64) payload.image_base64 = selectedItem.image_base64;
  if (selectedItem?.image_mime_type) payload.image_mime_type = selectedItem.image_mime_type;

  return fetchWithTimeout(
    urlVBSService.replace(/\/$/, "") + "/submission/external",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    20000,
  ).then(async function (response) {
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (_) {
      body = { detail: text };
    }
    const serverResponse = formatExternalSubmissionResponse(response, body);
    if (!response.ok) throw new Error(serverResponse);
    return serverResponse;
  });
}

function markResultSubmitted(selectedItem) {
  unselectImg(selectedItem);
}

function askQAAnswer(videoId, timestampMs) {
  return new Promise(function (resolve, reject) {
    let modal = document.getElementById("qaAnswerModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "qaAnswerModal";
      modal.className = "submit-settings-modal kis-submit-confirm-modal";
      modal.innerHTML = '<div class="submit-settings-card kis-submit-confirm-card qa-answer-card">' +
        '<div class="submit-settings-header"><span>QA answer</span><button type="button" class="submit-settings-close" data-qa-cancel>&times;</button></div>' +
        '<div class="qa-answer-context">' + videoId + ' &middot; ' + timestampMs + ' ms</div>' +
        '<label>Answer<textarea id="qaAnswerInput" rows="4" placeholder="Type your answer..."></textarea></label>' +
        '<div class="submit-settings-actions"><button type="button" data-qa-cancel>Cancel</button><button type="button" class="submit-settings-save" data-qa-submit>Submit</button></div>' +
        '</div>';
      document.body.appendChild(modal);
    } else {
      $(modal).find(".qa-answer-context").text(videoId + " · " + timestampMs + " ms");
    }
    $("#qaAnswerInput").val("").trigger("focus");
    $(modal).prop("hidden", false);
    $(modal).off("click.qaAnswer").on("click.qaAnswer", function (event) {
      if (event.target === modal || $(event.target).is("[data-qa-cancel]")) {
        $(modal).prop("hidden", true);
        const cancelled = new Error("QA submission cancelled");
        cancelled.cancelled = true;
        reject(cancelled);
      } else if ($(event.target).is("[data-qa-submit]")) {
        const answer = $("#qaAnswerInput").val().trim();
        if (!answer) {
          alert("Please enter an answer.");
          return;
        }
        $(modal).prop("hidden", true);
        resolve(answer);
      }
    });
  });
}

function showKISServerResponse(title, message, isError) {
  let modal = document.getElementById("kisServerResponseModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "kisServerResponseModal";
    modal.className = "submit-settings-modal kis-submit-confirm-modal";
    modal.innerHTML = '<div class="submit-settings-card kis-submit-confirm-card">' +
      '<div class="submit-settings-header"><span id="kisServerResponseTitle"></span><button type="button" class="submit-settings-close" data-kis-response-close>&times;</button></div>' +
      '<pre id="kisServerResponseBody" class="kis-server-response-body"></pre>' +
      '<div class="submit-settings-actions"><button type="button" class="submit-settings-save" data-kis-response-close>Close</button></div>' +
      '</div>';
    document.body.appendChild(modal);
    $(modal).on("click.kisResponse", function (event) {
      if (event.target === modal || $(event.target).is("[data-kis-response-close]")) $(modal).prop("hidden", true);
    });
  }
  $("#kisServerResponseTitle").text(title);
  $("#kisServerResponseTitle").css("color", isError ? "#a41318" : "#198754");
  $("#kisServerResponseBody").text(message || "(empty response)");
  $(modal).prop("hidden", false);
}

function submitVersion2(selectedItem) {
  showKISServerResponse("Submitting result", "Waiting for the submission service response...", false);
  submitExternalResult(selectedItem)
    .then(function (response) {
      markResultSubmitted(selectedItem);
      showKISServerResponse("Submission successful", response, false);
    })
    .catch(function (error) {
      console.error("Submission failed:", error);
      showKISServerResponse("Submission failed", error.message, true);
    });
  return null;
}
function showOverlay(img_overlay) {
  document.getElementById(img_overlay).style.opacity = 1;
}

function hideOverlay(img_overlay) {
  document.getElementById(img_overlay).style.opacity = 0;
}

const imgResult = (
  res,
  borderColor,
  imgLoading = "lazy",
  imgFetchPriority = "auto",
) => {
  jsonString = JSON.stringify(res);
  return `
		<div class="result-border" style="border-color: ${borderColor};">
			<div class="myimg-thumbnail" id="${res.imgId}" lang="${res.videoId}|${res.videoUrlPreview}" data-img-id="${res.imgId}">
				<img loading="${imgLoading}" fetchpriority="${imgFetchPriority}" decoding="async" id="img${res.imgId}" class="myimg" src="${res.thumb}" onclick='avsToggle(${jsonString}, event)' />
			</div>
			<div id="toolbar_icons_${res.imgId}" class="result-toolbar">
				<a class="result-frame-id" title="View annotations of ${res.frameName}, Score: ${res.score}" href="indexedData.html?videoId=${res.videoId}&id=${res.imgId}" target="_blank">${res.frameNumber}</a>
				<a class="result-action result-action-summary" title="Nearly keyframes" aria-label="Nearly keyframes" href="#" onclick='openNearbyKeyframes(${jsonString}); return false;'><i class="fas fa-th-large" aria-hidden="true"></i></a>
				<a class="result-action result-action-play" href="#" title="Play video" aria-label="Play video" onclick="playVideoWindow('${res.videoUrl}', '${res.videoId}', '${res.imgId}'); return false;"><i class="fas fa-play" aria-hidden="true"></i></a>
				<a class="result-action result-action-similarity isSimplified" href="#" title="Image similarity" aria-label="Image similarity" onclick="var queryObj=new Object(); queryObj.comboVisualSim='${res.imgId}'; searchByLink(queryObj); return false;"><i id="comboSim${res.imgId}" class="fas fa-clone" aria-hidden="true"></i></a>
				<a class="result-action result-action-similarity isAdvanced" href="#" title="Visual similarity (DINOv2)" aria-label="Visual similarity (DINOv2)" onclick="var queryObj=new Object(); queryObj.vf='${res.imgId}'; searchByLink(queryObj); return false;"><i id="gemSim${res.imgId}" class="fas fa-clone" aria-hidden="true"></i></a>
				<a id="submitBTN_${res.imgId}" class="result-action result-action-submit" href="#" title="Submit result" aria-label="Submit result" onclick='submitVersion2(${jsonString}); return false;'><i class="fas fa-paper-plane" aria-hidden="true"></i></a>
			</div>
		</div>
		`;
};

function openChildWindow(videoId, imgId, frameName) {
  var childWindow = window.open(
    "showVideoKeyframes.html?videoId=" +
      videoId +
      "&id=" +
      imgId +
      "#" +
      frameName,
    "_blank",
  );

  // Assegna la funzione o la variabile alla finestra figlia
  childWindow.submitFromChild = function (arg1) {
    // Implementazione della funzione nella finestra figlia
    console.log("submitResults chiamato nella finestra figlia con argomenti:");
  };
}

function playVideoWindow(videoURL, videoId, imgId) {
  let params = `scrollbars=no,status=no,location=no,toolbar=no,menubar=no,width=680,height=640,left=50,top=50`;
  var time = getStartTime(imgId);
  var myWindow = window.open(
    "videoPlayer.html?videoid=" +
      encodeURIComponent(videoId) +
      "&frameid=" +
      encodeURIComponent(imgId) +
      "&url=" +
      encodeURIComponent(videoURL) +
      "&t=" +
      encodeURIComponent(time),
    "playvideo",
    params,
  );
}

function generateUUID(color) {
  var d = new Date().getTime();
  if (window.performance && typeof window.performance.now === "function") {
    d += performance.now(); // use high-precision timer if available
  }
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = ((d + Math.random() * 16) % 16) | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    },
  );
  if (color) uuid = "color_" + uuid;
  return uuid;
}

$(document).on("click", ".deleteBtn", function (event) {
  console.log("active canvas: " + activeCanvasIdx);
  activeCanvas.getObjects().forEach(function (o) {
    if (o.uuid === event.target.id) {
      activeCanvas.discardActiveObject().renderAll();
      activeCanvas.remove(o);
    }
  });
  $("#" + event.target.id).remove();
  searchByForm();
});

function indexedCells(txt) {
  console.log("indexedCells " + txt);
  res = txt.trim().split(" ");
  cellTxt = [];
  for (i = 0; i < res.length; i++) {
    txt = "";
    key = res[i].substring(0, 2);
    if (cellTxt[key]) txt = cellTxt[key];
    style =
      colorMap[res[i].substring(2)] == null
        ? "<div>" + res[i].substring(2) + "</div>"
        : "<div " +
          colorMap[res[i].substring(2)] +
          ">" +
          res[i].substring(2) +
          "</div>";
    txt += style;
    cellTxt[key] = txt;
    console.log(cellTxt[0]);
  }
  imgtable = '<table id="cellTable" style="width: 825px;">';
  imgtable +=
    '<tr><td align="center"></td><td align="center">a</td><td align="center">b</td><td align="center">c</td><td align="center">d</td><td align="center">e</td>	<td align="center">f</td><td align="center">g</td>';
  counter = 0;
  row = 0;
  for (y = 0; y < CELL_ROWS; y++) {
    for (x = 0; x < CELL_COLS; x++) {
      if (counter % CELL_COLS == 0) {
        imgtable += "<tr>";
        imgtable += '<td style="width: 16px;">' + row++ + "</td>";
      }
      imgtable +=
        '<td valign="top" style="border: 1px solid black; width: 115px;">' +
        cellTxt[y.toString() + String.fromCharCode(97 + x)] +
        "</td>";
      counter++;
    }
  }
  imgtable += "</table>";

  $("#txt").append(imgtable);
}

/*
function changeQueryBySampleMod(mode) {
	if (mode == "url") {
		document.getElementById("uploadText").style.display = 'none';
		document.getElementById("uploadLink").style.display = '';
		document.getElementById("urlText").style.display = '';
		document.getElementById("urlLink").style.display = 'none';
		document.getElementById("imageToUpload").style.display = 'none';
		document.getElementById("urlToUpload").style.display = '';
		document.getElementById("imageToUpload").value = '';

		document.getElementById("searchbar").enctype = "";
		document.getElementById("searchbar").method = "GET";
	} else {
		document.getElementById("uploadText").style.display = '';
		document.getElementById("uploadLink").style.display = 'none';
		document.getElementById("urlText").style.display = 'none';
		document.getElementById("urlLink").style.display = '';

		document.getElementById("urlToUpload").style.display = 'none';
		document.getElementById("imageToUpload").style.display = '';
		document.getElementById("urlToUpload").value = '';

		document.getElementById("searchbar").enctype = "multipart/form-data";
		document.getElementById("searchbar").method = "POST";
	}
}
*/

function includeHTML(timeoutMs = 8000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const watchdog = setTimeout(() => {
      console.warn("includeHTML timed out");
      finish();
    }, timeoutMs);

    function processNext() {
      let z = document.getElementsByTagName("*");
      for (let i = 0; i < z.length; i++) {
        let elmnt = z[i];
        let file = elmnt.getAttribute("w3-include-html");
        if (file) {
          let xhttp = new XMLHttpRequest();
          xhttp.timeout = timeoutMs;
          xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
              if (this.status == 200) {
                elmnt.innerHTML = this.responseText;
              } else if (this.status == 404) {
                elmnt.innerHTML = "Page not found.";
              }
              elmnt.removeAttribute("w3-include-html");
              processNext();
            }
          };
          xhttp.ontimeout = function () {
            console.warn("includeHTML request timed out:", file);
            elmnt.removeAttribute("w3-include-html");
            processNext();
          };
          xhttp.onerror = function () {
            console.warn("includeHTML request failed:", file);
            elmnt.removeAttribute("w3-include-html");
            processNext();
          };
          xhttp.open("GET", file, true);
          xhttp.send();
          return;
        }
      }
      clearTimeout(watchdog);
      finish();
    }
    processNext();
  });
}
function sceneHasContent(idx) {
  const fields = ["textual", "not", "ocr", "asr", "tags"];
  for (let i = 0; i < fields.length; i++) {
    if (($("#" + fields[i] + idx).val() || "").trim()) return true;
  }
  if (canvases[idx]) {
    const objs = canvases[idx].getObjects();
    for (let j = 0; j < objs.length; j++) {
      if (objs[j].get("type") != "line") return true;
    }
  }
  return false;
}

function sceneClean(idx) {
  prevTextual[idx] = $("#textual" + idx).val() || "";
  $("#textual" + idx).val("");
  const cancelText = document.getElementById("cancelText" + idx);
  if (cancelText) cancelText.style.display = "none";

  prevTextualMode[idx] = textualMode[idx];
  const defaultMode =
    config &&
    config.ui &&
    config.ui["textual-modes"] &&
    config.ui["textual-modes"][0]
      ? config.ui["textual-modes"][0].mode
      : "all";
  const hasAll =
    config &&
    config.ui &&
    config.ui["textual-modes"] &&
    config.ui["textual-modes"].some(function (m) {
      return m.mode === "all";
    });
  const resetMode = hasAll ? "all" : defaultMode;
  textualMode[idx] = resetMode;
  const modeRadio = document.getElementById(
    "textualMode" + idx + "_" + resetMode,
  );
  if (modeRadio) modeRadio.checked = true;

  prevOccur[idx] = $("#and" + idx).is(":checked");
  const occurRadios = $("input:radio[name=occur" + idx + "]");
  if (occurRadios[0]) occurRadios[0].checked = true;
  occur[idx] = "and";

  prevNotField[idx] = $("#not" + idx).val() || "";
  $("#not" + idx).val("");

  prevOcrField[idx] = $("#ocr" + idx).val() || "";
  $("#ocr" + idx).val("");

  prevAsrField[idx] = $("#asr" + idx).val() || "";
  $("#asr" + idx).val("");

  prevTagsField[idx] = $("#tags" + idx).val() || "";
  $("#tags" + idx).val("");

  $("#rewrite" + idx).val("");
  const rewriteOut = document.getElementById("rewrite" + idx);
  if (rewriteOut) {
    rewriteOut.placeholder =
      "Rewritten query appears here — edit, then apply to textual above";
  }

  if ($("#isColor" + idx).is(":checked")) {
    prevIsColor[idx] = true;
  } else prevIsColor[idx] = false;
  $("#isColor" + idx).prop("checked", false);

  if ($("#isGray" + idx).is(":checked")) {
    prevIsGray[idx] = true;
  } else prevIsGray[idx] = false;
  $("#isGray" + idx).prop("checked", false);

  if (!canvases[idx]) return;
  prevCanvasObjects[idx] = canvases[idx].getObjects();

  canvases[idx].discardActiveObject().renderAll();
  canvases[idx].getObjects().forEach(function (o) {
    if (o.get("type") != "line") {
      $("#" + o.get("uuid")).hide();
      canvases[idx].remove(o);
    }
  });
}

function reset() {
  for (let i = 0; i < tempSearchForms; i++) {
    sceneClean(i);
  }
  resetCanvas();
}

function undoReset() {
  for (let i = 0; i < tempSearchForms; i++) {
    sceneCleanUndo(i);
  }
  undoCanvas();
}

function sceneCleanUndo(idx) {
  const textualVal = prevTextual[idx] || "";
  $("#textual" + idx).val(textualVal);
  const cancelText = document.getElementById("cancelText" + idx);
  if (cancelText)
    cancelText.style.display = textualVal === "" ? "none" : "block";

  if (prevTextualMode[idx]) {
    textualMode[idx] = prevTextualMode[idx];
    const modeRadio = document.getElementById(
      "textualMode" + idx + "_" + prevTextualMode[idx],
    );
    if (modeRadio) modeRadio.checked = true;
  }

  if (prevOccur[idx] == false) {
    const radios = $("input:radio[name=occur" + idx + "]");
    if (radios[1]) radios[1].checked = true;
    occur[idx] = "or";
  } else {
    occur[idx] = "and";
  }

  if (prevIsColor[idx] == true) $("#isColor" + idx).prop("checked", true);

  if (prevIsGray[idx] == true) $("#isGray" + idx).prop("checked", true);

  $("#not" + idx).val(prevNotField[idx] || "");
  $("#ocr" + idx).val(prevOcrField[idx] || "");
  $("#asr" + idx).val(prevAsrField[idx] || "");
  $("#tags" + idx).val(prevTagsField[idx] || "");

  if (prevCanvasObjects[idx]) {
    prevCanvasObjects[idx].forEach(function (o) {
      if (o.get("type") != "line") {
        canvases[idx].add(o);
        $("#" + o.get("uuid")).show();
      }
    });
  }
}

function canvasClean(idx) {
  sceneClean(idx);
}

function canvasCleanUndo(idx) {
  sceneCleanUndo(idx);
}

function displayAdvancedToggle() {
  // Advanced mode is always on; toggle removed from UI.
  isAdvanced = true;
  displayAdvanced();
  resultsVisualization();
}

function resultsVisualization() {
  $(".isAdvanced").css("display", "inline-block");
  $(".isSimplified").css("display", "none");
}

function displayAdvanced() {
  isAdvanced = true;
  document.body.classList.add("advanced-mode");
  applySidebarLayout();
  $(
    ".sidebar-scroll, .sidebar-fixed, .sidebar-header, .advanced-only, .advanced",
  ).css("display", "");
  $("#visionelogo")
    .addClass("visioneLogo sidebar-brand")
    .removeClass("visioneLogo_bigger");
}

function isSidebarCollapsed() {
  return localStorage.getItem("sidebarCollapsed") === "1";
}

function applySidebarLayout() {
  const collapsed = isSidebarCollapsed();
  const $body = $(".bodyGrid");
  const $sidebar = $(".sidebarGrid");
  const $btn = $("#sidebarToggle");

  if (collapsed) {
    $body.addClass("sidebar-collapsed");
    $sidebar.css({ width: "28px", maxWidth: "28px", display: "flex" });
    $body.css("grid-template-columns", "28px minmax(0, 1fr) auto");
    $btn.attr("aria-expanded", "false").attr("title", "Hiện thanh công cụ");
  } else {
    $body.removeClass("sidebar-collapsed");
    $sidebar.css({ width: "320px", maxWidth: "320px", display: "flex" });
    $body.css("grid-template-columns", "320px minmax(0, 1fr) auto");
    $btn.attr("aria-expanded", "true").attr("title", "Ẩn thanh công cụ");
  }
}

function toggleSidebar() {
  localStorage.setItem("sidebarCollapsed", isSidebarCollapsed() ? "0" : "1");
  applySidebarLayout();
}

function initLayout() {
  isAdvanced = true;
  // The sidebar is always visible; its former collapse control is replaced by
  // the fixed utility bar at the top of the page.
  localStorage.setItem("sidebarCollapsed", "0");
  document.body.classList.add("advanced-mode");
  applySidebarLayout();
  $("#visionelogo").addClass("visioneLogo sidebar-brand");
}

//create a function that create an input text with a microphone icon inside the input text
function createInputTextWithMic() {
  var inputText = document.createElement("input");
  inputText.setAttribute("type", "text");
  inputText.setAttribute("id", "inputText");
  inputText.setAttribute("class", "form-control");
  inputText.setAttribute("placeholder", "Search by voice");
  var micIcon = document.createElement("i");
  micIcon.setAttribute("class", "fa fa-microphone");
  micIcon.setAttribute("id", "micIcon");
  micIcon.setAttribute("aria-hidden", "true");
  micIcon.setAttribute("onclick", "startDictation(event)");
  inputText.appendChild(micIcon);
  console.log(inputText);
  return inputText;
}

function scrollToRow(rowNumber) {
  var colIdx = 0;

  var container = document.querySelector(".resGrid2");

  var containerTop = container.offsetTop;
  var containerHeight = container.offsetHeight;
  var containerBottom = containerTop + containerHeight;

  var row = document.getElementById(
    "img" + resMatrix[Math.max(0, rowNumber)][colIdx].imgId,
  );

  var rowTop = row.offsetTop;
  var rowHeight = row.offsetHeight;

  container.scrollTop = rowTop - containerTop - rowHeight / 2;

  /*
		if (rowTop - t < containerTop) {
			// La riga è sopra la parte correntemente visibile
			container.scrollTop = rowTop;
		} else if (rowTop -t > containerHeight) {
			// La riga è sotto la parte correntemente visibile
			container.scrollTop = rowTop - rowHeight - containerHeight;
		}*/

  /*
		if (rowTop < containerTop) {
			// La riga è sopra la parte correntemente visibile
			container.scrollTop = rowTop;
		} else if (rowTop + rowHeight > containerTop + containerHeight) {
			// La riga è sotto la parte correntemente visibile
			container.scrollTop = rowTop - rowHeight - containerHeight;
		}*/
}

function unscrollToRow(rowNumber) {
  var colIdx = 0;

  var container = document.querySelector(".resGrid2");
  var containerTop = container.offsetTop;

  var row = document.getElementById(
    "img" + resMatrix[Math.max(0, rowNumber)][colIdx].imgId,
  );

  var rowTop = row.offsetTop;

  // La riga è sopra la parte correntemente visibile
  //valore hardcoded. Bisognerebbe calcolare l'altezza dell'immagine selezionata
  container.scrollTop = rowTop - -rowHeight / 2;
}

//var colIdx = 0;
var selectContentOffsetY = 0;
var selectContentOffsetX = 0;
var gridOffsetY = -selectContentOffsetY;
var gridOffsetX = -selectContentOffsetX;
var gridOffsetY = -selectContentOffsetY;
var gridOffsetX = -selectContentOffsetX;
var lastSelected = null;
var prevSelected = null;
var scrollOffset = -1.5;
var rowHeight = 0;
var scrollingOffset = 0;

function translateText(textQuery, idx) {
  $.ajax({
    type: "POST",
    async: true,
    crossDomain: true,
    data: { text: textQuery, lang: localStorage.getItem("selectedLang") },
    dataType: "text",
    url: translateService + "/text",
    success: function (data) {
      console.log(data);
      setTranslate(data, idx);
    },
    error: function (data) {
      setTranslate(null, idx);
    },
  });
  //return JSON.parse('{"lang":"it","translated":true,"translation":"the pipo"}');
}

function initSupportedLanguages() {
  localStorage.setItem(
    "supportedLanguages",
    '{"AutoDetect": "auto", "Afrikaans": "afr", "Arabic": "arb", "Armenian": "hye", "Belarusian": "bel", "Bosnian": "bos", "Bulgarian": "bul", "Chinese": "cmn", "Croatian": "hrv", "Czech": "ces", "Danish": "dan", "Dutch": "nld", "Estonian": "est", "Finnish": "fin", "French": "fra", "Georgian": "kat", "German": "deu", "Greek": "ell", "Hebrew": "heb", "Hindi": "hin", "Hungarian": "hun", "Icelandic": "isl", "Indonesian": "ind", "Irish": "gle", "Italian": "ita", "Japanese": "jpn", "Korean": "kor", "Lithuanian": "lit", "Macedonian": "mkd", "Malayalam": "mal", "Maltese": "mlt", "Nepali": "npi", "Norwegian": "nno", "Polish": "pol", "Portuguese": "por", "Romanian": "ron", "Russian": "rus", "Serbian": "srp", "Slovak": "slk", "Slovenian": "slv", "Spanish": "spa", "Swedish": "swe", "Turkish": "tur", "Ukrainian": "ukr", "Vietnamese": "vie"}',
  );

  if (localStorage.getItem("supportedLanguages") == null) {
    $.ajax({
      type: "POST",
      async: true,
      crossDomain: true,
      data: {},
      dataType: "text",
      url: translateService + "/supported_languages",
      success: function (data) {
        console.log(data);
        localStorage.setItem("supportedLanguages", data);
        setSupportedLanguages(0);
        setSupportedLanguages(1);
      },
      error: function (data) {
        console.log("Error loading supported languages " + data);
      },
    });
  } else {
    setSupportedLanguages(0);
    setSupportedLanguages(1);
  }
  //return JSON.parse('{"lang":"it","translated":true,"translation":"the pipo"}');
}

function setSupportedLanguages(id) {
  supportedLanguages = JSON.parse(localStorage.getItem("supportedLanguages"));

  var selectElement = document.getElementById("supportedLang" + id);

  // Popola l'elemento select con le opzioni del dizionario
  /*for (var key in supportedLanguages) {
	  if (supportedLanguages.hasOwnProperty(key)) {
		var option = document.createElement('option');
		option.value = supportedLanguages[key];
		option.text = key;
		selectElement.add(option);
	  }
	}*/

  $.each(supportedLanguages, function (key, value) {
    var isSelected = value === localStorage.getItem("selectedLang");
    $("#supportedLang" + id).append(
      $("<option>", {
        text: key,
        value: value,
        selected: isSelected,
      }),
    );
  });

  $("#supportedLang0, #supportedLang1").on("change", function () {
    var selectedValue = $(this).val();
    localStorage.setItem("selectedLang", selectedValue);
    var otherSelect = $(this).is("#supportedLang0")
      ? $("#supportedLang1")
      : $("#supportedLang0");
    otherSelect.val(selectedValue);
  });
}

function checkKey(e) {
  if (!resMatrix || resMatrix.length == 0) return;

  e = e || window.event;
  //console.log(e.keyCode)
  var goToNextResult = false;

  /*var activeElement = document.activeElement;
	if (activeElement && /^textual\d+$/.test(activeElement.id)) {
		var idx = parseInt(activeElement.id.replace("textual", ""), 10);

		console.log(activeElement.id);
		if (e.key === 'Enter') {
			var textQuery =  activeElement.value;
			if (textQuery.length > 0) {
				if (document.getElementById("isTranslate" + idx).checked)
					translateText(textQuery, idx);
			console.log(activeElement.value);
			}
		  }
		return;
	}
	else if (activeElement.tagName == "INPUT" || activeElement.getAttribute("type") == "text" || activeElement.tagName === "TEXTAREA" || avsManually.size === 0) {
		return;
	}*/
  var activeElement = document.activeElement;
  //if (activeElement.tagName == "INPUT" || activeElement.getAttribute("type") == "text" || activeElement.tagName === "TEXTAREA" || avsManually.size === 0)
  if (
    activeElement.tagName == "INPUT" ||
    activeElement.getAttribute("type") == "text" ||
    activeElement.tagName === "TEXTAREA"
  )
    return;

  if (e.keyCode == "65") {
    //var mouseOverEvent = new Event('mouseenter');

    //let imgId4Regex = lastSelected.id.replaceAll("/", "\\/").replaceAll(".", "\\.")
    /*if (prevSelected != null) {
			let prevImgId4Regex = prevSelected.id.replaceAll("/", "\\/").replaceAll(".", "\\.")
			$('#' + prevImgId4Regex).off("contextmenu");
		}*/

    //$('#' + imgId4Regex).off("contextmenu")
    //$('#' + imgId4Regex).trigger( "contextmenu" );
    /*var testElement = $('#' + imgId4Regex);

		console.log(testElement);
		var rightClickEvent = $.Event("contextmenu");

		testElement.trigger(rightClickEvent);*/

    if (prevSelected != null) {
      var prevSel = document.getElementById(prevSelected.id);
      var mouseOutEvent = new MouseEvent("mouseout", {
        bubbles: true,
        cancelable: true,
      });

      prevSel.dispatchEvent(mouseOutEvent);
    }

    var testDiv = document.getElementById(lastSelected.id);

    var mouseOverEvent = new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    });

    testDiv.dispatchEvent(mouseOverEvent);

    var rightClickEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    testDiv.dispatchEvent(rightClickEvent);

    /*

				testDiv.addEventListener("contextmenu", function(event) {
					event.preventDefault(); // Opzionale: previene il menu contestuale predefinito
					// Inserisci qui il tuo codice per l'evento click del tasto destro del mouse
				  });
		*/

    //testDiv.dispatchEvent(mouseOverEvent);
  } else if (e.keyCode == "83") {
    //replace img to submitBTN_
    submitId = lastSelected.id.replace("img", "submitBTN_");
    document.getElementById(submitId).click();
    //submitBTN_${res.imgId}

    //submitVersion2()
    goToNextResult = true;
  } else if (e.keyCode == "38") {
    selectPrevResult();
    /*
		colIdx = 0;
		rowIdx = Math.max(0, rowIdx - 1);
		//console.log(resCursor)
		//$("#" + res[resCursor--].imgId).click();
		var element = document.getElementById("img" + resMatrix[rowIdx][colIdx].imgId);
		if (lastSelected != null) {
			lastSelected.click();
		}
		prevSelected = lastSelected;
		lastSelected = element;

		// Chiamare l'evento onclick
		element.click();*/

    //scrollToRow(rowIdx);

    /*
				var container = document.querySelector('.resGrid2');

				var containerTop = container.getBoundingClientRect().top;
				var containerBottom = containerTop + container.offsetHeight;

				var percentVisible = 0;
				numCycle = 0;
				while (percentVisible < 100 && numCycle++ < 10) {
					var elementTop = element.getBoundingClientRect().top;
					var elementBottom = elementTop + element.offsetHeight;

					if (elementTop >= containerTop && elementTop <= containerBottom) {
						var visibleHeight = Math.min(elementBottom, containerBottom) - elementTop;
						var elementHeight = element.offsetHeight;
						var percentVisible = (visibleHeight / elementHeight) * 100;
					}
					if (percentVisible < 100) {
						var gridContent = $("#content").find(".resGrid2");
						scrollingOffset = Math.max(0, scrollingOffset - 250)
						gridContent.animate({ scrollTop: scrollingOffset }, 0);
					}
					console.log("percentVisible: " + percentVisible);
				}
		*/

    /*gridOffsetY = Math.max(0, gridOffsetY - rowHeight);
		var gridContent = $("#content").find(".contentGrid");
		gridContent.animate({ scrollTop: gridOffsetY }, 0);
		rowHeight = document.getElementById("res_" + resMatrix[resCursor][colIdx].imgId).offsetHeight + scrollOffset;*/

    //console.log("up arrow")
  }
  if (e.keyCode == "40" || goToNextResult) {
    loadingNextResults();

    selectNextResult();

    //scrollToRow(rowIdx);

    /*

				var container = document.querySelector('.resGrid2');

				var containerTop = container.getBoundingClientRect().top;
				var containerBottom = containerTop + container.offsetHeight;

				var percentVisible = 0;
				numCycle = 0;
				while (percentVisible < 100 && numCycle++ < 10) {

					var elementTop = element.getBoundingClientRect().top;
					var elementBottom = elementTop + element.offsetHeight;

					if (elementTop >= containerTop && elementTop <= containerBottom) {
						var visibleHeight = Math.min(elementBottom, containerBottom) - elementTop;
						var elementHeight = element.offsetHeight;
						percentVisible = (visibleHeight / elementHeight) * 100;
					}
					if (percentVisible < 100) {
						var gridContent = $("#content").find(".resGrid2");
						scrollingOffset += 250
						gridContent.animate({ scrollTop: scrollingOffset }, 0);
					}
					console.log("percentVisible: " + percentVisible);
				}
				/*

						var gridItems = container.querySelectorAll('.item');
						var selectedRow = gridItems[resCursor]; // Riga 25 (indice 24 considerando 0-based index)

						var containerTop = container.getBoundingClientRect().top;
						var containerHeight = container.offsetHeight;
						var selectedRowTop = selectedRow.getBoundingClientRect().top;

						if (selectedRowTop >= containerTop && selectedRowTop <= containerTop + containerHeight) {
						console.log("La riga 25 è visibile");
						} else {
							console.log("La riga 25 è al di sotto dello scroll");
							gridOffsetY = gridOffsetY + rowHeight ;
							var gridContent = $("#content").find(".contentGrid");
							//gridContent.animate({ scrollTop: gridOffsetY }, 0);
							gridContent.animate({ scrollTop: 200 }, 0);

							resRow = document.getElementById("res_" + resMatrix[resCursor][colIdx].imgId)
							rowHeight = resRow.offsetHeight - scrollOffset
						}*/

    //console.log("down arrow")
  } else if (e.keyCode == "37") {
    colIdx = Math.max(0, colIdx - 1);
    var element = document.getElementById(
      "img" + resMatrix[rowIdx][Math.max(0, colIdx)].imgId,
    );
    if (lastSelected != null) {
      lastSelected.click();
    }
    prevSelected = lastSelected;
    lastSelected = element;
    element.click();
    scrollResultIntoView(element);
  } else if (e.keyCode == "39") {
    ++colIdx;
    try {
      var element = document.getElementById(
        "img" + resMatrix[rowIdx][colIdx].imgId,
      );
    } catch (error) {
      --colIdx;
      return;
    }
    if (lastSelected != null) {
      lastSelected.click();
    }
    prevSelected = lastSelected;
    lastSelected = element;
    element.click();
    scrollResultIntoView(element);
  }
}

function scrollResultIntoView(element) {
  if (!element) return;
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function selectNextResult() {
  while (rowIdx < resMatrix.length - 1) {
    try {
      //if (rowIdx >= (resMatrix.length - 1))
      //return;
      colIdx = 0;
      rowIdx++;
      //console.log(rowIdx)

      //$("#" + res[resCursor++].imgId).click();
      var element = document.getElementById(
        "img" + resMatrix[rowIdx][colIdx].imgId,
      );
      if (lastSelected != null) {
        lastSelected.click();
      }
      prevSelected = lastSelected;
      lastSelected = element;

      // Chiamare l'evento onclick
      element.click();
      break;
    } catch (error) {
      console.log(error);
    }
  }
}

function selectPrevResult() {
  while (rowIdx > 0) {
    try {
      colIdx = 0;
      //rowIdx = Math.max(0, rowIdx - 1);
      rowIdx--;
      //console.log(resCursor)
      //$("#" + res[resCursor--].imgId).click();
      var element = document.getElementById(
        "img" + resMatrix[rowIdx][colIdx].imgId,
      );
      if (lastSelected != null) {
        lastSelected.click();
      }
      prevSelected = lastSelected;
      lastSelected = element;

      // Chiamare l'evento onclick
      element.click();
      break;
    } catch (error) {
      console.log(error);
    }
  }
}

async function init() {
  setTaskType(sessionStorage.getItem("taskType"));

  document.onkeydown = checkKey;
  if (localStorage.getItem("selectedLang") == null) {
    localStorage.setItem("selectedLang", defaultLanguage);
  }

  $(function () {
    $("#dialog").dialog({
      autoOpen: false,
    });
  });
  try {
    await includeHTML();
    await loadConfig();
  } catch (err) {
    console.error("init bootstrap failed:", err);
    config = config || {};
  }
  //localStorage.setItem('isQA', false);
  collectionName = config?.main?.collection_name || "Salamanders";
  $("#visionelogo").append(
    "<h2><label id='collectionLabel'>" +
      collectionName +
      "</label>" +
      " - <label id='taskTypeLabel'>" +
      (localStorage.getItem("taskType") || defaultTaskType).toUpperCase() +
      "</label></h2>",
  );

  if (config?.main?.collection_name)
    document.title = config.main.collection_name + " - " + document.title;
  setNumResultsPerVideo();
  initVideoTypeAndK();
  const videoIdInput = document.getElementById("videoIdInput");
  if (videoIdInput) {
    videoIdInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        searchByForm();
      }
    });
  }
  loadPalette();
  initSearchScenes();

  $("#resultsContent").on("dragover", allowCanvasDrop);
  $("#resultsContent").on("drop", dropImage);

  $("#reset").on("click", function (e) {
    if (!isReset) {
      isReset = true;
      reset();
      searchByForm();
    }
  });

  $("#undoReset").on("click", function (e) {
    if (isReset) {
      isReset = false;
      undoReset();
      searchByForm();
    }
  });

  initLayout();
  displayAdvanced();
  initObjectIconsPanel();
  initResultDragScroll();

  var script = document.createElement("script");
  script.src = "js/WebAudioRecorder/WebAudioRecorder.min.js";
  document.head.appendChild(script);
  script = document.createElement("script");
  script.src = "js/WebAudioRecorder/audioRecorder.js";
  document.head.appendChild(script);

  /*var script = document.createElement('script');
	script.src = "js/WebAudioRecorder/WebAudioRecorder.min.js";
	document.head.appendChild(script)
	script = document.createElement('script');
	script.src = "js/WebAudioRecorder/audioRecorder.js";
	document.head.appendChild(script)

	const microphoneIcon = document.querySelector('.microphone-icon');
	const inputText = document.querySelector('input[type="text"]');

	microphoneIcon.addEventListener('click', () => {
	  // Avvia la registrazione audio
	  console.log('Registrazione audio avviata');
	});*/

  var imgGridResultsElement = document.getElementById("imgGridResults");

  /*
	imgGridResultsElement.addEventListener('scroll', function() {
		// Verifica se l'utente ha raggiunto la fine della pagina
		console.log('Scrolled!');
		if (visibleImages < res.length && window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
			// Carica il prossimo batch di immagini (ad esempio, altre 100 immagini)
			var nextBatchEndIndex = Math.min(visibleImages + batchSize, res.length);
			loadImages(visibleImages, nextBatchEndIndex);
		}
	});*/

  var resultsElement = $("#results");

  resultsElement.on("scroll mousewheel", function () {
    loadingNextResults();
  });
}

function loadingNextResults() {
  var resultsElement = $("#results");

  var containerHeight = resultsElement.height();
  var scrollableHeight = resultsElement.prop("scrollHeight");

  if (res != null) {
    if (
      visibleImages < res.length &&
      resultsElement.scrollTop() + resultsElement.innerHeight() >=
        scrollableHeight - 200
    ) {
      // Load the next ranked video groups only when the user nears the bottom.
      var nextBatchEndIndex = getVideoBatchEndIndex(
        visibleImages,
        videoBatchSize,
      );
      loadImages(visibleImages, nextBatchEndIndex);
    }
  }
}

function initObjectIconsPanel() {
  const panel = document.getElementById("objectIconsPanel");
  const toggleButton = document.getElementById("objectIconsToggle");
  const header = document.querySelector(".object-icons-header");

  if (!panel || !toggleButton || !header) {
    return;
  }

  const applyState = (collapsed) => {
    panel.classList.toggle("is-collapsed", collapsed);
    toggleButton.setAttribute("aria-expanded", String(!collapsed));
    toggleButton.title = collapsed
      ? "Mở rộng vùng icon object"
      : "Thu gọn vùng icon object";

    const icon = toggleButton.querySelector("i");
    if (icon) {
      icon.className = collapsed ? "fa fa-chevron-right" : "fa fa-chevron-down";
    }
  };

  const storedState = localStorage.getItem("objectIconsCollapsed");
  if (storedState === "true") {
    applyState(true);
  } else {
    applyState(false);
  }

  toggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const nextCollapsed = !panel.classList.contains("is-collapsed");
    applyState(nextCollapsed);
    localStorage.setItem("objectIconsCollapsed", String(nextCollapsed));
  });

  header.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    const nextCollapsed = !panel.classList.contains("is-collapsed");
    applyState(nextCollapsed);
    localStorage.setItem("objectIconsCollapsed", String(nextCollapsed));
  });
}

function initResultDragScroll() {
  const root = document.getElementById("imgGridResults");
  if (!root || root.dataset.dragScrollBound === "true") return;
  root.dataset.dragScrollBound = "true";

  let dragState = null;
  let suppressClickScroller = null;
  let suppressClickTimer = null;
  const interactiveSelector = "a, button, input, textarea, select, [role='button']";

  root.addEventListener("dragstart", function (event) {
    if (event.target.closest(".video-frames-scroll img")) event.preventDefault();
  });

  root.addEventListener("pointerdown", function (event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const scroller = event.target.closest(".video-frames-scroll");
    if (!scroller || event.target.closest(interactiveSelector)) return;

    dragState = {
      pointerId: event.pointerId,
      scroller: scroller,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
      moved: false,
    };
  });

  root.addEventListener("pointermove", function (event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    if (!dragState.moved) {
      if (Math.abs(deltaX) < 5) return;
      dragState.moved = true;
      dragState.scroller.setPointerCapture(event.pointerId);
      dragState.scroller.classList.add("is-dragging");
    }
    dragState.scroller.scrollLeft = dragState.startScrollLeft - deltaX;
    event.preventDefault();
  });

  function finishDrag(event, cancelled) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const state = dragState;
    dragState = null;
    state.scroller.classList.remove("is-dragging");
    if (state.scroller.hasPointerCapture(event.pointerId)) {
      state.scroller.releasePointerCapture(event.pointerId);
    }

    if (state.moved && !cancelled) {
      suppressClickScroller = state.scroller;
      clearTimeout(suppressClickTimer);
      suppressClickTimer = setTimeout(function () {
        suppressClickScroller = null;
      }, 0);
    }
  }

  root.addEventListener("pointerup", function (event) {
    finishDrag(event, false);
  });

  root.addEventListener("pointercancel", function (event) {
    finishDrag(event, true);
  });

  root.addEventListener(
    "click",
    function (event) {
      const scroller = event.target.closest(".video-frames-scroll");
      if (!suppressClickScroller || scroller !== suppressClickScroller) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClickScroller = null;
      clearTimeout(suppressClickTimer);
    },
    true,
  );
}

function loadPalette() {
  let palette = config?.ui?.objects?.palette || [];
  let dataArray = [];
  palette.forEach((item) => {
    if (item.name)
      dataArray.push([
        item.name,
        "palette/" + (item.url || item.name + ".png"),
      ]);
    if (item.break) dataArray.push(["-------"]);
  });

  setPalette(dataArray);
  return dataArray;
}

function setNumResultsPerVideo() {
  numResultsPerVideo = config?.ui?.["max-results-per-video"] ?? 10;
}

function initVideoTypeAndK() {
  const types = config?.ui?.["video-types"] || [
    "all",
    "news",
    "cycling",
    "cooking",
    "lecture",
  ];
  const select = document.getElementById("videoTypeSelect");
  if (select) {
    select.innerHTML = "";
    types.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type;
      select.appendChild(opt);
    });
    select.value = "all";
    videoType = "all";
    initVideoTypeDropdown(select);
  }

  const kDefault = config?.ui?.k ?? 1000;
  const kMin = config?.ui?.["k-min"] ?? 100;
  const kMax = config?.ui?.["k-max"] ?? 10000;
  const slider = document.getElementById("kSlider");
  if (slider) {
    slider.min = kMin;
    slider.max = kMax;
    slider.value = kDefault;
  }
  setTopK(kDefault, false);
}

function initVideoTypeDropdown(select) {
  const dropdown = document.getElementById("videoTypeDropdown");
  const selected = document.getElementById("videoTypeSelected");
  const options = document.getElementById("videoTypeOptions");
  if (!dropdown || !selected || !options) return;

  const syncSelectedLabel = function () {
    const activeOption = select.options[select.selectedIndex];
    selected.textContent = activeOption ? activeOption.textContent : "all";
    Array.from(options.children).forEach(function (item) {
      const isSelected = item.dataset.value === select.value;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-selected", String(isSelected));
    });
  };

  options.replaceChildren();
  Array.from(select.options).forEach(function (option) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "modern-video-option";
    item.textContent = option.textContent;
    item.dataset.value = option.value;
    item.setAttribute("role", "option");
    item.addEventListener("click", function () {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncSelectedLabel();
      dropdown.open = false;
    });
    options.appendChild(item);
  });

  select.addEventListener("change", syncSelectedLabel);
  syncSelectedLabel();

  if (!dropdown.dataset.outsideCloseBound) {
    document.addEventListener("pointerdown", function (event) {
      if (!dropdown.contains(event.target)) dropdown.open = false;
      const utilityFilter = document.querySelector(".utility-filter");
      if (utilityFilter && !utilityFilter.contains(event.target)) utilityFilter.open = false;
    });
    dropdown.dataset.outsideCloseBound = "true";
  }
}

async function checkServices() {
  let services_url = config?.services_urls || [];
  let message = "Warning, the following services return an error status:";
  let isError = false;

  // Funzione per effettuare la chiamata Fetch e gestire la risposta
  async function checkServiceStatus(key, url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        isError = true;
        message += `\n${key}: ${response.status}`;
      }
    } catch (error) {
      // Gestione degli errori di rete o Fetch
      isError = true;
      message += `\n${key}: Network error or Fetch error`;
    }
  }

  // Array di promesse per le chiamate Fetch
  const fetchPromises = [];

  for (let key in services_url) {
    let value = services_url[key];
    let serviceName = key.replace(/_url$/, "");
    let url = value != null ? value : "/" + serviceName;

    // Aggiungi la promessa alla lista
    fetchPromises.push(checkServiceStatus(serviceName, url));
  }

  // Attendi che tutte le chiamate Fetch siano completate
  await Promise.all(fetchPromises);

  // Mostra l'alert se ci sono errori
  if (isError) {
    alert(message);
  }
}

function setPalette(palette) {
  const paletteElement = document.querySelector(".palette");
  const computedStyle = window.getComputedStyle(paletteElement);
  const gridTemplateColumns = computedStyle.getPropertyValue(
    "grid-template-columns",
  );

  const match = gridTemplateColumns.match(/\d+/);
  const gridColumns = match ? parseInt(match[0]) : null;

  let html = "";
  let idx = 0;
  for (let i = 0; i < palette.length; i++) {
    const line = palette[i];
    if (line[0].startsWith("#") || line[0].trim() == "") continue;

    if (line[0].startsWith("-------")) {
      span = gridColumns - (idx % gridColumns);
      html += '<div class="column-span-' + span + '">';
      idx += span;
    } else {
      html += "<div>";
      html +=
        '<img draggable="true" ondragstart="drag(event)" id="' +
        line[0].trim() +
        '" title="' +
        line[0].trim() +
        '" src="' +
        line[1].trim() +
        '" />';
      idx++;
    }
    html += "</div>";
  }
  $("#palette").append(html);
}

function noResultsOutput(isNoResult = true) {
  var elemento = $("#imgGridResults");
  if (isNoResult) {
    elemento.removeClass("gridcontainer");
    elemento.addClass("alert alert-danger");
    elemento.attr("role", "alert");
    elemento.html("<strong>Ops!</strong> No results.");
  } else {
    elemento.removeClass("alert alert-danger");
    elemento.addClass("gridcontainer");
    elemento.attr("role", "");
  }
}
