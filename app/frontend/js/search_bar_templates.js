const searchFormID = {
  id: "0",
};

const MAX_TEMPORAL_SCENES = 5;

function toggleFieldPanel(btn) {
  if (typeof event !== "undefined" && event.target && event.target.closest(".field-clear-btn")) return;
  const panel = btn.closest(".field-panel");
  if (!panel) return;
  panel.classList.toggle("collapsed");
  btn.setAttribute(
    "aria-expanded",
    panel.classList.contains("collapsed") ? "false" : "true",
  );
}

function orderScenePanels(canvasID) {
  const scene = document.getElementById(`canvasTab${canvasID}`);
  const fieldGroup = document.getElementById(`block${canvasID}`);
  if (!scene || !fieldGroup) return;

  const panelOrder = [
    document.getElementById(`textualOptions${canvasID}`),
    document.getElementById(`textual${canvasID}_container`),
    document.getElementById(`panel_ocr${canvasID}`),
    document.getElementById(`panel_asr${canvasID}`),
    document.getElementById(`panel_rewrite${canvasID}`),
    document.getElementById(`panel_objects${canvasID}`),
    document.getElementById(`panel_not${canvasID}`),
    document.getElementById(`panel_tags${canvasID}`),
  ];

  panelOrder.forEach((panel) => panel && scene.appendChild(panel));
  fieldGroup.remove();
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

		<div class="textualOptions${canvasID} mode-row compact-mode-picker" id="textualOptions${canvasID}">
			${modesHtml}
		</div>

		<div id="textual${canvasID}_container" class="textual-container" title="Scene Description">
			<div id="div_textual${canvasID}">
				<div class="Icon-inside">
					<textarea id="textual${canvasID}" type="text" class="textualquery${canvasID} font-normal" rows="2"
						placeholder="${placeholder}"></textarea>
					<span id="cancelText${canvasID}" class="field-clear-btn input-clear-btn" data-clear-field="textual" data-scene-idx="${canvasID}" title="Clear textual query" aria-label="Clear textual query">&times;</span>
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

		<div class="field-panel collapsed" id="panel_objects${canvasID}">
			<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">Objects / grid</button>
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
					<span class="field-clear-btn canvas-clear-btn" data-clear-field="objects" data-scene-idx="${canvasID}" title="Clear object grid" aria-label="Clear object grid">&times;</span>
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
						<button type="button" class="object-count-range-btn active" data-range="lt" aria-pressed="false">lt</button>
						<button type="button" class="object-count-range-btn" data-range="gt" aria-pressed="false">gt</button>
						<button type="button" class="object-count-range-btn" data-range="eq" aria-pressed="true">eq</button>
					</div>
					<div class="input-with-clear"><textarea id="not${canvasID}" class="font-normal field-input" rows="2"
						data-range="eq" placeholder="e.g. 2 person 3 car 0 dog"></textarea><span class="field-clear-btn input-clear-btn" data-clear-field="not" data-scene-idx="${canvasID}" title="Clear object count" aria-label="Clear object count">&times;</span></div>
				</div>
			</div>

			<div class="field-panel" id="panel_ocr${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="true" onclick="toggleFieldPanel(this)">OCR</button>
				<div class="field-panel-body">
					<div class="mode-row asr-modes compact-mode-picker fuzziness-mode-row">
						<label class="mode-chip">
							<input type="radio" name="ocrMode${canvasID}" value="text" checked>
							<span>Text</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="ocrMode${canvasID}" value="vector">
							<span>Vector</span>
						</label>
						<label class="fuzziness-picker" for="ocrFuzziness${canvasID}" title="OCR fuzziness">
							<span class="fuzziness-picker-label">Fuzzy</span>
							<span class="fuzziness-select-shell">
								<select id="ocrFuzziness${canvasID}" aria-label="OCR fuzziness">
									<option value="AUTO">AUTO</option>
									<option value="0" selected>0</option>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
								</select>
							</span>
						</label>
					</div>
					<div class="input-with-clear"><textarea id="ocr${canvasID}" class="font-normal field-input" rows="2"
						placeholder="Text visible in the frame..."></textarea><span class="field-clear-btn input-clear-btn" data-clear-field="ocr" data-scene-idx="${canvasID}" title="Clear OCR" aria-label="Clear OCR">&times;</span></div>
				</div>
			</div>

			<div class="field-panel" id="panel_asr${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="true" onclick="toggleFieldPanel(this)">ASR</button>
				<div class="field-panel-body">
					<div class="mode-row asr-modes compact-mode-picker fuzziness-mode-row">
						<label class="mode-chip">
							<input type="radio" name="asrMode${canvasID}" value="text" checked>
							<span>Text</span>
						</label>
						<label class="mode-chip">
							<input type="radio" name="asrMode${canvasID}" value="vector">
							<span>Vector</span>
						</label>
						<label class="fuzziness-picker" for="asrFuzziness${canvasID}" title="ASR fuzziness">
							<span class="fuzziness-picker-label">Fuzzy</span>
							<span class="fuzziness-select-shell">
								<select id="asrFuzziness${canvasID}" aria-label="ASR fuzziness">
									<option value="AUTO">AUTO</option>
									<option value="0" selected>0</option>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
								</select>
							</span>
						</label>
					</div>
					<div class="input-with-clear"><textarea id="asr${canvasID}" class="font-normal field-input" rows="2"
						placeholder="Spoken / transcribed text..."></textarea><span class="field-clear-btn input-clear-btn" data-clear-field="asr" data-scene-idx="${canvasID}" title="Clear ASR" aria-label="Clear ASR">&times;</span></div>
				</div>
			</div>

			<div class="field-panel collapsed" id="panel_tags${canvasID}">
				<button type="button" class="field-panel-toggle" aria-expanded="false" onclick="toggleFieldPanel(this)">Tags</button>
				<div class="field-panel-body">
					<div class="input-with-clear"><textarea id="tags${canvasID}" class="font-normal field-input" rows="2"
						placeholder="<tag_one>, <tag two>, <news>"></textarea><span class="field-clear-btn input-clear-btn" data-clear-field="tags" data-scene-idx="${canvasID}" title="Clear tags" aria-label="Clear tags">&times;</span></div>
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
