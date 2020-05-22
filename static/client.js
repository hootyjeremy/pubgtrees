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

	vm.getMatchData(axios_response.data.matches);





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



	// show prev/next buttons
	document.getElementById('btnPreviousMatches').style.display 	= "block";
	document.getElementById('btnNextMatches').style.display 		= "block";



}


// ! Analyze Telemetry ----------------------------------------------------------->
async function GetTelemetry(_matchID) {
	console.log('GetTelemetry() -> ' + _matchID + ', ' + strPlatform + '/' + strPlayerName);

	// get telemetry for this match for this platform/player
	const axios_response = await axios.get(hooty_server_url + '/getmatchtelemetry', {
		params: {
			'platform'		:  strPlatform,
			'player_name' 	:  strPlayerName,
			'matchID'		: _matchID,
		}
	})

	// $ check for response errors here

}





// ! VUE STUFF ------------------------------------------------------------------->


Vue.component('custom_row', {
	props: ['match_prop'],
	methods: {
		printRoster: function (match) {
			
			var strRoster = '';

			for (let i = 0; i < match.length; i++){
				strRoster += match[i].name;

				if (i + 1 < match.length) {
					strRoster += ', ';
				}
			}
		
			return strRoster;
		},
		resolveMatchType: function (match_type) {
			if (match_type == 'competitive') {
				return 'Ranked'
			}
			else {
				return 'Unranked'
			}
		},
		analyzeMatch: function (_matchID) {
			//console.log('analyzeMatch() -> ' + _matchID);

			GetTelemetry(_matchID);


		}
	},	
	template:  `<tr style="height:22px; border:1px; border-color:#303030; outline: thin solid"> 					
					<td style="padding: 10px; text-align:left;">{{match_prop.timeSinceMatch}}</td> 
					<td style="padding: 10px; text-align:left;">{{match_prop.mapName}}</td>
					<td style="padding: 10px; text-align:left;">{{match_prop.gameMode}}</td> 
					<td style="padding: 10px; text-align:left;">{{resolveMatchType(match_prop.matchType)}}</td>
					<td style="padding: 10px; text-align:left;">{{printRoster(match_prop.teamRoster)}}</td>
					<td style="padding: 10px; text-align:left;"> <button v-on:click="analyzeMatch(match_prop.matchID)">View</button> </td>
				</tr>`
})

var vm = new Vue({
	el: "#vueapp",
	data: {
		match_data: [],
		strTeamRoster: '',
	},
	created: function () {
	},
	methods: {
		getMatchData: function (matches_array) {
			this.match_data = matches_array;

			//console.log('getMatchData()');
			console.dir(this.match_data);
		}
	},
})






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


function _printRoster(roster) {
	var strRoster;

	roster.forEach(element => {
		strRoster += element + ', ';
	});

	return strRoster;
}

function ClickedSomething(_matchID) {
	console.log('ClickedSomething() -> ' + _matchID);
}