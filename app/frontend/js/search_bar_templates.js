const searchFormID = {
  id: "0",
};

const MAX_TEMPORAL_SCENES = 5;

function toggleFieldPanel(btn) {
  const panel = btn.closest(".field-panel");
  if (!panel) return;
  panel.classList.toggle("collapsed");
  btn.setAttribute(
    "aria-expanded",
    panel.classList.contains("collapsed") ? "false" : "true",
  );
}

function sceneInfoText(canvasID) {
  if (canvasID === 0) return "Scene 1";
  return "Scene " + (canvasID + 1) + " (temporal next)";
}

function scenePlaceholder(canvasID) {
  if (canvasID === 0) return "Describe the scene you are looking for...";
  return "Describe the next temporal scene...";
}

const searchForm = (
  canvasID = 0,
  infoText = "",
  txtSearchTitle = "",
  css_class = "",
) => {
  let modesHtml = "";
  const modes =
    config && config.ui && config.ui["textual-modes"]
      ? config.ui["textual-modes"]
      : [
          { name: "Use all", mode: "all" },
          { name: "OpenCLIP", mode: "openclip" },
          { name: "SigLIP2", mode: "siglip2" },
          { name: "ALIGN", mode: "align" },
        ];
  modes.forEach((mode, i) => {
    const hasAll = modes.some((m) => m.mode === "all");
    const checked =
      (hasAll && mode.mode === "all") || (!hasAll && i === 0) ? "checked" : "";
    modesHtml += `
			<label class="mode-chip">
				<input type="radio" ${checked} name="textualMode${canvasID}" id="textualMode${canvasID}_${mode.mode}" value="${mode.mode}"
					onchange="setTextualMode(${canvasID}, '${mode.mode}');">
				<span>${mode.name}</span>
			</label>`;
  });

  const title = infoText || sceneInfoText(canvasID);
  const placeholder = txtSearchTitle || scenePlaceholder(canvasID);

  return `
	<div class="scene-card scene${canvasID % 5}" id="canvasTab${canvasID}" data-scene-idx="${canvasID}">
		<div class="scene-card-header">
			<div class="font-large font-bold scene-title-row">
				<i id="sceneDes${canvasID}" class="${css_class}"> ${title}</i>
				<div class="scene-actions">
					<button type="button" id="clean${canvasID}" class="scene-action-btn scene-clean-btn" title="Clean entire scene">
						<i class="fa fa-trash"></i>
					</button>
					<button type="button" id="undo${canvasID}" class="scene-action-btn scene-undo-btn" title="Undo scene clean">
						<i class="fa fa-undo"></i>
					</button>
					<button type="button" class="scene-remove-btn" id="removeScene${canvasID}" title="Remove this temporal scene"
						onclick="removeLastSearchScene(); return false;" style="display:none;">
						<i class="fa fa-times"></i>
					</button>
				</div>
			</div>
		</div>

		<div class="textualOptions${canvasID} mode-row" id="textualOptions${canvasID}">
			${modesHtml}
		</div>

		<div id="textual${canvasID}_container" class="textual-container" title="Scene Description">
			<div id="div_textual${canvasID}">
				<div class="Icon-inside">
					<textarea id="textual${canvasID}" type="text" class="textualquery${canvasID} font-normal" rows="2"
						placeholder="${placeholder}"></textarea>
					<i id="cancelText${canvasID}" class="fa fa-times fa-lg fa-fw cancel-text-icon" aria-hidden="true"></i>
					<i class="fa fa-search fa-lg fa-fw search-text-icon" title="Search"
						onclick="queryByTextual(); return false;"></i>
				</div>
			</div>
		</div>

		<div class="field-panel collapsed" id="panel_rewrite${canvasID}">
			<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">Query rewrite</button>
			<div class="field-panel-body rewrite-panel-body">
				<div class="rewrite-toolbar">
					<div class="rewrite-modes">
						<label class="mode-chip">
							<input type="radio" name="rewriteMode${canvasID}" id="rewriteMode${canvasID}_exploit" value="exploit" checked>
							<span>Exploit</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="rewriteMode${canvasID}" id="rewriteMode${canvasID}_explore" value="explore">
							<span>Explore</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="rewriteMode${canvasID}" id="rewriteMode${canvasID}_decompose" value="decompose">
							<span>Decompose</span>
						</label>
					</div>
					<div class="rewrite-action-group">
						<button type="button" id="rewriteBtn${canvasID}" class="rewrite-btn" title="Rewrite textual query">
							<i class="fa fa-magic"></i> Rewrite
						</button>
						<button type="button" id="applyRewrite${canvasID}" class="rewrite-apply-btn" title="Apply rewritten query to textual field">
							<i class="fa fa-arrow-up"></i> Apply to textual
						</button>
					</div>
				</div>
				<textarea id="rewrite${canvasID}" class="font-normal field-input rewrite-output" rows="2"
					placeholder="Rewritten query appears here — edit, then apply to textual above"></textarea>
			</div>
		</div>

		<div class="field-panel" id="panel_objects${canvasID}">
			<button type="button" class="field-panel-toggle" aria-expanded="true" onclick="toggleFieldPanel(this)">Objects / grid</button>
			<div class="field-panel-body">
				<div class="scene-controls">
					<span class="font-tiny">
						<input type="radio" id="canvas${canvasID}_enabled" name="canvas${canvasID}" value="enabled" checked onchange="setCanvasState(${canvasID}, this)">
						<label for="canvas${canvasID}_enabled" class="lbl-enabled">Enabled</label>
						<input type="radio" id="canvas${canvasID}_disabled" name="canvas${canvasID}" value="disabled" onchange="setCanvasState(${canvasID}, this)">
						<label for="canvas${canvasID}_disabled" class="lbl-disabled">Disabled</label>
					</span>
					<span class="font-tiny occur-controls">
						Objects
						<input type="radio" id="and${canvasID}" name="occur${canvasID}" value="and" checked onchange="setOccur(this, ${canvasID})">
						<label for="and${canvasID}">AND</label>
						<input type="radio" id="or${canvasID}" name="occur${canvasID}" value="or" onchange="setOccur(this, ${canvasID})">
						<label for="or${canvasID}">OR</label>
					</span>
				</div>

				<div id="canvasBlock${canvasID}" class="canvas-block"
					ondragover="allowCanvasDrop(event)" ondrop="dropOnObjectCanvas(event, ${canvasID})">
					<div id="overlay${canvasID}">
						<div align="center" id="text${canvasID}" style="color: gray;">Disabled</div>
					</div>
					<div id="canvasdiv${canvasID}">
						<canvas id="canvas${canvasID}" width=${canvasWidth} height=${canvasHeight}></canvas>
					</div>
				</div>
			</div>
		</div>

		<input id="annotations${canvasID}" type="text" style="display: none;">

		<div id="block${canvasID}" class="scene-fields">
			<div class="field-panel collapsed" id="panel_not${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">Object count</button>
				<div class="field-panel-body object-count-body">
					<div class="object-count-range" role="group" aria-label="Object count comparison">
						<button type="button" class="object-count-range-btn" data-range="lt" aria-pressed="false">lt</button>
						<button type="button" class="object-count-range-btn" data-range="gt" aria-pressed="false">gt</button>
						<button type="button" class="object-count-range-btn active" data-range="eq" aria-pressed="true">eq</button>
					</div>
					<textarea id="not${canvasID}" class="font-normal field-input" rows="2"
						data-range="eq" placeholder="e.g. 2 person 3 car 0 dog"></textarea>
				</div>
			</div>

			<div class="field-panel collapsed" id="panel_ocr${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">OCR</button>
				<div class="field-panel-body">
					<textarea id="ocr${canvasID}" class="font-normal field-input" rows="2"
						placeholder="Text visible in the frame..."></textarea>
				</div>
			</div>

			<div class="field-panel collapsed" id="panel_asr${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">ASR</button>
				<div class="field-panel-body">
					<div class="mode-row asr-modes">
						<label class="mode-chip">
							<input type="radio" name="asrMode${canvasID}" value="text" checked>
							<span>Text</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="asrMode${canvasID}" value="vector">
							<span>Vector</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="asrMode${canvasID}" value="hybrid">
							<span>Hybrid</span>
						</label>
					</div>
					<textarea id="asr${canvasID}" class="font-normal field-input" rows="2"
						placeholder="Spoken / transcribed text..."></textarea>
				</div>
			</div>

			<div class="field-panel collapsed" id="panel_tags${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">Tags</button>
				<div class="field-panel-body">
					<textarea id="tags${canvasID}" class="font-normal field-input" rows="2"
						placeholder="<tag_one>, <tag two>, <news>"></textarea>
				</div>
			</div>
		</div>
	</div>`;
};

function addSceneButtonHtml() {
  return `
	<div id="addSceneBar" class="add-scene-bar">
		<button type="button" id="addNewCanvas" class="add-scene-btn" title="Add temporal scene"
			onclick="addSearchScene(); return false;">
			<i class="fa fa-plus"></i>
			<span>Add temporal scene</span>
		</button>
		<div id="addSceneHint" class="add-scene-hint"></div>
	</div>`;
}

function imageGenerationPanelHtml() {
  return `
  <div class="field-panel image-generation-panel collapsed" id="panel_image_generation">
    <button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">
      Image generation
    </button>
    <div class="field-panel-body image-generation-body">
      <div class="image-generation-modes mode-row">
        <label class="mode-chip">
          <input type="radio" name="imageGenerationMode" value="single" checked>
          <span>Single</span>
        </label>
        <label class="mode-chip">
          <input type="radio" name="imageGenerationMode" value="grid">
          <span>Grid</span>
        </label>
      </div>
      <textarea id="imageGenerationPrompt" class="font-normal field-input" rows="3"
        placeholder="Describe the image you want to generate..."></textarea>
      <button type="button" id="imageGenerationBtn" class="image-generation-btn">
        <i class="fa fa-magic" aria-hidden="true"></i> Generate image
      </button>
      <div id="imageGenerationStatus" class="image-generation-status" role="status" aria-live="polite"></div>
      <div id="imageGenerationResult" class="image-generation-result" hidden>
        <button type="button" id="clearImageGeneration" class="clear-image-generation" title="Remove generated image" aria-label="Remove generated image">
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <button type="button" id="imageGenerationPreview" class="image-generation-preview" title="Click to enlarge generated image">
          <img id="imageGenerationImage" class="image-generation-image" alt="Generated image">
        </button>
        <div class="image-generation-download-hint">Click the image to enlarge</div>
      </div>
    </div>
  </div>`;
}
