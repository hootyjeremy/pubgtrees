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

	document.getElementById('fetching').style.display 	= "block";	// turn this on
	document.getElementById('vueapp').style.display 	= "none";


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
	document.getElementById('btnPreviousMatches').style.display	= "block";
	document.getElementById('btnNextMatches').style.display		= "block";
	document.getElementById('vueapp').style.display 			= "block";
	document.getElementById('fetching').style.display 			= "none";	// turn this back off


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

	console.log('telemetry response: ', axios_response);


	// $ cycle the response data and output the player's data
	for (i = 0; i < axios_response.data.arrPlayersDamageLog.length; i++) {
		var response 		= axios_response.data.arrPlayersDamageLog[i];
		var playerTeamId 	= axios_response.data.playerTeamId;

		// (response.attacker.teamId == playerTeamId || response.victim.teamId == playerTeamId)
		if (response.attacker.name == strPlayerName || response.victim.name == strPlayerName) {
			//console.log(response);

			var line = '';

			if (response._T == 'LogPlayerTakeDamage') {
				var killingStroke 	= (response.killingStroke 	== true) ? ' *kill/knock*' : '';
				var teammateDamage 	= (response.teammateDamage 	== true) ? ' *teammate-damage*' : '';
				var selfDamage 		= (response.selfDamage == true) ? ' *self-damage*' : '';

				line = 	response.matchTime + ' [(' + response.attacker.teamId + ') ' + response.attacker.name.padEnd(16, ' ') + '   (' + 
						response.victim.teamId + ') ' + response.victim.name.padEnd(16, ' ') + '] ' + strBot(response.attacker.isBot) + ' * ' + strBot(response.victim.isBot) + 
						' atckr health: ' + parseInt(response.attacker.health) + ' vs ' + parseInt(response.victim.healthBeforeDamage) + ', dmg: ' + parseInt(response.damage) + 
						', ' + response.damageTypeCategory + '/' + 	response.damageCauserName + '/' + response.damageReason + ', distance: ' + response.distance + killingStroke + selfDamage + teammateDamage;
			}
			else if (response._T == 'LogPlayerMakeGroggy') {
				if (response.byPlayer) {
					// knocked by player or bot
					line = 	response.matchTime + ' [(' + response.attacker.teamId + ') ' + response.attacker.name.padEnd(16, ' ') + ' v (' + 
					response.victim.teamId + ') ' + response.victim.name.padEnd(16, ' ') + '] ' + strBot(response.attacker.isBot) + ' v ' + strBot(response.victim.isBot);
				}
				else {
					// knocked by environment
					line = 	response.matchTime + ' [' + response.attacker.name.padEnd(16, ' ') + '      v (' + response.victim.teamId + ') ' + 
					response.victim.name.padEnd(16, ' ') + '] *env* v ' + strBot(response.victim.isBot);
				}
			}
			else if (response._T == 'LogPlayerKill') {
				if (response.byPlayer) {
					// killed by player or bot
					var _thirst 		= (response.isThirst) 		? ' *thirst*' : '';
					var _selfKill 		= (response.isSelfKill) 	? ' *self-kill*': '';
					var _teammateKill 	= (response.isTeammateKill) ? ' *teammate-kill*': '';
					var _bleedOut 		= (response.isBleedOut) 	? ' *bleed-out*': '';
	
					line = 	response.matchTime + ' [(' + response.attacker.teamId + ') ' + response.attacker.name.padEnd(16, ' ') + ' x (' + 
							response.victim.teamId + ') ' + response.victim.name.padEnd(16, ' ') + '] ' + strBot(response.attacker.isBot) + ' x ' + strBot(response.victim.isBot) +
								_thirst + _selfKill + _teammateKill + _bleedOut;
				}
				else {
					// environment kill
					line = 	response.matchTime + ' [' + response.attacker.name.padEnd(16, ' ') + '     x (' + 
							response.victim.teamId + ') ' + response.victim.name.padEnd(16, ' ') + '] *env* x ' + strBot(response.victim.isBot) + ' bleedout?';
				}
			}
			else if (response._T == 'LogPlayerRevive') {
				// not literally an "attacker" -> the attacker is the reviver. 
				line = response.matchTime + ' [(' + response.attacker.teamId + ') ' + response.attacker.name.padEnd(16, ' ') + ' ^ (' + response.victim.teamId + ') ' + 
				response.victim.name.padEnd(16, ' ') + ']';
			}



			console.log(line);
		}
	}

	console.log('show winPlace and of how many teams there were');
}

function strBot(bot) {
	if (bot) {
		return 'BOT  ';
	}
	else {
		return 'HUMAN';
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

	//vm.getMatchData([]); // clear out the table while fetching...

	prelim();
}


function btnNext_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	match_floor += 10;


	//vm.getMatchData([]); // clear out the table while fetching...


	prelim();
}


function btnPrevious_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	match_floor -= 10;

	//vm.getMatchData([]); // clear out the table while fetching...

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