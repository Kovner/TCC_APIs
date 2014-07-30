var viz;

window.onload = function() {
	//document.getElementById("myVizContainer").innerHTML = ticket;
	/********** Bootstrap the Viz **********/
	
	var placeholder = document.getElementById("myVizContainer");
	var url = "http://mkovner-vm/trusted/" + ticket + "/t/rest/views/AboutCerebral/Story1";
	var options = {
		width: "900px",
		height: "750px",
		hideTabs: true,
		hideToolbar: true,
		onFirstInteractive: function() {
		}
	};
	
	viz = new tableauSoftware.Viz(placeholder, url, options);
	
};