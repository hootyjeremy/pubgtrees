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

//

async function GetPlayerMatches() {

	console.log('client requesting from ' + hooty_server_url);
	console.log('requesting player: ' + strPlatform + ', ' + strPlayerName);


	const axios_response = await axios.get(hooty_server_url + '/getplayer', {
		params: {
			'endpoint'		: 'players', 
			'platform'		:  strPlatform,
			'player_name' 	:  strPlayerName,
			'match_id'		: '',
			'telemetry_id'	: ''
		}
	})


	console.log('axios_response.data...');
	console.log(getDate() + ' ' + axios_response.data);


	// check for any errors from the pubg api...
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

	GetPlayerMatches();
	//GetTest();
}


// ! it appears that get and post responses are not what i think i'm sending back
async function GetTest() {
	const response = await fetch(hooty_server_url + '/player', { });
	console.log('get response...');
	console.log(response);

}