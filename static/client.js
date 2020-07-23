// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php

//const e = require("express");

//const hf_server = require("../hooty_modules/hf_server");

let strLine = "--------------------------------------------";

let hooty_server_url 	= 'http://localhost:3000';
let defaultPlayer		= 'hooty__';

// --------------------------------------------------------->
// ! Deploy/Testing Version...
let   version 			= '0.014'
const blTestingVersion 	= !true;

if (!blTestingVersion) {
	hooty_server_url 	= 'https://hooty-pubg01.herokuapp.com';
	defaultPlayer 		= '';
	console.log('live version: ' + version);

	if (location.protocol == 'http:') {
		//alert('please go to https://hooty-pubg01.herokuapp.com instead of this unsecure page.');
		
		location.replace('https://hooty-pubg01.herokuapp.com');		
	}

	console.log('you are at: ' + location.href);
}
else {
	console.log('testing version: ' + version);
	console.log('you are at: ' + location.href);
	

	//console.log('!! VERIFY THAT YOU AREN\'T USING MINIFIED JS !!');

	// console.log(location.protocol);
	// console.log(location.host);
	//console.log('location.pathname: ' + location.pathname);
	// console.log('location.search: ' + location.search);

	// const tmpURL = location.protocol + '//' + location.host + location.pathname;

	// console.log(tmpURL);
}
// --------------------------------------------------------->



var strPlatform, strPlayerName;
var prevPlatform, prevPlayerName;	// these are used to reset match_floor if searching for a new player
let glSelectedPlayer = null;		// needed for the "show damage" button in the player report.
let prevSelectedPlayer = null;

let glMatchId = '';				// used for url

let bypassCache = null;
let blCycledKillsFound = false;

var url, player_url, match_url, telemetry_url = ""; // store the match ID's of the player
var player_response_json; // parsed json responses
var match_response_json;
var telemetry_response_json;

//var match_floor		= 0;
//var skipped_matches = 0;
var total_matches 	= 0;
let match_floors = [0];
let match_floors_index = 0;
let searchDirection = null;	// this will be for "next" or "previous" matches

let blShowDamage = false;

let axios_telemetry_response = null;	// global response so that functions know what to do with the response objects



// ! Window load
window.addEventListener('load', (event) => {
	//console.log('page is fully loaded');

	document.getElementById('inputPlayerName').value = defaultPlayer;

	// check if this is going to launch a tree from url parameters...
	checkURLQuery();



	// ! Event listeners...
	document.getElementById('btnSearchPlayer').addEventListener('click', (event) => {
		btnSearchPlayer_Click();
	});

	// Trigger search button click on hitting ENTER in the input text box...
	// https://stackoverflow.com/questions/155188/trigger-a-button-click-with-javascript-on-the-enter-key-in-a-text-box?rq=1
	document.getElementById("inputPlayerName").addEventListener("keyup", function (event) {
		event.preventDefault();
		if (event.keyCode === 13) {
			document.getElementById("btnSearchPlayer").click();
		}
	});	

	// document.getElementById('inputPlayerName').addEventListener('submit', (event) => {
	// 	btnSearchPlayer_Click();
	// })

	document.getElementById('btnPreviousMatches').addEventListener('click', (event) => {
		btnPrevious_Click();
	});

	document.getElementById('btnNextMatches').addEventListener('click', (event) => {
		btnNext_Click();
	});

	document.getElementById('btnCopyMatchURL').addEventListener('click', (event) => {
		btnCopyMatchToClipboard_Click();
	});


	// modal close button
	document.getElementById('btnCloseModal').addEventListener('click', (event) => {
		//document.getElementById('div-modal').style.display = 'none';
		HideModal();
	})

	document.getElementById('btnCloseModal2').addEventListener('click', (event) => {
		//document.getElementById('div-modal').style.display = 'none';
		HideModal();
	})


	// Show damage button
	document.getElementById('btnShowDamage').addEventListener('click', (event) => {

		//console.log(glSelectedPlayer);

		// reprint the report

		if (blShowDamage) {
			document.getElementById('btnShowDamage').textContent = 'Show damage';
		}
		else {
			document.getElementById('btnShowDamage').textContent = 'Hide damage';
		}

		blShowDamage = !blShowDamage;

		// re-draw the report
		OpenModalDamageReport(glSelectedPlayer);
	})

});


// if hitting escape, close the modal window
window.addEventListener('keydown', (event) => {
	if (event.key == 'Escape') {
		if (document.getElementById('div-modal').style.display != 'none') {
			HideModal();
		}
	}
});


// close the modal if hitting any of the outlined area
window.addEventListener('click', (event) => {
	//console.log(event.target);

	if (event.target.id == 'div-modal') {
		//console.log('modal clicked');
		HideModal();
	}
})


function ShowModal() {
	// display the modal report
	document.getElementById('div-modal').style.display = 'block';
	document.getElementById('div-modal').scrollIntoView({behavior: "smooth"});

}

function HideModal() {
	document.getElementById('div-modal').style.display = 'none';
	vuePlayerReport.clearPlayerReport();
}




function checkURLQuery() {
	// if there are search parameters, parse them and search the match
	// ! ?steam&hooty__&51beee36-6df7-4903-8d16-f21a97141340

	// console.log('location.search: [' + location.search + ']');
	if (location.search != '') {

		// params should be: platform, player name, matchId

		let params = location.search
					.substring(1, location.search.length)
					.split('&');



		// don't want to see match details since it won't work when analyzing from url parameters. will need to figure something out.
		//document.getElementById('tree-match-details').style.display = 'none';

		document.getElementById('inputPlayerName').value = params[1];

		strPlayerName = params[1];
		GetTelemetry(params[0]);
	}
	else {
		//document.getElementById('tree-match-details').style.display = 'inline';
	}
}

function btnCopyMatchToClipboard_Click() {
	// console.log('hooty_server_url: ' + hooty_server_url);
	// console.log('strPlatform: ' + strPlatform);
	// console.log('strPlayerName: ' + strPlayerName);
	// console.log('glMatchId: ' + glMatchId);

	navigator.permissions.query({name: "clipboard-write"}).then(result => {
		//console.log('result.state: ' + result.state);
		
		if (result.state == "granted" || result.state == "prompt") {

			let clip = hooty_server_url + '/?' + glMatchId + '&' + strPlayerName;
			//console.log(clip);

			navigator.clipboard.writeText(clip).then(function() {
				/* clipboard successfully set */
			  }, function() {
				/* clipboard write failed */
				alert('Could not copy to the clipboard.');
			  });
		}
    });
}



// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] GetPlayerMatches()
//

async function GetPlayerMatches() {


	let blCeilingHit 	= false;
	let blFloorHit 		= false;

	// clear out the current d3 tree
	document.getElementById('d3-svg01').innerHTML = '';


	if (strPlatform != prevPlatform || strPlayerName != prevPlayerName) {
		// reset match_floor if a new player or platform is selected...
		console.log('resetting match_floor for new player');

		match_floors = [0];
		match_floors_index = 0;
	}

	prevPlatform 	= strPlatform;
	prevPlayerName 	= strPlayerName;

	console.log('client requesting from ' + hooty_server_url);
	console.log('requesting player:     ' + strPlatform + '/' + strPlayerName);

	const btnSearch 	= document.getElementById('btnSearchPlayer');
	const btnPrevious 	= document.getElementById('btnPreviousMatches');
	const btnNext 		= document.getElementById('btnNextMatches');

	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = true;

	document.getElementById('fetching').style.display 	= "block";	// turn this on
	document.getElementById('vueapp').style.display 	= "none";

	// hide these if a new player is looked up
	document.getElementById('div-analyzing').style.display 	= 'none';
	document.getElementById('d3-tree01').style.display 		= 'none';


	var axios_response = null;

	if (blTestingVersion) {
		//console.log('req match_floor: ' + match_floor + ' of ' + total_matches);
		console.log('match_floors[' + match_floors_index + ']: ' + match_floors[match_floors_index]);
	}


	try {
		axios_response = await axios.get(hooty_server_url + '/getplayermatches', {
			params: {
				'endpoint'		: 'players', 
				'platform'		:  strPlatform,
				'player_name' 	:  strPlayerName,
				'match_floor'	:  match_floors[match_floors_index],
				'searchDirection': searchDirection,
				'match_id'		: '',
				'telemetry_id'	: '',
				'bypassCache'	: bypassCache,
			},
			headers: {
				'Content-Encoding': 'gzip',
			}
		})
	} catch (error) {
	
		alert('There was an error with the request. See the developer tools\' console log for fetching errors.');

		document.getElementById('fetching').style.display 		= "none";
		// document.getElementById('vueapp').style.display 		= "none";
		// document.getElementById('div-analyzing').style.display 	= 'none';
		// document.getElementById('d3-tree01').style.display 		= 'none';
	
		return;
	}


	// ! check for any errors from the pubg api response...
	if (axios_response.data.pubgResponse.status != 200 && axios_response.data.pubgResponse.status != null) {
		console.log('ERROR: could not find player in pubg api: ' + axios_response.data.status + ', ' + axios_response.data.statusText);

		alert('Could not find player in pubg api.');

		btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
		document.getElementById('fetching').style.display 	= "none";	// turn this on
	
		return;
	}
		
	if (blTestingVersion) {
		console.log('bypassCache: ' + bypassCache);
		console.log('GetPlayerMatches() axios_response...');
		console.log('current match_floor: ' + match_floors[match_floors_index] + ' of ' + axios_response.data.totalMatches + ', new ceiling: ' + axios_response.data.match_ceiling);
		console.log('total matches: ' + axios_response.data.totalMatches);
		console.dir(axios_response.data);
	}



	//#region // ! button stuff...
	//

	// add the match ceiling if the current index doesn't exist
	if (match_floors.length == match_floors_index + 1) {
		// this is basically only going to happen when you click next and an index doesn't exist
		match_floors.push(axios_response.data.match_ceiling);
	}

	// be aware that you are at the beginning or end of the match list (for button enabling)
	if (axios_response.data.match_ceiling < axios_response.data.totalMatches) {
		blCeilingHit = false;
	}
	else {
		blCeilingHit = true;
	}

	if (match_floors_index == 0) {
		blFloorHit = true;
	}
	else {
		blFloorHit = false;
	}


	// enable all buttons...
	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;


	if (blFloorHit) {
		// disable the "previous" button so that you can't go behind the 0 match floor
		btnPrevious.disabled = true;
		btnPrevious.classList.add('disabledButton');
	}
	else {
		btnPrevious.disabled = false;
		btnPrevious.classList.remove('disabledButton');
	}

	if (blCeilingHit) {
		btnNext.disabled = true;
		btnNext.classList.add('disabledButton');
	}
	else {
		btnNext.disabled = false;
		btnNext.classList.remove('disabledButton');
	}

	//
	//#endregion button stuff



	// don't show 0's on the board. show '-' instead so it's more clear...
	for (i = 0; i < axios_response.data.matches.length; i++) {
		if (axios_response.data.matches[i].DBNOs 		== 0) { axios_response.data.matches[i].DBNOs 		= '-'; }
		if (axios_response.data.matches[i].kills 		== 0) { axios_response.data.matches[i].kills 		= '-'; }
		if (axios_response.data.matches[i].damageDealt 	== 0) { axios_response.data.matches[i].damageDealt 	= '-'; }
	}



	vm.getMatchData(axios_response.data.matches);



	// show prev/next buttons
	document.getElementById('btnPreviousMatches').style.display	= "block";
	document.getElementById('btnNextMatches').style.display		= "block";
	document.getElementById('vueapp').style.display 			= "block";
	document.getElementById('fetching').style.display 			= "none";	// turn this back off
}

//#endregion



// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] GetTelemetry() ----------------------------------------------------------->
//

async function GetTelemetry(_matchID) {
	
	console.log('Match diag -> platform: ' + strPlatform + ', matchId: ' + _matchID + ', player: \'' + strPlayerName + '\'');

	glMatchId = _matchID;	// store for url clipboard

	axios_telemetry_response = null;

	const div_analyze 	= document.getElementById('div-analyzing');
	const svg_d3tree01	= document.getElementById('d3-tree01');

	div_analyze.style.display 	= 'block';
	svg_d3tree01.style.display 	= 'none';

	try {
		// get telemetry for this match for this platform/player

		axios_telemetry_response = await axios.get(hooty_server_url + '/getmatchtelemetry', {
			params: {
				'platform'		:  strPlatform,
				'matchID'		: _matchID,
				'player_name' 	:  strPlayerName,
			},
			headers: {
				'Content-Encoding': 'gzip',
			}
		})
	} 
	catch (error) 
	{
		//console.log('error getting telemetry from hootyserver: ' + error.response.status + ',' + error.response.statusText)
		alert('Error getting match details: ' + error.message);

		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'none';

		return;
	}

	//console.log('hootyserver.response:                     ' + axios_telemetry_response.status + ', ' + axios_telemetry_response.statusText);
	// console.log('pubgApiMatchResponseInfo.hootyserver:     ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.hootyserver);
	// console.log('pubgApiMatchResponseInfo.status:          ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.status);
	// console.log('pubgApiMatchResponseInfo.statusText:      ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.statusText);
	// console.log('pubgApiTelemetryResponseInfo.hootyserver: ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.hootyserver);
	// console.log('pubgApiTelemetryResponseInfo.status:      ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.status);
	// console.log('pubgApiTelemetryResponseInfo.statusText:  ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.statusText);

	vueMatchInfo.updateTreeMatchDetails(axios_telemetry_response.data.matchDetails);


	if (axios_telemetry_response.data.pubgApiMatchResponseInfo.status != 200 && axios_telemetry_response.data.pubgApiMatchResponseInfo.status != null) {
		alert('Error getting match from pubg api. ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.status + ': ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.statusText);

		// turn these off if there is an error.
		div_analyze.style.display 	= 'none';
		svg_d3tree01.style.display 	= 'none';
		
		return;
	}

	if (blTestingVersion) {
		console.log('axios_telemetry_response.data...');
		console.dir(axios_telemetry_response.data);
	}


	// ! D3 Tree Stuff...
	try {
		// clear out the svg D3 tree if there is anything in there...
		document.getElementById('d3-svg01').innerHTML = '';

		// create D3 tree...
		CreateTreeFromD3();

		document.getElementById('div-cycle-footnote').style.display = (blCycledKillsFound) ? 'block' : 'none';


		div_analyze.style.display 	= 'none';
		svg_d3tree01.style.display 	= 'block';

	} catch (error) {

		if (error.message == 'cycle') {
			alert('Cannot draw tree since two people killed each other and therefore destroys hierarchy. This is a bug I need to fix. I apologize.')
		}
		else {
			alert('D3 tree error: ' + error.message);
		}

		// turn these off if there is an error.
		div_analyze.style.display 	= 'none';
		svg_d3tree01.style.display 	= 'none';

		return;
	}


	// ! Update text class colors
	try {
		// once tree is generically created, update color for context and get data

		if (strPlayerName != '') {
			// need to remember who the looked up player is so that they will stay 'hightlighted'
			document.getElementById(strPlayerName).classList.add('searchedPlayer');
		}

		// don't update tree context on the first look
		//UpdateTreeContext(strPlayerName);

		document.getElementById('d3-tree01').scrollIntoView({behavior: "smooth"});

	} catch (error) {
		console.log('error in UpdateTreeContext() -> ' + error);
		alert('Error in UpdateTreeContext()');

		return;
	}



	// ? how can you pop up a dialog (like instagram) that will show the clicked player's info?



	//#region // ! [Console log stuff]
	//

	//PrintReportForSelectedPlayer(strPlayerName);

	//#endregion

}

//#endregion - Analyze telemetry



// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] Modal player report
//

function OpenModalDamageReport(selectedPlayer) {

	//console.log('OpenModalDamageReport(' + selectedPlayer + ')');

	glSelectedPlayer = selectedPlayer;

	// get teamId of selected player
	let playerTeamId = 0;
	axios_telemetry_response.data.arrTeams.forEach(team => {
		//console.log(team);
		team.teammates.forEach(teammate => {
			if (teammate.name == selectedPlayer) {
				playerTeamId = team.teamId;
			}
		})
	})

	// $ need to update vue variables for the table. 
	// pull table values from the damage report (kills, knocks, and damage)
	// have a player summary at the top (how many kills, how much damage, etc) -> might need to make a player card class that gets the same information
	// that you get on the searched player initially.

	// events:
	// LogPlayerTakeDamage
	// LogPlayerMakeGroggy
	// LogPlayerRevivie
	// LogPlayerKill

	// $ identify the player's card and send that record over
	// $ this will give the player's name and from there, you can get 
	vuePlayerReport.updatePlayerReport(selectedPlayer, playerTeamId, 
										axios_telemetry_response.data.arrPlayerCards, 
										axios_telemetry_response.data.arrPlayersDamageLog,
										axios_telemetry_response.data.allBotNames);



	ShowModal();

}



//#endregion 


// ! ------------------------------------------------------------------------------------------------------>
// $ DEPRECATED
//#region // ! [Region] Damage console logging
//

function PrintReportForSelectedPlayer(selectedPlayer) {

	// get teamId of selected player
	let playerTeamId = 0;
	axios_telemetry_response.data.arrTeams.forEach(team => {
		//console.log(team);
		team.teammates.forEach(teammate => {
			if (teammate.name == selectedPlayer) {
				playerTeamId = team.teamId;
			}
		})
	})

	console.log(strLine + strLine);
	console.log('Damage/Kill log for player -> ' + selectedPlayer + ', teamId: ' + playerTeamId);

	//debugger;

	for (i = 0; i < axios_telemetry_response.data.arrPlayersDamageLog.length; i++) {
		var record 			= axios_telemetry_response.data.arrPlayersDamageLog[i];
		//var playerTeamId 	= axios_telemetry_response.data.playerTeamId;

		// (record.attacker.teamId == playerTeamId || record.victim.teamId == playerTeamId)
		if (record.attacker.name == selectedPlayer || record.victim.name == selectedPlayer) {
			// this is only concerning the player
			//console.log(record);

			var line = '';
			var attackerTeamId  = new String(record.attacker.teamId);
     			attackerTeamId 	= attackerTeamId.padStart(3, '0') + '.';
			var victimTeamId 	= new String(record.victim.teamId);
				victimTeamId  	= victimTeamId.padStart(3, '0') + '.';
			var attackerName   	= new String(record.attacker.name).padEnd(16, ' ');
			var victimName		= new String(record.victim.name).padEnd(16, ' ');

			if (record._T == 'LogPlayerTakeDamage') {
				var killingStroke 	= (record.killingStroke 	== true) ? ' *kill/knock*' : '';
				var teammateDamage 	= (record.teammateDamage 	== true) ? ' *teammate-damage*' : '';
				var selfDamage 		= (record.selfDamage 		== true) ? ' *self-damage*' : '';

				line = 	record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + '   ' + victimTeamId + ' ' + victimName + '] ' + 
						strBot(record.attacker.isBot) + ' * ' + strBot(record.victim.isBot) + ' ' + parseInt(record.attacker.health) + ' vs ' + 
						parseInt(record.victim.healthBeforeDamage) + ', dmg: ' + parseInt(record.damage) + ', ' + record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
						record.damageReason + ', distance: ' + record.distance + killingStroke + selfDamage + teammateDamage;
			}
			else if (record._T == 'LogPlayerMakeGroggy') {
				if (record.byPlayer) {
					// knocked by player or bot
					line = record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' v ' + victimTeamId + ' ' + victimName + '] ' + 
						   strBot(record.attacker.isBot) + ' v ' + strBot(record.victim.isBot) + ' ' +  record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
						   record.damageReason + ' *knock*';
				}
				else {
					// knocked by environment
					line = 	record.matchTime + ' [' + record.attacker.name.padEnd(16, ' ') + '     v ' + victimTeamId + ' ' + victimName + '] *env* v ' + strBot(record.victim.isBot) +
							' ' + record.damageTypeCategory + '/' +	record.damageCauserName + '/' + record.damageReason;
				}
			}
			else if (record._T == 'LogPlayerKill') {

				if (record.byPlayer) {
					// killed by player or bot
					var _thirst 		= (record.isThirst) 			? ' *thirst*' : '';
					var _selfKill 		= (record.isSelfKill) 		? ' *self-kill*': '';
					var _teammateKill 	= (record.isTeammateKill) 	? ' *teammate-kill*': '';
					//var _bleedOut 		= (record.isBleedOut) 		? ' *bleed-out*': '';
					let _bleedOut = '';

					if (record.isTeamWipe && record.isTeamWipe != null) {
						_bleedOut = ' *bleedout/team-wiped*';
					}
					else if (record.isNoRevive && record.isTeamWipe != null) {
						_bleedOut = ' *bleedout/no-revive*';
					}
	
					line = 	record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' x ' + victimTeamId + ' ' + victimName + '] ' + 
							strBot(record.attacker.isBot) + ' x ' + strBot(record.victim.isBot) + ' ' +  record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
							record.damageReason + _thirst + _selfKill + _teammateKill + _bleedOut;
				}
				else {
					// environment kill
					line = 	record.matchTime + ' [' + attackerName + '     x ' + victimTeamId + ' ' + victimName + '] *env* x ' + strBot(record.victim.isBot) + ' ' + 
							record.damageTypeCategory + '/' + record.damageCauserName + '/' + record.damageReason + ' bleedout?';
				}
			}
			else if (record._T == 'LogPlayerRevive') {
				// not literally an "attacker" -> the attacker is the reviver. 
				line = record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' ^ ' + victimTeamId + ' ' + victimName + '] *revive*';
			}

			console.log(line);
		}
		else if (record.victim.teamId == playerTeamId) {
				// i want to know when a teammate is knocked or killed
				// i want to know when a teammate is revived
				
				var line = null;
				var attackerTeamId  = new String(record.attacker.teamId);
					attackerTeamId 	= attackerTeamId.padStart(3, '0') + '.';
				var victimTeamId 	= new String(record.victim.teamId);			
					victimTeamId  	= victimTeamId.padStart(3, '0') + '.';
				var attackerName   	= new String(record.attacker.name).padEnd(16, ' ');
				var victimName		= new String(record.victim.name).padEnd(16, ' ');

				if (record._T == 'LogPlayerMakeGroggy') {
					// your teammate was knocked

					if (record.byPlayer) {
						// knocked by player or bot
						line = record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' v ' + victimTeamId + ' ' + victimName + '] ' + 
							   strBot(record.attacker.isBot) + ' v ' + strBot(record.victim.isBot) + ' ' + record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
							   record.damageReason + ' *knock*';
					}
					else {
						// knocked by environment
						line = 	record.matchTime + ' [' + record.attacker.name.padEnd(16, ' ') + '     v ' + victimTeamId + ' ' + victimName + '] *env* v ' + strBot(record.victim.isBot) + 
								' ' + record.damageTypeCategory + '/' +	record.damageCauserName + '/' + record.damageReason;
					}
				}
				else if (record._T == 'LogPlayerKill') {
					// your teammate was killed

					// $ bug here where knocked by environment and then bleed out, shows killer as self. what is server side saying?

					if (record.byPlayer) {
						// killed by player or bot
						var _thirst 		= (record.isThirst) 		? ' *thirst*' : '';
						var _selfKill 		= (record.isSelfKill) 		? ' *self-kill*': '';
						var _teammateKill 	= (record.isTeammateKill) 	? ' *teammate-kill*': '';
						// var _bleedOut 		= (record.isBleedOut) 		? ' *bleed-out*': '';

						let _bleedOut = '';
						if (record.isTeamWipe && record.isTeamWipe != null) {
							_bleedOut = ' *bleedout/team-wiped*';
						}
						else if (record.isNoRevive && record.isNoRevive != null) {
							_bleedOut = ' *bleedout/no-revive*';
						}
	
		
						line = 	record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' x ' + victimTeamId + ' ' + victimName + '] ' + 
								strBot(record.attacker.isBot) + ' x ' + strBot(record.victim.isBot) + ' ' + record.damageTypeCategory + '/' + record.damageCauserName + '/' + 
								record.damageReason + _thirst + _selfKill + _teammateKill + _bleedOut;
					}
					else {
						// environment kill
						line = 	record.matchTime + ' [' + attackerName + '     x ' + victimTeamId + ' ' + victimName + '] *env* x ' + strBot(record.victim.isBot) + ' ' + 
								record.damageTypeCategory + '/' + record.damageCauserName + '/' + record.damageReason + ' bleedout?';
					}
				}
				else if (record._T == 'LogPlayerRevive') {
					// your teammate was revived

					line = record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' ^ ' + victimTeamId + ' ' + victimName + '] *revive*';
				}

				if (line != null){
					console.log('%c' + line, 'color: #98a0a6');
				}
		}
	}

}

//#endregion - Console log for damage



// ! ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] D3 : Build kill tree
//

function CreateTreeFromD3() {

	// original sample...
	// https://codesandbox.io/s/xwm4k88wp?file=/src/index.js

	blCycledKillsFound = false;

	const response = axios_telemetry_response.data;

	let  table = d3.csvParse(response.csvDataForD3);
	const root = d3.stratify()
				.id(function(d) { return d.name; })
				.parentId(function(d) { return d.parent; })
				(table);
	
	
	const path_width = 1200;                        // what is this the width of? path?
	//const root = d3.hierarchy(data);            	// https://github.com/d3/d3-hierarchy
	const dx = 14;                              	// node height (default 10)
	const dy = 140;									// path/link/line width
//	const dy = path_width / (root.height + 1);      // root.height is how many descendants there are. this is where you can make the line lengths static, probably.
	//const tree = d3.tree().nodeSize([dx, dy]);
	const tree = d3.tree().nodeSize([dx, dy]); 	// static width for paths

	let custom_width  = 160 + (root.height * dy);
	let custom_height = 0;
	
	let custom_neg_height = 0;
	let custom_pos_height = 0;

	tree(root);

	let x0 = Infinity;
	let x1 = -x0;
	root.each((d) => {
		//console.log(d.data.name);
		if (d.x > x1) x1 = d.x;
		if (d.x < x0) x0 = d.x;

		// need to know how high above root and low below root so that you can get an accurate height of the final svg
		if (d.x < 0) {
			// keep up with the lowest negative value...
			if (d.x < custom_neg_height) {
				custom_neg_height = d.x;
				//console.log('new neg: ' + d.id + ': ' + d.x);
			}
		}
		else {
			// keep up with the hightest positive value...
			if (d.x > custom_pos_height) {
				custom_pos_height = d.x;
				//console.log('new pos: ' + d.id + ': ' + d.x);
			}
		}
	});

	custom_height = (Math.abs(custom_neg_height) + custom_pos_height) + 40;


	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
	const svg = d3
	.select(document.getElementById("d3-svg01"))
	.style("width",  custom_width)
	.style("height", custom_height)
	.style('background-color', '#414144');

	const g = svg
	.append("g")                        // svg <g> tag is a group of elements : https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g#:~:text=The%20SVG%20element%20is,with%20the%20element.
	.attr("font-family", "sans-serif")
	.attr("font-size", 12)
	//.attr("transform", `translate(${dy / 3},${dx - x0})`);
	.attr("transform", `translate(${10},${dx - x0})`); 	// ! if you hide the first branch out, the first paramater can drag the tree to the left	

	const link = g
	.append("g")
	.attr("fill", "none")
	// .attr("stroke", "#8f91a1")
	.attr("stroke-opacity", 0.4)
	.attr("stroke-width", 1.5)
	.selectAll("path")
	.data(root.links())
	.enter()
	.append("path")
	//.attr("stroke", "#8f91a1")
	.attr("stroke", d => {
		//console.log(d.source.id);

		// draw the line invisible if it is coming from 'match' top node to any of the categories
		if (d.source.id == 'Match') {
			return '#414144';	// background color (the line is invisible)
		}
		else {
			return "#8f91a1";
		}
	})
	.attr(
		"d",
		d3
		.linkHorizontal()
		.x(d => d.y)      // width of line
		.y(d => d.x)      // height of line
	);
	// path:  https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/path
	// d:     https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
	// .linkHorizontal: https://github.com/d3/d3-shape/blob/v1.3.7/README.md#linkHorizontal


	const node = g
	.append("g")
	.selectAll("g")
	.data(root.descendants())
	.enter()
	.append("g")
	.attr("transform", d => `translate(${d.y},${d.x})`);  

	node
	.append("circle")
	//.attr("fill", d => (d.children ? "#8f91a1" : "#8f91a1"))    // the dot (nodes/leaves)
	.attr("fill", d => {
		// don't show the first dot for "Match" on the top level
		return (d.id == 'Match') ? "#414144" : "#8f91a1";	// background-color : line color
	})
	.attr("r", 2.5);

	node
	.append("text")           	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
	.attr('fill', "#dcddde")  	// added this to change text color
	.attr('class', d => {
		let winnerClass = '';

		if (response.allHumanNames.includes(d.data.name) ) {
			// don't create id's for stuff like ""
			//return 'allPlayers';


			response.arrSurvivors.forEach(element => {
				if (element.name == d.data.name) {
					winnerClass = ' winner';
				}
			})

			return 'allPlayers humanPlayers' + winnerClass;
		}
		else if (response.allBotNames.includes(d.data.name)) {

			response.arrSurvivors.forEach(element => {
				if (element.name == d.data.name) {
					winnerClass = ' winner';
				}
			})

			return 'allPlayers botPlayers' + winnerClass;
		}
		else if (d.data.name == 'Winner' || d.data.name == 'Winners') {
			// want to draw the winner category in winner's color so that the branch is somewhat separated from the rest.
			return 'categories'
			return 'categories winner'
		}
		else if (d.data.name == 'Match' || d.data.name == 'Environment kills' || 
				 d.data.name == 'Self kills' || d.data.name == 'Cycled kills') {
			// if it's not a player, then it's a category. (or an untracked late spawn bot?)
			return 'categories';
		}
		else if (d.data.name.includes('<')) { 
			// if it's an environment kill type "player" with '<' then just color it as category
			return 'categories';
		}
		else if (d.data.name.includes('(')) {
			// if it's a cycle will with a '(' or ')' then do the same.
			return 'categories';
		}
	})
	.attr('id', d=> {
		// if this is a human or a bot, then add an id of their name

		if (response.allHumanNames.includes(d.data.name) || response.allBotNames.includes(d.data.name)) {
			// don't create id's for stuff like ""
			return d.data.name;
		}
	})
	.attr('onclick', d => {
		if (response.allHumanNames.includes(d.data.name) || response.allBotNames.includes(d.data.name)) {
			// don't create id's for stuff like ""
			return 'UpdateTreeContext(\'' + d.data.name + '\')';
		}
	})
	.attr('cursor', d => {
		if (d.data.name == 'Match' || d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || 
		    d.data.name == 'Self kills' || d.data.name == 'Cycled kills' || d.data.name.includes('<') || d.data.name.includes('(')) {
			// if it's not a player, then it's a category. (or an untracked late spawn bot?)
			return 'normal';
		}
		else {
			return 'pointer';
		}
	})
	.attr("dy", "0.5em") // "dy", "0.31em"
	//.attr("x", d => (d.children ? 6 : 6))                    	// seems to be the offset for text-anchor           // "x", d => (d.children ? -6 : 6)
	//.attr("text-anchor", d => (d.children ? "start" : "start")) // where the text is in relation to the node dot    // "text-anchor", d => (d.children ? "end" : "start")
	//.text(d => d.data.name)
	.attr("x", d => {
		// if category, offset anchor to the left
		return (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || d.data.name == 'Self kills' || d.data.name == 'Cycled kills') ? -6 : 6;
	}) 
	.attr("text-anchor", d => {
		// if category, offset anchor to the left
		return (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || d.data.name == 'Self kills' || d.data.name == 'Cycled kills') ? "end" : "start";
	}) 
	.text(d => {
		// add '<>' to the category names
		if (d.data.name == 'Match') {
			return '';
		}
		else if (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || d.data.name == 'Self kills' || d.data.name == 'Cycled kills') {
			
			if (d.data.name == 'Cycled kills') {
				// need to know if the footnote should be displayed.
				blCycledKillsFound = true;
			}

			return '<' + d.data.name + '>';
		}
		else {
			return d.data.name;
		}
	})
}

//#endregion D3 tree -----------------------



function UpdateTreeContext(selectedPlayer) {
	// This will happen when any player is clicked...

	//console.log('clicked name: ' + name);

	// update data data for the selected player
	if (prevSelectedPlayer == selectedPlayer) {
		//PrintReportForSelectedPlayer(selectedPlayer);
		OpenModalDamageReport(selectedPlayer);
	}

	prevSelectedPlayer = selectedPlayer; 

	// ! human and bot players should always have at least one root class "humanPlayer" or "botPlayer" and then stack and relational classes on top of them. 
	// ! probably have 2 max (root + relational)

	const response = axios_telemetry_response.data;

	let allPlayers = document.getElementsByClassName('allPlayers');
	//let allHumanPlayers = document.getElementsByClassName('humanPlayer');
	//let allBotPlayers 	= document.getElementsByClassName('botPlayer');


	//#region // ! [Region] Get initial information...
	//

	// get seletected player's teamId (for determinining teammates)
	let selectedPlayerTeamId = null;
	let selectedPlayerKiller = null;
	let selectedPlayerKillerTeamId = null;

	response.arrTeams.forEach(element => {
		// loop through arrTeams until you find the selected player and then get their teamId

		element.teammates.forEach(teammate => {
			// loop through all of this team's teammates. if the selected player is there, then this is a teammate. 

			if (teammate.name == selectedPlayer) {
				//console.log('selectedPlayerTeamId found: ' + teammate.name);
				selectedPlayerTeamId = element.teamId;
			}
		})
	})


	// cycle the arrKillLog for victim. if the selected player is a victim, get the killer's name.
	response.arrKillLog.forEach(element => {
		if (element.victim == selectedPlayer && element.killer != selectedPlayer) {
			// if killer is self, then don't assign a killer.
			selectedPlayerKiller = element.killer;

			// if there is a valid killer, get the killer's teamId
			response.arrTeams.forEach(team => {
				team.teammates.forEach(teammate => {
					if (teammate.name == selectedPlayerKiller) {
						selectedPlayerKillerTeamId = team.teamId;
					}
				})
			})
		}
	})

	//
	//#endregion --------------------------------------------------------
	


	// cycle through all players and then give them a context class based on the selected player...
	for (let i = 0; i < allPlayers.length; i++) {

		let playerClassList = allPlayers[i].classList;
		let currentPlayer 	= allPlayers[i].textContent;

		// addd/remove classes
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList

		// prune all classes after the intial default classes that should not be removed (allPlayers, human/bot, 
		// searched) if they have any left over from the last selected player's context.
		for (let j = playerClassList.length - 1; j >= 0; j--) {
			//console.log('    ' + allPlayers[i].classList.value);

			if (playerClassList[j] != 'allPlayers' && playerClassList[j] != 'humanPlayers' && playerClassList[j] != 'botPlayers' && playerClassList[j] != 'searchedPlayer' &&
				playerClassList[j] != 'winner') {
				playerClassList.remove(playerClassList[j]);
			}
		}

		// at this point, add the relational classes...
		// what is the context of this player to the selected player?
		// -selected player?
		// -teammate?
		// -killer?
		// -killer teammate?
		// -traded paint?

		// selected player
		if (selectedPlayer == currentPlayer) {
			playerClassList.add('selectedPlayer');
		}
		else {
			// if not the selected player, what is currentPlayer's teamId? is it not the selected player?

			// loop through arrTeams until you find the teamId of the selected player
			response.arrTeams.forEach(element => {
		
				// loop through all of this team's teammates. if the selected player is there, then this is a teammate. 
				element.teammates.forEach(teammate => {
		
					if (teammate.name == currentPlayer) {
						//console.log('currentPlayer team found: ' + teammate.name + ' -> ' + currentPlayer);

						if (element.teamId == selectedPlayerTeamId) {
							//console.log('currentPlayer teammate found: ' + teammate.name + ' -> ' + currentPlayer);
							// #7dde98 green
							playerClassList.add('playerTeammate');
						}
						else if (element.teamId == selectedPlayerKillerTeamId) {
							// this player is on the killer's team. is it the killer or just a teammate?
							if (currentPlayer == selectedPlayerKiller) {
								// this is the killer
								playerClassList.add('killer')
							}
							else {
								// this is a killer teammate
								playerClassList.add('killerTeammate')
							}
						}
					}
				})
			})
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

	searchDirection = 'up';

	// just reset the whole array if they re-click "search"
	match_floors = [0];
	match_floors_index = 0;

	prelim();
}


function btnNext_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	searchDirection = 'up';

	match_floors_index++;

	prelim();
}


function btnPrevious_Click() {
	if (document.getElementById("inputPlayerName").value == "") {
		return;
	}

	searchDirection = 'down';

	match_floors_index--;

	prelim();
}


function prelim() {
	//strPlatform 	= document.querySelector('input[name="platform"]:checked').value;
	strPlatform 	= document.querySelector("#slcPlatform option:checked").value;
	strPlayerName 	= document.getElementById("inputPlayerName").value;

	if (strPlayerName[strPlayerName.length - 1] == '!') {
		// ends with '!' and can bypass cache.
		bypassCache = 'y';

		strPlayerName = strPlayerName.slice(0, strPlayerName.length - 1);
	}
	else {
		// doesn't end with '!'
		bypassCache = 'n';
	}

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