function initLayout(parentDiv) {

	var idDictionary = {};

	// code that create the word cloud
	var wordCloud = document.createElement("div");
	wordCloud.id = "wordCloud";
	wordCloud.style.width = "100%";
	wordCloud.style.height = "375px";//410px
	//wordCloud.style.background = "purple";
	wordCloud.style.cssFloat="left";
	wordCloud.innerHTML = "<p>Word Cloud<p>";
	document.getElementById(parentDiv).appendChild(wordCloud);
	idDictionary.wordCloudId = wordCloud.id;

	// code that creates the left map
	var leftMap = document.createElement("div");
	leftMap.id = "leftMap";
	leftMap.style.width = "38%";
	leftMap.style.height = "375px";
	//leftMap.style.background = "blue";
	leftMap.style.cssFloat="left";
	leftMap.innerHTML = "<p>Left Map<p>";
	document.getElementById(parentDiv).appendChild(leftMap);
	idDictionary.leftMapId = leftMap.id;

	// code that create the stats
	var statsView = document.createElement("div");
	statsView.id = "statsView";
	statsView.style.width = "24%";
	statsView.style.height = "375px";
	//statsView.style.background = "yellow";
	statsView.style.cssFloat="left";
	statsView.innerHTML = "<p>Stats View<p>";
	document.getElementById(parentDiv).appendChild(statsView);
	idDictionary.statsViewId = statsView.id;

	// code that creates the right map
	var rightMap = document.createElement("div");
	rightMap.id = "rightMap";
	rightMap.style.width = "38%";
	rightMap.style.height = "375px";
	//rightMap.style.background = "blue";
	rightMap.style.cssFloat="left";
	rightMap.innerHTML = "<p>Right Map<p>";
	document.getElementById(parentDiv).appendChild(rightMap);
	idDictionary.rightMapId = rightMap.id;

	return idDictionary;
}