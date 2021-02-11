// Controller object handles the objects
// holds and handles object behavior so that
// we don't have to. 


var createController = function (idDict, leftSideUnitCode, rightSideUnitCode) {

	var idDictionary = idDict;

	var controller = (function() {
		var leftSide = createSide("leftSide", leftSideUnitCode);
		var rightSide = createSide("rightSide", rightSideUnitCode);

		var statsView = createStatsView("statsView", idDictionary.statsViewId);

		var leftMapView = createMapView("leftMapView", "leftSide", idDictionary.leftMapId);
		var rightMapView = createMapView("rightMapView", "rightSide", idDictionary.rightMapId);

		var wordCloudView = createWordCloudView("wordCloudView", idDictionary.wordCloudId);
		
		var components = [wordCloudView, leftMapView, rightMapView, statsView];

		var init = function() {

			// register the sides to the controller
			leftSide.registerController(this);
			rightSide.registerController(this);

			// Register each side with each component - Observer Pattern
			// Allows the side to update it's related components when it changes
			wordCloudView.registerObserver(leftSide);
			wordCloudView.registerObserver(rightSide);
			leftMapView.registerObserver(leftSide);
			rightMapView.registerObserver(rightSide);
			statsView.registerObserver(leftSide);
			statsView.registerObserver(rightSide);

			// Register each componenet with each side - Observer Pattern
			// Allows the component to request info from it's desired side
			leftSide.registerObserver(wordCloudView);
			leftSide.registerObserver(statsView);
			leftSide.registerObserver(leftMapView);
			
			rightSide.registerObserver(wordCloudView);
			rightSide.registerObserver(statsView);
			rightSide.registerObserver(rightMapView);

			// init all components. Need special code to start up the tool.
			for (var i = 0;i<components.length; i++) {
				components[i].init();
			}

		};

		var update = function update(side, unitCode) {
			if (side==="rightSide") {
				rightSide.update(unitCode);
				rightSide.notifyObservers();
			} else if (side==="leftSide") {
				leftSide.update(unitCode);
				leftSide.notifyObservers()
			} else {
				throw new Error("Couldn't identify what side (i.e. needs to be 'rightSide' or 'leftSide', not " + side);
			}
		};

		return {
			init: init,
			update: update,
		};

	}());

	
	controller.init();

	return controller;

};
