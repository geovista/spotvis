var createStatsCharts = function(dId) {

	var statsCharts = (function() {

		var divId = dId;

		// gets the width and height of what is actually on screen in px
		var divWidth = document.getElementById(divId).clientWidth;
		var divHeight = document.getElementById(divId).clientHeight;

		// sets the position of the svg
		// use these to position things
		var margin = {top: 5, right: 5, bottom: 5,left: 5};
		var width = divWidth - margin.left - margin.right;
		var height = divHeight - margin.top - margin.bottom;

		// draw on this
		var svg = d3.select("#" + divId).append("svg")
			.attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		    //.style("background-color", "lightgray")
			.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var pctUnempScale = d3.scale.linear()
			.domain([0,25]);

		var pctGovWorkScale = d3.scale.linear()
			.domain([0,25]);

		var medHouseIncScale = d3.scale.linear()
			.domain([0,115000]);

		var pctUninsScale = d3.scale.linear()
			.domain([0,40]);

		var getMax = function (type) {
			if (type === "pctGovWork") return 125;
			if (type === "pctUnemp") return 125;
			if (type === "pctUnins") return 125;
			if (type === "medHouseInc") return 100;
		};

		var getBarX = function (value, sideN, type) {

			var output;
			var max = getMax(type);
			if (type === "pctUnemp") {
				if (sideN === "leftSide") {
					pctUnempScale.range([(width/2),((width/2)-max)]);
				} else {
					pctUnempScale.range([0,max]);
				}
				output = pctUnempScale(value);
			} else if (type === "pctGovWork") {
				if (sideN === "leftSide") {
					pctGovWorkScale.range([(width/2),((width/2)-max)]);
				} else {
					pctGovWorkScale.range([0,max]);
				}
				output = pctGovWorkScale(value);
			} else if (type === "medHouseInc") {
				if (sideN === "leftSide") {
					medHouseIncScale.range([(width/2),((width/2)-max)]);
				} else {
					medHouseIncScale.range([0,max]);
				}
				output = medHouseIncScale(value);
			} else if (type === "pctUnins") {
				if (sideN === "leftSide") {
					pctUninsScale.range([(width/2),((width/2)-max)]);
				} else {
					pctUninsScale.range([0,max]);
				}
				output = pctUninsScale(value);
			}
			return output;
		}

		var getBarWidth = function (value, sideN, type) {
			var output;
			var max = getMax(type);
			if (type === "pctUnemp") {
				pctUnempScale
					.range([0,max]);
				output = pctUnempScale(value);
			} else if (type === "pctGovWork") {
				pctGovWorkScale
					.range([0,max]);
				output = pctGovWorkScale(value);
			} else if (type === "medHouseInc") {
				medHouseIncScale
					.range([0,max]);
				output = medHouseIncScale(value);
			} else if (type === "pctUnins") {
				pctUninsScale
					.range([0,max]);
				output = pctUninsScale(value);
			}
			return output;
		};


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

		var initDisplay = function(lData, rData) {

			var yPos = 40;

			var lDemoData = lData.demographics;
			if (lDemoData.length === 4) {lDemoData.push({});}
			lDemoData[4].unitID = lData.unitID;

			var rDemoData = rData.demographics;
			if (rDemoData.length === 4) {rDemoData.push({});}
			rDemoData[4].unitID = rData.unitID;

			function getTitle(s) {
				if (s === "pctGovWork") return "% Federal Government Worker";
				if (s === "pctUnemp") return "% Unemployed";
				if (s === "pctUnins") return "% Uninsured";
				if (s === "medHouseInc") return "Median Household Income";
			}

			function createBarGroup (theG, i) {

				var xPos = margin.left-5;
				var lInfo = lDemoData[i];
				var rInfo = rDemoData[i];
				var theKey = lInfo.attribute

				theG.append("g")
					.attr("transform", "translate(" + xPos + "," + yPos + ")");

				theG.append("text")
					.classed("chartsSubtitleText", true)
					.attr("dx", width/2)
					.attr("dy", yPos - 2)
					.text(getTitle(theKey));

				var leftBarGroup = theG.append("g")
					.classed("leftSideBarGroup", true)
					.attr("transform", "translate(" + xPos + "," + margin.top + ")");


				leftBarGroup.selectAll("."+theKey+"Rect")
					.data([lInfo])
					.enter().append("rect")
					.attr("class", theKey+"Rect")
					.attr("height", 20)
					.attr("width", function (d) {
						return getBarWidth(d.chartValue, "leftSide", theKey);
					})
					.attr("y", yPos)
					.attr("x", function (d) {
						return getBarX(d.chartValue, "leftSide", theKey);
					});
					
				leftBarGroup.selectAll("."+theKey+"Text")
					.data([lInfo])
					.enter().append("text")
					.attr("class", theKey+"Text")
					.attr("dx", function (d) {
						return (getBarX(d.chartValue, "leftSide", theKey)) - 3;
					})
					.attr("dy", yPos + 15)
					.attr("text-anchor", "end")
					.text(function (d) {
						var v = "$" + d.chartValue;
						var t = (theKey === "medHouseInc") ? ("$" + d.chartValue): d3.round(d.chartValue,1);
						return t;	
					});


				var rightBarGroup = theG.append("g")
					.classed("rightSideBarGroup", true)
					.attr("transform", "translate(" + (margin.right + (width/2)-5) + "," + margin.top + ")");


				rightBarGroup.selectAll("."+theKey+"Rect")
					.data([rInfo])
					.enter().append("rect")
					.attr("class", theKey+"Rect")
					.attr("height", 20)
					.attr("width", function (d) {
						return getBarWidth(d.chartValue, "rightSide", theKey);
					})
					.attr("y", yPos)
					.attr("x", 0);
					
				rightBarGroup.selectAll("."+theKey+"Text")
					.data([rInfo])
					.enter().append("text")
					.attr("class", theKey+"Text")
					.attr("dy", yPos + 15)
					.attr("dx", function (d) {
						return (getBarX(d.chartValue, "rightSide", theKey)) + 3;
					})
					.attr("text-anchor", "start")
					.text(function (d) {
						var v = "$" + d.chartValue;
						var t = (theKey === "medHouseInc") ? v : d3.round(d.chartValue,1);
						return t;	
					});

				yPos += 50;
			}

			function createPVIGroup(theG) {


				var titles = theG.append("g")
				.attr("class", "chartsSubtitleText");
				titles.append("text")	
					.attr("dx", width/2)
					.attr("dy", 20)
					.text("Cook Partisan Voting Index");

				var leftGroup = theG.append("g")
					.classed("leftSidePviGroup", true)
					.attr("transform", "translate(" + 0 + "," + 26 + ")");
				
				leftGroup.selectAll("rect")
					.data([lDemoData[4]])
					.enter().append("rect")
					.attr("width", 40)
					.attr("height", 26)
					.attr("stroke", "black")
					.attr("x", width/2 - 50)
					.attr("y", 0)
					.style("fill", function(d) {
						if (d.unitID.length > 4) {
							var v = (d.unitID.split("_")[1] === "demStates") ? -100 : 100;
							return getColorFromPVI(v, "states");
						} 
						var t = (d.unitID > 99) ? "state" : "dist";
						return getColorFromPVI(d.chartValue, t);
					
					});

				leftGroup.selectAll("text")
					.data([lDemoData[4]])
					.enter().append("text")
					.attr("class", "pviText")
					.attr("dx", width/2 - 30)
					.attr("dy", 14)
					.text(function (d) {
						var someText = (d.unitID.length > 4) ? " " : d.labelValue;
						return someText;	
					});

				var rightGroup = theG.append("g")
					.classed("rightSidePviGroup", true)
					.attr("transform", "translate(" + (margin.right + (width/2)-5) + "," + 26 + ")");

				rightGroup.selectAll("rect")
					.data([rDemoData[4]])
					.enter().append("rect")
					.attr("width", 40)
					.attr("height", 26)
					.attr("stroke", "black")
					.attr("x", 10)
					.attr("y", 0)
					.style("fill", function(d) {
						if (d.unitID.length > 4) {
							var v = (d.unitID.split("_")[1] === "demStates") ? -100 : 100;
							return getColorFromPVI(v, "states");
						} 
						var t = (d.unitID > 99) ? "state" : "dist";
						return getColorFromPVI(d.chartValue, t);
					});

				rightGroup.selectAll("text")
					.data([rDemoData[4]])
					.enter().append("text")
					.attr("class", "pviText")
					.attr("dx", 30)
					.attr("dy", 14)
					.text(function (d) {
						var someText = (d.unitID.length > 4) ? " " : d.labelValue;
						return someText;		
					});

				yPos += 50;

			}

			function createCredits() {
				var creditsGroup = svg.append("g")
					.classed("creditsTextGroup", true)
					.attr("transform", "translate("+(width/2)+","+(height-30)+")");

				creditsGroup.append("text")
					.attr("x", 0)
					.attr("y", 0)
					.text("Data credits:");
				creditsGroup.append("text")
					.attr("x", 0)
					.attr("y", 10)
					.text("American Community Survey 2012,");
				creditsGroup.append("text")
					.attr("x", 0)
					.attr("y", 20)
					.text("The Cook Political Report 2012 Partisan Voter Index (congressional districts),");
				creditsGroup.append("text")
					.attr("x", 0)
					.attr("y", 30)
					.text("and The Cook Political Report 2014 Partisan Voter Index (states)");
			}

			var mainBarGroup = svg.append("g")
				.attr("transform", "translate(" + 0 + "," + 20 + ")");

			createBarGroup(mainBarGroup, 0);
			createBarGroup(mainBarGroup, 1);
			createBarGroup(mainBarGroup, 3);
			createBarGroup(mainBarGroup, 2);

			var pviGroup = svg.append("g")
				.attr("transform", "translate(" + 0 + "," + yPos + ")");
			createPVIGroup(pviGroup);

			createCredits();
				
			
		};
		
		

		var updateDisplay = function (sideName, data) {
		
			function getSideData (theD) {
				var newData = theD.demographics;
				if (newData.length === 4) {newData.push({});}
				newData[4].unitID = theD.unitID;
				return newData;
			}

			function updateBar (theD, i, sideN) {

				var theKey = theD[i].attribute;

				var theG = d3.selectAll("." + sideN + "BarGroup");

				theG.selectAll("."+theKey+"Rect")
					.data([theD[i]])
					.transition()
					.duration(1000)
					.attr("width", function (d) {
						return getBarWidth(d.chartValue, sideN, theKey);
					})
					.attr("x", function (d) {
						return (sideN === "leftSide") ? getBarX(d.chartValue, sideN, theKey) : 0;
					});
					
				theG.selectAll("."+theKey+"Text")
					.data([theD[i]])
					.transition()
					.duration(1000)
					.attr("dx", function (d) {
						var v = getBarX(d.chartValue, sideN, theKey);
						v = (sideN === "leftSide") ? v-3 : v+3;
						return v;
					})
					.text(function (d) {
						var t = (theKey === "medHouseInc") ? ("$" + d.chartValue): d3.round(d.chartValue,1);
						return t;	
					});
			}

			var newData = getSideData(data);

			updateBar(newData, 0, sideName);
			updateBar(newData, 1, sideName);
			updateBar(newData, 2, sideName);
			updateBar(newData, 3, sideName);

			var pviG = d3.selectAll("." + sideName + "PviGroup");
			pviG.selectAll("rect").data([newData[4]])
				.transition()
				.duration(1000)
				.style("fill", function(d) {
					if (d.unitID.length > 4) {
						var v = (d.unitID.split("_")[1] === "demStates") ? -100 : 100;
						return getColorFromPVI(v, "states");
					} 
					var t = (d.unitID > 99) ? "state" : "dist";
					return getColorFromPVI(d.chartValue, t);
				
				});
			pviG.selectAll("text").data([newData[4]])
				.transition()
				.delay(500)
				.text(function (d) {
					var someText = (d.unitID.length > 4) ? " " : d.labelValue;
					return someText;		
				});

		};

		return {
			init: initDisplay,
			update: updateDisplay
		};
	}());

	return statsCharts;
};