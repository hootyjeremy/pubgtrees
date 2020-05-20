// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php


let strLine = "--------------------------------------------";
let hooty_server_url 	= 'http://localhost:3000';

var strPlatform, strPlayerName;
var prevPlatform, prevPlayerName;	// these are used to reset match_offset if searching for a new player


var url, player_url, match_url, telemetry_url = ""; // store the match ID's of the player
//var response; // fetch() responses
var player_response_json; // parsed json responses
var match_response_json;
var telemetry_response_json;

var match_offset	= 0;
var total_matches 	= 0;


// $ FLOOD PREVENTION
// $ NEED TO BE ABLE TO SUPPRESS GETTING MATCHES UNTIL A RESPONSE COMES BACK
async function GetPlayerMatches() {

	match_offset = (match_offset < 0) ? 0 : match_offset;

	if (strPlatform != prevPlatform || strPlayerName != prevPlayerName) {
		// reset match_offset if a new player or platform is selected...
		console.log('resetting match_offset for new player');
		match_offset = 0;
	}


	console.log('client requesting from ' + hooty_server_url);
	console.log('requesting player:     ' + strPlatform + ', ' + strPlayerName);
	console.log('match_offset:          ' + match_offset + ' of ' + total_matches);


	const btnSearch 	= document.getElementById('btnSearchPlayer');
	const btnPrevious 	= document.getElementById('btnPreviousMatches');
	const btnNext 		= document.getElementById('btnNextMatches');

	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = true;

	const axios_response = await axios.get(hooty_server_url + '/getplayermatches', {
		params: {
			'endpoint'		: 'players', 
			'platform'		:  strPlatform,
			'player_name' 	:  strPlayerName,
			'match_offset'	:  match_offset,
			'match_id'		: '',
			'telemetry_id'	: '',
		}
	})

	// $ check for response errors here


	prevPlatform 	= strPlatform;
	prevPlayerName 	= strPlayerName;

	total_matches = axios_response.data.totalMatches;

	console.log('axios_response.data... ');
	console.log(getDate() + ' ' + JSON.stringify(axios_response.data));
	//console.log('match_offset: ' + match_offset + ', total_matches: ' + total_matches);

	// enable all buttons...
	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
	
	// disable buttons if they need to be disabled...
	btnPrevious.disabled 	= (match_offset < 10) 						? true : false ;
	btnNext.disabled 		= (match_offset + 10 > total_matches - 1) 	? true : false ;	// $ verify this is hitting the ceiling properly




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

	//strPlatform 	= document.querySelector('input[name="platform"]:checked').value;
	strPlatform 	= document.querySelector("#slcPlatform option:checked").value;
	strPlayerName 	= document.getElementById("inputPlayerName").value;

	//console.log("btnSearchPlayer_Click() handler. name: " + document.getElementById("inputPlayerName").value);
	console.log(strLine);
	console.log("Searching: " + strPlatform + "/" + strPlayerName);

	GetPlayerMatches();	// match offset = 0
	//GetTest();
}


function btnNext_Click() {
	console.log('btnNext_Click()');

	match_offset += 10;

	btnSearchPlayer_Click();
}


function btnPrevious_Click() {
	console.log('btnPrevious_Click()');

	match_offset -= 10;

	btnSearchPlayer_Click();
}



// ! it appears that get and post responses are not what i think i'm sending back
async function GetTest() {
	const response = await fetch(hooty_server_url + '/player', { });
	console.log('get response...');
	console.log(response);

}