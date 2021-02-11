function createSide(name, code) {

	var side = (function() {

		var sideName = name;
		// A list of all the components:
		//   e.g. [wordCloud, statsView, leftMapView, rightMapView]
		var observerList = [];
		// this is the unitCode (e.g. dis_0618, region_PA, etc.)
		var unitCode = code;
		var controller;

		var registerObserver = function(obj) {
			observerList.push(obj);
		};

		var getLocalPath = function () {
			return "src/data/" + unitCode + ".json";
		};

		var notifyObservers = function () {
			d3.json(getLocalPath(), function(error, data) {
				if (error) {
					return console.warn(error);

				}
				for (var i = 0; i < observerList.length; i++) {
					console.log(data);
					observerList[i].update(sideName, data);	
				}
			});
		};

		return {
			getSideName: function() {return sideName;},
			getUnitCode: function() {return unitCode;},
			registerObserver: registerObserver,
			registerController: function(c) {
				controller = c;
			},
			update: function (code) {
				unitCode = code;
			},
			getLocalPath: getLocalPath,
			notifyObservers: notifyObservers,
			fireUpdate: function(newUnitCodeToUpdate) {
				controller.update(sideName, newUnitCodeToUpdate);
			}
		};
		
	}());

	return side;
} 



