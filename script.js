const url = "https://script.google.com/macros/s/AKfycbzo06TDJr1oBadb6q7f9TTssuKwrBNc8UpQKEGJDXKriMxG7X4-3OxdH3uWTJ3Dsyn-Qg/exec?q=mtr";
const xhttpr = new XMLHttpRequest();
let lat, lng, response, received = 0;
xhttpr.open("GET", url, true);

xhttpr.send();

xhttpr.onload = ()=> {
	if (xhttpr.status == 200){
		response = JSON.parse(xhttpr.response);
		//let x = "<tr><td style='width:14%;'><strong>路線</strong></td><td style='width:86%;'><strong>方向</strong></td></tr>";
		received++
		if (received == 2){
			getClosestStop();
		}
	} else {
		//idk do sth
	}
}


if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
	console.log("no");
}


function showPosition(position) {
	lat = position.coords.latitude, lng = position.coords.longitude;
	console.log(lat + ", " + lng);
	let url = "https://script.google.com/macros/s/AKfycbzo06TDJr1oBadb6q7f9TTssuKwrBNc8UpQKEGJDXKriMxG7X4-3OxdH3uWTJ3Dsyn-Qg/exec?q=markdown&des=MTR-Info&lat=" + lat + "&lng=" + lng;
	xhttpr.open("GET", url, true);
	xhttpr.send();
	console.log("maps.google.com/?q=" + lat + "," + lng);
	received++
	if (received == 2){
		getClosestStop();
	}  
}

function getClosestStop (){
	let shortestDistance = getDistanceFromLatLonInKm(lat, lng, parseFloat(response[0]["lat"]), parseFloat(response[0]["long"])), distance, stop, stop_id, allLine = [], apiReceived = 0, x = "";
	let y = "<div class='centerDiv'>"
	for (let i = 0; i < response.length; i++){
		distance = getDistanceFromLatLonInKm(lat, lng, parseFloat(response[i]["lat"]), parseFloat(response[i]["long"]));
		if (distance < shortestDistance){
			stop = response[i]["name"];
			stopId = response[i]["code"];
			shortestDistance = distance;
		}
	}
	
	for (let i = 0; i < response.length; i++){
		if (stop == response[i]["name"]){
			allLine.push({line: response[i]["line"], sta: response[i]["code"], name: response[i]["name"]});
			
		}
	}
	
	for (let i = 0; i < allLine.length; i++){
		const url = "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=" + allLine[i]["line"] + "&sta=" + allLine[i]["sta"];
		const xhttpr = new XMLHttpRequest();
		let lineStation = allLine[i]["line"] + "-" + allLine[i]["sta"], destination = [], chunk = "", etaTime;
		xhttpr.open("GET", url, true);

		xhttpr.send();

		xhttpr.onload = ()=> {
			if (xhttpr.status == 200){
				raw = JSON.parse(xhttpr.response);
				list = raw["data"][lineStation];
				apiReceived++;
				x = x + "<table id='" + allLine[i]["line"] + "' class='timetable' style='display: none'><tr><td><strong>抵站時間</strong></td><td><strong>終點站</strong></td><td><strong>月台</strong></td></tr>";
				if (list["UP"] != null){
					for (let j = 0; j < list["UP"].length; j++){
						etaTime = new Date(list["UP"][j]["time"]);
						etaTime = etaTime.toLocaleTimeString('en-HK', {hourCycle: 'h23'});
						chunk += "<tr><td>" + etaTime + "</td><td>" + response[response.map(e => e.code).indexOf(list["UP"][j]["dest"])]["name"] + "</td><td>" + list["UP"][j]["plat"] + "</td></tr>";
						destination.push(response[response.map(e => e.code).indexOf(list["UP"][j]["dest"])]["name"]);
					}
					destination = [...new Set(destination)];
					x = x + "<tr><td colspan='3' style='background-color: #339933;'>往： " + destination.join("/") + "</td></tr>" + chunk;
				}
				chunk = "", destination = [];
				if (list["DOWN"] != null){
					for (let j = 0; j < list["DOWN"].length; j++){
						etaTime = new Date(list["DOWN"][j]["time"]);
						etaTime = etaTime.toLocaleTimeString('en-HK', {hourCycle: 'h23'});
						chunk += "<tr><td>" + etaTime + "</td><td>" + response[response.map(e => e.code).indexOf(list["DOWN"][j]["dest"])]["name"] + "</td><td>" + list["DOWN"][j]["plat"] + "</td></tr>";
						destination.push(response[response.map(e => e.code).indexOf(list["DOWN"][j]["dest"])]["name"]);
					}
					destination = [...new Set(destination)];
					x = x + "<tr><td colspan='3' style='background-color: #339933;'>往： " + destination.join("/") + "</td></tr>" + chunk;
				}
				x = x + "</table>";
				y += "<button class='btnOne' onclick='changeTable(\"" + allLine[i]["line"] + "\")' style='border-radius: 5px'>" + mtrLineName(allLine[i]["line"]) + "</button>";
				if (apiReceived == allLine.length){
					document.getElementById("station").innerText = allLine[0]["name"] + "站";
					document.getElementById("waiting").style.display = "none";
					document.getElementById("etaList").innerHTML = y + "</div>" + x;
					document.getElementById(allLine[0]["line"]).style.display = "";
				}
			} else {
				//idk do sth
			}
		}
	}
	console.log(allLine);
}

function changeTable (line){
	const collection = document.getElementsByTagName("table");
	for (let i = 0; i < collection.length; i++){
		collection[i].style.display = "none";
	}
	document.getElementById(line).style.display = "";
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  // deg2rad below
	var dLon = deg2rad(lon2-lon1); 
	var a = 
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}

function showError(error) {
	switch(error.code) {
		case error.PERMISSION_DENIED:
		  console.log("User denied the request for Geolocation.");
		  break;
		case error.POSITION_UNAVAILABLE:
		  console.log("Location information is unavailable.");
		  break;
		case error.TIMEOUT:
		  console.log("The request to get user location timed out.");
		  break;
		case error.UNKNOWN_ERROR:
		  console.log("An unknown error occurred.");
		  break;
	}
}

function mtrLineName(code) {
	switch (code){
		case "ISL":
			return "港島線";
		case "AEL":
			return "機場快線";
		case "TCL":
			return "東涌線";
		case "TML":
			return "屯馬線";
		case "TKL":
			return "將軍澳線";
		case "EAL":
			return "東鐵線";
		case "SIL":
			return "南港島線";
		case "TWL":
			return "荃灣線";
		case "KTL":
			return "觀塘線";
		default:
			return "迪士尼線";
	}
}