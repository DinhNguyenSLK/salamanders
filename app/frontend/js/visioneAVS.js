const avsManually = new Map();
const avsManuallyByVideoID = new Map();
const avsSubmitted = new Map();

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
				<a title="Video summary" href="showVideoKeyframes.html?videoId=${selectedItem.videoId}&id=${selectedItem.imgId}#${selectedItem.imgId}" target="_blank"><i class="fa fa-th" style="font-size:12px;  padding-left: 5px;"></i></a>
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
	let videoUrl = videoUrlPrefix + selectedItem.videoId + ".mp4";
	let videoUrlPreview = videoshrinkUrl + selectedItem.videoId + ".mp4";

	let existingList = document.querySelector('#avsTab [id^="avsList_"]');
	if (existingList) {
		// Đã có 1 preview → cập nhật tại chỗ (không destroy DOM → không giật layout)
		updatePreviewInPlace(selectedItem, videoUrl, videoUrlPreview);
	} else {
		$("#avsTab").html(imgSelected(selectedItem, videoUrl, videoUrlPreview));
		bindPreviewHover(selectedItem.imgId);
	}

	let avsTagId = document.getElementById(selectedItem.avsTagId);
	if (avsTagId != null)
		avsTagId.checked = true;

	let selImgId = document.getElementById(selectedItem.imgId)
	if (selImgId != null) {
		selImgId.style.borderWidth = "6px";
		selImgId.style.borderStyle = "dashed";
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
		links[1].href = "showVideoKeyframes.html?videoId=" + selectedItem.videoId + "&id=" + selectedItem.imgId + "#" + selectedItem.imgId;
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
		imgElement.style.borderWidth = "3px";
		imgElement.style.borderStyle = "solid";
	}
}

function unselectImg(selectedItem) {
	var avsListElement = document.getElementById("avsList_" + selectedItem.imgId);
	if (avsListElement) {
	  avsListElement.remove();
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
		if (prevVideoId === null || prevVideoId !== selectedItem.videoId) {
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
	//let id = selectedItem.imgId;.replaceAll(".jpg", "");

	img = '<div id="avsSubmittedList_' + selectedItem.imgId + '">';

	img += '<a title="View annotations of ' + selectedItem.imgId  + '" href="showVideoKeyframes.html?videoId=' + selectedItem.videoId + '&id='+ selectedItem.imgId + '#'+ selectedItem.imgId + '" target="_blank"><i class="fa fa-th" style="font-size:12px;  padding-left: 3px;"></i></a>'
			+'<a href="#"><i title="Play Video" class="fa fa-play" style="font-size:10px; color:#007bff;padding-left: 3px;" onclick="playVideoWindow(\''+ videoUrl+ '\', \''+ selectedItem.videoId+ '\', \''+selectedItem.imgId+'\'); return false;"></i><a>'
			+'<a href="#"><img style="padding-left: 5px;" src="img/comboSim.svg" width=20 title="Visual similarity" alt="' + selectedItem.imgId + '" id="avs_comboSim'+ selectedItem.imgId + '" onclick="var queryObj=new Object(); queryObj.comboVisualSim=\'' + selectedItem.imgId + '\'; searchByLink(queryObj); return false;"><a>'
			+'<br>'


	img += '<img title="' + selectedItem.imgId + '"style="padding-bottom: 10px;" width="110" height="80" src="' + selectedItem.thumb + '"></div>';
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
