var createDualingWordCloud = function(dId) {

	// this assumes that lData has same exact words as rData

	var wordCloud = (function() {

		var divId = dId;

		var padding = 0;

		var divWidth = document.getElementById(divId).clientWidth;
		var divHeight = document.getElementById(divId).clientHeight;
		
		var hHeight = 60;
		/*
		var hMargin = {top:0,right:0,bottom:0,top:0};
		var headingWidth = divWidth - hMargin.right - hMargin.left;
		var headingHeight = hHeight - hMargin.top - hMargin.bottom;
		*/
		var gutterBottom = {
			contentHeight: 20, 
			margin: {top:2, bottom:2},
			total: function () {return gutterBottom.contentHeight+gutterBottom.margin.top+gutterBottom.margin.bottom;}
		};

		// sets the position of the svg
		var margin = {top: 5+ hHeight, right: 25, bottom: 5,left: 25};
		var width = divWidth - margin.left - margin.right;
		var height = divHeight - margin.top - margin.bottom;

		var getScaledX = d3.scale.linear()
      		.domain([-1,1])
      		.range([0, width]);

		var getXValue = function (leftFreq, rightFreq, leftTotalFreq, rightTotalFreq) {
			// value from -1 to 1
			var percentLeft = leftFreq/leftTotalFreq;
  			var percentRight = rightFreq/rightTotalFreq;
  			var difference = percentRight - percentLeft;

  			// handles 0 percent values
  			if ((percentRight||percentLeft) === 0) {
  				// if pctLeft is > than pctRight give it value -1 else 1
  				xValue = (percentLeft > percentRight) ? -1 : 1;
  				// if pctRight = pctLeft (they are both 0) make value 0 else don't change it;
  				xValue = (percentLeft === percentRight) ? 0 : xValue;
  			} else {
  				var xValue = difference/(percentRight + percentLeft);
  			}
  			return xValue;
		};

		var getXPos = function (leftFreq, rightFreq, leftTotalFreq, rightTotalFreq) {
  			// value from -1 to 1
  			var v = getXValue(leftFreq, rightFreq, leftTotalFreq, rightTotalFreq);
  			return getScaledX(v);
  		};

  		var getPsuedoRandom = d3.random.normal(height/2,60);

  		var getYPos = function (radius) {
  			var yPos = getPsuedoRandom();
  			var centerOfDiv = margin.top + (height-gutterBottom.total())/2;
  			var bottomBounds = centerOfDiv*2 - radius;
  			while (true) {
  				yPos = getPsuedoRandom();
  				// check to see if it is out of canvas
  				if ((yPos < bottomBounds) && (yPos > radius)) {
  					return yPos;
  				}
			}
  		};

  		// min and max obj to manage the extents of radius values
  		// Don't alter! these get set dynamically and are used for setting the domain
      	var radiusExtents = {
      		rightMin: 0,
      		rightMax: 0,
      		leftMin: 0,
      		leftMax: 0,
      		getLargestExtent: function () {
      			var ex =  d3.extent([radiusExtents.rightMin, radiusExtents.rightMax, radiusExtents.leftMin, radiusExtents.leftMax]);
      			return ex;
      		},
      		setSideExtent: function (sideName, someExtent) {
      			if (sideName === "leftSide") {
      				radiusExtents.leftMin = someExtent[0];
      				radiusExtents.leftMax = someExtent[1];
      			} else if (sideName === "rightSide") {
      				radiusExtents.rightMin = someExtent[0];
      				radiusExtents.rightMax = someExtent[1];
      			}
      		}
      	};

  		var getScaledRadius = d3.scale.linear()
			//.domain([0,1]) domain is dynamic
			.range([10,50]);

		var getRadiusValue = function(leftFreq, rightFreq, leftTotalFreq, rightTotalFreq) {
			return (leftFreq + rightFreq) / (leftTotalFreq + rightTotalFreq);
		};

  		var getRadiusSize = function (leftFreq, rightFreq, leftTotalFreq, rightTotalFreq) {
  			var value = getRadiusValue(leftFreq, rightFreq, leftTotalFreq, rightTotalFreq);
  			return getScaledRadius(value);
  		};

  		var setRadiusDomain = function (objList) {
  			var min;
  			var max;
  			objList.forEach(function (obj) {
  				var v = (obj.leftFreq + obj.rightFreq) / (obj.leftTotalFreq + obj.rightTotalFreq);
  				max = (v > max) ? v : max;
  				min = (v < min) ? v : min; 
  			});
  		};

  		var getFontSize = function (radius) {
  			return radius*.75;
  		};

  		var getOpacity = d3.scale.pow().exponent(.1)
			.domain([20,Math.sqrt(width*width + height*height)])
			.range([.2,.7]);

  		var getLeftColor = d3.scale.linear()
  			.domain([-1,0])
  			.range(["#762A83","#F7F7F7"]);

		var getRightColor = d3.scale.linear()
  			.domain([0,1])
  			.range(["#F7F7F7","#1B7837"]);

  		var getColor = function (leftFreq, rightFreq, leftTotalFreq, rightTotalFreq) {
  			var value = getXValue(leftFreq, rightFreq, leftTotalFreq, rightTotalFreq);
  			var clr;
  			if (value >= 0) {
  				clr = getRightColor(value);
  			} else {
  				clr = getLeftColor(value);
  			}
  			return clr;
  		};
  		/*
  		var headingSVG = d3.select("#" + divId).append("svg")
			.attr("width", headingWidth + hMargin.left + hMargin.right)
		    .attr("height", headingHeight + hMargin.top + hMargin.bottom)
			.append("g")
		    .attr("transform", "translate(" + hMargin.left + "," + hMargin.top + ")");*/

		var svg = d3.select("#" + divId).append("svg")
			.attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
			.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// svg circles are attached to these
		// var nodes = d3.map();

		var force;

		var isUpdating = false;

		// Move nodes toward cluster focus.
		function gravity(alpha) {
		  return function(d) {
		    d.y += (d.gy - d.y) * alpha;
		    d.x += (d.gx - d.x) * alpha;
		  };
		}

		// Resolve collisions between nodes.
		function collide(alpha) {
		  var quadtree = d3.geom.quadtree(force.nodes());
		  return function(d) {
		    var r = d.r + getScaledRadius.domain()[1] + padding,
		        nx1 = d.x - r,
		        nx2 = d.x + r,
		        ny1 = d.y - r,
		        ny2 = d.y + r;
		    quadtree.visit(function(quad, x1, y1, x2, y2) {
		      if (quad.point && (quad.point !== d)) {
		        var x = d.x - quad.point.x,
		            y = d.y - quad.point.y,
		            l = Math.sqrt(x * x + y * y),
		            r = d.r + quad.point.r + (d.color !== quad.point.color) * padding;
		        if (l < r) {
		          l = (l - r) / l * alpha;
		          d.x -= x *= l;
		          d.y -= y *= l;
		          quad.point.x += x;
		          quad.point.y += y;
		        }
		      }
		      return x1 > nx2
		          || x2 < nx1
		          || y1 > ny2
		          || y2 < ny1;
		    });
		  };

		}

		var getTickY = function(d) {
			if (d.killed) {
				var value = Math.max(d.r, Math.min(height - d.r - gutterBottom.margin.bottom,d.y));
			} else {
				var value = Math.max(d.r, Math.min(height - d.r - gutterBottom.total(),d.y));
			}
			return value;
		};

		function tick(e) {
			var elements = 	d3.selectAll(".nodes")
			    .each(gravity(.9 * e.alpha))
			    .each(collide(.5));
			
			if (isUpdating && e.alpha>.01) {
				elements.transition()
					.duration(225)//150
					.attr("transform", function(d) {
						d.x = Math.max(d.r, Math.min(width - d.r,d.x));
						d.y = getTickY(d);
						return "translate(" + d.x + "," + d.y + ")"; })
				    .attr("r", function(d) { return d.r; });

			} else {
				isUpdating = false;
				elements
					.attr("transform", function(d) {
						// This the nodes in bounds
						d.x = Math.max(d.r, Math.min(width - d.r,d.x));
						d.y = getTickY(d);
						return "translate(" + d.x + "," + d.y + ")"; })
				    .attr("r", function(d) { return d.r; });
			}

			elements
				.on("mouseover", mouseOverEvent)
			    .on("mouseout", mouseOutEvent)
			    .on("click", nodeClicked);

		}

		var moveToFront = function(that) {
			d3.select(that).each(function(){
    			that.parentNode.appendChild(that);
  			});
  		};

		var mouseOverEvent = function() {


			moveToFront(this);
			var that = this;
			d3.selectAll(".wordsLabels")
				.transition()
				.duration(25)
				.style("opacity", function(d) {
					var targetX;
					var targetY;
					d3.select(that).each(function (d) {
						targetX = d.gx;
						targetY = d.gy;
					})
					var xLen = d.gx - targetX;
					var yLen = d.gy - targetY;
					var hyp = Math.sqrt(xLen*xLen + yLen*yLen);
					return getOpacity(hyp);
				})
				.style("font", function (d) {
      					return "200 " + getFontSize(d.r) + "px Helvetica Neue"});
			d3.select(this).select("circle")
				.attr("class", "wordCirclesActive")
				.style("opacity", .9)
			d3.select(this).select("text")
				.transition()
				.duration(50)
				.attr("class", "wordsLabelsActive")
				.style("opacity", 1)
				.style("font", function (d) {
      					return "400 " + getFontSize(d.r) + "px Helvetica Neue"});
			
		};

		var mouseOutEvent = function() {

			d3.selectAll(".wordsLabelsActive")
				.attr("class", "wordsLabels")
				.style("fill", "black");
			d3.selectAll(".wordCirclesActive")
				.classed("wordCirclesActive", false)
				.classed("wordCircles", true)
				.style("opacity", .7);
			d3.selectAll(".wordsLabels")
				.transition()
				.style("opacity", .7)
				.style("fill", "black")
				.style("font", function (d) {
      					return "300 " + getFontSize(d.r) + "px Helvetica Neue"});

			// ensures all transitions are cought in the middle
			d3.selectAll(".nodes")
				.selectAll("circle")
				.transition()
				.duration(200)
				.attr("r", function(d) {return d.r;})
				.style("fill", function(d) {return d.color;})
			d3.selectAll(".nodes")
				.selectAll("text")
				.style("font", function (d) {
	      			return "300 " + getFontSize(d.r) + "px Helvetica Neue"
	      		});

		};

		var killNodeEvent = function(obj) {

			var node = d3.select(obj)
					.attr("class", "nodes killed")
					.each(function (d) {
						isUpdating = true;
						d.killed = true;
						d.r = 10;
						d.gy = height - d.r - gutterBottom.margin.bottom;
					});
      		d3.selectAll(".killed").transition()
				.duration(1000)
				.attr("transform", function(d) { return "translate(" + d.gx + "," + d.gy + ")"; })
				.each(function() {
					node.select("circle")
						.style("fill", "white")
						.transition()
						.delay(50)
						.duration(100)
						.attr("r", function(d) {return d.r;})
						.style("fill", function(d) {return d.color;});
					node.select("text")
					    .style("font", function (d) {
	      					return "300 " + getFontSize(d.r) + "px Helvetica Neue"
	      				});

				});


      		force.alpha(.03);

      		// added below for scaling extents

      		var aliveNodes = d3.selectAll(".nodes").select(function(d, i) {return d3.select(this).attr("class") === "nodes" ? this : null; });
			
			var theTempExtent = d3.extent(aliveNodes.data(), function(obj) {
				if (obj) {
				return getRadiusValue(obj.leftFreq, obj.rightFreq, obj.leftTotalFreq, obj.rightTotalFreq);
				}
			});

			getScaledRadius.domain(theTempExtent);
			d3.selectAll(".nodes")
				.transition()
				.duration(1000)
				.each(function (d) {
					isUpdating = true;
					// update the node's radius and y axis if it hasn't been killed
					if (d3.select(this).attr("class") != "nodes killed") {
						d.r = getRadiusSize(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					}

					d.gx = getXPos(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					d.color = getColor(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
				})
				.each(function(d) {
					d3.select(this).select("circle")
						.transition()
						.duration(500)
						.attr("r", d.r)
						.style("fill", d.color);
					d3.select(this).select("text")
						.transition()
						.duration(500)
						.style("font", function (d) {
      					return "200 " + getFontSize(d.r) + "px Helvetica Neue"});
				});
			
			force.alpha(.03);
			

		};

		var reviveNodeEvent = function(obj) {
			d3.select(obj)
				.attr("class", "nodes")
				.transition()
				.duration(1000)
				.each(function (d) {
					isUpdating = true;
					//d.r = getRadiusSize(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					d.gy = getYPos(d.r);
					d.color = getColor(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					d.killed = false;
				})
				.each(function(d) {
					d3.select(obj).select("circle")
						.style("fill", "white")
						.transition()
						.delay(50)
						.duration(100)
						//.attr("r", d.r)
						.style("fill", d.color);
					d3.select(obj).select("text")
						.transition()
						.duration(100)
						.style("font", function (d) {
      					return "300 " + getFontSize(d.r) + "px Helvetica Neue"});
				});
			force.alpha(.03);


			// added below for scaling extents


      		var aliveNodes = d3.selectAll(".nodes").select(function(d, i) {return d3.select(this).attr("class") === "nodes" ? this : null; })
				.data();
			var theTempExtent = d3.extent(aliveNodes, function(obj) {
				if (obj) {
				return getRadiusValue(obj.leftFreq, obj.rightFreq, obj.leftTotalFreq, obj.rightTotalFreq);
				}
			});

			getScaledRadius.domain(theTempExtent);
			d3.selectAll(".nodes")
				.transition()
				.duration(1000)
				.each(function (d) {
					isUpdating = true;
					// update the node's radius and y axis if it hasn't been killed
					if (d3.select(this).attr("class") != "nodes killed") {
						d.r = getRadiusSize(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					}

					d.gx = getXPos(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					d.color = getColor(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
				})
				.each(function(d) {
					d3.select(this).select("circle")
						.transition()
						.duration(500)
						.attr("r", d.r)
						.style("fill", d.color);
					d3.select(this).select("text")
						.transition()
						.duration(500)
						.style("font", function (d) {
      					return "200 " + getFontSize(d.r) + "px Helvetica Neue"});
				});
			
			force.alpha(.03);
		};

		var nodeClicked = function() {
			if (d3.select(this).attr("class") === "nodes killed") {
				reviveNodeEvent(this);
			} else {
				killNodeEvent(this);
			}
		};

		var setTitle = function(side, titleText, subtitleText) {
			var theG = d3.select("#" + side + "TitleGroup");
			theG.select("text.titleText").text(titleText);
			theG.select("text.subtitleText").text(subtitleText);
		}

		var initDisplay = function (lData, rData) {

			// assumes lData.keywords and rData keywords are identical

			// reset nodes var incase this gets re-init
			function getInitData () {

				// This sets the nodes and thier position.
				var setNodesFreq = function(side, data, someMap) {
					var tempMap = someMap;
					if (side === "leftSide") {
						data.keywords.forEach(function (obj) {
							var value = tempMap.get(obj.text);
							value.word = obj.text;
							value.leftFreq = obj.numTweets;
							value.leftTotalFreq = data.totalTweets;
							tempMap.set(obj.text, value);
						});
					} else if (side === "rightSide") {
						data.keywords.forEach(function (obj) {
								var value = tempMap.get(obj.text);
							value.word = obj.text;
							value.rightFreq = obj.numTweets;
							value.rightTotalFreq = data.totalTweets;
							tempMap.set(obj.text, value);
						});
					}
					return tempMap;
				};

				var setNodesPos = function(someMap) {
					var newNodes = d3.map();
					someMap.forEach(function (k,v) {
						var value = v;
						value.r = getRadiusSize(value.leftFreq, value.rightFreq, value.leftTotalFreq, value.rightTotalFreq);
						value.gx = getXPos(value.leftFreq, value.rightFreq, value.leftTotalFreq, value.rightTotalFreq)
						value.gy = getYPos(value.r);
						value.color = getColor(value.leftFreq, value.rightFreq, value.leftTotalFreq, value.rightTotalFreq);
						newNodes.set(k,value);
					});
					return newNodes;
				};

				var newNodes = d3.map();

				lData.keywords.forEach(function(obj) {
					newNodes.set(obj.text, {});
				});

				newNodes = setNodesFreq("leftSide", lData, newNodes);
				newNodes = setNodesFreq("rightSide", rData, newNodes);

				var theCurrentExtent = d3.extent(newNodes.values(), function(obj) {
					return getRadiusValue(obj.leftFreq, obj.rightFreq, obj.leftTotalFreq, obj.rightTotalFreq);
				});
				radiusExtents.setSideExtent("leftSide", theCurrentExtent);
				radiusExtents.setSideExtent("rightSide", theCurrentExtent);
				getScaledRadius.domain(radiusExtents.getLargestExtent());

				return setNodesPos(newNodes);
			}
			
			function createBackground() {

				var lineFunction = d3.svg.line()
					.x(function(d) {return d.x;})
					.y(function(d) {return d.y;})
					.interpolate("linear");

				var leftLineData = [
					{x:0, y:height-gutterBottom.total()}, {x:0, y:0}, {x:1,y:0}
				];

				var rightLineData = [
					{x:width, y:height-gutterBottom.total()}, {x:width, y:0}, {x:width - 1, y:0}
				];

				var topLeftLineData = [
					{x:1,y:0},{x:width/2,y:0}
				];

				var topRightLineData = [
					{x:width/2 - 1,y:0},{x:width,y:0}
				];

				var middleLineDataA = [
					{x:width/4, y:height-gutterBottom.margin.bottom}, {x:width/4, y:0}
				];

				var middleLineDataB = [
					{x:width/2, y:height-gutterBottom.margin.bottom}, {x:width/2, y:0}
				];

				var middleLineDataC = [
					{x:3*(width/4), y:height-gutterBottom.margin.bottom}, {x:3*(width/4), y:0}
				];

				var gutterLineData = [
					{x:0,y:height-gutterBottom.total()},{x:width,y:height-gutterBottom.total()}
				];

				var leftGutterCorner = [
					{x:0,y:height-gutterBottom.margin.bottom-10}, {x:0,y:height-gutterBottom.margin.bottom},
					{x:10,y:height-gutterBottom.margin.bottom}
				];
				var rightGutterCorner = [
					{x:width,y:height-gutterBottom.margin.bottom-10}, {x:width,y:height-gutterBottom.margin.bottom},
					{x:width-10,y:height-gutterBottom.margin.bottom}
				];
				var middleGutterLine = [
					{x:(width/2)-10,y:height-gutterBottom.margin.bottom},
					{x:(width/2)+10,y:height-gutterBottom.margin.bottom}
				];

				var leftMidGutterLine = [
					{x:(width/4)-10,y:height-gutterBottom.margin.bottom},
					{x:(width/4)+10,y:height-gutterBottom.margin.bottom}
				];

				var rightMidGutterLine = [
					{x:3*(width/4)-10,y:height-gutterBottom.margin.bottom},
					{x:3*(width/4)+10,y:height-gutterBottom.margin.bottom}
				];

				var backgroundPaths = svg.append("g")
					.attr("class", "backgroundPathGroup");
					//.attr("transform", "translate(0,-0.5)");

				// makes the gutter path
				backgroundPaths.append("path")
					.attr("d", function () {return lineFunction(gutterLineData)})
					.style("stroke-opacity", ".5")
					.style("stroke-dasharray", "15,15")
					.style("stroke-width", 2)
					.style("fill", "none")

				backgroundPaths.append("path")
					.attr("d", lineFunction(leftLineData))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");

				backgroundPaths.append("path")
					.attr("d", lineFunction(rightLineData))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");

				backgroundPaths.append("path")
					.attr("d", lineFunction(topLeftLineData))
					.style("stroke-opacity", 1)
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "#000000");

				backgroundPaths.append("path")
					.attr("d", lineFunction(topRightLineData))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");
/*
				backgroundPaths.append("path")
					.attr("d", lineFunction(middleLineDataA))
					.style("opacity", ".3")
					.style("stroke", "black")
					.style("stroke-dasharray", "5,5")
					.style("stroke-width", 2)
					.style("fill", "none");
*/
				backgroundPaths.append("path")
					.attr("d", lineFunction(middleLineDataB))
					.style("opacity", ".3")
					.style("stroke", "black")
					.style("stroke-dasharray", "5,5")
					.style("stroke-width", 2)
					.style("fill", "none");
/*
				backgroundPaths.append("path")
					.attr("d", lineFunction(middleLineDataC))
					.style("opacity", ".3")
					.style("stroke", "black")
					.style("stroke-dasharray", "5,5")
					.style("stroke-width", 2)
					.style("fill", "none");
*/
				backgroundPaths.append("path")
					.attr("d", lineFunction(middleGutterLine))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");
				backgroundPaths.append("path")
					.attr("d", lineFunction(leftGutterCorner))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");
				backgroundPaths.append("path")
					.attr("d", lineFunction(rightGutterCorner))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");

				backgroundPaths.append("path")
					.attr("d", lineFunction(rightMidGutterLine))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");
				backgroundPaths.append("path")
					.attr("d", lineFunction(leftMidGutterLine))
					.style("stroke", "black")
					.style("stroke-width", 2)
					.style("fill", "none");

				
			}
			createBackground();

			force = d3.layout.force()
		    	.nodes(getInitData().values())
		    	.size([width, height])
		    	.gravity(0)
		    	.on("tick", tick)
		    	.start();

		    // Create a "g" element to hold the circle and label for each keyword
			var wordGroup = svg.selectAll(".nodes")
		    	.data(force.nodes(), function(d) {return d.word;} )
		  		.enter().append("g")
		  		.attr("class", "nodes")
		  		.attr("transform", function(d) {
		  			return "translate(" + d.gx + "," + d.gy + ")";
		  		})
		  		.call(force.drag);

		  	// Add circle to each group
		  	wordGroup.append("circle")
		  		.attr("class", "wordCircles")
		  		.attr("id", function(d) {return d.word;})
		  		.attr("cx", 0)
		  		.attr("cy", 0)
		  		.attr("r", function(d) {return d.r;})
		  		.style("opacity", ".7")
		  		.style("stroke", "gray")
		  		.style("stroke-width", 1)
		    	.style("fill", function (d) {
		    		return getColor(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
		    	});

		    // Add the text label to each group
		    wordGroup.append("text")
		    	.attr("class", "wordsLabels")
		    	.attr("dx", 0) // not necessary, but I left this in
      			.attr("dy", 0) // not necessary, but I left this in
      			.attr("text-anchor", "middle")
      			.style("opacity", ".7")
      			.style("pointer-events", "none")
      			.style("dominant-baseline", "middle")
      			.style("font", function (d) {
      				return "300 " + getFontSize(d.r) + "px Helvetica Neue"})
      			.text(function(d) { return d.word });

		    function createMgmtButtons() {
		    	var mgmtButtons = svg.append("g")
		    		.attr("id", "mgmtButtons")
			  		.attr("transform", "translate(" + (width - 50 - 5) + "," + (margin.top-hHeight) + ")");

				var shuffle = mgmtButtons
					.append("g")
					.attr("transform", "translate(" + 0 + "," + 0 + ")")
					.on("click", redraw);

				shuffle.append("rect")
					.classed("buttonRect", true)
					.attr("width", 50)
					.attr("height", 18)
					.attr("rx", 5)
					.attr("ry", 5)
					.attr("x", 0)
					.attr("y", 0)
					.on("click", redraw);

				shuffle.append("text")
					.attr("class", "buttonText")
			    	.attr("dx", 25) 
	      			.attr("dy", 10) 
	      			.attr("dominant-baseline", "middle")
	      			.attr("text-anchor", "middle")
	      			.text("Shuffle");
			}

			createMgmtButtons();

			function createTitle() {
				var leftTitleGroup = svg.append("g")
					.attr("class", "titleGroup")
					.attr("id", "leftSideTitleGroup")
					.attr("transform", "translate(" + (3-margin.left) + "," + 0 + ")");

				var rightTitleGroup = svg.append("g")
					.attr("class", "titleGroup")
					.attr("id", "rightSideTitleGroup")
					.attr("transform", "translate(" + (width+margin.left - 3) + "," + 0 + ")");

				var subTextLeft = leftTitleGroup.append("text")
					.attr("dx", 0)
					.attr("dy", -6)
					.attr("class", "subtitleText")
					.attr("text-anchor", "start")
					.text(lData.subtitle);

				var subTextRight = rightTitleGroup.append("text")
					.attr("dx", 0)
					.attr("dy", -6)
					.attr("class", "subtitleText")
					.attr("text-anchor", "end")
					.text(rData.subtitle);

				leftTitleGroup.append("text")
					.attr("dx", 0)
					.attr("dy", function() {return subTextLeft.node().getBBox().height - 22;})
					.attr("class", "titleText")
					.attr("text-anchor", "start")
					.text(lData.title);

				rightTitleGroup.append("text")
					.attr("dx", 0)
					.attr("dy", function() {return subTextRight.node().getBBox().height - 22;})
					.attr("class", "titleText")
					.attr("text-anchor", "end")
					.text(rData.title);
			}

			function createMainTitle() {

				var theTitleG = svg.append("g")
					.attr("transform", "translate(" + (width/2) + "," + -50 + ")");
				var title = theTitleG.append("text")
					.attr("dx", 0)
					.attr("dy", 0)
					.attr("class", "mainTitleText")
					.attr("text-anchor", "middle")
					.text("SPoTvis:");
				var subTitle = theTitleG.append("text")
					.attr("dx", 0)
					.attr("dy", title.node().getBBox().height - 9)
					.attr("class", "mainSubTitleText")
					.attr("text-anchor", "middle")
					.text("Spatial Patterns of Tweets");
				var subTitle2 = theTitleG.append("text")
					.attr("dx", 0)
					.attr("dy", title.node().getBBox().height+subTitle.node().getBBox().height - 9)
					.attr("class", "mainSubTitleText")
					.attr("text-anchor", "middle")
					.text("surrounding the U.S. government shutdown");

			}

			createTitle();
			createMainTitle()


		};

		var updateNodes = function(side, data) {
			setTitle(side, data.title, data.subtitle);

			var newDataMap = d3.nest()
				.key(function (d) {
					return d.text;
				})
				.map(data.keywords, d3.map);

			d3.selectAll(".nodes")
				.each(function (d,i) {
					// update the tweet frequency based on the side
					if (side === "leftSide") {
						console.log(newDataMap.values().length);
						
						d.leftFreq = newDataMap.get(d.word)[0].numTweets;
						d.leftTotalFreq = data.totalTweets;

					} else {
						d.rightFreq = newDataMap.get(d.word)[0].numTweets;
						d.rightTotalFreq = data.totalTweets;
					}
				})
				.call(function () {
					var aliveNodes = d3.selectAll(".nodes").select(function(d, i) {return d3.select(this).attr("class") === "nodes" ? this : null; })
						.data();
					var theCurrentExtent = d3.extent(aliveNodes, function(obj) {
						if (obj) {
							return getRadiusValue(obj.leftFreq, obj.rightFreq, obj.leftTotalFreq, obj.rightTotalFreq);
						}
					});

					//radiusExtents.setSideExtent(side, theCurrentExtent);
					getScaledRadius.domain(theCurrentExtent);
				});
			

			redraw();

		};

		var redraw = function() {
			d3.selectAll(".nodes")
				.transition()
				.duration(1000)
				.each(function (d) {
					isUpdating = true;
					// update the node's radius and y axis if it hasn't been killed
					if (d3.select(this).attr("class") != "nodes killed") {
						d.r = getRadiusSize(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
						d.gy = getYPos(d.r);
					}

					d.gx = getXPos(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
					d.color = getColor(d.leftFreq, d.rightFreq, d.leftTotalFreq, d.rightTotalFreq);
				})
				.each(function(d) {
					d3.select(this).select("circle")
						.transition()
						.duration(500)
						.attr("r", d.r)
						.style("fill", d.color);
					d3.select(this).select("text")
						.transition()
						.duration(500)
						.style("font", function (d) {
      					return "200 " + getFontSize(d.r) + "px Helvetica Neue"});
				});
			
			force.alpha(.03);

		};

		// checks to see if all of the keys in mapAlpha are in mapBravo
		var hasAllKeysIn = function(arrayA, arrayB) {
			var truthyness = true;
			arrayA.forEach(function (v) {
				console.log("v " + v + " " + "v2 " + arrayB.indexOf(v));
				if (arrayB.indexOf(v).typeof !== "number") {
					truthyness = false;
				} 
			
			});
			return truthyness;
		};

		return {
			init: function(divId, lData, rData) {
				initDisplay(divId, lData, rData);
			},
			update: function(sideName, data) {
				
				var newKeys = data.keywords.map(function (obj) {
					return obj.text;
				});
				var nodesKeys = force.nodes().map(function (obj) {
					return obj.word;
				});
				updateNodes(sideName, data);
				/*
				if (hasAllKeysIn(nodesKeys, newKeys) && hasAllKeysIn(newKeys, nodesKeys)) {
					updateNodes(sideName, data);
				} else {
					console.log("Error: couldn't match data.")
				}*/
			}
		};
	}());

	return wordCloud;
};