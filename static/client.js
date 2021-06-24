// PUBG Scheme Color
//https://www.schemecolor.com/pubg.php

// ? where is this automatic stuff coming from?
// const { ConvertSecondsToMinutes } = require("../hooty_modules/hf_server");
//const e = require("express");

//const hf_server = require("../hooty_modules/hf_server");

let strLine = "--------------------------------------------";

let hooty_server_url 	= 'http://localhost:3000';
//let defaultPlayer		= 'hooty__';

// --------------------------------------------------------->

// Deploy/Testing Version...
let   version 			= '0.067'
const blTestingVersion 	= false;


if (!blTestingVersion) {
	//hooty_server_url 	= 'https://hooty-pubg01.herokuapp.com';
	hooty_server_url 	= 'https://www.pubgtrees.com';
	//defaultPlayer 		= '';
	console.log('live version: ' + version);

	//let blHttpRedirected = false;
	if (location.protocol == 'http:') {
		//alert('please go to https://hooty-pubg01.herokuapp.com instead of this unsecure page.');

		// ? this seems to work but is weird. 
		
		location.replace('https://www.pubgtrees.com');		
		//blHttpRedirected = true;
	}

	// if ( blHttpRedirected) {
	// 	console.log('redirected http to https');
	// }

	console.log('you are at: ' + location.href);

	window.alert('Bug Alert: (v0.065 - 2021.06.23) The PUBG API has updated the kill/death event with a new object that has better information. I have not been able to completely adjust the backend to deal with this so the tree and reporting is a little buggy for now. I will be working on it this week. Also, matches older than 2021.06.23 can not be read by my backend code. I will see what I can do about that as well.')
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
//let blCycledKillsFound = false;

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

var axios_matches_response 		= null;	// global response for matches returned
let axios_telemetry_response 	= null;	// global response so that functions know what to do with the response objects

//let blShowDamage = false;

let chkIncoming = null;
let chkDefault 	= null;
//let chkOutgoing = null;


// will need to know the height and positive/negative heights of the tree from the 
// root so that you can position the rectangles behind the selected player.
let glTreeWidth 	= null;
let glTreeHeight 	= null;
let glTreeHeightPos = null;
let glTreeHeightNeg = null;
let glPlayerRectangle = null;

let blClickedPlayer = false; // will use this for notifying svg click that a player was looked up or not.


//#region  // ! [Region] Window load / Event Handlers
//

window.addEventListener('load', (event) => {
	//console.log('page is fully loaded');


	// use vue to turn on/off stuff with blTestingVersion
	vueSearchDiv.blTestingVersion = blTestingVersion;


	// load default player from local storage
	let defaultPlayer 	= localStorage.getItem('defaultPlayer');
	let defaultPlatform = localStorage.getItem('defaultPlatform');

	if (defaultPlayer != null) {
		document.getElementById('inputPlayerName').value = defaultPlayer;
		document.getElementById('slcPlatform').value = defaultPlatform;
	}




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


	// tree hint modal close
	document.getElementById('btnCloseTreeHintModal').addEventListener('click', (event) => {
		HideTreeHintModal();
	})

	document.getElementById('btnCloseTreeHintModal2').addEventListener('click', (event) => {
		HideTreeHintModal();
	})


	document.getElementById('div-modal').addEventListener('click', (event) => {
		// ! this is already happening below with a window click event that catched "outside modal" clicks
		// ! might take this out later but just want to close the whole thing quickly right now.

		//HideModal();
	})



	// clear name context and selected player if you click blank area
	document.getElementById('div-d3-tree').addEventListener('click', (event) => {

		//console.log('start: div-d3-tree.click() -> ' + blClickedPlayer);
	
		if (blClickedPlayer) {
			blClickedPlayer = false;	// turn this back off so that it is only set to true when a player is clicked.
		}
		else {
			// if a player was not clicked, then clear context colors 
			ClearTreeContext();
		}

	})



	// "set as default" checkbox
	chkDefault = document.getElementById('checkbox-setDefault');
	chkDefault.addEventListener('change', (event) => {
		if (chkDefault.checked) {
			document.getElementById('lblDefault').textContent = 'Set as default player (now click Search)';
		}
		else {
			document.getElementById('lblDefault').textContent = 'Set as default player';
		}
	})



	// ! filter for damage type -------------------------------->
	chkIncoming = document.getElementById('checkbox-incoming');

	// console.log("localStorage.defaultPlayer: " + localStorage.defaultPlayer);
	// console.log("localStorage.defaultPlatform: " + localStorage.defaultPlatform);
	// console.log("localStorage.chkIncomingChecked: " + localStorage.chkIncomingChecked);

	if (localStorage.getItem('chkIncomingChecked') != null) {		

		if (localStorage.getItem('chkIncomingChecked') == 'true') {
			chkIncoming.checked = true;
		}
		else {
			chkIncoming.checked = false;
		}
	}

	chkIncoming.addEventListener('change', (event) => {
		// update local storage

		localStorage.setItem('chkIncomingChecked', chkIncoming.checked);
		
		RunPlayerDamageReport(glSelectedPlayer);
	});



	// ! filter for teamId columns --------------------------->
	chkTeamId = document.getElementById('checkbox-teamId');

	if (localStorage.getItem('chkTeamId') != null) {
		if (localStorage.getItem('chkTeamId') == 'true') {
			chkTeamId.checked = true;
		}
		else {
			chkTeamId.checked = false;
		}

		vuePlayerReport.isHideTeamId = !chkTeamId.checked;
	}

	chkTeamId.addEventListener('change', (event) => {
		// update local storage

		localStorage.setItem('chkTeamId', chkTeamId.checked);

		vuePlayerReport.isHideTeamId = !chkTeamId.checked;

		RunPlayerDamageReport(glSelectedPlayer);
	})



	// ! filter for teammate deaths --------------------------->
	chkShowTeamDeaths = document.getElementById('checkbox-teamDeaths');

	if (localStorage.getItem('chkShowTeamDeaths') != null) {
		if (localStorage.getItem('chkShowTeamDeaths') == 'true') {
			chkShowTeamDeaths.checked = true;
		}
		else {
			chkShowTeamDeaths.checked = false;
		}

		vuePlayerReport.blShowTeamDeaths = chkShowTeamDeaths.checked;
	}

	chkShowTeamDeaths.addEventListener('change', (event) => {

		localStorage.setItem('chkShowTeamDeaths', chkShowTeamDeaths.checked);

		vuePlayerReport.blShowTeamDeaths = chkShowTeamDeaths.checked;

		RunPlayerDamageReport(glSelectedPlayer);
	})




	// ! "show damage" button
	document.getElementById('btnShowDamage').addEventListener('click', (event) => {

		//console.log(glSelectedPlayer);
		
		// show or hid the "Show incoming damage" checkbox
		if (vuePlayerReport.isHidden) {
			// if currently hiding columns, 
			document.getElementById('btnShowDamage').textContent = 'Hide details';
			
			chkIncoming.style.display = 'inline';
			lblIncoming.style.display = 'inline';


			chkTeamId.style.display = 'inline';
			document.getElementById('lblTeamId').style.display = 'inline';
			// vuePlayerReport.isHideTeamId should be whatever is in the local storage
			if (localStorage.getItem('chkTeamId') != null) {
				if (localStorage.getItem('chkTeamId') == 'true') {
					vuePlayerReport.isHideTeamId = false;
				}
				else {
					vuePlayerReport.isHideTeamId = true;
				}
			}


			chkShowTeamDeaths.style.display = 'inline';
			document.getElementById('lblTeamDeaths').style.display = 'inline';

			localStorage.setItem('isHidden', 'false');
			vuePlayerReport.isHidden = false;
		}
		else {
			document.getElementById('btnShowDamage').textContent = 'Show details';
			chkIncoming.style.display = 'none';
			lblIncoming.style.display = 'none';

			chkTeamId.style.display = 'none';
			document.getElementById('lblTeamId').style.display = 'none';
			vuePlayerReport.isHideTeamId = true;

			chkShowTeamDeaths.style.display = 'none';
			document.getElementById('lblTeamDeaths').style.display = 'none';

			localStorage.setItem('isHidden', 'true');
			vuePlayerReport.isHidden = true;	
		}



		// re-draw the report
		RunPlayerDamageReport(glSelectedPlayer);
	});


	// ! on load, set up report based on hidden or not
	if (localStorage.getItem('isHidden') != null) {

		if (localStorage.getItem('isHidden') == 'true') {
			document.getElementById('btnShowDamage').textContent = 'Show details';

			chkIncoming.style.display = 'none';
			lblIncoming.style.display = 'none';

			chkTeamId.style.display = 'none'
			document.getElementById('lblTeamId').style.display = 'none';

			chkShowTeamDeaths.style.display = 'none';
			document.getElementById('lblTeamDeaths').style.display = 'none';


			vuePlayerReport.isHidden = true;
		}
		else {
			document.getElementById('btnShowDamage').textContent = 'Hide details';

			chkIncoming.style.display = 'inline';
			lblIncoming.style.display = 'inline';

			chkTeamId.style.display = 'inline'
			document.getElementById('lblTeamId').style.display = 'inline';

			chkShowTeamDeaths.style.display = 'inline';
			document.getElementById('lblTeamDeaths').style.display = 'inline';


			vuePlayerReport.isHidden = false;
		}
	}


	// need to store the rectangle object so that it can be deleted and re-created if a new match is selected (sloppy but works, will figure out something later)
	glPlayerRectangle = document.getElementById('selectedPlayerRectangle');



	// check if this is going to launch a tree from url parameters...
	checkURLQuery();

});	// window load


// if hitting escape, close the modal window
window.addEventListener('keydown', (event) => {
	if (event.key == 'Escape') {
		if (document.getElementById('div-modal').style.display != 'none') {
			HideModal();
		}

		if (document.getElementById('div-treehint-modal').style.display != 'none') {
			HideTreeHintModal();
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

	if (event.target.id == 'div-treehint-modal') {
		//console.log('modal clicked');
		HideTreeHintModal();
	}

})

//#endregion -- Event Handlers



function ShowModal() {
	document.getElementById('div-modal').style.display = 'block';
	document.getElementById('div-modal').scrollIntoView({behavior: "smooth"});	
}

function HideModal() {
	document.getElementById('div-modal').style.display = 'none';
	vuePlayerReport.clearPlayerReport();
}



// ------------------------------------------------------------------>
function checkURLQuery() {
	// if there are search parameters, parse them and search the match
	// ! ?steam&hooty__&51beee36-6df7-4903-8d16-f21a97141340

	//console.log('location.href:   ' + location.href);
	//console.log('location.search: ' + location.search);

	// ----------------------------------------------------------------------------------------
	const tmpURL = new URL(location);		// https://dmitripavlutin.com/parse-url-javascript/
	// console.log('tmpURL.search: ' + tmpURL.search);
	// console.log('type:     ' + tmpURL.searchParams.get('type'));
	// console.log('matchid:  ' + tmpURL.searchParams.get('matchid'));
	// console.log('player:   ' + tmpURL.searchParams.get('player'));
	// console.log('platform: ' + tmpURL.searchParams.get('platform'));

	let paramType 		= tmpURL.searchParams.get('type')
	let paramMatchId 	= tmpURL.searchParams.get('matchid')
	let paramPlayer		= tmpURL.searchParams.get('player')
	let paramPlatform 	= tmpURL.searchParams.get('platform')

	// ? do some correction for a corrupted search param string?

	if (tmpURL.search != '') {

		// if (paramType == null || paramMatchId == null || paramPlayer == null || paramPlatform == null) {
		if (paramType == null || paramPlayer == null || paramPlatform == null) {
			alert('The link has invalid search parameters. See console log.');
			console.log('URL search parameter error: Check that all 4 parameters are present and spelled correctly: type, matchid, player, and platform.');

			history.replaceState('','','/');	// update browser's url so it isn't all this garbage up there

			return;
		}

		document.getElementById('inputPlayerName').value 	= paramPlayer;
		document.getElementById('slcPlatform').value 		= paramPlatform;

		strPlayerName 	= paramPlayer;
		strPlatform 	= paramPlatform;

		if (paramType == 'player') {

			// $ this will only need to be done if there is a "copy player url"

			console.log('url query: ' + tmpURL.search)

			// get player and matches
			btnSearchPlayer_Click();

			// https://stackoverflow.com/questions/3338642/updating-address-bar-with-new-url-without-hash-or-reloading-the-page
			//history.replaceState('','','/');	// update browser's url so it isn't all this garbage up there
			history.pushState('','',location);	// https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
		}
		else if (paramType == 'match') {

			console.log('url query: ' + tmpURL.search)

			// search for specific match telemetry
			GetTelemetry(paramMatchId);	

			//history.replaceState('','','/');	// update browser's url so it isn't all this garbage up there
			history.pushState('','',location);
		}
	}
	else {
		//console.log('no search query');
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

			//let clip = hooty_server_url + '/?' + glMatchId + '&' + strPlayerName + '&' + strPlatform;
			let clip = hooty_server_url + '/?type=match&matchid=' + glMatchId + '&player=' + strPlayerName + '&platform=' + strPlatform;
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


function SearchNewPlayer(player) {

	// $ ------------------------------------
	// $ THIS DOESN'T APPEAR TO BE IN USE....
	// $ ------------------------------------

	// console.log('selectedPlayer: ' + player);
	// console.log('platform: ' + strPlatform);

	// create search query string and then open window in new tab

	let tmpURL = hooty_server_url + '/?type=player&matchid=null&player=' + player + '&platform=' + strPlatform;

	window.open(tmpURL, '_blank');

	// document.getElementById('slcPlatform').value = strPlatform;
	// document.getElementById("inputPlayerName").value = player;

	// btnSearchPlayer_Click();
}




// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] GetPlayerMatches()
//

async function GetPlayerMatches() {

	let blCeilingHit 	= false;
	let blFloorHit 		= false;

	// clear out the current d3 tree
	//document.getElementById('d3-svg01').innerHTML = '';


	if (chkDefault.checked) {
		if (strPlayerName.length > 0) {
			localStorage.setItem('defaultPlayer', strPlayerName);
			localStorage.setItem('defaultPlatform', strPlatform);
		}

		chkDefault.checked = false;

		document.getElementById('lblDefault').textContent = 'Set as default player';
	}


	if (strPlatform != prevPlatform || strPlayerName != prevPlayerName) {
		// reset match_floor if a new player or platform is selected...

		if (blTestingVersion) {
			console.log('resetting match_floor for new player');
		}

		match_floors = [0];
		match_floors_index = 0;
	}

	// for detecting if the searched user changes
	prevPlatform 	= strPlatform;
	prevPlayerName 	= strPlayerName;


	//console.log('client requesting: ' + hooty_server_url);
	console.log('requesting player: ' + strPlatform + '/' + strPlayerName);

	const btnSearch 	= document.getElementById('btnSearchPlayer');
	const btnPrevious 	= document.getElementById('btnPreviousMatches');
	const btnNext 		= document.getElementById('btnNextMatches');

	btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = true;

	// $ change cursor to "wait"
	document.body.style.cursor = 'wait';
	document.getElementById('fetching').style.display 	= "block";	// turn this on
	document.getElementById('vueapp').style.display 	= "none";

	// hide these if a new player is looked up
	document.getElementById('div-analyzing').style.display 	= 'none';
	document.getElementById('d3-tree01').style.display 		= 'none';
	document.getElementById('vue-obituaries').style.display = 'none';



	//var axios_response = null;

	if (blTestingVersion) {
		//console.log('req match_floor: ' + match_floor + ' of ' + total_matches);
		console.log('match_floors[' + match_floors_index + ']: ' + match_floors[match_floors_index]);
	}


	try {
		axios_matches_response = await axios.get(hooty_server_url + '/getplayermatches', {
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

		document.body.style.cursor = 'default';
		document.getElementById('fetching').style.display 		= "none";
		// document.getElementById('vueapp').style.display 		= "none";
		// document.getElementById('div-analyzing').style.display 	= 'none';
		// document.getElementById('d3-tree01').style.display 		= 'none';
	
		return;
	}


	// ! check for any errors from the pubg api response...
	if (axios_matches_response.data.pubgResponse.status != 200 && axios_matches_response.data.pubgResponse.status != null) {

		if (axios_matches_response.data.pubgResponse.status == 429) {
			console.log('ERROR: pubg api rate limit hit: ' + axios_matches_response.data.pubgResponse.status + ', ' + axios_matches_response.data.pubgResponse.statusText);
			console.log(axios_matches_response.data.pubgResponse);
	
			alert('Rate limited exceeded. Please try again in 60 seconds.');
		}
		else {
			console.log('ERROR: could not find player in pubg api. Check spelling and uppercase/lowercase. It must match their in game name exactly. ' + axios_matches_response.data.status + ', ' + axios_matches_response.data.statusText);
			console.log(axios_matches_response.data.pubgResponse);
	
			alert('Could not find player in pubg api. Check spelling and uppercase/lowercase. It must match their in game name exactly.');
		}

		btnSearch.disabled = btnPrevious.disabled = btnNext.disabled = false;
		document.body.style.cursor = 'default';
		document.getElementById('fetching').style.display = "none";	// turn this on
	
		return;
	}
		
	if (blTestingVersion) {
		console.log('bypassCache: ' + bypassCache);
		console.log('matches_response.data...');
		console.dir(axios_matches_response.data);
		console.log('current match_floor: ' + match_floors[match_floors_index] + ' of ' + axios_matches_response.data.totalMatches + ', new ceiling: ' + axios_matches_response.data.match_ceiling);
		console.log('total matches: ' + axios_matches_response.data.totalMatches);
	}

	console.log('hootyserver getMatches response -> ' + axios_matches_response.data.pubgResponse.hootyserver);


	//#region // ! button stuff...
	//

	// add the match ceiling if the current index doesn't exist
	if (match_floors.length == match_floors_index + 1) {
		// this is basically only going to happen when you click next and an index doesn't exist
		match_floors.push(axios_matches_response.data.match_ceiling);
	}

	// be aware that you are at the beginning or end of the match list (for button enabling)
	if (axios_matches_response.data.match_ceiling < axios_matches_response.data.totalMatches) {
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
	for (i = 0; i < axios_matches_response.data.matches.length; i++) {
		if (axios_matches_response.data.matches[i].DBNOs 		== 0) { axios_matches_response.data.matches[i].DBNOs 		= '-'; }
		if (axios_matches_response.data.matches[i].kills 		== 0) { axios_matches_response.data.matches[i].kills 		= '-'; }
		if (axios_matches_response.data.matches[i].damageDealt 	== 0) { axios_matches_response.data.matches[i].damageDealt 	= '-'; }
	}



	vm.getMatchData(axios_matches_response.data.matches);



	// show prev/next buttons
	document.getElementById('btnPreviousMatches').style.display	= "block";
	document.getElementById('btnNextMatches').style.display		= "block";
	document.getElementById('vueapp').style.display 			= "block";
	document.getElementById('fetching').style.display 			= "none";	// turn this back off
	document.body.style.cursor = 'default';


	// if the player has no matches, then don't display the divs
	if (axios_matches_response.data.totalMatches == 0) {
		alert('The player was found but they have no recent matches.');

		document.getElementById('vueapp').style.display = 'none';
		document.getElementById('d3-tree01').style.display = 'none';
		document.getElementById('vue-obituaries').style.display = 'none';

	}


}

//#endregion



// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] GetTelemetry() ----------------------------------------------------------->
//

async function GetTelemetry(_matchID) {
	
	console.log('Match diag -> platform: ' + strPlatform + ', matchId: ' + _matchID + ', player: \'' + strPlayerName + '\'');

	glMatchId = _matchID;	// store for url clipboard

	axios_telemetry_response = null;

	//const div_analyze 	= document.getElementById('div-analyzing');
	//const svg_d3tree01	= document.getElementById('d3-tree01');

	document.body.style.cursor= 'wait';
	document.getElementById('div-analyzing').style.display 	= 'block';
	document.getElementById('d3-tree01').style.display 		= 'none';
	document.getElementById('vue-obituaries').style.display = 'none';


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

		document.body.style.cursor= 'default';
		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'none';
		document.getElementById('vue-obituaries').style.display = 'none';


		return;
	}

	//console.log('hootyserver.response:                     ' + axios_telemetry_response.status + ', ' + axios_telemetry_response.statusText);
	//console.log('pubgApiMatchResponseInfo.hootyserver:     ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.hootyserver);
	//console.log('pubgApiMatchResponseInfo.status:          ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.status);
	//console.log('pubgApiMatchResponseInfo.statusText:      ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.statusText);
	//console.log('pubgApiTelemetryResponseInfo.hootyserver -> ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.hootyserver);
	//console.log('pubgApiTelemetryResponseInfo.status:      ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.status);
	//console.log('pubgApiTelemetryResponseInfo.statusText:  ' + axios_telemetry_response.data.pubgApiTelemetryResponseInfo.statusText);


	// if the match doesn't exist, don't continue
	if (axios_telemetry_response.data.pubgApiMatchResponseInfo.status != null && axios_telemetry_response.data.pubgApiMatchResponseInfo.status != 200) {
		
		alert('This match no longer exists.');

		document.body.style.cursor= 'default';
		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'none';
		document.getElementById('vue-obituaries').style.display = 'none';


		//console.log('Match not found');
		return;
	}


	// if (axios_telemetry_response.data.matchDetails.mapName == "Haven") {
	// 	alert('PUBG HAVEN UPDATE: With the new seasonal map, Haven, there are AI Commanders and Guards that break the rendering of the kill tree. For now, there will not be a tree drawn for Haven games.');

	// 	document.body.style.cursor = 'default';
	// 	document.getElementById('div-analyzing').style.display 	= 'none';
	// 	document.getElementById('d3-tree01').style.display 		= 'none';

	// 	return;
	// }


	// if direct link to match, this will break because there is no (axios matches). so circumventing this error...
	if (axios_matches_response == null) {
		vueMatchInfo.updateTreeMatchDetails(axios_telemetry_response.data.matchDetails, null);
	}
	else {
		vueMatchInfo.updateTreeMatchDetails(axios_telemetry_response.data.matchDetails, axios_matches_response.data.matches);
	}


	if (axios_telemetry_response.data.pubgApiMatchResponseInfo.status != 200 && axios_telemetry_response.data.pubgApiMatchResponseInfo.status != null) {
		alert('Error getting match from pubg api. ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.status + ': ' + axios_telemetry_response.data.pubgApiMatchResponseInfo.statusText);

		// turn these off if there is an error.
		document.body.style.cursor= 'default';
		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'none';
		document.getElementById('vue-obituaries').style.display = 'none';

		
		return;
	}

	if (blTestingVersion) {
		console.log('telemetry_response.data...');
		console.dir(axios_telemetry_response.data);
	}



	// ! D3 Tree Stuff...
	try {
		// clear out the svg D3 tree if there is anything in there...
		document.getElementById('d3-svg01').innerHTML = '';

		// create D3 tree...
		CreateTreeFromD3();
		SetRectangleLocation(strPlayerName);	// on the initial drawing of the table, set the rectangle to highlight the searched player

		//document.getElementById('div-cycle-footnote').style.display = (blCycledKillsFound) ? 'block' : 'none';


		// document.body.style.cursor	= 'default';
		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'block';

	} catch (error) {

		if (error.message == 'cycle') {
			alert('There is an error creating the tree structure for this match because of \'circular kills.\''  + 
				'\n\nI can currently detect if player A kills B and B also kills player A which creates a loop and breaks the tree hierarchy structure but ' + 
					'I have not accounted for cases where player A kills B who kills C and then player C kills A or any other larger loops. These are pretty ' + 
					'rare but I will need to sit down and get it cleaned up. For now, I cannot draw the match tree and I apologize.');
		}
		else {
			alert('D3 tree error: ' + error.message);
		}

		// turn these off if there is an error.
		document.body.style.cursor = 'default';
		document.getElementById('div-analyzing').style.display 	= 'none';
		document.getElementById('d3-tree01').style.display 		= 'none';
		//document.getElementById('vue-obituaries').style.display = 'block';

		return;
	}



	// ! Update text class colors
	try {
		// once tree is generically created, update color for context and get data

		if (strPlayerName != '') {
			// need to remember who the looked up player is so that they will stay 'hightlighted'

			document.getElementById(strPlayerName).classList.add('searchedPlayer');
		}

		
		// ! Obituary rows
		// 0.059 - Show deaths in order with their timestamp and deathtype?
		// probably need a vue for loop to add a new span which has it's own id and class and can be contextally colored to the clicked name?
		vueObituaries.updateObituaries(axios_telemetry_response.data.arrKillLog, axios_telemetry_response.data.arrPlayerCards, axios_telemetry_response.data.arrSurvivors);
		document.getElementById('vue-obituaries').style.display = 'block';


		// don't update tree context on the first look
		//UpdateTreeContext(strPlayerName);
		//ClearTreeContext();	// draw colors
		// ! removing ClearTreeContext() here because vueObituaries.updateObituaries() calls it anyway.


		document.body.style.cursor = 'default';
		document.getElementById('d3-tree01').scrollIntoView({behavior: "smooth"});

	} catch (error) {
		console.log('error in ClearTreeContext() for player ' + strPlayerName + ' -> ' + error);
		alert('An error occurred while updating player colors. The player you searched for has possibly changed their name after this game was played.');

		document.body.style.cursor = 'default';

		return;
	}





}

//#endregion - Analyze telemetry



// ------------------------------------------------------------------------------------------------------>
//#region // ! [Region] Modal player report
//

function RunPlayerDamageReport(selectedPlayer) {

	//console.log('RunPlayerDamageReport(' + selectedPlayer + ')');

	glSelectedPlayer = selectedPlayer;

	// get teamId of selected player
	let playerTeam = 0;
	axios_telemetry_response.data.arrTeams.forEach(team => {
		//console.log(team);
		team.teammates.forEach(teammate => {
			if (teammate.name == selectedPlayer) {
				playerTeam = team;
			}
		})
	})


	// get player's killer if they have one...
	let tmpKiller = '';
	axios_telemetry_response.data.arrKillLog.forEach(element => {
		if (element.victim == selectedPlayer) {
			//console.log(element);
			tmpKiller = element.killer;

			return;
		}
	})

	// get killer's teamId
	let killerTeam = 0;
	if (tmpKiller != '') {

		axios_telemetry_response.data.arrTeams.forEach(team => {
			team.teammates.forEach(teammate => {
				if (teammate.name == tmpKiller) {
					killerTeam = team;

					return;
				}
			})

			if (killerTeam != 0) {
				return;
			}
		});
	}


	// vuePlayerReport.updatePlayerReport(selectedPlayer, tmpKiller, playerTeam, killerTeam,
	// 									axios_telemetry_response.data.arrPlayerCards, 
	// 									axios_telemetry_response.data.arrPlayersDamageLog,
	// 									axios_telemetry_response.data.allBotNames,
	// 									axios_telemetry_response.data.allHumanNames);

	vuePlayerReport.updatePlayerReport(selectedPlayer, tmpKiller, playerTeam, killerTeam);

											
	// don't show player report table if they did no damage at all and the report is empty (rare)
	if (vuePlayerReport.arrPlayerReport.length > 0) {
		document.getElementById('reportTable').style.display 		= 'table';
		document.getElementById('alt-reportTable').style.display 	= 'none';
	}
	else{
		document.getElementById('reportTable').style.display 		= 'none';
		document.getElementById('alt-reportTable').style.display 	= 'block';
	}

	

	ShowModal();
}

//#endregion 



// ! ------------------------------------------------------------------------------------------------------>
// $ DEPRECATED
//#region // ! [Region] Damage console logging
//

function PrintReportForSelectedPlayer(selectedPlayer) {

	return; 

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


	//blCycledKillsFound = false;

	const response = axios_telemetry_response.data;

	let table = d3.csvParse(response.csvDataForD3);
	const root = d3.stratify()
				.id(function(d) { return d.name; })
				.parentId(function(d) { return d.parent; })
				(table);
	
	const path_width = 1200;                        // what is this the width of? path?
	//const root = d3.hierarchy(data);            	// https://github.com/d3/d3-hierarchy
	const dx = 14;                              	// node height (default 10)
	const dy = 140;									// path/link/line width
	//const dy = path_width / (root.height + 1);      // root.height is how many descendants there are. this is where you can make the line lengths static, probably.
	//const tree = d3.tree().nodeSize([dx, dy]);
	const tree = d3.tree().nodeSize([dx, dy]); 	// static width for paths

	glTreeWidth 	= 160 + (root.height * dy);
	glTreeHeight  	= 0;
	glTreeHeightNeg = 0;
	glTreeHeightPos = 0;

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
			if (d.x < glTreeHeightNeg) {
				glTreeHeightNeg = d.x;
				//console.log('new neg: ' + d.id + ': ' + d.x);
			}
		}
		else {
			// keep up with the hightest positive value...
			if (d.x > glTreeHeightPos) {
				glTreeHeightPos = d.x;
				//console.log('new pos: ' + d.id + ': ' + d.x);
			}
		}
	});

	glTreeHeight = (Math.abs(glTreeHeightNeg) + glTreeHeightPos) + 40;


	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
	const svg = d3
	.select(document.getElementById("d3-svg01"))
	.style("width",  glTreeWidth)
	.style("height", glTreeHeight)
	.style('background-color', '#414144');

	const g = svg
	.append("g")                        // svg <g> tag is a group of elements : https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g#:~:text=The%20SVG%20element%20is,with%20the%20element.
	.attr("id", 'g-child')				// adding so that you can easily grab this child before inserting a rectangle
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
	)
	.attr('id', d => {
		return 'path-' + d.source.id + '-' + d.target.id;
	})
	.attr('class', d => {

		if (d.source.id == 'Match')
		{
			return 'd3-path pathHidden';
		}
		else {
			return 'd3-path pathDefault';
		}
	});
	

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
		//return (d.id == 'Match') ? "#414144" : "#8f91a1";	// background-color : line color
	})
	.attr("r", 2.5)
	.attr('id', d => {
		return 'circle-' + d.data.name;
	})
	.attr('class', 'd3-circle');

	node
	.append("text")           	// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
	.attr('fill', "#dcddde")  	// added this to change text color
	.attr('class', d => {
		let winnerClass = '';

		if (response.allHumanNames.includes(d.data.name) ) {
			// don't create id's for stuff like ""
			//return 'allPlayers';

			// if d.data.name is on the winning team, give them winner class
			//let winningTeamId = null;

			// response.arrSurvivors.forEach(element => {
			// 	if (element.name == d.data.name) {
			// 		winningTeamId = element.teamId;		
			// 		winnerClass = ' winner';
			// 	}
			// })


			response.arrPlayerCards.forEach(player => {
				if (player.name == d.data.name) {
					if (player.winPlace == 1) {
						winnerClass = ' winner';
					}
				}
			})

			// response.arrTeams.forEach(team => {
			// 	if (team.teamId == winningTeamId) {
			// 		team.teammates.forEach(teammate => {
			// 			if (teammate.name == d.data.name) {
			// 				winnerClass = ' winner';
			// 			}
			// 		})
			// 	}
			// })

			// if (d.data.name == 'fjh2331762810') {
			// 	console.log('humanPlayers: ' + d.data.name);
			// }

			return 'allPlayers humanPlayers' + winnerClass;
		}
		else if (response.allBotNames.includes(d.data.name)) {

			response.arrSurvivors.forEach(element => {
				if (element.name == d.data.name) {
					winnerClass = ' winner';
				}
			})

			// ! haven correction
			if (d.data.name.includes('.npc')) {
				winnerClass = '';
			}
			
			return 'allPlayers botPlayers' + winnerClass;
		}
		else if (d.data.name == 'Winner' || d.data.name == 'Winners') {
			// want to draw the winner category in winner's color so that the branch is somewhat separated from the rest.
			return 'categories winner'
		}
		else if (d.data.name == 'Match' || d.data.name == 'Environment' || 
				 d.data.name == 'Self kills' || d.data.name == 'Circular kills' || d.data.name == 'Haven') {
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
		if (response.allHumanNames.includes(d.data.name)) {
			// don't create id's for stuff like ""

			//  || response.allBotNames.includes(d.data.name)

			return 'UpdateTreeContext(\'' + d.data.name + '\', true)';
		}
	})
	.attr('cursor', d => {
		if (d.data.name == 'Match' || d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment' || 
			d.data.name == 'Self kills' || d.data.name == 'Circular kills' || d.data.name == 'Haven' || d.data.name.includes('<') || d.data.name.includes('(') || 
			!response.allHumanNames.includes(d.data.name)) {
			// if it's not a player, then it's a category or a bot. (or an untracked late spawn bot?)
			return 'normal';
		}
		else {
			return 'pointer';
		}
	})
	.attr("dy", "0.36em") // "0.5em" // "dy", "0.31em"
	//.attr("x", d => (d.children ? 6 : 6))                    	// seems to be the offset for text-anchor           // "x", d => (d.children ? -6 : 6)
	//.attr("text-anchor", d => (d.children ? "start" : "start")) // where the text is in relation to the node dot    // "text-anchor", d => (d.children ? "end" : "start")
	//.text(d => d.data.name)
	.attr("x", d => {
		// if category, offset anchor to the left
		return (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment' || d.data.name == 'Self kills' || d.data.name == 'Circular kills' || d.data.name == 'Haven') ? -6 : 6;
	}) 
	.attr("text-anchor", d => {
		// if category, offset anchor to the left
		return (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment' || d.data.name == 'Self kills' || d.data.name == 'Circular kills' || d.data.name == 'Haven') ? "end" : "start";
	}) 
	.text(d => {
		// add '<>' to the category names
		if (d.data.name == 'Match') {
			return '';
		}
		else if (d.data.name == 'Winner' || d.data.name == 'Winners' || d.data.name == 'Environment' || d.data.name == 'Self kills' || d.data.name == 'Circular kills' || d.data.name == 'Haven') {
			
			// if (d.data.name == 'Circular kills') {
			// 	// need to know if the footnote should be displayed.
			// 	blCycledKillsFound = true;
			// }

			return '<' + d.data.name + '>';
		}
		else if (!response.allHumanNames.includes(d.data.name) && !d.data.name.includes('<') && !d.data.name.includes('(')) {
			// this is a bot

			// ! haven corrections
			if (d.data.name.includes('.npc')) {
				return d.data.name;
			}

			if (d.data.name.length > 10) {
				return 'bot.' + d.data.name.substring(0, 10) + '~';
			}
			else {
				return 'bot.' + d.data.name;
			}
		}
		else {
			return d.data.name;
		}
	})
	.select(function() {
		return this.parentNode.insertBefore(this.cloneNode(true), this);
	  })
	  .attr("stroke", "#414144")	// do the dark background color so that the text will "float" on top of the lines by obscuring them somewhat
	  .attr("stroke-linejoin", "round")
	  .attr("stroke-width", 3)
	  .attr("id", 'fake-invalid-id')	// $ this probably needs to be handled better since it creates duplicate IDs, even though they won't likely be used.
	  .attr('onclick', 'javacript.void(0);');
}

//
//#endregion D3 tree -----------------------



function ClearTreeContext() {

	//console.log('ClearTreeContext()');

	glSelectedPlayer 	= '';  // clear the selected player
	prevSelectedPlayer 	= '';

	let allPlayers = document.getElementsByClassName('allPlayers');

	let allCircles = document.getElementsByClassName('d3-circle');
	let allPaths = document.getElementsByClassName('d3-path');


	//#region // ! [Region] allPlayers
	//

	// cycle through all players and then give them a context class based on the selected player...
	for (let i = 0; i < allPlayers.length; i++) {

		if (allPlayers[i].id == 'fake-invalid-id') {
			continue;	// skip the duplicate names for name "stroke"
		}

		let playerClassList = allPlayers[i].classList;
		let circleClassList = document.getElementById('circle-' + allPlayers[i].id).classList;

		// add/remove classes
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList


		// add "winner" class back if player is #1
		axios_telemetry_response.data.arrPlayerCards.forEach(element => {
			if (element.name == allPlayers[i].textContent) {
				if (element.winPlace == 1) {
					playerClassList.add('winner');
					circleClassList.add('winner');
					//document.getElementById('circle-' + element.name).classList.add('winner');


					// ! haven correction
					if (element.name.includes('.npc')) {
						playerClassList.remove('winner');
						circleClassList.remove('winner');
					}
				}

				if (element.name == strPlayerName) {
					playerClassList.add('searchedPlayer');
					circleClassList.add('searchedPlayer');
					//document.getElementById('circle-' + element.name).classList.add('searchedPlayer');
				}
			}
		})


		// prune all classes after the intial default classes that should not be removed (allPlayers, human/bot, 
		// searched) if they have any left over from the last selected player's context.
		for (let j = playerClassList.length - 1; j >= 0; j--) {
			//console.log('    ' + allPlayers[i].classList.value);

			if (playerClassList[j] != 'allPlayers' 		&& 
				playerClassList[j] != 'humanPlayers' 	&& 
				playerClassList[j] != 'botPlayers' 		&& 
				playerClassList[j] != 'searchedPlayer' 	&&
				playerClassList[j] != 'winner') {
				playerClassList.remove(playerClassList[j]);
			}
		}

		// prune circles...
		for (let j = circleClassList.length - 1; j >= 0; j--) {
			//console.log('    ' + allPlayers[i].classList.value);


			if (circleClassList[j] != 'd3-circle'		&& 
				circleClassList[j] != 'allPlayers' 		&& 
				circleClassList[j] != 'humanPlayers' 	&& 
				circleClassList[j] != 'botPlayers' 		&& 
				circleClassList[j] != 'searchedPlayer' 	&&
				circleClassList[j] != 'winner'  		  ) {
				
				circleClassList.remove(circleClassList[j]);

			}
		}

	}

	//#endregion -- allPlayers



	//#region // ! [Region] allCircles
	//

	for (let i = 0; i < allCircles.length; i++) {
		// need to color all circle dots the same ass their associated player color

		// strip off "circle-" to see the name associated
		let who = allCircles[i].id.substring(7, allCircles[i].id.length);

		//console.log('   circle: ' + who);
		//console.log('-> ' + allCircles[i].id);

		// 0.058 update: if there was a player with the string 'Match' in their name, then the match category would get a humanPlayers class.
		// check previous versions if something else breaks and the expected behavior isn't happening.
		if (allCircles[i] == 'circle-Winners' || allCircles[i] == 'circle-Winner' || allCircles[i] == 'circle-Self kills' || 
				allCircles[i] == 'circle-Environment' || allCircles[i] == 'circle-Circular kills' ||
				 who.includes('<')) {
			allCircles[i].classList.add('categories');
		}
		else if (allCircles[i].id == 'circle-Match') {
			allCircles[i].classList.add('transparent');
		}
		else if (axios_telemetry_response.data.allHumanNames.includes(who)) {
			allCircles[i].classList.add('humanPlayers');
		}
		else {
			// anything else should be a bot?
			allCircles[i].classList.add('botPlayers');
		}
	}

	//#endregion -- allCircles


	// clear out path/line colors except for defaults
	PrunePathClasses(document.getElementsByClassName('d3-path'));


	// move the rectangle out of sight
	//document.getElementById('selectedPlayerRectangle').setAttribute('x', -200);
	SetRectangleLocation(strPlayerName);



	// ! obituary rows 
	// update the table row classes
	let obitRows = document.getElementsByClassName('obituaryRow');

	for (i = 0; i < obitRows.length; i++) {

		//remove 'obituarySelected' by default, then add if this is the selected user
		obitRows[i].classList.remove('obituarySelected');

		if (obitRows[i].id == 'obit-' + strPlayerName) {
			// if this is the obit row for the selected player, add obitSelected
			obitRows[i].classList.add('obituarySelected');
		}

		//console.log(obitRows[i].id);
	}


	// clear the table data colors too
	let obitSelected = document.getElementsByClassName('obit-name');

	for (i = 0; i < obitSelected.length; i++) {

		// remove all classes but the default 'obit-name'
		for (j = 0; j < obitSelected[i].classList.length; j++) {
			//console.log(obitSelected[i].classList[j]);

			// $ i'm drunk so i'm not 100% sure this works but the dom is behaving the way i want so i'm just going to wrap this up and make some assumptions here.
			if (obitSelected[i].classList[j] != 'obit-name') {
				obitSelected[i].classList.remove(obitSelected[i].classList[j]);
			}
		}

		if (obitSelected[i].innerText == strPlayerName) {
			obitSelected[i].classList.add('selectedPlayer');
		}
	}
}




function UpdateTreeContext(selectedPlayer, _playerClicked) {

	// update data data for the selected player

	//ClearTreeContext();

	let startTime = new Date();

	//console.log('clicked name: ' + selectedPlayer);
	//console.log('UpdateTreeContext() event ');

	// to notify svg click event (if true, this will indicate that a player in the tree was clicked. if false, 
	// a player from the report was clicked and you can clear context easier)
	blClickedPlayer = _playerClicked; 

	if (!blClickedPlayer) {
		HideModal();	// hides the modal report window if a player was clicked from there
	}


	// ! filter: don't do any reporting on bots. just let them show up in relation to actual players.
	if (!axios_telemetry_response.data.allHumanNames.includes(selectedPlayer)) {
		//alert('this is a bot.');
		return;
	}

	

	// make them select the player first before showing the report
	if (prevSelectedPlayer == selectedPlayer && glSelectedPlayer != '') {
		RunPlayerDamageReport(selectedPlayer);
	}
	
	glSelectedPlayer 	= selectedPlayer;
	prevSelectedPlayer 	= selectedPlayer; 

	//RunPlayerDamageReport(selectedPlayer);


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
	


	//#region // ! [Region] add classes to players and circles
	//

	// cycle through all players and then give them a context class based on the selected player...
	for (let i = 0; i < allPlayers.length; i++) {

		if (allPlayers[i].id == 'fake-invalid-id') {
			continue;
		}

		let playerClassList = allPlayers[i].classList;
		let currentPlayer 	= stripBotText(allPlayers[i].textContent);
		
		let circleClassList = document.getElementById('circle-' + allPlayers[i].id).classList;

		// add/remove classes
		// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList

		// prune all classes after the intial default classes that should not be removed (allPlayers, human/bot, 
		// searched) if they have any left over from the last selected player's context.
		for (let j = playerClassList.length - 1; j >= 0; j--) { 
			//console.log('    ' + allPlayers[i].classList.value);
			if (playerClassList[j] != 'allPlayers' && playerClassList[j] != 'humanPlayers' && playerClassList[j] != 'botPlayers' 
				// && playerClassList[j] != 'searchedPlayer'
				// &&	playerClassList[j] != 'winner'
				 ) {
				playerClassList.remove(playerClassList[j]);
			}
		}

		
		// clear out the classes for the circles
		for (let j = circleClassList.length - 1; j > 0; j--) {

			// prune all but default classes
			if (circleClassList[j] != 'allPlayers' && circleClassList[j] != 'humanPlayers' && circleClassList[j] != 'botPlayers' && circleClassList[j] != 'transparent') {
				circleClassList.remove(circleClassList[j]);
			}
		}



		// at this point, add the relational classes...
		// what is the context of this player to the selected player?
		// -selected player?
		// -teammate?
		// -killer?
		// -killer teammate?

		// selected player
		if (selectedPlayer == currentPlayer) {
			playerClassList.add('selectedPlayer');
			circleClassList.add('selectedPlayer');
		}
		else {
			// if not the selected player, what is currentPlayer's teamId? is it not the selected player?

			// loop through arrTeams until you find the teamId of the selected player
			response.arrTeams.forEach(team => {
		
				// loop through all of this team's teammates. if the selected player is there, then this is a teammate. 
				team.teammates.forEach(teammate => {
		
					if (teammate.name == currentPlayer) {
						//console.log('currentPlayer team found: ' + teammate.name + ' -> ' + currentPlayer);

						if (team.teamId == selectedPlayerTeamId) {
							//console.log('currentPlayer teammate found: ' + teammate.name + ' -> ' + currentPlayer);
							// #7dde98 green
							playerClassList.add('playerTeammate');
							circleClassList.add('playerTeammate');
						}
						else if (team.teamId == selectedPlayerKillerTeamId) {
							// this player is on the killer's team. is it the killer or just a teammate?
							if (currentPlayer == selectedPlayerKiller) {
								// this is the killer
								playerClassList.add('killer')
								circleClassList.add('killer');
							}
							else {
								// this is a killer teammate
								playerClassList.add('killerTeammate')
								circleClassList.add('killerTeammate');
							}
						}
					}
				});
			});
		}
	}

	//#endregion - player and circle classes



	//#region // ! [Region] Path/Lines
	//

	let allPaths = document.getElementsByClassName('d3-path');

	// clear out path/line colors except for defaults
	PrunePathClasses(allPaths);


	// give class context to paths/lines
	for (let i = 0; i < allPaths.length; i++) {

		// what is this path in relation to? 
		if (allPaths[i].id.includes(selectedPlayer)) {

			// is it the path for the killer to the player or the player to their victims?

			//console.log(allPaths[i].id);
			//console.log(allPaths[i].id.substring(5, selectedPlayer.length));

			if (allPaths[i].id.substring(5, 5 + selectedPlayer.length) == selectedPlayer) {
				//console.log('player is killer');
				allPaths[i].classList.add('selectedPlayer')
			}
			else {
				//console.log('player is victim');

				// this should be the killer. only show when it isn't a category...
				if (!allPaths[i].id.includes('Winner') 			&& 
					!allPaths[i].id.includes('Winners') 		&& 
					!allPaths[i].id.includes('Self kills')	 	&& 
					!allPaths[i].id.includes('Circular kills') 	&& 
					!allPaths[i].id.includes('Environment') 	  ) {

					allPaths[i].classList.add('killer');
				}
			}
		}
	}

	//#endregion - path/lines



	// $ BUG: cycling through obits is buggy and takes up to 5 seconds per click. fix this later.
	/*


	//#region // ! [Region] Obituaries...
	//

	console.log('[before obits: ' + (new Date().getTime() - startTime.getTime()) / 1000);


	// cycle through obituary rows and then add the td class for context?
	let obits = document.getElementsByClassName('obit-name');

	for (i = 0; i < obits.length; i++) {

		// if this element's innerText is the selected player, teammate, or any context, then color the row appropriately.		
		//console.log(obits[i].innerText);


		// prune all classes but 'obit-name' before checking it for the new context
		let obitClassList = obits[i].classList;
		
		for (let j = obitClassList.length - 1; j >= 0; j--) { 
			//console.log('    ' + allPlayers[i].classList.value);
			if (obitClassList[j] != 'obit-name') {
				obitClassList.remove(obitClassList[j]);
			}
		}


		// is this a bot player?
		if (axios_telemetry_response.data.allBotNames.split('|').includes(obits[i].innerText)) {
			//console.log(obits[i].innerText + ' is a bot');
			obits[i].classList.add('botPlayer');
		}


		// ? check what happens to context colors if a teammate is your killer or you kill yourself.

		// copy/paste from above
		if (obits[i].innerText == selectedPlayer) {
			obits[i].classList.add('selectedPlayer');
		}
		else {
			// if not the selected player, what is currentPlayer's teamId? is it not the selected player?

			// loop through arrTeams until you find the teamId of the selected player
			response.arrTeams.forEach(team => {
		
				//console.log(team.teamId);

				if (team.teamId == selectedPlayerTeamId) {
					// if this is a teammate of the selected player...

					team.teammates.forEach(teammate => {

						if (obits[i].innerText === teammate.name) {

							obits[i].classList.add('playerTeammate');
						}
	
					})

				}
				else if (team.teamId == selectedPlayerKillerTeamId) {
					// if this is the killer's team

					team.teammates.forEach(teammate => {

						if (obits[i].innerText == selectedPlayerKiller) {
							// this is the killer
							obits[i].classList.add('killer');
						}
						else {
							// this is a killer teammate
							//obits[i].classList.add('killerTeammate');

							// $ this is buggy right now. drawing the killer's teammates is not working in obits.
						}

					})
					
				}





				// loop through all of this team's teammates. if the selected player is there, then this is a teammate. 
				// team.teammates.forEach(teammate => {
		
				// 	if (obits[i].innerText === teammate.name) {
				// 		//console.log('currentPlayer team found: ' + teammate.name + ' -> ' + currentPlayer);

				// 		if (team.teamId == selectedPlayerTeamId) {
				// 			//console.log('currentPlayer teammate found: ' + teammate.name + ' -> ' + currentPlayer);
				// 			// #7dde98 green
				// 			obits[i].classList.add('playerTeammate');
				// 			return;
				// 		}
				// 		else if (team.teamId == selectedPlayerKillerTeamId) {
				// 			// this player is on the killer's team. is it the killer or just a teammate?
				// 			if (obits[i].innerText == selectedPlayerKiller) {
				// 				// this is the killer
				// 				obits[i].classList.add('killer');
				// 				return;
				// 			}
				// 			else {
				// 				// this is a killer teammate
				// 				obits[i].classList.add('killerTeammate');
				// 				return;
				// 			}
				// 		}
				// 	}

				// });
			});
		}
	}

	console.log(' after obits1: ' + (new Date().getTime() - startTime.getTime()) / 1000);


	// update the table row classes
	let obitRows = document.getElementsByClassName('obituaryRow');

	for (i = 0; i < obitRows.length; i++) {

		//remove 'obituarySelected' by default, then add if this is the selected user
		obitRows[i].classList.remove('obituarySelected');

		if (obitRows[i].id == 'obit-' + selectedPlayer) {
			// if this is the obit row for the selected player, add obitSelected
			obitRows[i].classList.add('obituarySelected');
		}

		//console.log(obitRows[i].id);
	}

	console.log(' after obits2: ' + (new Date().getTime() - startTime.getTime()) / 1000 + ']');

	*/
	// $ BUG: cycling through obits is buggy right now. sometimes it takes up to 5 seconds to cycle through all of this. FIX.


	//
	//#endregion -- Obituaries




	// set the rectangle at the selected player
	SetRectangleLocation(selectedPlayer);

}


function PrunePathClasses(paths) {
	// clear out path/line colors except for defaults
	//let paths = document.getElementsByClassName('d3-path');
	for (let i = 0; i < paths.length; i++) {
		
		for (let j = paths[i].classList.length - 1; j >= 0; j--) {
			if (paths[i].classList[j] != 'd3-path' 		&& 
				paths[i].classList[j] != 'pathHidden' 	&& 
				paths[i].classList[j] != 'pathDefault'	  ) {

				//console.log('removing class ' + allPaths[i].classList[j] + ' for ' + allPaths[i].id);
				paths[i].classList.remove(paths[i].classList[j]);
			}
		}
	}

}


function SetRectangleLocation(player) {
	// get coordinates for the selected player and the player's killer so that you can put rectangles behind them
	let playerCoorindates = document.getElementById(player).parentElement.transform.baseVal[0].matrix;
	// console.log('x=' + playerCoorindates.e + ' y=' + playerCoorindates.f);
	// console.log('glTreeHeightNeg: ' + glTreeHeightNeg + ', ' + 'glTreeHeighPos: ' + glTreeHeightPos)

	// now that you know the D3 version of x/y, you will need to translate that to the actual
	// y will need to be the total of absolute 
	let translatedY = 0;

	if (playerCoorindates.f < 0) {
		// this is a negative value (above the left most root)

		//console.log('translated y: ' + (playerCoorindates.f - glTreeHeightNeg));
		translatedY = playerCoorindates.f - glTreeHeightNeg;
	}
	else {
		//console.log('translated y: ' + (playerCoorindates.f + Math.abs(glTreeHeightNeg)));
		translatedY = playerCoorindates.f + Math.abs(glTreeHeightNeg);
	}


	//let playerRectangle = document.getElementById('selectedPlayerRectangle');
	playerRectangle 				= glPlayerRectangle;
	playerRectangle.x.baseVal.value = playerCoorindates.e;
	playerRectangle.y.baseVal.value = translatedY + 6;
	
	playerRectangle.width.baseVal.value = document.getElementById(player).getComputedTextLength() + 26;
	

	// create rectangle element
	// <rect id='selectedPlayerRectangle' x="10" y="10" width="144" height="18" fill="#303032" rx='8' ry='8'/>
	// https://stackoverflow.com/questions/20539196/creating-svg-elements-dynamically-with-javascript-inside-html
	// let svgNS = document.documentElement.namespaceURI;
	// let rect = document.createElementNS(svgNS, 'rect');
	// rect.setAttribute('id', 'selectedPlayerRectangle');
	// rect.setAttribute('x', playerCoorindates.e);
	// rect.setAttribute('y', translatedY + 6);
	// rect.setAttribute('height', 18);
	// rect.setAttribute('width', 144);
	// rect.setAttribute('rx', 8);
	// rect.setAttribute('ry', 8);
	// rect.setAttribute('fill', '#303032');


	// this will get the top most 
	let existingChild = document.getElementById('g-child');
	document.getElementById('d3-svg01').insertBefore(playerRectangle, existingChild);

}




function stripBotText(name) {
	if (name.includes('bot.')) {
		name = name.substring(6, name.length);
	}

	return name;
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

	// 0.055
	// update the browser url so that it shows the current player: ?type=player&player=JowyBear&platform=steam
	// console.log(location.protocol);
	// console.log(location.host);
	// console.log('location.pathname: ' + location.pathname);
	// console.log('location.search: ' + location.search);
	//console.log('url -> ' + location.protocol + '//' + location.host + '?type=player&player=' + strPlayerName + '&platform=' + strPlatform);
	history.replaceState('','',location.protocol + '//' + location.host + '?type=player&player=' + strPlayerName + '&platform=' + strPlatform);
	//history.pushState('','',location.protocol + '//' + location.host + '?type=player&player=' + strPlayerName + '&platform=' + strPlatform);
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
	//console.log("Searching: " + strPlatform + "/" + strPlayerName);

	GetPlayerMatches();
}


function _printRoster(roster) {
	var strRoster;

	roster.forEach(element => {
		strRoster += element + ', ';
	});

	return strRoster;
}


function openTwitter() {
	window.open('https://twitter.com/pubgtrees', '_blank');
}


function drawRectangle() {

	let svg = document.getElementById('d3-svg01');

	let rect = document.getElementById('selectedPlayerRectangle');

	console.log(rect.x);
	
	rect.x.baseVal.value += 20;


}


function ShowTreeHintModal() {
	document.getElementById('div-treehint-modal').style.display = 'block';
}

function HideTreeHintModal() {
	document.getElementById('div-treehint-modal').style.display = 'none';
}
