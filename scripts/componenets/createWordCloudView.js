function createWordCloudView(name, wordCloudDivId) {

	var wordCloudView = (function() {

		var svgId = name;
		var divId = wordCloudDivId;

		var observerList = [];
		var registerObserver = function (obj) {
			observerList.push(obj);
		};

		var dualingWordCloud;

		var init = function() {

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

			var checkEqualKeywords = function(lWords, rWords) {
				var lMap = d3.nest().key(function (d) {
					return d.text;})
					.map(lWords, d3.map);
				var rMap = d3.nest().key(function(d) {
					return d.text;})
					.map(rWords, d3.map);
				var truthyness = true;
				lMap.forEach(function(key, value) {
					if (!rMap.has(key)) {
						console.log(key);
						truthyness = false;
					}
				});
				rMap.forEach(function(key, value) {
					if (!lMap.has(key)) {
						truthyness = false;
					}
				});
				return truthyness;
			};

			var leftSidePath = getSideDataPath("leftSide");
			var rightSidePath = getSideDataPath("rightSide");

			d3.json(leftSidePath, function(error, lData) {
				if (error) {
					return console.warn(error);
				}
				d3.json(rightSidePath, function(error, rData) {
						if (error) {
						return console.warn(error);
					}
					console.log(lData);
					console.log(rData);
					// if all words in lData are in rData and rData in lData
					if (checkEqualKeywords(lData.keywords, rData.keywords)) {
						// get rid of everything within the div
						d3.select("#" + divId).selectAll("*").remove();
						dualingWordCloud = createDualingWordCloud(divId);
						dualingWordCloud.init(lData, rData);
					}
				});
			});
		};

		return {
			registerObserver: registerObserver,
			update: function(side, data) {
				console.log(data);
				dualingWordCloud.update(side, data);
			},
			init: init
		};
	}());

	return wordCloudView;

};