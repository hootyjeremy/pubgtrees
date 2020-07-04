// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php

//const hf_server = require("../hooty_modules/hf_server");


let strLine = "--------------------------------------------";

let hooty_server_url 	= 'http://localhost:3000';
let defaultPlayer		= 'hooty__';
let version 			= '2020.07.03 _ 003'

// --------------------------------------------------------->
// ! Deploy/Testing Version...
const blTestingVersion 	= true;

if (!blTestingVersion) {
	hooty_server_url 	= 'https://hooty-pubg01.herokuapp.com';
	defaultPlayer 		= '';
	console.log('live version: ' + version);

	if (location.protocol == 'http:') {
		//alert('please go to https://hooty-pubg01.herokuapp.com instead of this unsecure page.');
		
		location.replace('https://hooty-pubg01.herokuapp.com');		
	}
}
else {
	console.log('testing version: ' + version);
	console.log('you are at: ' + location.href);

	// console.log(location.protocol);
	// console.log(location.host);
	// console.log(location.pathname);

	// const tmpURL = location.protocol + '//' + location.host + location.pathname;

	// console.log(tmpURL);
}
// --------------------------------------------------------->



var strPlatform, strPlayerName;
var prevPlatform, prevPlayerName;	// these are used to reset match_floor if searching for a new player

var url, player_url, match_url, telemetry_url = ""; // store the match ID's of the player
//var response; // fetch() responses
var player_response_json; // parsed json responses
var match_response_json;
var telemetry_response_json;

var match_floor		= 0;
var total_matches 	= 0;

let axios_telemetry_response = null;	// global response so that functions know what to do with the response objects


// $ FLOOD PREVENTION
// $ NEED TO BE ABLE TO SUPPRESS GETTING MATCHES UNTIL A RESPONSE COMES BACK
async function GetPlayerMatches() {

	//#region // ! [Region] GetPlayerMatches()
	//

	document.getElementById('d3-svg01').innerHTML = '';

	match_floor = (match_floor < 0) ? 0 : match_floor;

	if (strPlatform != prevPlatform || strPlayerName != prevPlayerName) {
		// reset match_floor if a new player or platform is selected...
		console.log('resetting match_floor for new player');
		match_floor = 0;
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

	try {
		axios_response = await axios.get(hooty_server_url + '/getplayermatches', {
			params: {
				'endpoint'		: 'players', 
				'platform'		:  strPlatform,
				'player_name' 	:  strPlayerName,
				'match_floor'	:  match_floor,
				'match_id'		: '',
				'telemetry_id'	: '',
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


	// ! check for any errors from the pubg api...
	if (axios_response.data.pubgResponse.status != 200 && axios_response.data.pubgResponse.status != null) {
		console.log('ERROR: could not find player in pubg api: ' + axios_response.data.status + ', ' + axios_response.data.statusText);

		alert('could not find player in pubg api');
		// $ need to reset the form and shit
		btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
		document.getElementById('fetching').style.display 	= "none";	// turn this on
	
		return;
	}

	//console.log('axios_response...');
	//console.dir(axios_response.data);

	total_matches 	= axios_response.data.totalMatches;
	console.log('match_floor:     ' + match_floor + ' of ' + total_matches);


	// don't show 0's on the board. show '-' instead so it's more clear...
	for (i = 0; i < axios_response.data.matches.length; i++) {
		if (axios_response.data.matches[i].DBNOs 		== 0) { axios_response.data.matches[i].DBNOs 		= '-'; }
		if (axios_response.data.matches[i].kills 		== 0) { axios_response.data.matches[i].kills 		= '-'; }
		if (axios_response.data.matches[i].damageDealt 	== 0) { axios_response.data.matches[i].damageDealt 	= '-'; }
	}

	vm.getMatchData(axios_response.data.matches);


	//console.log('axios_response.data... ');
	//console.log('match_floor: ' + match_floor + ', total_matches: ' + total_matches);

	// enable all buttons...
	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
	
	// disable buttons if they need to be disabled...
	btnPrevious.disabled 	= (match_floor < 10) 						? true : false ;
	btnNext.disabled 		= (match_floor + 10 > total_matches - 1) 	? true : false ;	// $ verify this is hitting the ceiling properly


	// show prev/next buttons
	document.getElementById('btnPreviousMatches').style.display	= "block";
	document.getElementById('btnNextMatches').style.display		= "block";
	document.getElementById('vueapp').style.display 			= "block";
	document.getElementById('fetching').style.display 			= "none";	// turn this back off

	//#endregion

}


// ! Analyze Telemetry ----------------------------------------------------------->
async function GetTelemetry(_matchID) {
	console.log('GetTelemetry() -> ' + _matchID + ', ' + strPlatform + '/' + strPlayerName);

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
		alert('Error getting tree details: ' + error.message);

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
	console.log('axios_telemetry_response.data...');
	console.dir(axios_telemetry_response.data);




	// clear out the svg D3 tree if there is anything in there...
	document.getElementById('d3-svg01').innerHTML = '';
	


	// ! D3 Tree Stuff...
	try {
		// create D3 tree...
		CreateTreeFromD3();

		div_analyze.style.display 	= 'none';
		svg_d3tree01.style.display 	= 'block';

	} catch (error) {

		if (error.message == 'cycle') {
			alert('Cannot draw tree since two people killed each other and therefore destroys hierarchy. This is a bug I need to fix. I apologize.')
		}
		else {
			alert('D3 tree error: ' + error.message);
		}

		div_analyze.style.display 	= 'none';
		svg_d3tree01.style.display 	= 'none';
	}


	try {
		// once tree is generically created, update color for context and get data

		UpdateTreeContext(strPlayerName);

	} catch (error) {
		console.log('error in UpdateTreeContext() -> ' + error);
		alert('error in UpdateTreeContext()');
	}


	// $ GET ALL THIS stuff to happen inside a function. this will need to fire off on the "view" button for the searched player
	// $ and also for any clicked human player in the tree to show damage and details and also highlight teammates and killer/teammates.
	// ? the question is how do you set this up initially (vue?) so that it can work on the first search and update for later searches.
	// ? make the classes into vue variables and update vue objects (and the classes in turn) when necessary.


	//#region // ! [Console log stuff]
	//

	// $ ---------------------------------------------------------------->
	// $ cycle the response data and output the player's data
	for (i = 0; i < axios_telemetry_response.data.arrPlayersDamageLog.length; i++) {
		var record 			= axios_telemetry_response.data.arrPlayersDamageLog[i];
		var playerTeamId 	= axios_telemetry_response.data.playerTeamId;

		// (record.attacker.teamId == playerTeamId || record.victim.teamId == playerTeamId)
		if (record.attacker.name == strPlayerName || record.victim.name == strPlayerName) {
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

				// $ bug here where knocked by environment and then bleed out, shows killer as self. what is server side saying?

				if (record.byPlayer) {
					// killed by player or bot
					var _thirst 		= (record.isThirst) 		? ' *thirst*' : '';
					var _selfKill 		= (record.isSelfKill) 		? ' *self-kill*': '';
					var _teammateKill 	= (record.isTeammateKill) 	? ' *teammate-kill*': '';
					var _bleedOut 		= (record.isBleedOut) 		? ' *bleed-out*': '';
	
					line = 	record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' x ' + victimTeamId + ' ' + victimName + '] ' + 
							strBot(record.attacker.isBot) + ' x ' + strBot(record.victim.isBot) + ' ' +  record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
							record.damageReason + _thirst + _selfKill + _teammateKill + _bleedOut;
				}
				else {
					// environment kill
					line = 	record.matchTime + ' [' + attackerName + '     x ' + victimTeamId + ' ' + victimName + '] *env* x ' + strBot(record.victim.isBot) + ' ' + 
							record.damageTypeCategory + '/' +	record.damageCauserName + '/' + record.damageReason + ' bleedout?';
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
						var _bleedOut 		= (record.isBleedOut) 		? ' *bleed-out*': '';
		
						line = 	record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' x ' + victimTeamId + ' ' + victimName + '] ' + 
								strBot(record.attacker.isBot) + ' x ' + strBot(record.victim.isBot) + ' ' + record.damageTypeCategory + '/' +	record.damageCauserName + '/' + 
								record.damageReason + _thirst + _selfKill + _teammateKill + _bleedOut;
					}
					else {
						// environment kill
						line = 	record.matchTime + ' [' + attackerName + '     x ' + victimTeamId + ' ' + victimName + '] *env* x ' + strBot(record.victim.isBot) + ' ' + 
								record.damageTypeCategory + '/' +	record.damageCauserName + '/' + record.damageReason + ' bleedout?';
					}
				}
				else if (record._T == 'LogPlayerRevive') {
					// your teammate was revived

					line = record.matchTime + ' [' + attackerTeamId + ' ' + attackerName + ' ^ ' + victimTeamId + ' ' + victimName + '] *revive*';
				}

				if (line != null){
					console.log(line);
				}
		}
	}

	console.log('show winPlace and of how many teams there were');

	//#endregion

}




// ! ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] Build kill tree
//

function CreateTreeFromD3() {

	// original sample...
	// https://codesandbox.io/s/xwm4k88wp?file=/src/index.js

	const response = axios_telemetry_response.data;

	let  table = d3.csvParse(response.csvDataForD3);
	const root = d3.stratify()
				.id(function(d) { return d.name; })
				.parentId(function(d) { return d.parent; })
				(table);
	
	
	const path_width = 1200;                        // ? what is this the width of? path?
	//const root = d3.hierarchy(data);            	// https://github.com/d3/d3-hierarchy
	const dx = 14;                              	// node height? (default 10)
	const dy = path_width / (root.height + 1);      // root.height is how many descendants there are. this is where you can make the line lengths static, probably.
	//const tree = d3.tree().nodeSize([dx, dy]);
	const tree = d3.tree().nodeSize([dx, 130]); 	// static width for paths

	let custom_width  = 200 + (root.height * 130);
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

	custom_height = (Math.abs(custom_neg_height) + custom_pos_height) + 38;


	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
	const svg = d3
	.select(document.getElementById("d3-svg01"))
	.style("width",  custom_width)
	.style("height", custom_height);

	const g = svg
	.append("g")                        // svg <g> tag is a group of elements : https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g#:~:text=The%20SVG%20element%20is,with%20the%20element.
	.attr("font-family", "sans-serif")
	.attr("font-size", 12)
	.attr("transform", `translate(${dy / 3},${dx - x0})`);  // ? what are "transform" and "translate?"

	const link = g
	.append("g")
	.attr("fill", "none")
	.attr("stroke", "#8f91a1")	// #bbb
	.attr("stroke-opacity", 0.4)
	.attr("stroke-width", 1.5)
	.selectAll("path")
	.data(root.links())
	.enter()
	.append("path")
	.attr(
		"d",
		d3
		.linkHorizontal()
		.x(d => d.y)      // width of line
		.y(d => d.x)      // height of line
							// ? how can you have a static width of the line regardless of depth of descendants?
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
	.attr("fill", d => (d.children ? "#8f91a1" : "#8f91a1"))    // the dot (nodes/leaves)
	.attr("r", 2.5);

	node
	.append("text")           	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
	.attr('fill', "#dcddde")  	// added this to change text color
	.attr('class', d => {

		if (response.allHumanNames.includes(d.data.name) ) {
			// don't create id's for stuff like ""
			//return 'allPlayers';
			return 'allPlayers humanPlayers';
		}
		else if (response.allBotNames.includes(d.data.name)) {
			return 'allPlayers botPlayers';
		}
		else if (d.data.name == 'Match' || d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || d.data.name == 'Self kills' || 
		 		 d.data.name.includes('*')) {
			// if it's not a player, then it's a category. (or an untracked late spawn bot?)
			return 'categories';
		}

		// if (d.data.name == strPlayerName) {
		// 	return 'selectedPlayer';
		// }
		// else if (d.data.name == 'Match' || d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment kills' || d.data.name == 'Self kills' || 
		// 		 d.data.name.includes('*')) {
		// 	return 'categories';
		// }
		// else {

		// 	// check if player is a bot. if so, shade the name...

		// 	if (response.allHumanNames.includes(d.data.name)) {
		// 		return 'humanPlayer';
		// 	}
		// 	else {
		// 		// this is a bot
		// 		return 'botPlayer';
		// 	}
		// }
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
	.attr('cursor', 'pointer')
	.attr("dy", "0.5em") // "dy", "0.31em"
	.attr("x", d => (d.children ? 6 : 6))                    	// $ seems to be the offset for text-anchor           // "x", d => (d.children ? -6 : 6)
	.attr("text-anchor", d => (d.children ? "start" : "start")) // $ where the text is in relation to the node dot    // "text-anchor", d => (d.children ? "end" : "start")
	.text(d => d.data.name)

}

//#endregion D3 tree -----------------------



function UpdateTreeContext(selectedPlayer) {
	//console.log('clicked name: ' + name);

	// ! human and bot players should always have at least one root class "humanPlayer" or "botPlayer" and then stack and relational classes on top of them. 
	// ! probably have 2 max (root + relational)

	const response = axios_telemetry_response.data;

	let allPlayers 		= document.getElementsByClassName('allPlayers');
	//let allHumanPlayers = document.getElementsByClassName('humanPlayer');
	//let allBotPlayers 	= document.getElementsByClassName('botPlayer');


	// ? Class lists...
	// ? allPlayers -> humanPlayer/botPlayer/categories -> relationshipClass?

	// get seletected player's teamId (for determinining teammates)
	let selectedPlayerTeamId = null;
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


	

	// addd/remove classes
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList


	// cycle through all players and then give them a context class based on the selected player...
	for (let i = 0; i < allPlayers.length; i++) {
		//console.log(allPlayers[i].textContent);

		let playerClassList = allPlayers[i].classList;

		// prune all classes after the intial default two classes (allPlayers + human/bot) if they have any left over from the last selected player's context.
		for (let j = playerClassList.length - 1; j >= 0; j--) {
			//console.log('    ' + allPlayers[i].classList.value);

			if (playerClassList[j] != 'allPlayers' && playerClassList[j] != 'humanPlayers' && playerClassList[j] != 'botPlayers') {
				playerClassList.remove(playerClassList[j]);
			}
		}

		// at this point, add the relational classes...
		// ? what is the context of this player to the selected player?
		// selected player?
		// teammate?
		// killer?
		// killer teammate?
		// traded paint?

		// selected player
		if (selectedPlayer == allPlayers[i].textContent) {
			playerClassList.add('selectedPlayer');
		}
		else {
			// if not the selected player, what is allPlayers[i].textContent's teamId? is is not the selected player?

			// loop through arrTeams until you find the teamId of the selected player
			response.arrTeams.forEach(element => {
		
				// loop through all of this team's teammates. if the selected player is there, then this is a teammate. 
				element.teammates.forEach(teammate => {
		
					if (teammate.name == allPlayers[i].textContent) {
						//console.log('allPlayers[i].textContent team found: ' + teammate.name + ' -> ' + allPlayers[i].textContent);

						if (element.teamId == selectedPlayerTeamId) {
							//console.log('allPlayers[i].textContent teammate found: ' + teammate.name + ' -> ' + allPlayers[i].textContent);
							// #7dde98 green
							playerClassList.add('playerTeammate');
						}
					}
				})
			})
		}



		//debugger;

	}


	//debugger;


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