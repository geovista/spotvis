function createMap (sName, dId) {

	var theMap = (function() {

		var divId = dId;

		var isPolicicalFill = false;

		var sideName = sName;

		var currentUnitId;

		var parentView;

		var divWidth = document.getElementById(divId).clientWidth;
		var divHeight = document.getElementById(divId).clientHeight;

		var margin = {top: 0, right: 0, bottom: 0, left: 0};
		var width = divWidth - margin.left - margin.right;
		var height = divHeight - margin.top - margin.bottom;

		var active = "first";

		var mapable;

	    var projection = d3.geo.albers()
	    	.rotate([96,0])
	    	.center([-.6,38.7])
	    	.parallels([29.5,45.5])
			.scale(600)
			.precision(.1)
			.translate([width/2, height/2]);

		var path = d3.geo.path()
    		.projection(projection);

		var svg = d3.select("#" + divId).append("svg")
			.attr("width", width)
			.attr("height", height);

		var getDistrictStrokeWidth = d3.scale.linear()
			.domain([0,1])
			.range([.02,1]);

		var getStateStrokeWidth = d3.scale.linear()
			.domain([0,1])
			.range([.25,1.5]);

		var getNegColor = d3.scale.linear()
			.range(["#2166ac","#f7f7f7"]);

		var getPosColor = d3.scale.linear()
			.range(["#f7f7f7","#b2182b"]);

		var getColorFromPVI = function (v, type) {
			if (v > 0) {
				if (type === "state") {
					getPosColor.domain([-16,22]);
					var t = (v > 22) ? 22: v;
				} else {
					getPosColor.domain([-41,29]);
					var t = (v > 29) ? 29: v;
				}
				var c = getPosColor(t);
			} else {
				if (type === "state") {
					getNegColor.domain([-16,22]);
					var t = (v < -16) ? -16: v;
				} else {
					getNegColor.domain([-41,29]);
					var t = (v < -41) ? -41: v;
				}
				var c = getNegColor(t);				
			}
			return c;
		};

		var minScaleWidth = 10/width;
		var minScaleHeight = 10/height;


		// this is for zooming to us or a state
		var zoomToFullBounds = function(b) {
			
			mapable.transition().duration(2000)
				.attr("transform",
		    		"translate(" + projection.translate() + ")"
		    		+ "scale(" + .9 / Math.max((b[1][0] - b[0][0]) / width, minScaleWidth, minScaleHeight, (b[1][1] - b[0][1]) / height) + ")"
		    		+ "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
		};

		// This is for zooming to districts
		var zoomToHalfBounds = function(b) {
			mapable.transition().duration(2000)
				.attr("transform",
		    		"translate(" + projection.translate() + ")"
		    		+ "scale(" + .75 / Math.max((b[1][0] - b[0][0]) / width, minScaleWidth, minScaleHeight, (b[1][1] - b[0][1]) / height) + ")"
		    		+ "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
		};

		var setVisibleDistrict = function(v) {

			mapable.selectAll(".states.currentAggregate")
				.attr("class", "states noncurrentAggregate");
			mapable.selectAll(".districts.noncurrentAggregate")
				.transition()
				.duration(2000)
				.style("opacity", 1)
				.attr("class", "districts currentAggregate");
			
			mapable.selectAll(".state-boundaries")
				.transition()
				.delay(2000)
				.style("stroke-width", function () {
					return getStateStrokeWidth(v);
				});

			mapable.selectAll(".district-boundaries")
				.transition()
				.attr("stroke-opacity", 1)
				.delay(100)
				.duration(2000)
				.style("stroke-width", function () {
					return getDistrictStrokeWidth(v);
				})
				.each("end", function (d) {
					// this ensures that the data is at this value
					d3.select(this)
						.style("stroke-width", function () {
							return getDistrictStrokeWidth(v);
						})
						.attr("stroke-opacity", 1);
				});
		};

		var setDistrictInvisible = function(v) {


			mapable.selectAll(".districts")
				.transition()
				.duration(750)
				.attr("class", "districts noncurrentAggregate")
				.style("opacity", 0);
			mapable.selectAll(".states")
				.attr("class", "states currentAggregate");
	
			mapable.selectAll(".state-boundaries")
				.transition()
				.duration(750)
				.style("stroke-width", 1);

			mapable.selectAll(".district-boundaries")
				.transition()
				.duration(500)
				.style("stroke-width", function () {
					return getDistrictStrokeWidth(v);
				})
				.transition()
				.duration(500)
				.attr("stroke-opacity", 0);
		};

		var setStatesTransparent = function(v) {

			mapable.selectAll(".state-boundaries")
				.transition()
				.duration(750)
				.style("stroke-width", 1);

			mapable.selectAll(".district-boundaries")
				.transition()
				.duration(500)
				.style("stroke-width", function () {
					return getDistrictStrokeWidth(v);
				})
				.transition()
				.duration(500)
				.attr("stroke-opacity", 0);

		};

		var zoomIn = function (d) {
			var theG = d3.select("#" +sideName+ "ControlGroup").selectAll(".simDifButtonGroup.showing");

			if (active === d ){//|| theG[0].length !== 0) {
				if (active !== "first") {
					return zoomOut(d);
				}
			}
			var theElement = d3.select(this);
			mapable.selectAll(".active").classed("active", false);
			theElement.classed("active", active = d);
			
			var bounds = path.bounds(d);
			var scaleValue = (Math.max((bounds[1][0] - bounds[0][0]) / width, minScaleWidth, minScaleHeight, (bounds[1][1] - bounds[0][1]) / height));
			if (theElement.attr("id").split("_")[0] === "state") {
				zoomToFullBounds(bounds);
				setVisibleDistrict(scaleValue);
				setStrokeForUnit();
			} else {
				zoomToHalfBounds(bounds);
				setVisibleDistrict(scaleValue);
				setStrokeForUnit();
			} 

			d3.selectAll("#" + sideName + "Select").property("value", theElement.attr("id"));
			parentView.fireUpdate(theElement.attr("id"));

			
		};

		var zoomOut = function() {

			var elements = mapable.select(".active");

			var type = d3.select(elements[0][0]).attr("id").split("_")[0];
			var theG = d3.select("#" +sideName+ "ControlGroup").selectAll(".simDifButtonGroup.showing");

			if (theG[0].length !== 0) {
				mapable.transition().duration(1500).attr("transform", "");
				var bounds = path.bounds(d3.select(elements[0][0]));
				var scaleValue = (Math.max((bounds[1][0] - bounds[0][0]) / width, minScaleWidth, minScaleHeight, (bounds[1][1] - bounds[0][1]) / height));
				if (mapable.select(".active").attr("id").split("_")[0] !== "dist") {
					setDistrictInvisible(scaleValue);
					mapable.select(".state-boundaries")
						.style("stroke-width", 1);
				} else {
					setStatesTransparent(scaleValue);
				}


			} else if (type === "dist" && elements.length === 1) {

				var stateNum = d3.select(elements[0][0]).attr("id").split("_")[1].slice(0,2);
				mapable.selectAll("#state_"+stateNum).each(zoomIn);	

			} else if (type === "state" || elements.length > 1) {
				console.log("here");
				var bounds = path.bounds(d3.select(elements[0][0]));
				var scaleValue = (Math.max((bounds[1][0] - bounds[0][0]) / width, minScaleWidth, minScaleHeight, (bounds[1][1] - bounds[0][1]) / height));
				mapable.selectAll(".active").classed("active", active = false);
				mapable.transition().duration(1500).attr("transform", "");
				//var bounds = path.bounds(d3.select(elements[0][0]));
				//var scaleValue = (Math.max((bounds[1][0] - bounds[0][0]) / width, minScaleWidth, minScaleHeight, (bounds[1][1] - bounds[0][1]) / height));
				setDistrictInvisible(scaleValue);

			} /*else {
				console.log("party");
				mapable.selectAll(".active").classed("active", active = false);
				mapable.transition().duration(1500).attr("transform", "");
				setDistrictInvisible(scaleValue);
				d3.selectAll("#" + sideName + "Select").property("value", theElement.attr("id"));
				parentView.fireUpdate(theElement.attr("id"));
			}*/

		};

		var partyZoom = function (unitId) {
			console.log("party");
			mapable.selectAll(".active").classed("active", active = false);
			mapable.transition().duration(1500).attr("transform", "");
			//setDistrictInvisible(scaleValue);
			d3.selectAll("#" + sideName + "Select").property("value", unitId);
			parentView.fireUpdate(unitId);
		};

		var setStrokeForUnit = function () {
			mapable.selectAll(".highlightUnit").remove();
			console.log(mapable.selectAll(".highlightUnit"));
			var type = (mapable.select(".active").attr("id").split("_")[0] === "dist") ? "highLtDist":"highLtState";
			console.log(type);
			mapable.selectAll(".highlightUnit")
				.data([{"p":mapable.select(".active").attr("d")}]).enter().append("path")
				.classed("highlightUnit", true)
				.classed(type, true)/*
				.style("stroke-width", function (d) {
					var bounds = path.bounds(d3.select(this));
					var scaleValue = (Math.max((bounds[1][0] - bounds[0][0]) / width, minScaleWidth, minScaleHeight, (bounds[1][1] - bounds[0][1]) / height));
					return 8*getDistrictStrokeWidth(scaleValue);
				})*/
				.style("fill-opacity", 0)
				.attr("d", function(d) {return d.p;});

		};

		var changeFill = function() {
			if (isPolicicalFill) {
				mapable.selectAll(".states").selectAll("path")
					.attr("fill", "#bbb");
				mapable.selectAll(".districts").selectAll("path")
					.attr("fill",  "#bbb");
				isPolicicalFill = false;

			} else {
				mapable.selectAll(".states").selectAll("path")
				.attr("fill", function (d) {
					console.log(d.properties.COOKPVI);
					return getColorFromPVI(d.properties.COOKPVI, "state")
				});
				mapable.selectAll(".districts").selectAll("path")
				.attr("fill", function (d) {
					console.log(d.properties.COOKPVI);
					return getColorFromPVI(d.properties.COOKPVI, "dist")
				});
				isPolicicalFill = true;
			}
		}

    	var setSimDifButtons = function(data) {

    			function showSimDif(someD, that) {

    				var type = d3.select(that).attr("type");

    				hideSimDif(someD);

    				var xPos = (sideName === "leftSide") ?  0 : width - 10 - 5;
    				var anchor = (sideName === "leftSide") ? "start" : "end";
    				/*
    				var simDifGroup = d3.select("#" +sideName+ "ControlGroup").append("g")
    					.attr("class", "simDifButtonGroup simDifUnitsGroup")
    					.attr("transform", "translate(" + xPos + "," + 40 + ")");
    				*/
    				var simDifGroup = d3.select("#" +sideName+ "ControlGroup").append("g")
    					.attr("class", "simDifUnitsGroup")
    					.attr("transform", "translate(" + xPos + "," + 40 + ")");

    				function getUnitName(digits) {
    					return (digits.length > 2) ? "dist_"+digits:"state_"+digits;
    				}

    				function showCircle(d) {
    					var n = getUnitName(d.id);
    					mapable.select("#"+ n).each(function (d) {
    						var center = path.centroid(d.geometry);
    						var s = d3.select("#"+sideName+"ControlGroup").select(".showing");
    						var v = (s.classed("Similar")) ? "Similar":"Different";
    						mapable.append("circle")
    							.classed("simDifMarker", true)
    							.classed(sideName+"Marker",true)
    							.classed(v,true)
    							.attr("cx", center[0])
    							.attr("cy", center[1])
    							.style("opacity", 1)
    							.attr("r", 10)
    							.transition()
    							.delay(50)
    							.duration(1000)
    							.style("fill", "gray")
    							.style("opacity", 0)
    							.attr("r", 0)
    							.remove();
    					});
    					
    				}

    				simDifGroup.selectAll("g")
    					.data(someD).enter().append("g")
    					.attr("transform", function (d,i) {
    						var xPos = (sideName === "leftSide") ? -500 : width+500;
    						return "translate("+ xPos +"," + (40 + (i*20)) + ")";
    					})
    					.attr("class", "simDifUnitGroup "+ type)
    					.on("click", function(d) {
    						var n = getUnitName(d.id);
    						hideSimDif();
    						mapable.select("#"+ n).each(zoomIn);
    					})
    					.on("mouseover", showCircle)
    					.each(function(d) {

    						var theText = d3.select(this).append("text")
								.attr("class", "simDifText")
						    	.attr("dx", 0)
				      			.attr("dy", 0)
				      			.attr("text-anchor", anchor)
				      			.text(d.title);

				   			var rectX = (sideName === "rightSide") ? -(theText.node().getBBox().width) : 0;
				      		d3.select(this).append("rect")
				      			.attr("class", "simDifRect")
				      			.classed(sideName+"Rect", true)
				      			.attr("x", rectX)
				      			.attr("width", theText.node().getBBox().width)
				      			.attr("height", theText.node().getBBox().height);
    					});
    				var otherType = ("Similar" === type) ? "Different":"Similar";
    				simDifGroup.selectAll("g").transition()
    					.transition()
    					.duration(500)
    					.delay(function (d,i) {return i*100;})
    					.attr("transform", function (d,i) {
    						return "translate(0," + (40 + (i*20)) + ")";
    					})
    					.each("end", function (d) {
				      		mapable.select("#"+getUnitName(d.id))
				      			.classed("units" + type, true)
				      			.classed(sideName + "Units", true);

    					});

    				d3.select(that).classed("showing", true);
    				

    			}

    			function hideSimDif() {

    				function getUnitName(digits) {
    					return (digits.length > 2) ? "dist_"+digits:"state_"+digits;
    				}
    				var theG = d3.select("#" +sideName+ "ControlGroup");
    				theG.selectAll(".simDifButtonGroup")
    					.classed("showing", false);
    				theG.selectAll(".simDifUnitsGroup")
    					.transition()
    					.delay(750)
    					.remove();
    				
				    theG.selectAll(".simDifUnitGroup")
				    	.transition()
				    	.duration(500)
				    	.delay(function (d,i) {return i*100;})
				    	.attr("transform", function (d,i) {
				    		var xPos = (sideName === "leftSide") ? -500 : width+500;
    						return "translate("+ xPos +"," + (40 + (i*20)) + ")";
    					})
				    	.each("end", function(d) {
				    		mapable.select("#" + getUnitName(d.id))
				    			.classed("unitsSimilar", false)
				    			.classed("unitsDifferent", false)
				    		this.remove();
				    	})
				    	.remove();

				    return theG;
    			}

    			function addSimilarDifferentButton(theGroup, text, someData) {
    				var xPos = (text === "Different") ? 65:0;
    				xPos = (sideName === "rightSide") ? xPos+width - 125 - 10 - 2: xPos;
    				
		      		var simDifGroup = theGroup.selectAll(".simDifButtonGroup ." + text)
		      			.data([someData]).enter().append("g")
		      			.attr("transform", "translate(" + xPos + "," + 20 + ")")
		    			.attr("class", "simDifButtonGroup "+text)
		    			.classed("showing", false)
		    			.attr("type", text)
		    			.on("click", function(d) {
		    				if (d3.select(this).classed("showing")) {
		    					
		    					active = "";
		    					mapable.select(".active").each(zoomIn);
		    					hideSimDif(d);
		    				} else {

		    					showSimDif(d, this);
		    					mapable.select(".active").each(zoomOut);
		    				}

		    			});
		    		simDifGroup.append("rect")
						.attr("class", "buttonRect")
						.attr("width", 60)
						.attr("height", 18)
						.attr("rx", 5)
						.attr("ry", 5)
						.attr("dx", 0)
						.attr("dy", 0);
					simDifGroup.append("text")
						.attr("class", "buttonText")
				    	.attr("dx", 30)
		      			.attr("dy", 10)
		      			.attr("text-anchor", "middle")
		      			.text(text);
					
	      		}

		    	// clear out all other data that may be displaying
		    	hideSimDif();

	      		var theG = d3.select("#" +sideName+ "ControlGroup");
	      		theG.selectAll(".simDifButtonGroup").remove();
	      		addSimilarDifferentButton(theG, "Similar", data.similarUnits);
	      		addSimilarDifferentButton(theG, "Different", data.dissimilarUnits);
    	};

    	var init = function(theParentView, someUnit, data) {

    		parentView = theParentView;

    		currentUnitId = someUnit;

    		function setDropDown (someSvg) {

    			function dropDownChanged(d) { 
    				var someUnit = this.options[this.selectedIndex].value;
					parentView.fireUpdate(someUnit);
				}
				var xPos = (sideName === "leftSide") ? 2 : width - 302;
				var theDropDown = someSvg.append("foreignObject")
				    	.attr("width", 300)
				    	.attr("height", 30)
				    	.attr("x", xPos)
				    	.attr("y", 2)
					.append("xhtml:select")
				    	.attr("class", "unitDropDown")
				    	.attr("id", sideName+"Select")
				    	.on("change", function (d) {
				    		var someUnit = this.options[this.selectedIndex].value;
				    		if (someUnit.split("_")[0] === "party") {
				    			//console.log("view party not working yet");
				    			partyZoom(someUnit);
				    		} else {
				    			mapable.selectAll("#" + someUnit).each(zoomIn)
				    		}
				    	});

				d3.json("src/units.json", function (error, data) {
					if (error) {
						return console.warn(error);
					}
					data.forEach(function (obj) {
						theDropDown.append("xhtml:option")
							.attr("value", obj.key)
							.text(obj.value);
					});

					theDropDown.property("value", currentUnitId);

				});
    		}

    		queue()
    			.defer(d3.json, "src/mapfiles/us.json")
    			.defer(d3.json, "src/mapfiles/districts.json")
    			.await(ready);

			function ready(error, us, districts) {

				// this is the background for the svg so that black spots dont show up
				svg.append("rect")
					.attr("width",width)
					.attr("height", height)
					.attr("x",margin.left)
					.attr("y", margin.top)
					.style("fill", "white");

				mapable = svg.append("g")
					.attr("class", "mapable")
					.attr("id",  "mapable_" + sideName);

				mapable.append("g")
					.attr("class", "states currentAggregate")
				.selectAll("path")
					.data(topojson.feature(us, us.objects.US).features)
				.enter().append("path")
					.attr("d", path)
					.attr("id", function(d) {
						return "state_" + d.properties.STFIPS;
					})
					.on("click", zoomIn);

				mapable.append("g")
					.attr("class", "districts noncurrentAggregate")
				.selectAll("path")
					.data(topojson.feature(districts, districts.objects.Districts).features)
				.enter().append("path")
					.attr("d", path)
					.attr("area", function(d) {})
					.attr("id", function(d) {
						return "dist_" + d.properties.DISTRICTID;
					})
					.on("click", zoomIn);
					
				mapable.append("path")
					.attr("class", "district-boundaries")
					.attr("stroke-opacity", 0)
					.datum(topojson.mesh(districts, districts.objects.Districts, function(a, b) { return (a.id / 1000 | 0) === (b.id / 1000 | 0); }))
					.attr("d", path);

				mapable.append("path")
					.attr("class", "state-boundaries")
					.datum(topojson.mesh(us, us.objects.US, function(a, b) { return a !== b; }))
					.attr("d", path);
					
				 var controlGroup = svg.append("g")
    				.attr("transform", "translate(5,5)")
    				.attr("id", sideName + "ControlGroup");

    			function addZoomButton(someGroup) {
    				var xPos = (sideName === "rightSide") ? 0 : width - 78;
		      	   	var zoomOutButton = someGroup.append("g")
		    			.attr("transform", "translate(" + xPos + "," + 0 + ")")
		    			.attr("class", "zoomButtonGroup")
		    			.on("click", function () {mapable.select(".active").each(zoomIn);});
		    		zoomOutButton.append("rect")
						.attr("class", "buttonRect")
						.attr("width", 68)
						.attr("height", 18)
						.attr("rx", 5)
						.attr("ry", 5)
						.attr("dx", 0)
						.attr("dy", 0);
					zoomOutButton.append("text")
						.attr("class", "buttonText")
				    	.attr("dx", 34)
		      			.attr("dy", 10)
		      			.attr("text-anchor", "middle")
		      			.text("Zoom Out");
    			}

    			function addFillSwitch(someGroup) {
    				var xPos = (sideName === "rightSide") ? 0 : width - 78;
		      	   	var fillSwitchButton = someGroup.append("g")
		    			.attr("transform", "translate(" + xPos + "," + 20 + ")")
		    			.attr("class", "fillSwitchButtonGroup")
		    			.on("click", changeFill);
					fillSwitchButton.append("rect")
						.attr("class", "buttonRect")
						.attr("width", 34)
						.attr("height", 18)
						.style("fill", "#2166ac")
						.style("stroke-opacity", 0)
						.attr("fill-opacity", .1)
						.attr("dx", 0)
						.attr("dy", 0);
					fillSwitchButton.append("rect")
						.attr("class", "buttonRect")
						.attr("width", 34)
						.attr("height", 18)
						.style("fill", "#b2182b")
						.style("stroke-opacity", 0)
						.attr("fill-opacity", .1)
						.attr("x", 34)
						.attr("dy", 0);
					fillSwitchButton.append("rect")
						.attr("class", "buttonRect")
						.style("fill-opacity", 0)
						.attr("width", 68)
						.attr("height", 18)
						.attr("dx", 0)
						.attr("dy", 0);
					fillSwitchButton.append("text")
						.attr("class", "buttonText")
				    	.attr("dx", 34)
		      			.attr("dy", 10)
		      			.attr("text-anchor", "middle")
		      			.text("Cook PVI");
    			}

				addZoomButton(controlGroup);
				addFillSwitch(controlGroup);

				setDropDown(svg);

				setSimDifButtons(data);

				mapable.select("#"+someUnit).each(zoomIn);
				changeFill();
    		}

    	};

    	var update = function (someUnit, data) {
    		setSimDifButtons(data);
    	};

		return {

			init: init,
			update: update,

		};

	}());

	return theMap;

}