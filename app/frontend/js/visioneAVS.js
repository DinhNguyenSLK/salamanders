const avsManually = new Map();
const avsManuallyByVideoID = new Map();
const avsSubmitted = new Map();
const resultLightboxKeyframes = new Map();
const resultLightboxKeyframeRequests = new Map();
const resultLightboxPreloadedThumbnails = new Set();
const resultLightboxThumbnailPreloads = new Map();
let resultLightboxItem = null;
let resultLightboxViewedFrame = null;
let resultLightboxRequestId = 0;
let resultLightboxThumbnailItem = null;
let resultLightboxThumbnailFrames = [];
let resultLightboxThumbnailStart = 0;
const resultLightboxThumbnailCount = 13;
let resultLightboxPreloadTimer = null;
let preserveResultLightboxOnUnselect = false;
let resultLightboxResultsScrollTop = null;
let nearbyKeyframesItem = null;
let nearbyKeyframesFrames = [];
let nearbyKeyframesStart = 0;
let nearbyKeyframesEnd = 0;
let nearbyKeyframesRequestId = 0;
const nearbyKeyframesInitialRadius = 14;
const nearbyKeyframesLoadCount = 14;

function normalizeResultFrameName(frameName) {
	return String(frameName || "").replace(/\.(?:jpe?g|png|webp)$/i, "");
}

function getResultFrameUrl(videoId, frameName) {
	return keyFramesUrl + videoId + "/" + normalizeResultFrameName(frameName) + ".jpg";
}

function getResultThumbnailUrl(videoId, frameName) {
	return thumbnailUrl + videoId + "/" + normalizeResultFrameName(frameName) + ".webp";
}

function requestResultLightboxKeyframes(videoId) {
	if (resultLightboxKeyframes.has(videoId)) {
		return Promise.resolve(resultLightboxKeyframes.get(videoId));
	}
	if (resultLightboxKeyframeRequests.has(videoId)) {
		return resultLightboxKeyframeRequests.get(videoId);
	}

	var request = new Promise(function (resolve, reject) {
		$.ajax({
			type: "GET",
			url: urlVBSService + "/getAllVideoKeyframes?videoId=" + encodeURIComponent(videoId),
		}).done(function (response) {
			var keyframes = response;
			if (typeof keyframes === "string") {
				try {
					keyframes = JSON.parse(keyframes);
				} catch (error) {
					keyframes = [];
				}
			}
			if (!Array.isArray(keyframes)) keyframes = [];
			resultLightboxKeyframes.set(videoId, keyframes);
			resolve(keyframes);
		}).fail(reject);
	});

	resultLightboxKeyframeRequests.set(videoId, request);
	request.then(function () {
		resultLightboxKeyframeRequests.delete(videoId);
	}, function () {
		resultLightboxKeyframeRequests.delete(videoId);
	});
	return request;
}

function getNearbyKeyframeActionItem(frameName) {
	if (!nearbyKeyframesItem) return null;
	var normalizedFrame = normalizeResultFrameName(frameName);
	var actionItem = Object.assign({}, nearbyKeyframesItem);
	actionItem.imgId = normalizedFrame;
	actionItem.frameName = normalizedFrame;
	actionItem.thumb = getResultThumbnailUrl(actionItem.videoId, normalizedFrame);
	actionItem.keyframe = getResultFrameUrl(actionItem.videoId, normalizedFrame);
	return actionItem;
}

function createNearbyKeyframePlaceholder() {
	var placeholder = document.createElement("div");
	placeholder.className = "nearby-keyframe-placeholder";
	placeholder.setAttribute("aria-hidden", "true");
	return placeholder;
}

function createNearbyKeyframeCard(frameName) {
	var actionItem = getNearbyKeyframeActionItem(frameName);
	if (!actionItem) return document.createDocumentFragment();
	var selectedFrame = normalizeResultFrameName(nearbyKeyframesItem.imgId);
	var isSelected = frameName === selectedFrame;

	var card = document.createElement("article");
	card.className = "nearby-keyframe-card" + (isSelected ? " is-selected" : "");
	card.dataset.frameId = frameName;

	var imageWrap = document.createElement("button");
	imageWrap.type = "button";
	imageWrap.className = "nearby-keyframe-image";
	imageWrap.title = "Enlarge " + frameName;
	imageWrap.setAttribute("aria-label", "Enlarge keyframe " + frameName);
	imageWrap.addEventListener("click", function () {
		openNearbyKeyframePreview(actionItem.videoId, frameName);
	});
	var image = document.createElement("img");
	image.src = isSelected && nearbyKeyframesItem.thumb
		? nearbyKeyframesItem.thumb
		: getResultThumbnailUrl(actionItem.videoId, frameName);
	image.alt = "Keyframe " + frameName;
	image.loading = isSelected ? "eager" : "lazy";
	image.decoding = "async";
	image.fetchPriority = isSelected ? "high" : "auto";
	imageWrap.appendChild(image);
	card.appendChild(imageWrap);

	var toolbar = document.createElement("div");
	toolbar.className = "nearby-keyframe-toolbar";

	var frameLink = document.createElement("a");
	frameLink.className = "nearby-keyframe-id";
	frameLink.href = "indexedData.html?videoId=" + encodeURIComponent(actionItem.videoId) + "&id=" + encodeURIComponent(frameName);
	frameLink.target = "_blank";
	frameLink.title = "Show indexed data for " + frameName;
	frameLink.textContent = frameName;
	toolbar.appendChild(frameLink);

	var videoButton = document.createElement("button");
	videoButton.type = "button";
	videoButton.className = "nearby-keyframe-action nearby-keyframe-action-video";
	videoButton.title = "Play video";
	videoButton.setAttribute("aria-label", "Play video at " + frameName);
	videoButton.innerHTML = '<i class="fas fa-video" aria-hidden="true"></i>';
	videoButton.addEventListener("click", function () {
		var videoUrl = actionItem.videoUrl || videoUrlPrefix + actionItem.videoId + ".mp4";
		playVideoWindow(videoUrl, actionItem.videoId, frameName);
	});
	toolbar.appendChild(videoButton);

	var similarityButton = document.createElement("button");
	similarityButton.type = "button";
	similarityButton.className = "nearby-keyframe-action nearby-keyframe-action-similarity";
	similarityButton.title = "Visual similarity (DINOv2)";
	similarityButton.setAttribute("aria-label", "Visual similarity for " + frameName);
	similarityButton.innerHTML = '<i class="fas fa-clone" aria-hidden="true"></i>';
	similarityButton.addEventListener("click", function () {
		closeNearbyKeyframes();
		searchByLink({ vf: frameName });
	});
	toolbar.appendChild(similarityButton);

	var submitButton = document.createElement("button");
	submitButton.type = "button";
	submitButton.className = "nearby-keyframe-action nearby-keyframe-action-submit";
	submitButton.title = "Submit result";
	submitButton.setAttribute("aria-label", "Submit " + frameName);
	submitButton.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>';
	submitButton.addEventListener("click", function () {
		submitVersion2(actionItem);
	});
	toolbar.appendChild(submitButton);

	card.appendChild(toolbar);
	return card;
}

function updateNearbyKeyframeControls() {
	var previous = document.getElementById("nearbyKeyframesPrevious");
	var next = document.getElementById("nearbyKeyframesNext");
	var range = document.getElementById("nearbyKeyframesRange");
	if (previous) previous.disabled = nearbyKeyframesStart <= 0;
	if (next) next.disabled = nearbyKeyframesEnd >= nearbyKeyframesFrames.length;
	if (range) {
		range.textContent = nearbyKeyframesFrames.length
			? nearbyKeyframesStart + 1 + "–" + nearbyKeyframesEnd + " / " + nearbyKeyframesFrames.length
			: "No keyframes";
	}
}

function centerNearbySelectedCard() {
	var scroller = document.getElementById("nearbyKeyframesScroller");
	var selected = document.querySelector("#nearbyKeyframesGrid .nearby-keyframe-card.is-selected");
	if (!scroller || !selected) return;
	var centeredTop = selected.offsetTop - (scroller.clientHeight - selected.offsetHeight) / 2;
	scroller.scrollTop = Math.max(0, centeredTop);
}

function renderInitialNearbyKeyframes(selectedItem, keyframes) {
	var grid = document.getElementById("nearbyKeyframesGrid");
	var title = document.getElementById("nearbyKeyframesTitle");
	if (!grid) return;

	var frames = Array.isArray(keyframes)
		? keyframes.map(normalizeResultFrameName).filter(Boolean)
		: [];
	frames = frames.filter(function (frame, index) {
		return frames.indexOf(frame) === index;
	});
	var selectedFrame = normalizeResultFrameName(selectedItem.imgId);
	var selectedIndex = frames.indexOf(selectedFrame);
	if (selectedIndex < 0) {
		frames.unshift(selectedFrame);
		selectedIndex = 0;
	}

	nearbyKeyframesFrames = frames;
	nearbyKeyframesStart = Math.max(0, selectedIndex - nearbyKeyframesInitialRadius);
	nearbyKeyframesEnd = Math.min(frames.length, selectedIndex + nearbyKeyframesInitialRadius + 1);
	var leadingPlaceholders = Math.max(
		0,
		nearbyKeyframesInitialRadius - (selectedIndex - nearbyKeyframesStart),
	);
	var trailingPlaceholders = Math.max(
		0,
		nearbyKeyframesInitialRadius - (nearbyKeyframesEnd - selectedIndex - 1),
	);

	grid.replaceChildren();
	var fragment = document.createDocumentFragment();
	for (var before = 0; before < leadingPlaceholders; before++) {
		fragment.appendChild(createNearbyKeyframePlaceholder());
	}
	for (var index = nearbyKeyframesStart; index < nearbyKeyframesEnd; index++) {
		fragment.appendChild(createNearbyKeyframeCard(frames[index]));
	}
	for (var after = 0; after < trailingPlaceholders; after++) {
		fragment.appendChild(createNearbyKeyframePlaceholder());
	}
	grid.appendChild(fragment);
	if (title) title.textContent = "Video ID: " + selectedItem.videoId + " · Selected: " + selectedFrame;
	updateNearbyKeyframeControls();
	requestAnimationFrame(centerNearbySelectedCard);
}

function loadMoreNearbyKeyframes(direction) {
	var grid = document.getElementById("nearbyKeyframesGrid");
	var scroller = document.getElementById("nearbyKeyframesScroller");
	if (!grid || !scroller || !nearbyKeyframesFrames.length) return;
	grid.querySelectorAll(".nearby-keyframe-placeholder").forEach(function (placeholder) {
		placeholder.remove();
	});

	var fragment = document.createDocumentFragment();
	if (direction < 0 && nearbyKeyframesStart > 0) {
		var oldHeight = scroller.scrollHeight;
		var oldScrollTop = scroller.scrollTop;
		var newStart = Math.max(0, nearbyKeyframesStart - nearbyKeyframesLoadCount);
		for (var before = newStart; before < nearbyKeyframesStart; before++) {
			fragment.appendChild(createNearbyKeyframeCard(nearbyKeyframesFrames[before]));
		}
		grid.prepend(fragment);
		nearbyKeyframesStart = newStart;
		requestAnimationFrame(function () {
			scroller.scrollTop = oldScrollTop + scroller.scrollHeight - oldHeight;
		});
	} else if (direction > 0 && nearbyKeyframesEnd < nearbyKeyframesFrames.length) {
		var newEnd = Math.min(
			nearbyKeyframesFrames.length,
			nearbyKeyframesEnd + nearbyKeyframesLoadCount,
		);
		for (var after = nearbyKeyframesEnd; after < newEnd; after++) {
			fragment.appendChild(createNearbyKeyframeCard(nearbyKeyframesFrames[after]));
		}
		grid.appendChild(fragment);
		nearbyKeyframesEnd = newEnd;
	}
	updateNearbyKeyframeControls();
}

function openNearbyKeyframes(selectedItem) {
	var modal = document.getElementById("nearbyKeyframesModal");
	var range = document.getElementById("nearbyKeyframesRange");
	if (!modal || !selectedItem) return;

	nearbyKeyframesItem = Object.assign({}, selectedItem);
	nearbyKeyframesItem.imgId = normalizeResultFrameName(selectedItem.imgId || selectedItem.frameName);
	nearbyKeyframesRequestId++;
	var requestId = nearbyKeyframesRequestId;
	modal.hidden = false;
	document.body.classList.add("nearby-keyframes-open");
	renderInitialNearbyKeyframes(nearbyKeyframesItem, [nearbyKeyframesItem.imgId]);
	if (range) range.textContent = "Loading…";

	requestResultLightboxKeyframes(nearbyKeyframesItem.videoId).then(function (keyframes) {
		if (
			requestId === nearbyKeyframesRequestId &&
			nearbyKeyframesItem &&
			nearbyKeyframesItem.videoId === selectedItem.videoId
		) {
			renderInitialNearbyKeyframes(nearbyKeyframesItem, keyframes);
		}
	}).catch(function () {
		if (requestId === nearbyKeyframesRequestId && range) {
			range.textContent = "Unable to load";
		}
	});
}

function openNearbyKeyframePreview(videoId, frameName) {
	var preview = document.getElementById("nearbyKeyframePreview");
	var image = document.getElementById("nearbyKeyframePreviewImage");
	if (!preview || !image) return;

	var normalizedFrame = normalizeResultFrameName(frameName);
	image.src = getResultFrameUrl(videoId, normalizedFrame);
	image.alt = "Keyframe " + normalizedFrame;
	preview.hidden = false;
}

function closeNearbyKeyframePreview() {
	var preview = document.getElementById("nearbyKeyframePreview");
	var image = document.getElementById("nearbyKeyframePreviewImage");
	if (preview) preview.hidden = true;
	if (image) {
		image.removeAttribute("src");
		image.alt = "";
	}
}

function closeNearbyKeyframes() {
	var modal = document.getElementById("nearbyKeyframesModal");
	closeNearbyKeyframePreview();
	nearbyKeyframesRequestId++;
	nearbyKeyframesItem = null;
	nearbyKeyframesFrames = [];
	nearbyKeyframesStart = 0;
	nearbyKeyframesEnd = 0;
	if (modal) modal.hidden = true;
	document.body.classList.remove("nearby-keyframes-open");
}

function bindNearbyKeyframesEvents() {
	var preview = document.getElementById("nearbyKeyframePreview");
	document.querySelectorAll("[data-nearby-keyframes-close]").forEach(function (element) {
		element.addEventListener("click", function () {
			if (
				element.classList.contains("nearby-keyframes-backdrop") &&
				preview &&
				!preview.hidden
			) {
				closeNearbyKeyframePreview();
				return;
			}
			closeNearbyKeyframes();
		});
	});
	var previous = document.getElementById("nearbyKeyframesPrevious");
	var next = document.getElementById("nearbyKeyframesNext");
	if (previous) previous.addEventListener("click", function () { loadMoreNearbyKeyframes(-1); });
	if (next) next.addEventListener("click", function () { loadMoreNearbyKeyframes(1); });
	document.querySelectorAll("[data-nearby-preview-close]").forEach(function (element) {
		element.addEventListener("click", closeNearbyKeyframePreview);
	});
	if (preview) {
		preview.addEventListener("click", function (event) {
			if (event.target === preview) closeNearbyKeyframePreview();
		});
	}
	document.addEventListener("keydown", function (event) {
		if (event.key !== "Escape" || !nearbyKeyframesItem) return;
		if (preview && !preview.hidden) {
			closeNearbyKeyframePreview();
		} else {
			closeNearbyKeyframes();
		}
	});
}

function preloadResultLightboxThumbnailUrl(url) {
	if (resultLightboxPreloadedThumbnails.has(url) || resultLightboxThumbnailPreloads.has(url)) return;
	var image = new Image();
	resultLightboxThumbnailPreloads.set(url, image);
	image.onload = function () {
		resultLightboxThumbnailPreloads.delete(url);
		resultLightboxPreloadedThumbnails.add(url);
	};
	image.onerror = function () {
		resultLightboxThumbnailPreloads.delete(url);
	};
	image.src = url;
}

function preloadResultLightboxThumbnailPages(videoId, frames, start, end) {
	var preloadStart = Math.max(0, start - resultLightboxThumbnailCount);
	var preloadEnd = Math.min(frames.length, end + resultLightboxThumbnailCount);
	for (var index = preloadStart; index < preloadEnd; index++) {
		if (index >= start && index < end) continue;
		preloadResultLightboxThumbnailUrl(getResultThumbnailUrl(videoId, frames[index]));
	}
}

function scheduleResultLightboxThumbnailPreload(videoId, frameName) {
	window.clearTimeout(resultLightboxPreloadTimer);
	resultLightboxPreloadTimer = window.setTimeout(function () {
		requestResultLightboxKeyframes(videoId).then(function (keyframes) {
			var frames = keyframes.map(normalizeResultFrameName).filter(Boolean);
			var currentFrame = normalizeResultFrameName(frameName);
			var currentIndex = Math.max(0, frames.indexOf(currentFrame));
			var start = Math.max(0, currentIndex - Math.floor(resultLightboxThumbnailCount / 2));
			start = Math.min(start, Math.max(0, frames.length - resultLightboxThumbnailCount));
			var end = Math.min(frames.length, start + resultLightboxThumbnailCount);
			for (var index = start; index < end; index++) {
				preloadResultLightboxThumbnailUrl(getResultThumbnailUrl(videoId, frames[index]));
			}
			preloadResultLightboxThumbnailPages(videoId, frames, start, end);
		}).catch(function () {});
	}, 120);
}

function setResultLightboxFrame(videoId, frameName, frameUrl) {
	var normalizedFrameName = normalizeResultFrameName(frameName);
	var image = document.getElementById("resultLightboxImage");
	var title = document.getElementById("resultLightboxTitle");
	if (!image || !title) return;

	resultLightboxViewedFrame = normalizedFrameName;
	image.src = frameUrl || getResultFrameUrl(videoId, normalizedFrameName);
	image.alt = "imgID: " + normalizedFrameName;
	title.textContent = "imgID: " + normalizedFrameName + " · Video ID: " + videoId;

	document.querySelectorAll("#resultLightboxThumbnails .result-lightbox-thumbnail").forEach(function (button) {
		var isActive = button.dataset.frameId === normalizedFrameName;
		button.classList.toggle("is-active", isActive);
		button.setAttribute("aria-current", isActive ? "true" : "false");
	});
}

function updateResultLightboxThumbnailControls() {
	var previous = document.getElementById("resultLightboxPrevious");
	var next = document.getElementById("resultLightboxNext");
	if (!previous || !next) return;
	previous.disabled = resultLightboxThumbnailStart <= 0;
	next.disabled = resultLightboxThumbnailStart + resultLightboxThumbnailCount >= resultLightboxThumbnailFrames.length;
}

function renderResultLightboxThumbnails(selectedItem, keyframes, requestedStart) {
	var strip = document.getElementById("resultLightboxThumbnails");
	if (!strip) return;

	var currentFrame = normalizeResultFrameName(selectedItem.imgId);
	var frames = Array.isArray(keyframes)
		? keyframes.map(normalizeResultFrameName).filter(Boolean)
		: [];
	frames = frames.filter(function (frame, index) {
		return frames.indexOf(frame) === index;
	});

	var currentIndex = frames.indexOf(currentFrame);
	if (currentIndex < 0) {
		frames = [currentFrame];
		currentIndex = 0;
	}

	var maxStart = Math.max(0, frames.length - resultLightboxThumbnailCount);
	var start = typeof requestedStart === "number"
		? Math.max(0, Math.min(requestedStart, maxStart))
		: Math.max(0, currentIndex - Math.floor(resultLightboxThumbnailCount / 2));
	start = Math.min(start, maxStart);
	var end = Math.min(frames.length, start + resultLightboxThumbnailCount);
	var keepCurrentFrame = resultLightboxViewedFrame || currentFrame;
	var mainImage = document.getElementById("resultLightboxImage");
	var keepCurrentUrl = mainImage ? mainImage.src : selectedItem.keyframe;

	resultLightboxThumbnailItem = selectedItem;
	resultLightboxThumbnailFrames = frames;
	resultLightboxThumbnailStart = start;

	strip.replaceChildren();
	strip.scrollLeft = 0;
	frames.slice(start, end).forEach(function (frameName) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = "result-lightbox-thumbnail";
		button.dataset.frameId = frameName;
		button.title = "imgID: " + frameName;
		button.setAttribute("aria-label", "View " + frameName);

		var thumb = document.createElement("img");
		thumb.src = getResultThumbnailUrl(selectedItem.videoId, frameName);
		thumb.alt = "";
		thumb.loading = "eager";
		button.appendChild(thumb);
		button.addEventListener("click", function () {
			setResultLightboxFrame(selectedItem.videoId, frameName, getResultFrameUrl(selectedItem.videoId, frameName));
		});
		strip.appendChild(button);
	});

	if (typeof requestedStart === "number") {
		setResultLightboxFrame(selectedItem.videoId, keepCurrentFrame, keepCurrentUrl);
	} else {
		setResultLightboxFrame(selectedItem.videoId, currentFrame, selectedItem.keyframe);
	}
	updateResultLightboxThumbnailControls();
	preloadResultLightboxThumbnailPages(selectedItem.videoId, frames, start, end);
}

function shiftResultLightboxThumbnails(direction) {
	if (!resultLightboxThumbnailItem || !resultLightboxThumbnailFrames.length) return;
	var step = Math.max(1, resultLightboxThumbnailCount - 2);
	var nextStart = resultLightboxThumbnailStart + direction * step;
	renderResultLightboxThumbnails(
		resultLightboxThumbnailItem,
		resultLightboxThumbnailFrames,
		nextStart,
	);
}

function loadResultLightboxThumbnails(selectedItem) {
	var videoId = selectedItem.videoId;
	var requestId = ++resultLightboxRequestId;
	renderResultLightboxThumbnails(selectedItem, [selectedItem.imgId]);

	if (resultLightboxKeyframes.has(videoId)) {
		renderResultLightboxThumbnails(selectedItem, resultLightboxKeyframes.get(videoId));
		return;
	}

	requestResultLightboxKeyframes(videoId).then(function (keyframes) {
		if (
			requestId === resultLightboxRequestId &&
			resultLightboxItem &&
			resultLightboxItem.imgId === selectedItem.imgId
		) {
			renderResultLightboxThumbnails(selectedItem, keyframes);
		}
	}).catch(function () {});
}

function openResultLightbox(selectedItem) {
	var modal = document.getElementById("resultLightbox");
	if (!modal) return;

	if (modal.hidden) {
		var resultsScroller = document.querySelector(".resGrid2");
		resultLightboxResultsScrollTop = resultsScroller ? resultsScroller.scrollTop : null;
	}
	resultLightboxItem = selectedItem;
	modal.hidden = false;
	document.body.classList.add("result-lightbox-open");
	loadResultLightboxThumbnails(selectedItem);
}

function markResultLightboxItemAsViewed(selectedItem) {
	if (!selectedItem) return;
	var thumbnail = document.getElementById(selectedItem.imgId);
	var card = thumbnail ? thumbnail.closest(".result-border") : null;
	if (!card) return;

	card.classList.add("is-viewed");
	if (card.querySelector(".result-viewed-badge")) return;

	var badge = document.createElement("span");
	badge.className = "result-viewed-badge";
	badge.title = "Viewed: " + selectedItem.imgId;
	badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Viewed</span>';
	card.appendChild(badge);
}

function closeResultLightbox() {
	var modal = document.getElementById("resultLightbox");
	var viewedItem = modal && !modal.hidden ? resultLightboxItem : null;
	var savedScrollTop = resultLightboxResultsScrollTop;
	resultLightboxRequestId++;
	resultLightboxItem = null;
	resultLightboxViewedFrame = null;
	resultLightboxThumbnailItem = null;
	resultLightboxThumbnailFrames = [];
	resultLightboxThumbnailStart = 0;
	resultLightboxResultsScrollTop = null;
	if (modal) modal.hidden = true;
	document.body.classList.remove("result-lightbox-open");
	markResultLightboxItemAsViewed(viewedItem);
	if (savedScrollTop !== null) {
		window.requestAnimationFrame(function () {
			var resultsScroller = document.querySelector(".resGrid2");
			if (resultsScroller) resultsScroller.scrollTop = savedScrollTop;
		});
	}
}

function getResultLightboxActionItem() {
	if (!resultLightboxItem) return null;
	var actionItem = Object.assign({}, resultLightboxItem);
	var frameName = resultLightboxViewedFrame || normalizeResultFrameName(resultLightboxItem.imgId);
	actionItem.imgId = frameName;
	actionItem.frameName = frameName;
	var image = document.getElementById("resultLightboxImage");
	if (image && image.src) actionItem.keyframe = image.src;
	return actionItem;
}

function clearResultLightboxSelection() {
	if (resultLightboxItem && avsManually.has(resultLightboxItem.imgId)) {
		avsToggle(resultLightboxItem, null, true);
	} else {
		closeResultLightbox();
	}
}

function runResultLightboxAction(action) {
	var actionItem = getResultLightboxActionItem();
	if (!actionItem) return;

	if (action === "summary") {
		closeResultLightbox();
		openNearbyKeyframes(actionItem);
	} else if (action === "play") {
		playVideoWindow(actionItem.videoUrl, actionItem.videoId, actionItem.imgId);
	} else if (action === "similarity") {
		clearResultLightboxSelection();
		var queryObj = new Object();
		queryObj.vf = actionItem.imgId;
		searchByLink(queryObj);
	} else if (action === "submit") {
		preserveResultLightboxOnUnselect = true;
		try {
			submitVersion2(actionItem);
		} finally {
			preserveResultLightboxOnUnselect = false;
		}
	}
}

function requestResultLightboxClose() {
	if (resultLightboxItem && avsManually.has(resultLightboxItem.imgId)) {
		avsToggle(resultLightboxItem, null, true);
	} else {
		closeResultLightbox();
	}
}

function bindResultLightboxThumbnailDrag(strip) {
	var pointerId = null;
	var startX = 0;
	var startScrollLeft = 0;
	var isDragging = false;
	var suppressClick = false;

	strip.addEventListener("pointerdown", function (event) {
		if (event.button !== 0) return;
		pointerId = event.pointerId;
		startX = event.clientX;
		startScrollLeft = strip.scrollLeft;
		isDragging = false;
	});

	strip.addEventListener("pointermove", function (event) {
		if (pointerId !== event.pointerId) return;
		var distance = event.clientX - startX;
		if (!isDragging && Math.abs(distance) < 5) return;

		isDragging = true;
		strip.classList.add("is-dragging");
		if (!strip.hasPointerCapture(event.pointerId)) {
			strip.setPointerCapture(event.pointerId);
		}
		strip.scrollLeft = startScrollLeft - distance;
		event.preventDefault();
	});

	function finishDrag(event) {
		if (pointerId !== event.pointerId) return;
		suppressClick = isDragging;
		strip.classList.remove("is-dragging");
		if (strip.hasPointerCapture(event.pointerId)) {
			strip.releasePointerCapture(event.pointerId);
		}
		pointerId = null;
		isDragging = false;
		window.setTimeout(function () {
			suppressClick = false;
		}, 0);
	}

	strip.addEventListener("pointerup", finishDrag);
	strip.addEventListener("pointercancel", finishDrag);
	strip.addEventListener("click", function (event) {
		if (!suppressClick) return;
		event.preventDefault();
		event.stopImmediatePropagation();
	}, true);
	strip.addEventListener("dragstart", function (event) {
		event.preventDefault();
	});
}

function bindResultLightboxEvents() {
	document.querySelectorAll("[data-result-lightbox-close]").forEach(function (element) {
		element.addEventListener("click", requestResultLightboxClose);
	});
	var stage = document.querySelector(".result-lightbox-stage");
	if (stage) {
		stage.addEventListener("click", function (event) {
			if (event.target === stage) requestResultLightboxClose();
		});
	}
	var thumbnailStrip = document.getElementById("resultLightboxThumbnails");
	if (thumbnailStrip) bindResultLightboxThumbnailDrag(thumbnailStrip);
	document.querySelectorAll("[data-result-lightbox-action]").forEach(function (button) {
		button.addEventListener("click", function () {
			runResultLightboxAction(button.dataset.resultLightboxAction);
		});
	});
	document.querySelectorAll("[data-result-lightbox-page]").forEach(function (button) {
		button.addEventListener("click", function () {
			shiftResultLightboxThumbnails(Number(button.dataset.resultLightboxPage));
		});
	});
	document.addEventListener("mouseover", function (event) {
		var thumbnail = event.target.closest ? event.target.closest(".myimg-thumbnail[data-img-id]") : null;
		if (!thumbnail || thumbnail.contains(event.relatedTarget)) return;
		var videoId = String(thumbnail.getAttribute("lang") || "").split("|")[0];
		if (videoId && thumbnail.dataset.imgId) {
			scheduleResultLightboxThumbnailPreload(videoId, thumbnail.dataset.imgId);
		}
	});
	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && resultLightboxItem) {
			requestResultLightboxClose();
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function () {
		bindResultLightboxEvents();
		bindNearbyKeyframesEvents();
	});
} else {
	bindResultLightboxEvents();
	bindNearbyKeyframesEvents();
}

/*
function getAvsObj(videoId, imgId, avsTagId, thumb, keyframe, rowIdx, colIdx) {
	avsObj=new Object();
	avsObj.videoId = videoId;
	avsObj.imgId = imgId;
	avsObj.avsTagId = avsTagId;
	avsObj.thumb = thumb;
	avsObj.keyframe = keyframe;
	avsObj.rowIdx = rowIdx;
	avsObj.colIdx = colIdx;
	return avsObj
}*/

/*
function submitAVS(selectedItem) {
	$('#submitted_bar').css("display", "block");
	let res = null;
	if (!isAVS)
		res = submitResult(selectedItem.imgId, selectedItem.videoId);
	else
		submitResult(selectedItem.imgId, selectedItem.videoId);
	avsRemoveSelected(selectedItem)

	updateAVSTab(selectedItem)
	avsSubmitted.set(selectedItem.videoId, selectedItem);
	avsSubmittedTab(selectedItem);
	if (!isAVS) {
		alert('Server response: ' + res);
	}
	$( "#submitted_num" ).text(avsSubmitted.size)
	updateAVSInfo();
	avsHilightlighSubmittedVideos();
}*/

const imgSelected = (selectedItem, videoUrl, videoUrlPreview, img_loading="eager") => {
	selectedString = JSON.stringify(selectedItem);

	return `
		<span id="avsList_${selectedItem.imgId}">
			<div style="float: left; padding: 2px;">
				<img id="remove_${selectedItem.imgId}" style="padding-left: 5px;" title="remove ${selectedItem.imgId}" width="30" src="img/Actions-dialog-close-icon.png" onclick='avsToggle(${JSON.stringify(selectedItem)}, null, true)'>
				<a style="font-size:12px; padding-left: 5px;" title="View annotations of ${selectedItem.imgId}" href="indexedData.html?videoId=${selectedItem.videoId}&id=${selectedItem.imgId}" target="_blank">${selectedItem.imgId}</a>
				<a title="Nearly keyframes" href="#" onclick='openNearbyKeyframes(${selectedString}); return false;'><i class="fa fa-th" style="font-size:12px;  padding-left: 5px;"></i></a>
				<a href="#" title="Play Video"><i title="Play Video" class="fa fa-play font-normal" style="color:#007bff;padding-left: 3px;" onclick="playVideoWindow('${videoUrl}', '${selectedItem.videoId}', '${selectedItem.imgId}'); return false;"></i></a>
				<a href="#" title="Visual similarity"><img loading="${img_loading}" style="padding: 2px;" src="img/comboSim.svg" width=20 title="Visual similarity" alt="${selectedItem.imgId}" id="comboSim${selectedItem.imgId}" onclick="var queryObj=new Object(); queryObj.vf='${selectedItem.imgId}'; searchByLink(queryObj); return false;"></a>
				<a href="#" title="Submit result"><span class="pull-right"><i title="Submit result" class="fa fa-arrow-alt-circle-up font-huge" style="color:#00AA00; padding-left: 0px;" onclick='submitVersion2(${selectedString});'> </i></span></a>

				<br>
				<div id="avsdiv_${selectedItem.imgId}" lang="${selectedItem.videoId}|${videoUrlPreview}" style="height: 25em;">
					<img id="selected_avs_${selectedItem.imgId}" title="${selectedItem.imgId}" style="padding-bottom: 10px; height: 25em;" src="${selectedItem.keyframe}">
				</div>
			</div>
		</span>
	`
}

function selectImg(selectedItem) {
	$("#avsTab").empty();
	openResultLightbox(selectedItem);

	let avsTagId = document.getElementById(selectedItem.avsTagId);
	if (avsTagId != null)
		avsTagId.checked = true;

	let selImgId = document.getElementById(selectedItem.imgId)
	if (selImgId != null) {
		selImgId.style.borderWidth = "0";
		selImgId.style.borderStyle = "none";
		selImgId.style.outline = "3px solid #c47728";
		selImgId.style.outlineOffset = "-3px";
	}
}

function updatePreviewInPlace(selectedItem, videoUrl, videoUrlPreview) {
	var oldList = document.querySelector('#avsTab [id^="avsList_"]');
	if (!oldList) return;

	// Gỡ video preview nếu đang hover
	var oldVideo = oldList.querySelector("video");
	if (oldVideo) oldVideo.remove();

	oldList.id = "avsList_" + selectedItem.imgId;

	var removeBtn = oldList.querySelector('[id^="remove_"]');
	if (removeBtn) {
		removeBtn.id = "remove_" + selectedItem.imgId;
		removeBtn.title = "remove " + selectedItem.imgId;
		removeBtn.onclick = function () {
			avsToggle(selectedItem, null, true);
		};
	}

	var links = oldList.querySelectorAll("a");
	if (links[0]) {
		links[0].title = "View annotations of " + selectedItem.imgId;
		links[0].href = "indexedData.html?videoId=" + selectedItem.videoId + "&id=" + selectedItem.imgId;
		links[0].textContent = selectedItem.imgId;
	}
	if (links[1]) {
		links[1].href = "#";
		links[1].onclick = function () {
			openNearbyKeyframes(selectedItem);
			return false;
		};
	}
	if (links[2]) {
		links[2].onclick = function () {
			playVideoWindow(videoUrl, selectedItem.videoId, selectedItem.imgId);
			return false;
		};
	}
	if (links[3]) {
		var simImg = links[3].querySelector("img");
		if (simImg) {
			simImg.alt = selectedItem.imgId;
			simImg.id = "comboSim" + selectedItem.imgId;
			simImg.onclick = function () {
				var queryObj = new Object();
				queryObj.vf = selectedItem.imgId;
				searchByLink(queryObj);
				return false;
			};
		}
	}
	if (links[4]) {
		var submitIcon = links[4].querySelector("i");
		if (submitIcon) {
			submitIcon.onclick = function () {
				submitVersion2(selectedItem);
			};
		}
	}

	var avsdiv = oldList.querySelector('[id^="avsdiv_"]');
	if (avsdiv) {
		avsdiv.id = "avsdiv_" + selectedItem.imgId;
		avsdiv.lang = selectedItem.videoId + "|" + videoUrlPreview;
	}

	var previewImg = oldList.querySelector('[id^="selected_avs_"]');
	if (previewImg) {
		previewImg.id = "selected_avs_" + selectedItem.imgId;
		previewImg.title = selectedItem.imgId;
		previewImg.style.display = "block";
		previewImg.src = selectedItem.keyframe;
	}

	bindPreviewHover(selectedItem.imgId);
}

function bindPreviewHover(imgId) {
	let imgId4Regex = imgId.replaceAll(".", "\\.");
	$("#avsdiv_" + imgId4Regex).off("mouseenter mouseleave").hover(hoverVideoAVS, hideVideoAVS);

	function hoverVideoAVS(e) {
		let avsdivNoRegex = this.id
		let avsdiv = avsdivNoRegex.replaceAll(".", "\\.")
		let imgIdNoRegex = avsdivNoRegex.replaceAll("avsdiv_", "selected_avs_")
		let imgIdEsc = imgIdNoRegex.replaceAll(".", "\\.")
		let imgIdAVS = avsdivNoRegex.replaceAll("avsdiv_", "")

		$('#' + imgIdEsc).off("contextmenu").contextmenu(function() {
			let langInfo = document.getElementById(avsdivNoRegex).lang.split('|');

			let videoId = langInfo[0];
			let videourl = langInfo[1];
			let playerId = 'video' + videoId;

			var elementExists = document.getElementById(playerId);

			var middleTime = getMiddleTimestamp(imgIdAVS);
			var startTime = middleTime -2;
			var endTime = middleTime+2;
			if (elementExists != null) {
				var player = $('#' + playerId).get(0);
				player.pause();
				player.src = videourl + '#t=' + startTime + ',' + endTime;
				player.load();
				player.play();
				return;
			}

			let imgtable = '<video id="' + playerId + '" class="myimg video" autoplay loop muted preload="none"><source src="' + videourl + '#t=' + startTime + ',' + endTime + '" type="video/mp4"></video>'
			$('#' + avsdiv).append(imgtable);
			$('#' + imgIdEsc).css("display", "none");

			return false;
		});
	}

	function hideVideoAVS(e) {
		let avsdivNoRegex = this.id
		let avsdiv = avsdivNoRegex.replaceAll(".", "\\.")
		let imgIdEsc = avsdiv.replaceAll("avsdiv_", "selected_avs_")
		let langInfo = document.getElementById(avsdivNoRegex).lang.split('|');
		let videoId = langInfo[0];
		let playerId = 'video' + videoId;

		var elementExists = document.getElementById(playerId);
		if (elementExists != null) {
			$('#' + playerId).remove();
			$('#' + imgIdEsc).css("display", "block");
		}
	}
}

function resetSelectionBorder(selectedItem) {
	var avsTagElement = document.getElementById(selectedItem.avsTagId);
	if (avsTagElement) {
		avsTagElement.checked = false;
	}

	var imgElement = document.getElementById(selectedItem.imgId);
	if (imgElement) {
		imgElement.style.borderWidth = "0";
		imgElement.style.borderStyle = "none";
		imgElement.style.outline = "none";
		imgElement.style.outlineOffset = "0";
	}
}

function unselectImg(selectedItem) {
	var avsListElement = document.getElementById("avsList_" + selectedItem.imgId);
	if (avsListElement) {
	  avsListElement.remove();
	}
	if (!preserveResultLightboxOnUnselect && resultLightboxItem && resultLightboxItem.imgId === selectedItem.imgId) {
		closeResultLightbox();
	}
	resetSelectionBorder(selectedItem);
}

function updateAVSInfo() {
	var divAvsSelected = document.getElementById('avsSelected');
	var divResGrid = document.getElementById('resGrid');
	if (!divAvsSelected || !divResGrid) return;
	var divAvsSelectedHeight = divAvsSelected.offsetHeight;

	divResGrid.style.height = "calc(100% - " + divAvsSelectedHeight + "px)";
}

function updateAVSTab(selectedItem) {
	if (avsManually.has(selectedItem.imgId)) {
			selectImg(selectedItem)
	}
	else {
		unselectImg(selectedItem)
	}
	updateAVSInfo();
}

function avsToggle(avsJSON, event, isRemoveButton = false) {
	var selectedItem = avsJSON;
	rowIdx = selectedItem.rowIdx
	colIdx = selectedItem.colIdx

	var alreadySelected = avsManually.has(selectedItem.imgId);
	var prevItems = Array.from(avsManually.values());
	var prevVideoId = prevItems.length ? prevItems[0].videoId : null;
	var hadPreview = prevItems.length > 0;

	// Click lại cùng ảnh / nút remove → bỏ chọn
	if (isRemoveButton || alreadySelected) {
		avsManually.clear();
		avsManuallyByVideoID.clear();
		for (var i = 0; i < prevItems.length; i++) {
			resetSelectionBorder(prevItems[i]);
		}
		$("#avsTab").empty();
		closeResultLightbox();
		updateAVSInfo();
		return;
	}

	// Click ảnh khác → chỉ giữ đúng 1 ảnh (thay preview, không xóa rồi gắn lại 2 bước)
	avsManually.clear();
	avsManuallyByVideoID.clear();
	for (var j = 0; j < prevItems.length; j++) {
		resetSelectionBorder(prevItems[j]);
	}

	avsManually.set(selectedItem.imgId, selectedItem);
	avsManuallyByVideoID.set(selectedItem.videoId, selectedItem);

	try {
		selectImg(selectedItem);
		// Chỉ recalc layout khi 0→1; 1→1 giữ nguyên chiều cao → không giật
		if (!hadPreview) {
			updateAVSInfo();
		}
		// Cùng video → không scroll
		if (!document.body.classList.contains("result-lightbox-open") && (prevVideoId === null || prevVideoId !== selectedItem.videoId)) {
			scrollToRow(rowIdx - 1);
		}
	} catch (error) {
		console.log(error);
	}
}

/*
function avsRemoveSelected(selectedItem) {
	if (!avsSubmitted.has(selectedItem.videoId)) {
		if (avsManually.has(selectedItem.imgId)) {
			avsManually.delete(selectedItem.imgId);
			avsManuallyByVideoID.delete(selectedItem.videoId);
		}
	}
}*/

function avsSubmittedTab(selectedItem) {
	videoUrl = videoUrlPrefix + selectedItem.videoId + "-medium.mp4";
	var submittedItemJson = JSON.stringify(selectedItem);
	//let id = selectedItem.imgId;.replaceAll(".jpg", "");

	img = '<div id="avsSubmittedList_' + selectedItem.imgId + '" class="submitted-card">';
	img += '<img class="submitted-thumbnail" title="' + selectedItem.imgId + '" width="110" height="80" src="' + selectedItem.thumb + '">';
	img += '<div class="submitted-toolbar">'
			+'<span class="submitted-frame-id" title="' + selectedItem.imgId + '">' + selectedItem.imgId + '</span>'
			+'<a class="submitted-action submitted-action-summary" title="Nearly keyframes" aria-label="Nearly keyframes" href="#" onclick=\'openNearbyKeyframes(' + submittedItemJson + '); return false;\'><i class="fas fa-th-large" aria-hidden="true"></i></a>'
			+'<a class="submitted-action submitted-action-video" href="#" title="Play video" aria-label="Play video" onclick="playVideoWindow(\''+ videoUrl+ '\', \''+ selectedItem.videoId+ '\', \''+selectedItem.imgId+'\'); return false;"><i class="fas fa-video" aria-hidden="true"></i></a>'
			+'<a class="submitted-action submitted-action-similarity" href="#" title="Visual similarity" aria-label="Visual similarity" onclick="var queryObj=new Object(); queryObj.comboVisualSim=\'' + selectedItem.imgId + '\'; searchByLink(queryObj); return false;"><i id="avs_comboSim'+ selectedItem.imgId + '" class="fas fa-clone" aria-hidden="true"></i></a>'
			+'</div></div>';
	$("#avsSubmittedTab").append(img);
}

function qaSubmittedTab(answerTxt) {
	text = '<div>';

	text += '<p>' + answerTxt + '</p>'
		+'</div><br>'
	$("#avsSubmittedTab").append(text);
}

function avsHideSubmittedVideos() {
	for (let [videoId, selectedItem] of avsSubmitted) {
		tmp = $("[id^=video_" + videoId + "]");
		tmp2 = document.getElementById("video_" + videoId);
		$("[data-videoid^=" + videoId + "]").remove();
	}
}

function avsHilightlighSubmittedVideos() {
	for (let [videoId, selectedItem] of avsSubmitted) {
		tmp = $("[id^=video_" + videoId + "]");
		tmp2 = document.getElementById("video_" + videoId);
		$("[data-videoid^=" + videoId + "]").css("background-color", "#fce390");
	}
}


function avsCleanManuallySelected() {
	for (let [key, selectedItem] of avsManually) {
		resetSelectionBorder(selectedItem)
	}
	avsManually.clear();
	avsManuallyByVideoID.clear();
	$("#avsTab").empty();
	closeResultLightbox();
}

/*
function avsReloadManuallySelected() {
	for (let [key, selectedItem] of avsManually) {
		try {
			updateAVSTab(selectedItem)
		} catch (error) {
			console.log("AVS " + selectedItem.imgId + " is not in the results list");
		}
	}
}*/
