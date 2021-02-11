function createStatsView(name, statsViewDivId) {

	var statsView = (function() {

		var svgId = name;
		var divId = statsViewDivId;

		var observerList = [];

		var registerObserver = function (obj) {
			observerList.push(obj);
		};



		var statsCharts;

		var init = function() {

			// removes anything currently in the element from the div
			d3.select("#" + divId).selectAll("*").remove();


			// returns the loacl path to the variable
			var getSideDataPath = function(sideName) {
				var dataPath = "NoPath";
	  			// set the json data path
	  			observerList.forEach(function(observer) {
	  				if (sideName === observer.getSideName()) {
						dataPath = observer.getLocalPath();
					} else if (sideName === observer.getSideName()) {
						dataPath = observer.getLocalPath();
					}
	  			});
				return dataPath;
			};

			// updates the stats panel 
			var simulateUpdate = function(sideName) {
				var lPath = getSideDataPath("leftSide");
				d3.json(lPath, function(error, lData) {
					if (error) {
						return console.warn(error);
					}
					var rPath = getSideDataPath("rightSide");
					d3.json(rPath, function(error, rData) {
						if (error) {
							return console.warn(error);
						}

							// creates a ned statsCharts object
							statsCharts = createStatsCharts(divId);
							statsCharts.init(lData, rData);

						
					});
				});
			};

			simulateUpdate("leftSide", "rightSide");

		};

		return {
			// allows other things to 
			registerObserver: registerObserver,
			update: function(side, data) {
				statsCharts.update(side,data);
			},
			init: init
		};
	}());

	return statsView;

}