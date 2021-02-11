// This script init left side and right side.
//
// After this script is complete handle all
// data request via 'controller' object.
//
// Local server:
//
// 	 before in terminal 
//  	  cd Users/bwswedberg/Documents/School/Fall2013/VisualAnalytics/Project/Programming/ProjectEnv
//    	  python3.3 -m http.server 8888 &
//
//   close port
//        lsof -i :8888
//        kill -9 PID
//
//
// -------------------------------------------------

var idDictionary = initLayout("content");

// function to get IP address
var leftSideAreaId = "party_demStates";

// get reference to entire national dataset
var rightSideAreaId = "party_gopStates";

// create the controller to manage sides
var controller = createController(idDictionary, leftSideAreaId, rightSideAreaId);


