function createMapView(name, side, mapViewId) {

	var mapView = (function() {
		var svgId = name;
		var divId = mapViewId;
		var sideName = side;
		var observerList = [];
		var controller;
		var theMap;

		var registerObserver = function (obj) {
			observerList.push(obj);
		};
/*
		var registerController = function(obj) {
			controller = obj;
		};*/

		var update = function(sideName, data) {

			// Would be nice to include unitId in json file

			if (observerList.length === 1) {
				theMap.update(observerList[0].getUnitCode(), data);
			}
		};

		var init = function() {

			console.log(observerList.length);

			if (observerList.length === 1) {
				var uCode = observerList[0].getUnitCode();

				d3.select("#" + divId).selectAll("*").remove();

				var that = this;

				d3.json(observerList[0].getLocalPath(), function(error, data) {
					if (error) {
						return console.warn(error);
					}
					theMap = createMap(sideName, divId);
					theMap.init(that, uCode, data);
				});

			}

		};

		var fireUpdate = function (someUnit) {
			observerList[0].fireUpdate(someUnit);
		};

		return {
			registerObserver: registerObserver,
			update: update,
			init: init,
			fireUpdate: fireUpdate
		};
	}());

	return mapView;
}