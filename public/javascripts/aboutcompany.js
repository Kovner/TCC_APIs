var viz;

window.onload = function() {
	//document.getElementById("myVizContainer").innerHTML = ticket;
	/********** Bootstrap the Viz **********/
	
	var placeholder = document.getElementById("myVizContainer");
	//var url = "http://mkovner-vm/trusted/" + ticket + "/t/rest/views/AboutCerebral/Story1"; //Kovner's
	var url = "http://winTableau/trusted/" + ticket + "/t/rest/views/AboutCerebral/Story1"; //Russell's
	var options = {
		width: "900px",
		height: "750px",
		hideTabs: true,
		hideToolbar: true,
		onFirstInteractive: function() {
			var story = viz.getWorkbook().getActiveSheet();
			var numPoints = story.getStoryPointsInfo().length;
			setInterval(function() {
				if(story.getActiveStoryPoint().getIndex() === numPoints-1) {
					story.activateStoryPointAsync(0);
				} else {
					story.activateNextStoryPointAsync();
				}
			},6500);
		}
	};
	
	viz = new tableauSoftware.Viz(placeholder, url, options);
	
};