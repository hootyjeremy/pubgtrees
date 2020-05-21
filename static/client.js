// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php


let strLine = "--------------------------------------------";
let hooty_server_url 	= 'http://localhost:3000';

var strPlatform, strPlayerName;
var prevPlatform, prevPlayerName;	// these are used to reset match_floor if searching for a new player


var url, player_url, match_url, telemetry_url = ""; // store the match ID's of the player
//var response; // fetch() responses
var player_response_json; // parsed json responses
var match_response_json;
var telemetry_response_json;

var match_floor		= 0;
var total_matches 	= 0;


// $ FLOOD PREVENTION
// $ NEED TO BE ABLE TO SUPPRESS GETTING MATCHES UNTIL A RESPONSE COMES BACK
async function GetPlayerMatches() {

	match_floor = (match_floor < 0) ? 0 : match_floor;

	if (strPlatform != prevPlatform || strPlayerName != prevPlayerName) {
		// reset match_floor if a new player or platform is selected...
		console.log('resetting match_floor for new player');
		match_floor = 0;
	}

	prevPlatform 	= strPlatform;
	prevPlayerName 	= strPlayerName;


	console.log('client requesting from ' + hooty_server_url);
	console.log('requesting player:     ' + strPlatform + ', ' + strPlayerName);


	const btnSearch 	= document.getElementById('btnSearchPlayer');
	const btnPrevious 	= document.getElementById('btnPreviousMatches');
	const btnNext 		= document.getElementById('btnNextMatches');

	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = true;

	const axios_response = await axios.get(hooty_server_url + '/getplayermatches', {
		params: {
			'endpoint'		: 'players', 
			'platform'		:  strPlatform,
			'player_name' 	:  strPlayerName,
			'match_floor'	:  match_floor,
			'match_id'		: '',
			'telemetry_id'	: '',
		}
	})

	// $ check for response errors here

	//console.log(getDate() + ' axios_response: ' + JSON.stringify(axios_response.data));
	console.dir(axios_response.data);

	total_matches 	= axios_response.data.totalMatches;
	console.log('match_floor:     ' + match_floor + ' of ' + total_matches);

	// $ it's time to start working on vue table rows 

	//console.log('axios_response.data... ');
	//console.log('match_floor: ' + match_floor + ', total_matches: ' + total_matches);

	// enable all buttons...
	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
	
	// disable buttons if they need to be disabled...
	btnPrevious.disabled 	= (match_floor < 10) 						? true : false ;
	btnNext.disabled 		= (match_floor + 10 > total_matches - 1) 	? true : false ;	// $ verify this is hitting the ceiling properly




	// ! check for any errors from the pubg api...
	//   if there was an error here, then there isn't much reason to do anything else other than display it
	if (axios_response.data.pubg_response_status != undefined) {
		// if pubg_response_statue is defined, then there was an error retrieving from the pubg api
		if (axios_response.data.pubg_response_status != 200) {
			console.log('pubg_response error: ' + axios_response.data.pubg_response_status + ' ' + axios_response.data.pubg_response_statusText);
		}
	}




}











// ! ------------------------------------------------------------------------------------------------------>
// ! HTML Event Handlers
//

function btnSearchPlayer_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	match_floor = 0;

	prelim();
}


function btnNext_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	match_floor += 10;

	prelim();
}


function btnPrevious_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	match_floor -= 10;

	prelim();
}


function prelim() {
	//strPlatform 	= document.querySelector('input[name="platform"]:checked').value;
	strPlatform 	= document.querySelector("#slcPlatform option:checked").value;
	strPlayerName 	= document.getElementById("inputPlayerName").value;

	//console.log("btnSearchPlayer_Click() handler. name: " + document.getElementById("inputPlayerName").value);
	console.log(strLine);
	console.log("Searching: " + strPlatform + "/" + strPlayerName);

	GetPlayerMatches();
}


