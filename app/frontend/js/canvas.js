function draw_grid(canvas, gridWidth, gridHeight) {
	for (var x = 1; x < (canvas.width / gridWidth); x++) {
		canvas.add(new fabric.Line([ gridWidth * x, 0, gridWidth * x, canvas.height ], {
			stroke : "#D0D0D0",
			strokeWidth : 1,
			selectable : false,
			strokeDashArray : [ 5, 5 ]
		}));
	}
	for (var y = 1; y < (canvas.height / gridHeight); y++) {
		canvas.add(new fabric.Line([ 0, gridHeight * y, canvas.width, gridHeight * y ],
				{
					stroke : "#D0D0D0",
					strokeWidth : 1,
					selectable : false,
					strokeDashArray : [ 5, 5 ]
				}));
	}
}

function get_canvas(idx) {
	var canvas_id = 'canvas' + idx;
	var annotations_id = 'annotations' + idx;
	var not_id = 'not' + idx;

	var canvas = new fabric.Canvas(canvas_id);
	canvas.uniScaleTransform = true;
	canvas.selection = false;
	canvas._sceneIdx = idx;
	isCanvasClean[idx] = false;
	isReset = false;
	draw_grid(canvas, cellWidth, cellHeight);

	canvas.on('mouse:down', function(o) {
		activeCanvas = canvas;
		activeCanvasIdx = idx;
		draggedLabel = '';
		if (!o.target && !activeCanvas.selection) {
			isDrawing = true;
			var pointer = activeCanvas.getPointer(o.e);
			origX = pointer.x;
			origY = pointer.y;

			var imgElement = document.getElementById(draggedLabel);

			rect = new fabric.Image(imgElement, {
				left: origX,
				top: origY,
				width: pointer.x-origX,
				height: pointer.y-origY,
				fill: '',
				stroke : 'black',
				type : 'rect',
				uuid : generateUUID(),
				strokeWidth : 1,

			});
			activeCanvas.add(rect);
		}

		if (o.target) {
		 	if (o.target.get('type') == 'rect') {
				$("#" + o.target.get('uuid')).hide();
			} else {
				groupObjects = o.target.getObjects();
				for (thing in groupObjects) {
					obj = groupObjects[thing];
					$("#" + obj.get('uuid')).hide();
				}
			}
		}
	});

	canvas.on('mouse:move', function(o) {
		activeCanvas = canvas;
		activeCanvasIdx = idx;

	    if (isDrawing && !activeCanvas.selection && rect != null) {
		    var pointer = activeCanvas.getPointer(o.e);

		   	if(origX>pointer.x){
		        rect.set({ left: Math.abs(pointer.x) });
		    }
		    if(origY>pointer.y){
		        rect.set({ top: Math.abs(pointer.y) });
		    }
		    rect.set({ width: Math.abs(origX - pointer.x) });
		    rect.set({ height: Math.abs(origY - pointer.y) });
		    activeCanvas.renderAll();
	   }
	});

	canvas.on('mouse:dblclick', function(o) {
		activeCanvas = canvas;
		activeCanvasIdx = idx;
		if (o.target) {
			if (o.target.get('type') == 'rect') {
				activeCanvas.sendToBack(o.target);
				activeCanvas.discardActiveObject().renderAll();
			}
		}
	});

	canvas.on('mouse:up', function(o) {
		activeCanvas = canvas;
		activeCanvasIdx = idx;
		groupObjects = null;

		if (isDrawing && !activeCanvas.selection) {
			isDrawing = false;
			activeCanvas.remove(rect);
			if (rect.width >= cellWidth/3 && rect.height >= cellHeight/3) {
				$("#dialog").dialog("open");
				$("#tag").autocomplete(
					"option",
					"appendTo",
					$("#dialog").parent()
				);
			} else
				return;

		} else if (o.target) {
			if (o.target.get('type') == 'rect') {
				label =$("#" + o.target.get('uuid')).attr('title');
				$("#" + o.target.get('uuid')).remove();
				addDeleteBtn(label, o.target);
			} else  if (o.target.get('type') == 'activeSelection') {
				groupObjects = o.target.getObjects();
				for (thing in groupObjects) {
					obj = groupObjects[thing];
					o.target.removeWithUpdate(obj);
			    	label =$("#" + obj.get('uuid')).attr('title');
					$("#" + obj.get('uuid')).remove();
					addDeleteBtn(label, obj);
			   }
			}
		} else
			return;
    	isCanvasClean[idx] = false;
		isReset = false;
		searchByForm();

		if (groupObjects != null) {
			for (thing in groupObjects) {
				obj = groupObjects[thing];
				o.target.addWithUpdate(obj);
		    }
		}

		var objs = activeCanvas.getObjects();
		for (var i = 0 ; i < objs.length; i++) {
			objs[i].setCoords();
		}
	});

		$("#" + annotations_id).autocomplete({
		      source: null
		 });

		$("#" + annotations_id).keyup(function(e) {
			annotations = $("#" + annotations_id).val();
			if (annotations != '') {
				terms = mifileAnnotations;
				words =  annotations.split(" ");
				lastTerm = words[words.length - 1];
				if (lastTerm.length >= 3 && e.which != 13) {
					$("#" + annotations_id).autocomplete({
				        minLength: 3,
				        source: function( request, response ) {
				          response( $.ui.autocomplete.filter(
				        	mifileAnnotations, extractLast( request.term ) ) );
				        },
				        focus: function() {
				          return false;
				        },
				        select: function( event, ui ) {
				          var terms = split( this.value );
				          terms.pop();
				          terms.push( ui.item.value.split(',')[0] );
				          terms.push( "" );
				          this.value = terms.join( " " );
						searchByForm();
				          return false;
				        }
				      });
				} else {
					$( "#" + annotations_id ).autocomplete( "option", "source", '' );
				}
			}
			 if(e.which == 13 || annotations.trim() == '') {
						searchByForm();
			 }
		});

		$("#" + not_id).keyup(function(e) {
			notField = $("#" + not_id).val();
			if (notField != '') {
				notField = notField.replace(new RegExp("([0-9])([a-z])", "g"), "$1 $2");
				$("#" + not_id).val(notField);
				words =  notField.split(" ");
				lastTerm = words[words.length - 1];
				if (lastTerm.length >= 3 && e.which != 13) {
					$( "#" + not_id ).autocomplete({
				        minLength: 3,
				        source: function( request, response ) {
				          response( $.ui.autocomplete.filter(
				        	availableTags, extractLast( request.term ) ) );
				        },
				        focus: function() {
				          return false;
				        },
				        select: function( event, ui ) {
				          var terms = split( this.value );
				          terms.pop();
				          terms.push( ui.item.value.split(',')[0] );
				          terms.push( "" );
				          this.value = terms.join( " " );
						searchByForm();
				          return false;
				        }
				      });
				} else {
					$( "#" + not_id ).autocomplete( "option", "source", '' );
				}
			}
			 if(e.which == 13 || notField.trim() == '') {
				 $( "#" + not_id ).autocomplete( "option", "source", '' );
						searchByForm();
			 }
		});

		$("#tag").autocomplete({
			minLength: 2,
			appendTo: $("#dialog").parent(),
			source: function(request, response) {
				var tags = Array.isArray(availableTags) ? availableTags : [];
				response(
					$.ui.autocomplete.filter(tags, extractLast(request.term))
				);
			},
			focus: function() {
				return false;
			},
			select: function(event, ui) {
				var terms = split(this.value);
				terms.pop();
				terms.push(ui.item.value.split(',')[0]);
				terms.push("");
				this.value = terms.join(" ");
				return false;
			}
		});

		$("#dialog").off("keyup.objectGrid");
		$("#dialog").on("keyup.objectGrid", function(e) {
			textVal = $("#tag").val().trim();
			 var key = e.which;
			 if(key == 13) {
				if (textVal) {
					activeCanvas.add(rect);
					addDeleteBtn(textVal.trim(), rect);
				    rect = null;
				}

				$(this).closest('.ui-dialog-content').dialog('close');
				$("#tag").val('');
						searchByForm();

				var objs = activeCanvas.getObjects();
			    for (var i = 0 ; i < objs.length; i++) {
					objs[i].setCoords();
				}
			}
		});

		 $('#dialog').on('dialogclose', function(event) {
			 $("#tag").val('');
		 });

	return canvas;

}
