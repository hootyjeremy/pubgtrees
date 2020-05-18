// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php


let strLine = "--------------------------------------------";
let hooty_server_url 	= 'http://localhost:3000';

var strPlatform, strPlayerName;

var url, player_url, match_url, telemetry_url = ""; // store the match ID's of the player
//var response; // fetch() responses
var player_response_json; // parsed json responses
var match_response_json;
var telemetry_response_json;

var match_offset = 0;


// # FLOOD PREVENTION
// # NEED TO BE ABLE TO SUPPRESS GETTING MATCHES UNTIL A RESPONSE COMES BACK
async function GetPlayerMatches() {

	match_offset = (match_offset < 0) ? 0 : match_offset;

	console.log('client requesting from ' + hooty_server_url);
	console.log('requesting player:     ' + strPlatform + ', ' + strPlayerName);
	console.log('match_offset:          ' + match_offset);


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

	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
	
	console.log('axios_response.data...');
	console.log(getDate() + ' ' + axios_response.data);


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