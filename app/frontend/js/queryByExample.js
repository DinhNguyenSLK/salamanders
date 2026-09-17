// Store examples on their scene nodes so removing/recreating a scene resets its state.
function getSceneImage(idx) {
	return document.getElementById(`panel_image${idx}`)?.dataset.image || "";
}

function renderSceneImage(idx, source) {
	const panel = document.getElementById(`panel_image${idx}`);
	if (!panel) return;
	panel.dataset.image = source;
	const preview = document.getElementById(`sceneImagePreview${idx}`);
	const image = document.getElementById(`sceneImageThumb${idx}`);
	preview.hidden = !source;
	if (source) image.src = source;
	else image.removeAttribute("src");
	document.getElementById(`channel_image${idx}`).classList.toggle("has-value", Boolean(source));
}

function clearSceneImage(idx) {
	const panel = document.getElementById(`panel_image${idx}`);
	if (!panel) return;
	panel._imageReadToken = {};
	panel._imagePending = false;
	document.getElementById(`sceneImageUrl${idx}`).value = "";
	document.getElementById(`sceneImageFile${idx}`).value = "";
	document.getElementById(`sceneImageStatus${idx}`).textContent = "";
	renderSceneImage(idx, "");
	isCanvasClean[idx] = false;
}

function setSceneImageUrl(idx, input) {
	const value = input.value;
	clearSceneImage(idx);
	input.value = value;
	const source = value.trim();
	if (!source) return;
	try {
		const url = new URL(source);
		if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid protocol");
		renderSceneImage(idx, source);
	} catch (_) {
		document.getElementById(`sceneImageStatus${idx}`).textContent = "Enter a complete http or https image URL.";
	}
}

function uploadSceneImage(idx, input) {
	const file = input.files && input.files[0];
	if (!file) return;
	const panel = document.getElementById(`panel_image${idx}`);
	const status = document.getElementById(`sceneImageStatus${idx}`);
	if (!file.type.startsWith("image/")) {
		status.textContent = "Choose an image file.";
		input.value = "";
		return;
	}
	clearSceneImage(idx);
	const token = panel._imageReadToken;
	panel._imagePending = true;
	status.textContent = "Reading image…";
	const reader = new FileReader();
	reader.onload = () => {
		if (!panel.isConnected || token !== panel._imageReadToken) return;
		panel._imagePending = false;
		renderSceneImage(idx, reader.result);
		status.textContent = file.name;
	};
	reader.onerror = () => {
		if (!panel.isConnected || token !== panel._imageReadToken) return;
		panel._imagePending = false;
		status.textContent = "Could not read this image. Please try again.";
	};
	reader.readAsDataURL(file);
}

function changeQueryBySampleMod(mode) {
	const urlInput = document.getElementById("urlToUpload");
	const fileLabel = document.getElementById("imageToUploadLabel");
	const fileInput = document.getElementById("imageToUpload");
	const urlTab = document.getElementById("urlTabBtn");
	const uploadTab = document.getElementById("uploadTabBtn");

	if (mode == "url") {
		if (urlInput) urlInput.style.display = '';
		if (fileLabel) fileLabel.style.display = 'none';
		if (fileInput) fileInput.value = '';
		if (urlTab) urlTab.classList.add('active');
		if (uploadTab) uploadTab.classList.remove('active');
	} else {
		if (urlInput) {
			urlInput.style.display = 'none';
			urlInput.value = '';
		}
		if (fileLabel) fileLabel.style.display = 'block';
		if (urlTab) urlTab.classList.remove('active');
		if (uploadTab) uploadTab.classList.add('active');
	}
}

function previewUploadedQueryImage(fileInput) {
	const file = fileInput && fileInput.files && fileInput.files[0];
	const previewBlock = document.getElementById('qbeblock');
	const previewImage = document.getElementById('qbeImg');
	if (!file || !previewBlock || !previewImage) return;

	const reader = new FileReader();
	reader.onload = function(e) {
		previewImage.src = e.target.result;
		previewBlock.style.display = 'block';
	};
	reader.readAsDataURL(file);
}

function queryImg() {
	let queryUrl = ($('#urlToUpload').val() || '').trim();

	if (queryUrl) {
		document.getElementById('qbeblock').style.display = 'block';
		$('#qbeImg').attr('src', queryUrl);
		queryByExample(queryUrl);
		return;
	}

	var fileInput = $('#imageToUpload')[0];
	if (fileInput && fileInput.files && fileInput.files[0]) {
		var file = fileInput.files[0];
		var reader = new FileReader();

		reader.onload = function(e) {
			var base64Data = e.target.result;
			document.getElementById('qbeblock').style.display = 'block';
			$('#qbeImg').attr('src', base64Data);
			queryByExample(base64Data);
		};

		reader.readAsDataURL(file);
		return;
	}

	// Không bắt buộc URL/file: Search / Enter chạy query form hiện tại
	searchByForm();
}

function resetQueryImg() {
	const qbeImg = document.getElementById('qbeImg');
	if (qbeImg) qbeImg.removeAttribute('src');
	document.getElementById('urlToUpload').value = '';
	const fileInput = document.getElementById('imageToUpload');
	if (fileInput) fileInput.value = '';
	document.getElementById('qbeblock').style.display = 'none';
	showResults(null);
}

function clearQuery() {
	if (document.getElementById('urlToUpload').value.trim() == '')
		document.getElementById('qbeblock').style.display = 'none';
}

function trim(str) {
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function getWindowHeight() {
	var windowHeight = 0;
	if (typeof(window.innerHeight) == 'number') {
		windowHeight = window.innerHeight;
	}
	else if (document.documentElement && document.documentElement.clientHeight) {
		windowHeight = document.documentElement.clientHeight;
	}
	else if (document.body && document.body.clientHeight) {
		windowHeight = document.body.clientHeight;
	}
	return windowHeight;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
