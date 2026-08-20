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
