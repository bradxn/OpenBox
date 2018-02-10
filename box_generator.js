// Originally from https://github.com/bumblebeefr/svg-box-generator

var layer = document.getElementById("layer1");

var TabTools = {
	/**
	 * Generate the elements of a polygon
	 * svg for notches of approximately
	 * <tab_width>, over a length of <length>,
	 * for a material thickness <thickness>.
	 *
	 * Options :
	 *  - direction : 0 top of the face, 1 right of the face, 2 bottom of the face, 3 left of the face.
	 *  - firstUp : Indicates whether you start at the top of a cut-away (true) or at the bottom of the cut-away (false - default)
	 *  - lastUp : Indicates whether you end at the top of a cut-away (true) or at the bottom of the cut-away (false - default)
	 **/
	tabs: function (length, tab_width, thickness, options) {

		//options management
		var opt = {
			direction: 0,
			firstUp: false,
			lastUp: false,
			inverted: false,
			backlash: 0,
			cutOff: false

		};
		if (typeof options === 'object') {
			for (k in options) {
				opt[k] = options[k];
			}
		}
		if (typeof opt.backlash != 'number') {
			opt.backlash = 0;
		}

		//Calcultate tab size and number
		var nb_tabs = Math.floor(length / tab_width);
		nb_tabs = nb_tabs - 1 + (nb_tabs % 2);
		var tab_real_width = length / nb_tabs;

		//Check if no inconsistency on tab size and number
		console.debug(["For a width of ", length, "and finger size of ", tab_width, "=> Number of finger:", nb_tabs, "Finger width: ", tab_real_width].join(" "));
/*
		if (tab_real_width <= thickness * 1.5) {
			var msg = ["Be careful the resulting notches are not wide enough for the material of your material (", tab_width, " < ", thickness, "). Please use a notch size consistent with your box"].join(" ");
			alert(msg);
			throw (msg);
		}
*/
		if (nb_tabs <= 1) {
			var msg = ["No room for any fingers! Please use a finger size that will work for your box size"].join(" ");
			document.getElementById("msg").innerText = msg;
//			alert(msg);
			throw (msg);
		}

		return TabTools._rotate_path(TabTools._generate_tabs_path(tab_real_width, nb_tabs, thickness, options), opt.direction);

	},

	_generate_tabs_path: function (tab_width, nb_tabs, thickness, options) {
		console.debug((options.cutOff ? "generate path with cuttof" : "generate path without cutoff"));
		//Generate path
		var points = [];
		for (var i = 1; i <= nb_tabs; i++) {
			if (options.inverted) {
				if (i % 2 == 1) { //gap
					if (i != 1 || !options.firstUp) {
						points.push([0, thickness]);
					}
					if (i == 1 || i == nb_tabs) {
						points.push([tab_width - (options.cutOff ? thickness : 0) - (0.5 * options.backlash), 0]);
					} else {
						points.push([tab_width - options.backlash, 0]);
					}
					if (i != nb_tabs || !options.lastUp) {
						points.push([0, -thickness]);
					}
				} else { //tab
					points.push([tab_width + options.backlash, 0]);
				}

			} else {
				if (i % 2 == 1) { //tab
					if (i != 1 || !options.firstUp) {
						points.push([0, -thickness]);
					}
					if (i == 1 || i == nb_tabs) {
						points.push([tab_width - (options.cutOff ? thickness : 0) + (0.5 * options.backlash), 0]);
					} else {
						points.push([tab_width + options.backlash, 0]);
					}
					if (i != nb_tabs || !options.lastUp) {
						points.push([0, thickness]);
					}
				} else { //gap
					points.push([tab_width - options.backlash, 0]);
				}
			}

		}
		return points;
	},

	_rotate_path: function (points, direction) {
		switch (direction) {
		case 1:
			return points.map(function (point) {
				return [-point[1], point[0]];
			});
		case 2:
			return points.map(function (point) {
				return [-point[0], -point[1]];
			});
		case 3:
			return points.map(function (point) {
				return [point[1], -point[0]];
			});
		default:
			return points;
		}
	}
};
var SvgTools = {
	mm2px: function (arr) {
		console.log(typeof arr);
		if (typeof arr == 'array' || typeof arr == 'object') {
			return arr.map(function (point) {
				return point.map(function (coord) {
					return coord * 96 / 25.4;
				});
			});
		}
		if (typeof arr == 'number') {
			return arr * 96 / 25.4;
		}

	},

	toPathString: function (arr) {
		return arr.map(function (point) {
			return point.join(",")
		}).join(" ");
	},
	addPath: function (str, id, _x, _y) {
		var shape = document.createElement("path");
		shape.setAttribute("style", "fill:rgba(255, 255, 255, .7); stroke:#ffffff");
		shape.setAttribute("id", id);
		shape.setAttribute("transform", "translate(" + SvgTools.mm2px(_x) + "," + (SvgTools.mm2px(_y)) + ")");
		shape.setAttribute("d", "m " + str + " z");
		layer.appendChild(shape);
	},
	clearPathAndLink: function () {
		var out = document.getElementById("out");
		out.innerHTML = "Loading...";
		layer.innerHTML = "";
	},
	downloadLink: function (width, depth, height, thickness) {
//		alert(document.getElementById("svg").innerHTML);
		document.getElementById("preview").innerHTML = document.getElementById("svg").innerHTML;
		var aFileParts = ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>', document.getElementById("svg").innerHTML];
		var oMyBlob = new Blob(aFileParts, {
			type: 'image/svg+xml '
		});
		var out = document.getElementById("out");
		out.innerHTML = "";
		var link = document.createElement("a");
		link.innerHTML = "Download SVG file";
		link.setAttribute("class", "download-btn");
		link.setAttribute("href", URL.createObjectURL(oMyBlob));
		link.setAttribute("download", ["box_", width, "x", depth, "x", height, "_", thickness, "mm.svg"].join(""));
		out.appendChild(link);
//		link.click();
	},
	setDocumentSize: function (width, depth, height, thickness) {
		var w = 50 + SvgTools.mm2px(2 * Math.max(width, depth) + 3 * thickness);
		var h = 50 + SvgTools.mm2px(depth + 2 * height + 4 * thickness);
		document.getElementById("box").setAttribute("height", Math.ceil(h) + "px");
		document.getElementById("box").setAttribute("width", Math.ceil(w) + "px");
		document.getElementById("box").setAttribute("viewbox", "0,0," + w + "," + h);
	}
};

var Box = {
	_bottom: function (width, depth, tab_width, thickness, backlash) {
		console.debug("_bottom");
		var points = [[0, 0]];
		points.push.apply(points, TabTools.tabs(width, tab_width, thickness, {
			direction: 0,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		points.push.apply(points, TabTools.tabs(depth, tab_width, thickness, {
			direction: 1,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		points.push.apply(points, TabTools.tabs(width, tab_width, thickness, {
			direction: 2,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		points.push.apply(points, TabTools.tabs(depth, tab_width, thickness, {
			direction: 3,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		return points;
	},
	_front_without_top: function (width, height, tab_width, thickness, backlash) {
		console.debug("_front_without_top");
		var points = [[0, 0], [width, 0]];
		points.push.apply(points, TabTools.tabs(height - thickness, tab_width, thickness, {
			direction: 1,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		points.push.apply(points, TabTools.tabs(width, tab_width, thickness, {
			direction: 2,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		points.push.apply(points, TabTools.tabs(height - thickness, tab_width, thickness, {
			direction: 3,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		return points;
	},
	_front_with_top: function (width, height, tab_width, thickness, backlash) {
		console.debug("_front_with_top");
		var points = [[0, thickness]];

		points.push.apply(points, TabTools.tabs(width, tab_width, thickness, {
			direction: 0,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		points.push.apply(points, TabTools.tabs(height - (thickness * 2), tab_width, thickness, {
			direction: 1,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		points.push.apply(points, TabTools.tabs(width, tab_width, thickness, {
			direction: 2,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		points.push.apply(points, TabTools.tabs(height - (thickness * 2), tab_width, thickness, {
			direction: 3,
			backlash: backlash,
			firstUp: true,
			lastUp: true
		}));
		return points;
	},
	_side_without_top: function (depth, height, tab_width, thickness, backlash) {
		console.debug("_side_without_top");
		var points = [[thickness, 0], [depth - (2 * thickness), 0]];
		points.push.apply(points, TabTools.tabs(height - thickness, tab_width, thickness, {
			direction: 1,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		points.push.apply(points, TabTools.tabs(depth, tab_width, thickness, {
			direction: 2,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true,
			cutOff: true
		}));
		points.push.apply(points, TabTools.tabs(height - thickness, tab_width, thickness, {
			direction: 3,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		return points;
	},
	_side_with_top: function (depth, height, tab_width, thickness, backlash) {
		console.debug("_side_with_top");
		var points = [[thickness, thickness]];
		points.push.apply(points, TabTools.tabs(depth, tab_width, thickness, {
			direction: 0,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true,
			cutOff: true
		}));
		points.push.apply(points, TabTools.tabs(height - (2 * thickness), tab_width, thickness, {
			direction: 1,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		points.push.apply(points, TabTools.tabs(depth, tab_width, thickness, {
			direction: 2,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true,
			cutOff: true
		}));
		points.push.apply(points, TabTools.tabs(height - (2 * thickness), tab_width, thickness, {
			direction: 3,
			backlash: backlash,
			firstUp: true,
			lastUp: true,
			inverted: true
		}));
		return points;
	},
	withTop: function (width, depth, height, tab_size, thickness, backlash) {
		SvgTools.clearPathAndLink();
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._bottom(width, depth, tab_size, thickness, backlash))), 'bottom', (1 * thickness), (1 * thickness));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._bottom(width, depth, tab_size, thickness, backlash))), 'top', (2 * thickness + width), (1 * thickness));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._front_with_top(width, height, tab_size, thickness, backlash))), 'font', (2 * thickness + width), (2 * thickness + depth));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._front_with_top(width, height, tab_size, thickness, backlash))), 'back', (1 * thickness), (2 * thickness + depth));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._side_with_top(depth, height, tab_size, thickness, backlash))), 'left_side', (2 * thickness + depth), (3 * thickness + depth + height));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._side_with_top(depth, height, tab_size, thickness, backlash))), 'right_side', (1 * thickness), (3 * thickness + depth + height));
		SvgTools.setDocumentSize(width, depth, height, thickness);
		SvgTools.downloadLink(width, depth, height, thickness);
	},
	withoutTop: function (width, depth, height, tab_size, thickness, backlash) {
		SvgTools.clearPathAndLink();
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._bottom(width, depth, tab_size, thickness, backlash))), 'bottom', (1 * thickness), (1 * thickness));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._front_without_top(width, height, tab_size, thickness, backlash))), 'font', (2 * thickness + width), (2 * thickness + depth));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._front_without_top(width, height, tab_size, thickness, backlash))), 'back', (1 * thickness), (2 * thickness + depth));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._side_without_top(depth, height, tab_size, thickness, backlash))), 'left_side', (2 * thickness + depth), (3 * thickness + depth + height));
		SvgTools.addPath(SvgTools.toPathString(SvgTools.mm2px(Box._side_without_top(depth, height, tab_size, thickness, backlash))), 'right_side', (1 * thickness), (3 * thickness + depth + height));
		SvgTools.setDocumentSize(width, depth, height, thickness);
		SvgTools.downloadLink(width, depth, height, thickness);
	}
};

function MMFromUnit(n, u)
{
	if (u == "mm")
		mm = n;
	else if (u == "cm")
		mm = n * 10;
	else if (u == "m")
		mm = n * 1000;
	else if (u == "in" || u == "" || u == null)
		mm = n * 25.4;
	else if (u == "ft")
		mm = n * 304.8;
	else
		throw (n + " is not a length");

	return mm;
}

function ParseLength(val)
{
	var result = val.match(/\s*([0-9]+)\s+([0-9]+)\/([0-9]+)\s*(.*)\s*/);
	if (result != null)
	{
		var n0 = parseInt(result[1]);
		var n1 = parseInt(result[2]);
		var n2 = parseInt(result[3]);
		var u = result[4];
		var n = n0 + n1 / n2;
		return MMFromUnit(n, u);
	}

	result = val.match(/\s*([0-9]+)\/([0-9]+)\s*(.*)\s*/);
	if (result != null)
	{
		var n1 = parseInt(result[1]);
		var n2 = parseInt(result[2]);
		var u = result[3];
		var n = n1 / n2;
		return MMFromUnit(n, u);
	}

	result = val.match(/\s*([0-9.]*)\s*(.*)\s*/);
	var n = result[1];
	var u = result[2];

	return MMFromUnit(n, u);


}

function value_of(id) {
	var v = ParseLength(document.getElementById(id).value);
	if (isNaN(v)) {
		throw (id + " is not a number : " + document.getElementById(id).value);
	} else {
		return v;
	}
}

function generate_box() {
	document.getElementById("msg").innerText = "";
	try {
		if (document.getElementById('closed').checked) {
			Box.withTop(value_of('width'), value_of('depth'), value_of('height'), value_of('tabs'), value_of('thickness'), value_of('backlash'));
		} else {
			Box.withoutTop(value_of('width'), value_of('depth'), value_of('height'), value_of('tabs'), value_of('thickness'), value_of('backlash'));
		}
	} catch (e) {
		console.error(e);
		document.getElementById("out").innerHTML = "";
		if (document.getElementById("msg").innerText == "")
			document.getElementById("msg").innerText = 'Cannot generate the requested box';
//		alert('Cannot generate the requested box');
	}
}
