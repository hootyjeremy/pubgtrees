const express       = require('express');
//const bodyParser    = require('body-parser');
const axios         = require('axios');
const moment        = require('moment-timezone');   //require('moment');

const app           = express();
const fs            = require('fs');
const path          = require('path');
const glob          = require('glob');
const chalk         = require('chalk');             // https://www.npmjs.com/package/chalk
const compression   = require('compression');       // http://expressjs.com/en/resources/middleware/compression.html

const hf            = require('./hooty_modules/hf_server'); // helper functions

const port          = process.env.PORT || 3000;    // https://stackoverflow.com/questions/18864677/what-is-process-env-port-in-node-js
// const databaseUrl   = process.env.DATABASE_URL;
const apiKey        = process.env.PUBG_API_KEY;
const zlib          = require('zlib');


// database stuff
const { Client }    = require('pg');
let databaseURL     = '';
let dbRowsToInsert  = '';


//const { translateMapName, } = require('./hooty_modules/hf_server');
//const { debug } = require('console');



// ---------------------------->
// ! Deploy/Testing Version...
const blTestingVersion = !true;



// ! Global variables...
const strLine   = "--------------------------------------------";


// ---------------------------->
// ! Cache Purging and Database Updating
setInterval(clearCache,     300000);    // check for cache clear every 5 minutes (300,000 milliseconds)
setInterval(UpdateDatabase, 300000);    // check for cache clear every 5 minutes (300,000 milliseconds)
CreateCacheFolders();

// alias, literal
app.use(compression());


// ------------------------------------------------------------->
app.listen(port, () => {
    console.log(strLine);
    console.log('test version: ' + blTestingVersion);
    console.log(getDate() + ' -> hooty-pubg server listening on port ' + port);
    //console.log('process.env.DATABASE_URL: ' + process.env.DATABASE_URL);
    //console.log('process.env.PUBG_API_KEY: ' + apiKey);
    console.log('__dirname: ' + __dirname + '\\');
});



// ------------------------------------------------------------->
app.use('/static', express.static(__dirname + '/static'));
//app.use('/match',  express.static(__dirname + '/static/match'));    // so that root/pubg.js and root/index.html can be found


// this doesn't seem to do anything once you apply app.use('/')
app.get('/', (req, res) => {
    //console.log('request:  ' + req);
    //console.log('response: ' + res);

    res.sendFile(__dirname + '/static/index.html');
    //res.sendFile('/static/index.html');
});




//#region // ! [region] database setup
//

if (!blTestingVersion) {
    // hard code whatever heroku has when doing local testing
    databaseURL = process.env.DATABASE_URL;
}
else {
    databaseURL = 'postgres://tgovfrczazrsnm:6974fe69669f35826a71d1c0c1991a0f86f4ccc28544c66a596d69697f48aac8@ec2-18-215-99-63.compute-1.amazonaws.com:5432/d9srr2mjrsmilo';
}


async function UpdateDatabaseRows(playername, platform, ratelimitremaining, ip) {

    let dbDate = new Date();
    let dbTime = dbDate.getTime();

    if (dbRowsToInsert == '') {
        // currently blank
        dbRowsToInsert = `(${dbTime}, '${getDate()}', '${playername}', '${platform}', ${ratelimitremaining}, 'nah')`;
    }
    else {
        dbRowsToInsert += `,\n(${dbTime}, '${getDate()}', '${playername}', '${platform}', ${ratelimitremaining}, 'nah')`;
    }

    console.log(`inserting row: (${dbTime}, '${getDate()}', '${playername}', '${platform}', ${ratelimitremaining}, 'nah')`);
}






// ------------------------------------------------------------->
app.get('/getplayermatches', async (req, res) => {

    //console.log('bypassCache: ' + req.query.bypassCache);

    var pubgApiResponseInfo = null;   // will include this in response to the client

    var match_floor     = new Number(req.query.match_floor);  // i don't know why this is catching a string. maybe the query converts it?
    //let skipped_matches = new Number(0);
    const strPlayerName = req.query.player_name;
    let searchDirection = req.query.searchDirection;

    if (blTestingVersion) {
        console.log(strLine);
        console.log('/getplayer called -> ' + req.query.platform + '/' + req.query.player_name);
        console.log('match_floor:     ' + match_floor);
        //console.log('skipped_matches: ' + skipped_matches);
        console.log('searchDirection: ' + searchDirection);
    }

    // console.log('request ip: ' + req.ip);
    // console.log('req.query.endpoint:     ' + req.query.endpoint);
    // console.log('req.query.platform:     ' + req.query.platform);
    // console.log('req.query.player_name:  ' + req.query.player_name);
    // console.log('req.query.match_id:     ' + req.query.match_id);
    // console.log('req.query.telemetry_id: ' + req.query.telemetry_id);

    // player url: https://api.pubg.com/shards/steam/players?filter[playerNames]=hooty__
    // match  url: https://api.pubg.com/shards/steam/matches/066befe1-6320-44c6-8a66-2a9578ad87ba

    var base_url    = "https://api.pubg.com/shards/",
        player_url  = '',
        match_url   = '',
        player_data = null;     // player_data is the data portion of the full pubgapi_player_response (whether from api or cache)

    base_url   += req.query.platform + '/';
    player_url  = base_url + req.query.endpoint + '?filter[playerNames]=' + req.query.player_name;
    match_url   = base_url + 'matches/';
    //console.log('match_url: ' + match_url);

    // player_url: 'https://api.pubg.com/shards/steam/players?filter[playerNames]=hooty__'
    //console.log('player_url: ' + player_url);

    // cache structure:
    // ./cache/matches
    // ./cache/players/psn
    // ./cache/players/stadia
    // ./cache/players/steam
    // ./cache/players/tournament
    // ./cache/players/xbox
    // ./cache/players/psn/404
    // ./cache/players/stadia/404
    // ./cache/players/steam/404
    // ./cache/players/tournament/404
    // ./cache/players/xbox/404


    // ------------------------------------------------------->
    //#region // ! [Region] fetch player_data
    //

    const player_cache_file     = './cache/players/' + req.query.platform + '/' + req.query.player_name + '.json.gzip';
    //const player_cache_file_404 = './cache/players/' + req.query.platform + '/404/' + req.query.player_name + '.txt';


    // -------------------------------------------------------------->
    // ! READ CACHE FILE -> if you can get the player cache from the file, then get it...

    if (fs.existsSync(player_cache_file) && req.query.bypassCache == 'n') {
        // if bypassCache is 'y' then don't get player from cache.

        try {

            //console.log('retrieving from cache file: ' + player_cache_file);
    
            player_data = readCacheFileJSON(player_cache_file);

            if (blTestingVersion) {
                console.log('player cache exists... ');
            }
    
            pubgApiResponseInfo = { 'hootyserver': 'cached', 'status': null, 'statusText': 'no need to fetch from pubg api' };
        }
        catch (err) {
    
            console.log('no player cache file: ' + player_cache_file);
    
            if (err.code != "ENOENT") {
                console.log('player cache file read error: ' + err.code);
            }
        }
    }
    else {
        //console.log('no cache file. fetching from pubg api -> ' + player_url);

        if (blTestingVersion) {
            console.log('player cache does not exist... ');
        }

        var pubgapi_player_response;

        try 
        {
            pubgapi_player_response = await axios.get(player_url, { 
                headers: {
                    Authorization: 'Bearer ' + apiKey,
                    Accept: 'application/vnd.api+json'
                }
            })

            pubgApiResponseInfo = { 'hootyserver': 'fetched', 'status': pubgapi_player_response.status, 'statusText': pubgapi_player_response.statusText,
                                    'x-ratelimit-remaining' : pubgapi_player_response.headers['x-ratelimit-remaining'] + ' of ' + 
                                    pubgapi_player_response.headers['x-ratelimit-limit'], };



            if (blTestingVersion) {
                console.log('fetched player_url: ' + player_url);
                console.log('pubgapi_player_response.headers.x-ratelimit-remaining: ' + pubgapi_player_response.headers['x-ratelimit-remaining'] + ' of ' + pubgapi_player_response.headers['x-ratelimit-limit']);
            }



            // successful get, update database
            UpdateDatabaseRows(req.query.player_name, req.query.platform, pubgapi_player_response.headers['x-ratelimit-remaining'], req.ip);

        }
        catch (error)
        {
            if (error.response.status != 200) {

                if (error.response.status == 429) {
                    // too many requests (over the rate limit)
                    // database logging for after ratelimit is reached

                    // rate limit reached, update database
                    UpdateDatabaseRows(req.query.player_name, req.query.platform, 0, req.ip);
                }

                console.log('could not fetch player from pubg api: ' + player_url);
                console.log('error.response.status: ' + error.response.status + ' -> error.response.statusText: ' + error.response.statusText);

                //var _response_json = { pubg_response_status: error.response.status, pubg_response_statusText: error.response.statusText };
                //res.send(_response_json);

                pubgApiResponseInfo = { 'hootyserver': 'fetched', 'status': error.response.status, 'statusText': error.response.statusText };

                var response_data = { 
                    'pubgResponse'  : pubgApiResponseInfo,
                };

                res.send(response_data);
                return;
            }
        }


        // ----------------------------->
        // ! WRITE CACHE FILE -> write player's cache file...
        writeCacheFileJSON(player_cache_file, pubgapi_player_response.data.data[0]);

        player_data = pubgapi_player_response.data.data[0];

    }

    if (blTestingVersion) {
        console.log('player_data -> ', player_data);
    }


    //
    //#endregion ---------------------------------------------------------------------------------------------->



    // ------------------------------------------------------->
    // ! MATCH DATA ->

    // only want to pull 10 matches at a time depending on match_floor, but also no more than the end of matches
    var match_ceiling = (match_floor + 10 > player_data.relationships.matches.data.length) ? player_data.relationships.matches.data.length : match_floor + 10 ; 
    //console.log(getDate() + ' before get matches');

    //console.log('matches.length: ' + player_data.relationships.matches.data.length);
    //console.log('match_floor:   ' + match_floor);
    //console.log('match_ceiling:  ' + match_ceiling);

    var matchArray  = [];    // an array of json objects about each match
    var matchIndex  = 0;

    // matches loop...
    for (let i = match_floor; i < match_ceiling; i++) {
        // $ need to recalculate match_celing when skipping unwanted gameMode types
        //console.log(i + '. ' + getDate() + ' -> match_url: ' + match_url + player_data.relationships.matches.data[i].id);

        var match_cache_file = './cache/matches/' + player_data.relationships.matches.data[i].id + '.json.gzip';
        var pubgapi_match_response;
        var match_data;
        var _cached;


        // ------------------------------------------------------->
        // #region // ! [Region] fetch match_data from cache or api
        //

        if (fs.existsSync(match_cache_file)) {
            // a cache file exists

            try 
            {
                match_data = readCacheFileJSON(match_cache_file);
    
                //console.log(i +  '. ' + getDate() + ' (cached) ' , match_data);
                _cached = ('cached');
            }
            catch (err) 
            {
                console.log('match cache read error: ' + err + ' -> for cache file ' + match_cache_file);
            }
        } 
        else {
            // no cache file exists. fetch from the pubg api...

            try 
            {
                // match_url + id: https://api.pubg.com/shards/steam/matches/ba57018d-6e6f-46ea-bcd4-ebd8bbcefd28
                pubgapi_match_response = await axios.get(match_url + player_data.relationships.matches.data[i].id, {
                    headers: {
                        Accept: 'application/vnd.api+json'
                    }
                });

                writeCacheFileJSON(match_cache_file, pubgapi_match_response.data);

                match_data = pubgapi_match_response.data;
    
                //console.log(i +  '. ' + getDate() + ' (fetched) ' , match_data);
                _cached = '(fetched)';
            }
            catch (error) 
            {
                // handle fetch errors...
                if (error.response.status != 200) {
                    console.log('-could not fetch match from pubg api: ' + match_url + player_data.relationships.matches.data[i].id)
                    console.log('-error: ' + error.response.status + ', ' + error.response.statusText);
                }

                continue; // ? get next match if this one fails? does any data need to be sent back to the client? probably not.
            }            

            // create cache file for this match response...
            //fs.writeFileSync(match_cache_file, JSON.stringify(pubgapi_match_response.data, null, 2), function (err) {
            // fs.writeFileSync(match_cache_file, JSON.stringify(pubgapi_match_response.data, null, 0), function (err) {
            //     //console.log('writing match cache...');
            //     if (err) {
            //         console.log('error writing match cache file: ' + match_cache_file);
            //     }
            //     else {
            //         //console.log('created match cache file: ' + match_cache_file);
            //     }
            // })

        }
        //
        //#endregion fetch

        
        // -------------------------------------------------->
        //#region // ! [Region] Loop through match's included[] array
        //

        // filter out irregular games (and the training map)
		if (
			(match_data.data.attributes.gameMode != "solo"  &&	match_data.data.attributes.gameMode != "solo-fpp" 	&&
			 match_data.data.attributes.gameMode != "duo" 	&&	match_data.data.attributes.gameMode != "duo-fpp" 	&&
             match_data.data.attributes.gameMode != "squad" &&	match_data.data.attributes.gameMode != "squad-fpp") ||
             match_data.data.attributes.mapName == "Range_Main"  ) {

            
            if (blTestingVersion) {
                console.log('skipping match gameMode or training map: ' + match_data.data.attributes.gameMode + ', ' + match_data.data.attributes.mapName);
            }
            
            // recalculate match_ceiling if you skip a match. 
            if (matchArray.length < 10 && match_ceiling < player_data.relationships.matches.data.length) {
                match_ceiling++;
            }   

			continue;
        }


        var damageDealt, kills, winPlace, timeSurvived, participantID;
        var dctParticipantNames     = [];   // [ participantID, name ] in the match so you can resolve playerID's
        var arrRosters              = [];   // [ rosterId, [roster participantIDs] ]  -> match participant ID's to their roster
		var dctParticipantRoster    = []; 	// [ participantId, rosterId ]
		var dctTeamRoster 			= [];	// [ name, participantId ]
		var participantIndex 		= 0;
		var rosterIndex 			= 0;
		var participantRosterIndex  = 0;
		var teamRosterIndex 		= 0;

        for (let j = 0; j < match_data.included.length; j++) {

            const included = match_data.included[j];


            if (included.type == 'participant') {

                // death types: byplayer, byzone (blue only?), alive (won without dying), suicide

                //console.log('[' + j + '] deathType: ' + included.attributes.stats.deathType + ', ' + included.attributes.stats.name);

                // is this the selected player?
                if (included.attributes.stats.name == strPlayerName) {
                    //console.log(j + '. this participant is the selected player: ' + strPlayerName + ', ' + included.attributes.stats.playerId);
                    participantID   = included.id;
                    damageDealt     = parseInt(included.attributes.stats.damageDealt);
					kills 			= included.attributes.stats.kills;
					DBNOs 			= included.attributes.stats.DBNOs;
					winPlace 		= included.attributes.stats.winPlace;
                    timeSurvived 	= hf.ConvertSecondsToMinutes(included.attributes.stats.timeSurvived);                
                }

                dctParticipantNames[participantIndex] = { 'participantID': included.id, 'name': included.attributes.stats.name };
                participantIndex++;
            }
            else if (included.type == 'roster') {
   				// since you don't know your participantID until after looping through .included[] once, you can't always find your roster of teammates on the first round.
				// build an array of all rosters this match and after this .inluded[] loop, find out your teammates names

				var _roster_participants = [];

				// enter all participants of each included.relationships.participants.data[].id
				for (let p = 0; p < included.relationships.participants.data.length; p++) {
					_roster_participants[p] = included.relationships.participants.data[p].id;

					// get [participantId, rosterId]
					dctParticipantRoster[participantRosterIndex] = { 'participantID': included.relationships.participants.data[p].id, 'rosterID': included.id };
					participantRosterIndex++;
				}

				// add participant array to rosters array
				arrRosters[rosterIndex] = { 'rosterID': included.id, 'rosterParticipants': _roster_participants } ;
				rosterIndex++;
            }
            else if (included.type == 'asset') {
                // get telemetry url from asset...

                //const telemetry_url_cache = './cache/matches/' + player_data.relationships.matches.data[i].id + '.telemetry.json';
                //const telemetry_json = { 'matchID': player_data.relationships.matches.data[i].id, 'telemetry_url': included.attributes.URL };

                // cache the telemetry url for when the user asks for it. if they want to analyze a match, get it's url here. 
                // if the cache doesn't exist, try the cached match file. if that doesn't exist, fetch match from the pubg api.
                // fs.writeFile(telemetry_url_cache, JSON.stringify(telemetry_json, null, 2) , function (err) {
                //     if (err) {
                //         console.log(err +  ' -> error writing telemetry url cache: ' + telemetry_url_cache);
                //     }
                // })
            }
            else {
                console.log(chalk.yellow(j + ' included type is not participant, roster, or asset. this is unexpected.'));
            }
        } // .included[j] loop


		// ! resolve roster teammate names
        // loop through participants:roster until you find the player's rosterId
        var _rosterID = '';

        for (let j = 0; j < dctParticipantRoster.length; j++) {
            if (dctParticipantRoster[j].participantID == participantID) {
                _rosterID = dctParticipantRoster[j].rosterID;
                break;
            }
        }

        // now that you have _rosterId for the player, search arrRosters for the participantIDs
		for (let j = 0; j < arrRosters.length; j++) {
			if (arrRosters[j].rosterID == _rosterID) {
				_participants = arrRosters[j].rosterParticipants;
				break;
			}
		}

		// now that you have the teammates' participant IDs (including the selected player's), resolve their names
		for (let j = 0; j < _participants.length; j++) {
			// resolve name of participantId as long as it isn't the selected player
			for (let k = 0; k < dctParticipantNames.length; k++) {
				//console.log(_participants[j] + ", " + dctParticipantNames[k][0] + ", " + dctParticipantNames[k][1]);

				if (_participants[j] == dctParticipantNames[k].participantID) {
					dctTeamRoster[teamRosterIndex] = { 'name': dctParticipantNames[k].name, 'participantID':  dctParticipantNames[k].participantID };
					teamRosterIndex++;
				}
			}
        }
       

        //
        //#endregion (match data) --------------------------------------------------------------------------------->


        matchArray[matchIndex] = { 
            'strPlayerName':    strPlayerName,
            'timeSinceMatch':   getTimeSinceMatch(match_data.data.attributes.createdAt),
            'duration':         match_data.data.attributes.duration,
            'gameMode':         match_data.data.attributes.gameMode, 
            'matchType':        match_data.data.attributes.matchType,   // official vs. competitive
            'mapName':          hf.translateMapName(match_data.data.attributes.mapName),
            'teamRoster':       dctTeamRoster,
            'damageDealt':      damageDealt,
            'kills':            kills,
            'DBNOs':            DBNOs,
            'winPlace':         winPlace,
            'timeSurvived':     timeSurvived,
            'matchId':          match_data.data.id,
            'participantCount': participantIndex,
        };


        if (blTestingVersion) {
            console.log(i + '. ' + _cached + ": " + matchArray[matchIndex].timeSinceMatch + ', ' + matchArray[matchIndex].gameMode + ', ' +
                        matchArray[matchIndex].mapName + ', [' + printTeamRoster(dctTeamRoster) + ']');
        }

        //console.log(match_data);

        matchIndex++;

    }   // matches[i] loop


    //console.log(getDate() + ' after get matches');
    //console.log(matchArray);

    // $ if no matches, then the client should be made aware
    var response_data = { 
        'match_ceiling' : match_ceiling, 
        'totalMatches'  : player_data.relationships.matches.data.length,
        'matches'       : matchArray,
        'pubgResponse'  : pubgApiResponseInfo,
    };

    res.json(response_data);
})



app.get('/getmatchtelemetry', async (req, res) => {
    console.log('/getmatchtelemetry -> player: ' + req.query.platform + '/' + req.query.player_name + ', matchID: ' + req.query.matchID);

    var pubgApiMatchResponseInfo = null;
    var pubgApiTelemetryResponseInfo = null;

    var   playerName        = req.query.player_name;
    const match_url         = 'https://api.pubg.com/shards/' + req.query.platform + '/matches/' + req.query.matchID;
    const match_cache_file  = './cache/matches/' + req.query.matchID + '.json.gzip';
    var   telemetry_cache_file = null;


    var match_data, telemetry_url;

    let allHumanNames   = '';
    let allBotNames     = '';   // store a long string of bot names so that they can be identified for classes
    let arrPlayerCards  = [];   // [name, { activity }]  the damage to and from a player, and kills/death.
    let matchDetails    = new Object();   // identify the map, humans/bots, player win place, region




    // ---------------------------------------------------->
    //#region // ! [Region] Fetch telemetry from match data
    //

    // get telemetry url from asset property of match_data. try match cache first. if not there, fetch the match from the pubg api and then cache the match.

    // check for match cache file first
    if (fs.existsSync(match_cache_file)) {
        try 
        {
            match_data = readCacheFileJSON(match_cache_file);

            //console.log('match_data (cached): ');
            //console.log(match_data);

            pubgApiMatchResponseInfo = { 'hootyserver': 'match (cached)', 'status': null, 'statusText': 'no need to fetch from pubg api' };
        }
        catch (err) 
        {
            console.log('error getting telemetry url while reading match cache file: ' + match_cache_file);

            pubgApiMatchResponseInfo = { 'hootyserver': 'match cache (error)', 'hootyserver_status': err.response.status, 'hootyserver_statusText': err.response.statusText, 'status': 200, 'statusText': 'no need to fetch from pubg api' };

            // $ should send back an error response here...
        }
    }
    else {
        // if the match cache file doesn't exist, get it from the pubg api, then get the telemetry url, and then cache the match.

        var pubgapi_match_response;

        try 
        {
            // match_url + id: https://api.pubg.com/shards/steam/matches/ba57018d-6e6f-46ea-bcd4-ebd8bbcefd28
            pubgapi_match_response = await axios.get(match_url, {
                headers: {
                    Accept: 'application/vnd.api+json'
                }
            });

            match_data = pubgapi_match_response.data;

            pubgApiMatchResponseInfo = { 'hootyserver': 'match (fetched)', 'status': pubgapi_match_response.status, 'statusText': pubgapi_match_response.statusText };

            // create cache file for this match response...
            writeCacheFileJSON(match_cache_file, pubgapi_match_response.data);

            //console.log('match_data (fetched): ');
            //console.log(match_data);
        }
        catch (error) 
        {
            // handle fetch errors...
            if (error.response.status != 200) {
                console.log('response: ' + error.response.status + ': ' + error.response.statusText + ' (could not fetch match from pubg api: ' + match_url + ')');
            }

            pubgApiMatchResponseInfo = { 'hootyserver': 'match fetch (error)', 'status': error.response.status, 'statusText': error.response.statusText };

            res.send({ pubgApiMatchResponseInfo });

            return;
        }
    }


    if (blTestingVersion) {
        console.log('match_data...');
        console.dir(match_data);
    }


    // get match data info here to send back to client for the tree div
    matchDetails = { 
        'mapName': hf.translateMapName(match_data.data.attributes.mapName),
        'matchType': match_data.data.attributes.matchType,
        'gameMode': match_data.data.attributes.gameMode,
        'createdAt': getTimeSinceMatch(match_data.data.attributes.createdAt),
        'duration': hf.ConvertSecondsToMinutes(match_data.data.attributes.duration),
        'shardId': match_data.data.attributes.shardId,
        'id': match_data.data.id,
    }


    for (let i = 0; i < match_data.included.length; i++) {
        if (match_data.included[i].type == 'asset') {
            // get the telemetry url from the asset property of match_data
            telemetry_url           = match_data.included[i].attributes.URL;
            telemetry_cache_file    = './cache/telemetry/' + path.parse(telemetry_url).base + '.gzip';
            //break;
        }
        else if (match_data.included[i].type == 'participant') {
            //get survivor names  here

            //deathType: byzone, byplayer, suicide, alive
            
            // if (match_data.included[i].attributes.stats.deathType == "alive") {
            //     console.log('survivor: ' + match_data.included[i].attributes.stats.deathType + '/' + match_data.included[i].attributes.stats.name);
            // }
            // else if (match_data.included[i].attributes.stats.deathType == "suicide") {
            //     console.log('suicide: ' + match_data.included[i].attributes.stats.deathType + '/' + match_data.included[i].attributes.stats.name);
            // }
            allHumanNames += '|' + match_data.included[i].attributes.stats.name;

            // make player cards here for the individual players' reports
            arrPlayerCards.push({ 
                                    'name': match_data.included[i].attributes.stats.name,
                                    'kills':  match_data.included[i].attributes.stats.kills,
                                    'damageDealt': match_data.included[i].attributes.stats.damageDealt,
                                    'DBNOs': match_data.included[i].attributes.stats.DBNOs,
                                    'timeSurvived': hf.ConvertSecondsToMinutes(match_data.included[i].attributes.stats.timeSurvived),
                                    'winPlace': match_data.included[i].attributes.stats.winPlace,
                                    'teamKills': match_data.included[i].attributes.stats.teamKills,
                                });
        }
    }



    // ----------------------------------------------------
    // fetch the actual telemetry here from the pubg api...
    var telemetry_response = null;

    // search for cached telemetry. if exists, load it
    // if it doesn't exist, fetch it from pubg api and then cache it...


    if (fs.existsSync(telemetry_cache_file)) {
        // read from the cache file

        try 
        {
            telemetry_response = readCacheFileJSON(telemetry_cache_file);

            pubgApiTelemetryResponseInfo = { 'hootyserver': 'telemetry (cached)', 'status': null, 'statusText': 'no need to fetch from pubg api' };

            if (blTestingVersion) {
                console.dir('telemetry_response...');
                console.dir(telemetry_response);
            }
        }
        catch (err)
        {
            console.log('error reading telemetry cache file: ' + telemetry_cache_file);
            console.log('-> error: ' + err);

            pubgApiTelemetryResponseInfo = { 'hootyserver': 'telemetry cache read error', 'hootyserver_status': err.response.status, 'hootyserver_statusText': err.response.statusText,
                                             'status': 200, 'statusText': 'no need to fetch from pubg api' };

            // $ should send back a repsonse with this error here?
        }
    }
    else {
        // if no cache file, fetch it and then cache it

        try {
            var telemetry_response_full = await axios.get(telemetry_url, {
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Accept-Encoding': 'gzip'
                }
            });
        
            // create cache file for this telemetry response...    
            writeCacheFileJSON(telemetry_cache_file, telemetry_response_full.data);

            pubgApiTelemetryResponseInfo = { 'hootyserver': 'telemetry (fetched)', 'status': telemetry_response_full.status, 'statusText': telemetry_response_full.statusText };
    
            telemetry_response = telemetry_response_full.data;

            if (blTestingVersion) {
                console.log('telemetry_response...');
                console.dir(telemetry_response);
            }
        }
        catch (error) {
            if (error.response.status != 200) {
                console.log('could not fetch telemetry url from pubg api: ' + telemetry_url);
                console.log(error.response.status + ': ' + error.response.statusText);
            }
    
            pubgApiTelemetryResponseInfo = { 'hootyserver': 'telemetry fetch (error)', 'status': error.response.status, 'statusText': error.response.statusText };
        }
    }

    //
    //#endregion (fetch telemetry data) ------------------------------------------------------------------------>


    console.log(strLine);
    console.log('analyzing telemetry...');

    // arr_T = [];
    // arr_Tindex = 0;

    var ai_deaths       = 0;
    var human_deaths    = 0;
    //var ai_count        = 0;
    //var human_count     = 0;

    var blBeforeMatchStart  = true;
    var matchStartTime      = null;
    var strRecordTimestamp  = null;

    var arrDamageLog    = [];       // for server side console logging
    var arrKillFeedLog  = [];
    var arrEnvironmentKills = [];   // just to identify environment killers for knowing what to look for (Redzone, Drowning, other stuff I don't know yet)
    let arrSelfKills        = [];   // just to identify self kill data
    
    var arrTeams        = [];   // [teamId, [players]]
    var arrPlayerTeam   = [];   // [name, teamId]   // for reverse lookups
    var arrKnocks       = [];   // [{ knocked_player, whodunit}] -> this is here to keep up with who is currently knocked in-game so you know if a player was thirsted

    // data for client response...
    var arrPlayersDamageLog = [];   // [player_name, {playerDamageLog}]  -- this will be every player's damage/tagged log
    var playerTeamId        = null;

    //var arrKillerVictims    = [];   // [ { killerinfo, [{victims}] } ]
    var arrKillLog          = [];   // just need to know killer:victim to know who didn't die
    var arrSurvivors        = [];   // hold a list of living players. remove when they die.
    // $ remove each living player from a list when they die

    //var null_attacker   = [];   // for testing bluezone/redzone/blackzone


    // ! loop through each telemetry event...
    for (let i = 0; i < telemetry_response.length; i++){
        //console.log(i);

        var record = telemetry_response[i];
        var _recordLog = '';

        var playerDamageLog = new Object();

        var killer          = new Object();
            killer.victims  = [];
        //var blKillerExists  = false;


        var i_string = new String(i);
        // _T types...
        // if (!arr_T.includes(telemetry_response.data[i]._T)) {
        //     arr_T[arr_Tindex] = telemetry_response.data[i]._T;
        //     arr_Tindex++;
        // }

        // if (telemetry_response.data[i]._T == 'LogPlayerCreate') {
        //     console.log('LogPlayerCreate: ' + telemetry_response.data[i]._D + ' -> ' + telemetry_response.data[i].character.accountId + ', ' + telemetry_response.data[i].character.name );
        // }

        
        // $ BOT PROBLEM
        // $ some bots and bot teams are created after the round starts so they aren't detected in LogPlayerCreate or in backpack pickup.
        // $ therefore, arrTeams doesn't list all bots right now. will have to detect bots and teamId in their death/survivor events for an accurate count.
        // if (record._T == 'LogPlayerCreate') {
        //     if (record.character.teamId >= 200 && record.character.teamId < 300) {
        //         console.log('(' + i_string.padStart(5, ' ') + ') LogPlayerCreate: ' + record.character.teamId + ' - ' + record.character.name);
        //         console.log(record);
        //     }
        // }

        // if (record._T == 'LogPlayerPosition') {
        //     if (record.character.accountId.includes('ai.')) {


        // if (record._T == 'LogGameStatePeriodic') {
        //     console.log(record);
        //     debugger;
        // }

    

        //#region // ! [Region (pre-match/post-match)]
        //

        // before the match starts, get teamId of each player and bot
        if (blBeforeMatchStart) {
            if (record._T == 'LogItemPickup' && record.item.itemId == 'Item_Back_B_01_StartParachutePack_C') {

                // if (!hf.isBot(record.character.accountId)) { //} telemetry_response.data[i].character.accountId.includes('account.')){
                //     human_count++;
                // }

                arrPlayerTeam.push({ 'name': record.character.name, 'teamId': record.character.teamId});
                
                // ! create arrTeams array
                // [{ 'teamId': teamId, 'teammates': [{'playerName': name, 'isBot': bool}] }]
                var team        = new Object();
                team.teamId     = record.character.teamId;
                team.teammates  = [];

                var player                  = new Object();
                player.name                 = record.character.name;
                player.isBot                = hf.isBot(record.character.accountId);
                player.accountId            = record.character.accountId;
                player.isKnockedOrKilled    = false;    // need to be able to know the state of the other team members when a player is reduced to 0. if all down, it's a wipe.
                
                team.teammates.push(player);


                arrSurvivors.push({ 'name': player.name, 'teamId': team.teamId });


                var blTeamExists = false;

                for (let j = 0; j < arrTeams.length; j++){

                    if (arrTeams[j].teamId == team.teamId) {
                        blTeamExists = true;

                        arrTeams[j].teammates.push(player);
                        break;
                    }
                }

                // if there is no team for this teamId, create it...
                if (!blTeamExists) {
                    arrTeams.push(team);
                }


                if (record.character.name == playerName) {
                    playerTeamId = record.character.teamId;
                }


                //console.log('teamId: ' + record.character.teamId + ', ' + hf.strIsHumanOrBot(record.character.accountId) + ' ' + record.character.name);
            }

            strRecordTimestamp = '--:--';
        }
        else {
            strRecordTimestamp = hf.getDurationFromDatesTimestamp(matchStartTime, record._D);
        }

        // bots and humans leaving the plane
        // if (record._T == 'LogVehicleLeave') {
        //     if (record.vehicle.vehicleId == 'DummyTransportAircraft_C') {
        //         if (hf.isBot(record.character.accountId)) { //} telemetry_response.data[i].character.accountId.includes('account.')){
        //             bot_count2++;
        //         }
        //         else {
        //             human_count2++;
        //         }
        //          console.log('(' + i_string.padStart(5, ' ') + ') ' + hf.strIsHumanOrBot(record.character.accountId) + ' ' + record.character.name + ' left plane');
        //      }
        //  }

         if (record._T == 'LogMatchStart') {
            console.log('(' + i_string.padStart(5, ' ') + ') ' + record._T + ' -> ' + hf.translateMapName(record.mapName));

            //console.log('humans: ' + human_count + ', bots: ' + ai_count);

            matchStartTime = record._D;

            blBeforeMatchStart = false;            
        }
        else if (record._T == 'LogMatchEnd') {

            if (blTestingVersion) {
                console.log('(' + i_string.padStart(5, ' ') + ') ' + record._T + ' (get final stats here)');
                console.log(record);
            }
        }

        //
        //#endregion pre-match ------------------------------------------------------------------------>



        if (record._T == 'LogPlayerTakeDamage') {
            
            //#region //! [Region] LogPlayerTakeDamage...
            //

            //console.dir(i + ': ' + record);
            //strRecordTimestamp = hf.getDurationFromDatesTimestamp(matchStartTime, record._D);
            
            try {
                // $ if attacker is null, is that always bluezone or environment damage?
                var _attackerName = (record.attacker == null) ? 'null' : record.attacker.name;

                //console.log('(' + i_string.padStart(5, ' ') + ') LogPlayerTakeDamage. attacker: ' + _attackerName + ', victim: ' + record.victim.name + 
                //', damageCauserName: ' + record.damageCauserName + ', damageReason: ' + record.damageReason + ', damageTypeCategory: ' + record.damageTypeCategory);

                // if not a solo, check for teammate damage

                if (record.attacker != null && record.damageTypeCategory != 'Damage_Groggy' && record.damage > 0) {

                    // filter out bot vs. bot damage:
                    if (hf.isBot(record.attacker.accountId) && hf.isBot(record.victim.accountId)) {
                        continue;
                    }

                    var _teammateDamage = (record.attacker.name != record.victim.name && record.attacker.teamId == record.victim.teamId) ? ' *teammate-damage*' : '';
                    var _selfDamage     = (record.attacker.name == record.victim.name) ? ' *self-damage*' : '';
                    var _killshot       = (parseInt(record.victim.health - record.damage) == 0) ? ' *killshot*' : '';
                    var _distance       = hf.getDistanceXYZ(record.attacker.location, record.victim.location);

                    arrDamageLog.push('(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [' + _attackerName.padEnd(16, ' ') + '   ' + record.victim.name.padEnd(16, ' ') + ']  __' +
                    hf.strIsHumanOrBot(record.attacker.accountId).padEnd(5, ' ') + ' * ' + hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' ') + 
                    ' attacker health: ' + parseInt(record.attacker.health) + ' vs ' +  parseInt(record.victim.health) + 
                    ' (-' + parseInt(record.damage) + ' -> ' + (parseInt(record.victim.health - record.damage)) + ') distance: ' + _distance + 'm, ' + 
                    hf.translateDamageTypeCategory(record.damageTypeCategory) + '/' + hf.translateDamageCauserName(record.damageCauserName) + '/' + record.damageReason + 
                    _selfDamage + _teammateDamage + _killshot);



                    // client stuff --------------------------------------->
                    var _attacker   = new Object();
                    var _victim     = new Object();

                    playerDamageLog._T              = 'LogPlayerTakeDamage';
                    playerDamageLog.matchTime       = strRecordTimestamp;
                    playerDamageLog.killingStroke   = (record.victim.health - record.damage == 0) ? true : false;

                    _attacker.name              = record.attacker.name;
                    _attacker.isBot             = hf.isBot(record.attacker.accountId);
                    _attacker.teamId            = record.attacker.teamId;
                    _attacker.health            = record.attacker.health;

                    _victim.name                = record.victim.name;
                    _victim.isBot               = hf.isBot(record.victim.accountId);
                    _victim.teamId              = record.victim.teamId;
                    _victim.healthBeforeDamage  = record.victim.health;
                    _victim.healthAfterDamage   = record.victim.health - record.damage;
                    _victim.zone                = record.victim.zone;

                    // ! add to bot names if this bot is a late spawner
                    if (_attacker.isBot) {
                        if (!allBotNames.includes(_attacker.name)) {
                            allBotNames += '|' + _attacker.name;
                        }
                    }

                    if (_victim.isBot) {
                        if (!allBotNames.includes(_victim.name)) {
                            allBotNames += '|' + _victim.name;
                        }
                    }

                    playerDamageLog.attacker    = _attacker;
                    playerDamageLog.victim      = _victim;

                    playerDamageLog.damage              = record.damage;
                    
                    //playerDamageLog.distance            = _distance;

                    if ((record.attacker.location.x == 0 && record.attacker.location.y == 0 && record.attacker.location.z == 0) || 
                        (record.victim.location.x   == 0 && record.victim.location.y   == 0 && record.victim.location.z   == 0)) {
                        // this is probably a bot that is throwing the distances off so just return -1
                        playerDamageLog.distance = -1;
                    }
                    else {
                        playerDamageLog.distance = hf.getDistanceXYZ(record.attacker.location, record.victim.location);
                    }


                    playerDamageLog.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);
                    playerDamageLog.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);
                    playerDamageLog.damageReason        = record.damageReason;

                    playerDamageLog.teammateDamage  = (record.attacker.name != record.victim.name && record.attacker.teamId == record.victim.teamId) ? true : false;
                    playerDamageLog.selfDamage      = (record.attacker.name == record.victim.name) ?  true : false;

                    // $ log teammate/self kills and knocks here?
                    // $ log enemy kills here too?
                    
                    // $ what to do about environment damage and kills?

                    arrPlayersDamageLog.push(playerDamageLog);
                }
                else if (record.attacker == null) {
                    //null_attacker.push(record.damageTypeCategory);
                    // pretty much just bluezone and blackzone. why not redzone? because insta-knock?
                }
            }
            catch (error) {
                console.error('(' + i_string.padStart(5, ' ') + ') : ' + ' + error: ' + error.message);
            }



            // ! 'LogPlayerTakeDamage' : need to keep track of when teammates are knocked 
            // update the arrTeams' isKnockedOrKilled variable
            if (playerDamageLog.killingStroke) {
                // if this player is reduced to 0, then update arrTeams
                arrTeams.forEach(team => {
                    if (team.teamId == record.victim.teamId) {
                        team.teammates.forEach(teammate => {
                            if (teammate.name == record.victim.name) {
                                teammate.isKnockedOrKilled = true;
                            }
                        })
                    }
                })
            }

            //
            //#endregion 'LogPlayerTakeDamage'

        }
        else if (record._T == 'LogPlayerMakeGroggy') {

            //#region // ! [Region] LogPlayerMakeGroggy...
            //

            //console.log(record);
            //strRecordTimestamp = hf.getDurationFromDatesTimestamp(matchStartTime, record._D);

            var teammateKnock = '';
            var selfKnock = '';

            if (record.attacker.name == record.victim.name) {
                selfKnock = ' *self-knock*';
            }
            else if (record.attacker.teamId == record.victim.teamId) {
                // if the knocker was on the same team, it's a teammate kill
                teammateKnock = ' *teammate knock*';
            }


            // knocked by player or environment?
            if (!record.attacker.name == '') {
                // this is a knock by a player or bot
                // console.log('(' + i_string.padStart(5, ' ') + ') '  + strRecordTimestamp + ' [' + record.attacker.name.padEnd(16, ' ') + ' v ' + record.victim.name.padEnd(16, ' ') + ']  ' +
                // hf.strIsHumanOrBot(record.attacker.accountId).padEnd(5, ' ') + ' v ' + hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' ') + ' ' + 
                // hf.translateDamageCauserName(record.damageCauserName) + selfKnock + teammateKnock);

                _recordLog = '(' + i_string.padStart(5, ' ') + ') '  + strRecordTimestamp + ' [' + record.attacker.name.padEnd(16, ' ') + ' v ' + record.victim.name.padEnd(16, ' ') + ']  ' +
                                hf.strIsHumanOrBot(record.attacker.accountId).padEnd(5, ' ') + ' v ' + hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' ') + ' ' + 
                                hf.translateDamageCauserName(record.damageCauserName) + selfKnock + teammateKnock

                arrKnocks.push({'knocked_player': record.victim.name, 'whodunit': record.attacker.name});

                arrKillFeedLog.push(_recordLog);
                arrDamageLog.push(_recordLog)



                // client stuff --------------------------------------->
                var _attacker   = new Object();
                var _victim     = new Object();
                playerDamageLog._T          = 'LogPlayerMakeGroggy';
                playerDamageLog.matchTime   = strRecordTimestamp;
                playerDamageLog.byPlayer    = true;


                _attacker.name              = record.attacker.name;
                _attacker.isBot             = hf.isBot(record.attacker.accountId);
                _attacker.teamId            = record.attacker.teamId;
                _attacker.health            = record.attacker.health;
                
                _victim.name                = record.victim.name;
                _victim.isBot               = hf.isBot(record.victim.accountId);
                _victim.teamId              = record.victim.teamId;
                _victim.zone                = record.victim.zone;

                playerDamageLog.attacker    = _attacker;
                playerDamageLog.victim      = _victim;

                playerDamageLog.damage              = record.damage;
                //playerDamageLog.distance            = hf.getDistanceXYZ(record.attacker.location, record.victim.location);

                if ((record.attacker.location.x == 0 && record.attacker.location.y == 0 && record.attacker.location.z == 0) || 
                    (record.victim.location.x   == 0 && record.victim.location.y   == 0 && record.victim.location.z   == 0)) {
                    // this is probably a bot that is throwing the distances off so just return -1
                    playerDamageLog.distance = -1;
                }
                else {
                    playerDamageLog.distance = hf.getDistanceXYZ(record.attacker.location, record.victim.location);
                }

                playerDamageLog.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);
                playerDamageLog.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);
                playerDamageLog.damageReason        = record.damageReason;

                playerDamageLog.teammateKnock   = (record.attacker.name != record.victim.name && record.attacker.teamId == record.victim.teamId) ? true : false;
                playerDamageLog.selfKnock       = (record.attacker.name == record.victim.name) ?  true : false;

                arrPlayersDamageLog.push(playerDamageLog);
            }
            else {
                // this is an environment knock
                // console.log('(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [*' + hf.translateDamageTypeCategory(record.damageTypeCategory).padEnd(15, ' ') + ' v ' + 
                // record.victim.name.padEnd(16, ' ') + ']  *env* v ' + hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' '));

                _recordLog = '(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [*' + hf.translateDamageTypeCategory(record.damageTypeCategory).padEnd(15, ' ') + ' v ' + 
                                record.victim.name.padEnd(16, ' ') + ']  *env* v ' + hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' ');

                arrKillFeedLog.push(_recordLog);
                arrDamageLog.push(_recordLog);

                arrKnocks.push({'knocked_player': record.victim.name, 'whodunit': record.damageTypeCategory});


                // client stuff (environment knock) --------------------------->
                var _attacker   = new Object();
                var _victim     = new Object();

                playerDamageLog._T          = 'LogPlayerMakeGroggy';
                playerDamageLog.matchTime   = strRecordTimestamp;
                playerDamageLog.byPlayer    = false;

                _attacker.name = '<' + hf.translateDamageTypeCategory(record.damageTypeCategory) + '>';
                
                _victim.name    = record.victim.name;
                _victim.isBot   = hf.isBot(record.victim.accountId);
                _victim.teamId  = record.victim.teamId;
                _victim.zone    = record.victim.zone;

                playerDamageLog.attacker    = _attacker;
                playerDamageLog.victim      = _victim;

                playerDamageLog.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);
                playerDamageLog.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);
                playerDamageLog.damageReason        = record.damageReason;

                arrPlayersDamageLog.push(playerDamageLog);
            }

            //
            //#endregion LogPlayerMakeGroggy

        }
        else if (record._T == 'LogPlayerRevive') {

            //#region // ! [Region] LogPlayerRevive...
            //

            //console.log(record);
            //strRecordTimestamp = hf.getDurationFromDatesTimestamp(matchStartTime, record._D);

            //console.log('(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [' + record.reviver.name.padEnd(16, ' ') + ' ^ ' + record.victim.name.padEnd(16, ' ') + ']');
            _recordLog = '(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [' + record.reviver.name.padEnd(16, ' ') + ' ^ ' + record.victim.name.padEnd(16, ' ') + ']';

            arrKillFeedLog.push(_recordLog);
            arrDamageLog.push(_recordLog);


            // ! need to keep track of when teammates are revived 
            // update the arrTeams' isKnockedOrKilled variable
            arrTeams.forEach(team => {
                if (team.teamId == record.victim.teamId) {
                    team.teammates.forEach(teammate => {
                        if (teammate.name == record.victim.name) {
                            teammate.isKnockedOrKilled = false;
                        }
                    })
                }
            })


            // remove knocked player from arrKnocks list
            var remove_index = arrKnocks.findIndex(function(item, i) {
                // https://stackoverflow.com/questions/36419195/get-index-from-a-json-object-with-value/36419269
                return item.knocked_player == record.victim.name;
            })

            if (remove_index > -1){
                arrKnocks.splice(remove_index, 1);
            }


            // client stuff ------------------------------->
            playerDamageLog._T          = 'LogPlayerRevive';
            playerDamageLog.matchTime   = strRecordTimestamp;
            playerDamageLog.attacker    = record.reviver;   // need to switch this to attacker so client can find it instead of searching for "reviver" when only this even has that.
            playerDamageLog.victim      = record.victim;

            arrPlayersDamageLog.push(playerDamageLog);


            //
            //#endregion LogPlayerRevive -----------------------------

        }
        else if (record._T == 'LogPlayerKill') {

            //#region  // ! [Region] 'LogPlayerKill'
            // 

            try {

                //strRecordTimestamp = hf.getDurationFromDatesTimestamp(matchStartTime, record._D);

                //console.log(record);

                var victim_player_type = hf.strIsHumanOrBot(record.victim.accountId).padEnd(5, ' '); //  (record.victim.accountId.includes('account')) ? 'human' : 'ai   ';                

                // damage causer
                // https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/damageCauserName.json

                // count deaths
                if (hf.isBot(record.victim.accountId)) { // record.victim.accountId.includes('account')) {
                    ai_deaths++;
                }
                else {
                    human_deaths++;
                }


                if (record.killer == null) {

                    // ! (environment kill) if the player didn't die to a killer

                    var killer_player_type = '*env*';

                    // $ need to know if environment "thirsted" the player?

                    // console.log('(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [*' + hf.translateDamageTypeCategory(record.damageTypeCategory).padEnd(15, ' ') + 
                    //             ' x ' + record.victim.name.padEnd(16, ' ') + ']  ' + killer_player_type + ' x '  + victim_player_type);

                    _recordLog = '(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [**' + hf.translateDamageTypeCategory(record.damageTypeCategory).padEnd(15, ' ') + 
                                 ' x ' + record.victim.name.padEnd(16, ' ') + ']  ' + killer_player_type + ' x '  + victim_player_type;

                    arrKillFeedLog.push(_recordLog);
                    arrDamageLog.push(_recordLog);


                    // arrPlayersDamageLog (environment kill) ----------------------------->
                    var _attacker   = new Object();
                    var _victim     = new Object();
                    playerDamageLog._T          = 'LogPlayerKill';
                    playerDamageLog.matchTime   = strRecordTimestamp;
                    playerDamageLog.byPlayer    = false;

                    playerDamageLog.isSelfKill      = null;
                    playerDamageLog.isThirst        = null;
                    playerDamageLog.isTeammateKill  = null;

                    //playerDamageLog.isBleedOut      = null;
                    playerDamageLog.isNoRevive      = null;     // died while knocked (not rezed, timer ran out)
                    playerDamageLog.isTeamWipe      = null;     // died while knocked (because team was wiped)


                    _attacker.name = '<' + hf.translateDamageTypeCategory(record.damageTypeCategory) + '>';
                    
                    _victim.name    = record.victim.name;
                    _victim.isBot   = hf.isBot(record.victim.accountId);
                    _victim.teamId  = record.victim.teamId;
                    _victim.zone    = record.victim.zone;

                    // ! add to bot names if this bot is a late spawner
                    if (_victim.isBot) {
                        allBotNames += '|' + _victim.name; // for finding bots in tree
                    }

                    // playerDamageLog.attacker    = _attacker;
                    // playerDamageLog.victim      = _victim;

                    playerDamageLog.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);
                    playerDamageLog.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);
                    playerDamageLog.damageReason        = record.damageReason;

                    // arrPlayersDamageLog.push(playerDamageLog);
                    // arrEnvironmentKills.push( { 'damageTypeCategory':   playerDamageLog.damageTypeCategory,
                    //                             'damageCauserName':     playerDamageLog.damageCauserName,
                    //                             'damageReason':         playerDamageLog.damageReason } ); 


                    // kill tree stuff (environment kill) -------------------------------------->
                    _victim.timeOfDeath         = strRecordTimestamp;
                    _victim.isThirst            = null; // $ need to know if environment knocked and then thirsted? or if environment thirsted a knock by player? probably not...
                    _victim.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);    //playerDamageLog.damageTypeCategory;
                    _victim.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);        // playerDamageLog.damageCauserName;
                    _victim.damageReason        = record.damageReason;                                          //playerDamageLog.damageReason;

                    // _victim.isSelfKill      = null;
                    // _victim.isThirst        = null;
                    // _victim.isTeammateKill  = null;

                    // _victim.isBleedOut      = null;
                    // _victim.isNoRevive      = null;     // died while knocked (not rezed, timer ran out)
                    // _victim.isTeamWipe      = null;     // died while knocked (because team was wiped)

                    // _victim.isThirst        = playerDamageLog.isThirst;
                    // _victim.isSelfKill      = playerDamageLog.isSelfKill; 
                    // _victim.isTeammateKill  = playerDamageLog.isTeammateKill; 

                    // _victim.isBleedOut      = playerDamageLog.isBleedOut;
                    // _victim.isNoRevive      = playerDamageLog.isNoRevive;
                    // _victim.isTeamWipe      = playerDamageLog.isTeamWipe;


                    playerDamageLog.attacker    = _attacker;
                    playerDamageLog.victim      = _victim;


                    arrPlayersDamageLog.push(playerDamageLog);
                    arrEnvironmentKills.push( { 'damageTypeCategory':   hf.translateDamageTypeCategory(record.damageTypeCategory),
                                                'damageCauserName':     hf.translateDamageCauserName(record.damageCauserName),
                                                'damageReason':         record.damageReason } ); 


                    // arrKillerVictims -------------------------->
                    // for (j = 0; j < arrKillerVictims.length; j++) {
                    //     if (arrKillerVictims[j].name == _attacker.name) {
                    //         blKillerExists = true;
                    //         arrKillerVictims[j].victims.push(_victim);   // add victim to this killer's victims array
                    //         break;
                    //     }
                    // }

                    // if there is no record for this killer, create it...
                    // if (!blKillerExists) {
                    //     killer.name     = _attacker.name;
                    //     killer.type     = 'environment';    // either environment or player (human or bot)
                    //     killer.isBot    = null;
                    //     killer.teamId   = null;

                    //     killer.victims.push(_victim);
                    //     arrKillerVictims.push(killer);
                    // }


                    arrKillLog.push({ 'killer': _attacker.name, 'victim': record.victim.name });  // killer:victim

                    //debugger;

                    // end of environment kill -------------------------
                }
                else {
                    // ! Player kill (not environment)... 

                    var killer_player_type = hf.strIsHumanOrBot(record.killer.accountId).padEnd(5, ' '); // (record.killer.accountId.includes('account')) ? 'human' : 'ai   ';
                    var damage_info     = '';
                    var selfKill        = '';
                    var thirst          = '';
                    var teammateKill    = '';

                    playerDamageLog.isSelfKill      = null;
                    playerDamageLog.isThirst        = null;
                    playerDamageLog.isTeammateKill  = null;
                    //playerDamageLog.isBleedOut      = null;

                    playerDamageLog.isNoRevive      = null;     // died while knocked (not rezed, timer ran out)
                    playerDamageLog.isTeamWipe      = null;     // died while knocked (because team was wiped)


   
                    // self-kill
                    // self-kill while knocked by player                    
                    // self-kill while knocked by environment
                    if (record.killer.accountId == record.victim.accountId) {
                        // this player died to themself (could have been self-kill or bled out while knocked)

                        // $ if they were knocked, then attribute the kill to the knocker (player or environment)
                        // if they were not knocked, then it's just a self-kill

                        var knock_index = arrKnocks.findIndex(function(item, i) {
                            return item.knocked_player == record.victim.name;
                        })

                        if (knock_index > -1) {
                            // if they were knocked, who knocked them?
                            selfKill = ' *(not self kill) died while knocked by ' + arrKnocks[knock_index].whodunit + '*';

                            playerDamageLog.isSelfKill = false;
                            //_victim.isSelfKill = false;
                        }
                        else {
                            // they were not knocked while they died
                            selfKill = ' *self-kill*';

                            playerDamageLog.isSelfKill = true;
                            //_victim.isSelfKill = true;

                            arrSelfKills.push(record.victim.name);
                        }

                        selfKill += ' ' + hf.translateDamageTypeCategory(record.damageTypeCategory);
                    }
                    else {
                        // if they were killed while knocked and they didn't die to themselves, it's a thirst...
                        var knock_index = arrKnocks.findIndex(function(item, i) {
                            return item.knocked_player == record.victim.name;
                        })

                        if (knock_index > -1) {
                            thirst = " *thirst*"

                            playerDamageLog.isThirst = true;
                            //_victim.isThirst = true;
                        }
                        else {
                            playerDamageLog.isThirst = false;
                            //_victim.isThirst = false;
                        }


                        // if the killer was on the same team, it's a teammate kill
                        if (record.killer.teamId == record.victim.teamId) {
                            teammateKill = ' *teammate kill*';

                            playerDamageLog.isTeammateKill = true;
                            //_victim.isTeammateKill = true;
                        }
                        else {
                            playerDamageLog.isTeammateKill = false;
                            //_victim.isTeammateKill = false;
                        }
    
                    }


                    if (record.damageTypeCategory != 'Damage_Groggy') {

                        // if they died by self killing, then show the type category?
                        if (record.damageTypeCategory == 'Damage_Instant_Fall' ||
                            record.damageTypeCategory == 'Damage_Drown') {
                            damage_info = hf.translateDamageTypeCategory(record.damageTypeCategory);
                        }
                        else {
                            damage_info = hf.translateDamageCauserName(record.damageCauserName);
                        }
                    }
                    else if (record.damageTypeCategory == 'Damage_Groggy'       || 
                             record.damageTypeCategory == 'Damage_Instant_Fall' ) {
                        // if they die from being groggy, then it's not a thirst.
                        thirst = '';
                        playerDamageLog.isThirst = false; // reset if not a thirst
                        //_victim.isThirst = false; // reset if not a thirst
                        

                        // $ if you are aware of the last living partner's death, then you will know if this bleed out is from no-rez or team-wipd

                        if (record.damageTypeCategory == 'Damage_Groggy') {
                            damage_info = 'Bled-out';
                            // playerDamageLog.isBleedOut = true;
                            //_victim.isBleedOut = true;


                            // does this victim have any teammates up? 
                            // if no teammates are currently up, then this death is a team wipe.
                            // if teammates are up, then this death is a bleed-out from not being revive
                            let blTeamWiped = true; // assume a wipe. if a teammate is still up, then reverse it.

                            //console.log('victim: ' + record.victim.name);
                            arrTeams.forEach(team => {
                                if (team.teamId == record.victim.teamId) {
                                    // check each teammate's knocked status
                                    //console.log('teamId: ' + team.teamId);
                                    team.teammates.forEach(teammate => {
                                        //console.log('teammate.isKnockedOrKilled: ' + teammate.isKnockedOrKilled + ', -> ' + teammate.name);
                                        if (!teammate.isKnockedOrKilled) {
                                            blTeamWiped = false;
                                        }
                                    })
                                }
                            })

                            if (blTeamWiped) {
                                playerDamageLog.isNoRevive  = false;
                                playerDamageLog.isTeamWipe  = true;
                                // _victim.isNoRevive  = false;
                                // _victim.isTeamWipe  = true;
                            }
                            else {
                                playerDamageLog.isNoRevive  = true;
                                playerDamageLog.isTeamWipe  = false;
                                // _victim.isNoRevive  = true;
                                // _victim.isTeamWipe  = false;
                            }

                            //console.log('blTeamWiped: ' + blTeamWiped)
                            //debugger;

                        }
                        else { 
                            // playerDamageLog.isBleedOut = false;
                            // _victim.isBleedOut = false;
                        }
                    }


                    // remove thirst if killed by environment since environment can't thirst
                    if (record.damageTypeCategory == 'Damage_BlueZone' || 
                        record.damageTypeCategory == 'Damage_Drown' || 
                        record.damageTypeCategory == 'Damage_Explosion_BlackZone' || 
                        record.damageTypeCategory == 'Damage_Instant_Fall' || 
                        record.damageTypeCategory == 'Damage_Explosion_RedZone') {
                            thirst = '';
                            playerDamageLog.isThirst = false; // reset if not a thirst
                            // _victim.isThirst = false; // reset if not a thirst
                    }


                    // console.log('(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [' + record.killer.name.padEnd(16, ' ') + 
                    //             ' x ' + record.victim.name.padEnd(16, ' ') + ']  ' + killer_player_type + ' x '  + victim_player_type + ' ' + damage_info + selfKill + thirst + teammateKill);
                    _recordLog = '(' + i_string.padStart(5, ' ') + ') ' + strRecordTimestamp + ' [' + record.killer.name.padEnd(16, ' ') + 
                                    ' x ' + record.victim.name.padEnd(16, ' ') + ']  ' + killer_player_type + ' x '  + victim_player_type + ' ' + damage_info + selfKill + thirst + teammateKill;


                    arrKillFeedLog.push(_recordLog);
                    arrDamageLog.push(_recordLog);



                    // arrPlayersDamageLog (player kill, not environment) --------------------------------->
                    var _attacker   = new Object();
                    var _victim     = new Object();
                    playerDamageLog._T          = 'LogPlayerKill';
                    playerDamageLog.matchTime   = strRecordTimestamp;
                    playerDamageLog.byPlayer    = true;

                    _attacker.name      = record.killer.name;
                    _attacker.isBot     = hf.isBot(record.killer.accountId);
                    _attacker.teamId    = record.killer.teamId;
                    _attacker.health    = record.killer.health;

                    _victim.name        = record.victim.name;
                    _victim.isBot       = hf.isBot(record.victim.accountId);
                    _victim.teamId      = record.victim.teamId;
                    _victim.zone        = record.victim.zone;

                    // ! add to bot names if this bot is a late spawner
                    // if (_attacker.isBot) {
                    //     allBotNames += '|' + _attacker.name; // for finding bots in tree
                    //     addBotToTeamsArray(_attacker.name, _attacker.teamId);
                    // }

                    if (_victim.isBot) {
                        allBotNames += '|' + _victim.name; // for finding bots in tree
                    }

                    // playerDamageLog.attacker    = _attacker;
                    // playerDamageLog.victim      = _victim;

                    playerDamageLog.damage              = record.damage;

                    if ((record.killer.location.x == 0 && record.killer.location.y == 0 && record.killer.location.z == 0) || 
                        (record.victim.location.x == 0 && record.victim.location.y == 0 && record.victim.location.z == 0)) {
                            // this is probably a bot that is throwing the distances off so just return -1
                        playerDamageLog.distance = -1;
                    }
                    else {
                        playerDamageLog.distance = hf.getDistanceXYZ(record.killer.location, record.victim.location);
                    }

                    playerDamageLog.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);
                    playerDamageLog.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);
                    playerDamageLog.damageReason        = record.damageReason;

                    // arrPlayersDamageLog.push(playerDamageLog);



                    // (CLIENT) kill tree stuff (player kills) -------------------------------------->
                    _victim.killerHealth        = record.killer.health;
                    _victim.timeOfDeath         = strRecordTimestamp;

                    // _victim.isThirst            = playerDamageLog.isThirst;
                    // _victim.isSelfKill          = playerDamageLog.isSelfKill;
                    // _victim.isTeammateKill      = playerDamageLog.isTeammateKill;

                    // _victim.isBleedOut          = playerDamageLog.isBleedOut;
                    // _victim.isTeamWipe          = playerDamageLog.isTeamWipe;
                    // _victim.isNoRevive          = playerDamageLog.isNoRevive;

                    // _victim.damageTypeCategory  = hf.translateDamageTypeCategory(record.damageTypeCategory);    //playerDamageLog.damageTypeCategory;
                    // _victim.damageCauserName    = hf.translateDamageCauserName(record.damageCauserName);        //playerDamageLog.damageCauserName;
                    // _victim.damageReason        = record.damageReason;                                          //playerDamageLog.damageReason;

                    playerDamageLog.attacker    = _attacker;
                    playerDamageLog.victim      = _victim;

                    arrPlayersDamageLog.push(playerDamageLog);


                    // arrKillerVictims -------------------------->
                    // for (j = 0; j < arrKillerVictims.length; j++) {
                    //     if (arrKillerVictims[j].name == record.killer.name) {
                    //         blKillerExists = true;
                    //         arrKillerVictims[j].victims.push(_victim);   // add victim to this killer's victims array

                    //         break;
                    //     }
                    // }

                    // if there is no record for this killer, create it...
                    // if (!blKillerExists) {
                    //     killer.name     = record.killer.name;
                    //     killer.isBot    = hf.isBot(record.killer.accountId);
                    //     killer.type     = 'player'; // (set to self kill if their only kill was themselves)
                    //     killer.teamId   = record.killer.teamId;

                    //     killer.victims.push(_victim);
                    //     arrKillerVictims.push(killer);
                    // }


                    arrKillLog.push({ 'killer': record.killer.name, 'victim': record.victim.name });  // killer:victim

                    //debugger;
                }
            }
            catch (err) {
                console.log('(' + i_string.padStart(5, ' ') + ') error: ' + err);
            }



            // update the arrTeams' isKnockedOrKilled variable
            // this is done originally in the damage to 0 event but bots are weird so making it explicit here.
            arrTeams.forEach(team => {
                if (team.teamId == record.victim.teamId) {
                    team.teammates.forEach(teammate => {
                        if (teammate.name == record.victim.name) {
                            teammate.isKnockedOrKilled = true;
                        }
                    })
                }
            })


            // remove victim from the survivors array...
            var x = arrSurvivors.findIndex(function(item, j) {
                return item.name == record.victim.name;                
            })

            if (x > -1) {
                arrSurvivors.splice(x, 1);
            }

            // $ maybe don't need a "survived" tag in KillerVictims because what if the survivor didn't kill anybody and just lived while a person died of env?
            // $ just pull it from the match data and flag from that.

            //
            //#endregion 'LogPlayerKill' ----------------------------------------

        } // LogPlayerKill


        // enter this playerDamageLog into arrPlayersDamageLog

        //debugger;

    }   // i loop


    // $ debugger is breaking before this point

    //#region // ! [Region] Create csv data for D3
    //
    // root (match) -> winners
    //                  -> survivor 01
    //                  -> survivor 02 etc.
    //              -> environment kills
    //              -> self kills

    let csvDataForD3    = 'name,parent\n' +
                          'Match,\n';

    // [Winners branch] ------------------
    if (arrSurvivors.length > 1) {
        csvDataForD3 += 'Winners,Match\n';

        arrSurvivors.forEach(element => {
            csvDataForD3 += element.name + ',Winners\n'
        })
    }
    else {
        csvDataForD3 += 'Winner,Match\n';
        csvDataForD3 += arrSurvivors[0].name + ',Winner\n';
    }


    // [Self kills branch] -------------------------
    if (arrSelfKills.length > 0) {
        //csvDataForD3 += 'Self kills,Match\n';
    }
    else {
        //csvDataForD3 += 'Self kills,Match\n';
    }

    let blSelfKillsFound = false;
    arrKillLog.forEach(element => {
        if (element.killer == element.victim && !blSelfKillsFound) {
            csvDataForD3 += 'Self kills,Match\n';
            blSelfKillsFound = true;
        }
    });



    // ! correct for cycle kills -------------------------------------------------------
    let blCycleKillsFound   = false;    // if changed, then add the name/parent record for cycle kills to the end of the list'
    for (let i = 0; i < arrKillLog.length; i++) {

        // for each record (after filtering out categories) get the killer's name and then go down the rest of the list to see if that person was the victim
        // of the current victim. if so, then change the killer's name to '(killername)' 
        // - add a '*Cycle kills*, Match' record (only once)
        // - add a '(killername), *Cycle kills*' record so that it links up
        // - add a '(vicimname), *Cycle kills*' record so that it links up
        // - change the record at the next kill so that both records are edited

        // victim, killer

        // does this killer subseqently die to this victim?

        for (let j = i; j < arrKillLog.length; j++) {
            //console.log('j loop -> killer: ' + arrKillLog[j].killer + ' - ' + arrKillLog[j].victim);

            if (i != j && 
                arrKillLog[i].killer == arrKillLog[j].victim && 
                arrKillLog[j].killer == arrKillLog[i].victim) {

                //console.log(i + ' -> cycle kill: ' + arrKillLog[i].killer + ' -> ' + arrKillLog[i].victim);
                //console.log(j + ' -> cycle kill: ' + arrKillLog[j].killer + ' -> ' + arrKillLog[j].victim);

                // need to update these two records
                arrKillLog[i].killer = '(' + arrKillLog[i].killer + ')';
                arrKillLog[j].killer = '(' + arrKillLog[j].killer + ')';

                // add these two (killers) to the end of arrKillLog 
                arrKillLog.push( { 'killer': 'Cycled kills', 'victim': arrKillLog[i].killer });
                arrKillLog.push( { 'killer': 'Cycled kills', 'victim': arrKillLog[j].killer });

                blCycleKillsFound = true;
            }
        }
    }

    if (blCycleKillsFound) {
        csvDataForD3 += 'Cycled kills,Match\n';
    }


    // [Environment kills branch] -------------------------
    if (arrEnvironmentKills.length > 0) {
        csvDataForD3 += 'Environment kills,Match\n';

        // arrEnvironmentKills.forEach(element => {
        //     csvDataForD3 += element.damageCauserName + ',environment kills\n'
        // })
    }
    

    // ---------------------------
    let tmpEnv = ''
    arrKillLog.forEach(element => {
        // cycle through the kill log and get parents


        if (element.killer.includes('<')) {
            // this is an environment kill

            //console.log(element.killer);

            // create parent connection for this environment kill type
            if (!tmpEnv.includes(element.killer)) {
                tmpEnv += element.killer + ',';
                csvDataForD3 += element.killer + ',Environment kills\n';
            }

            csvDataForD3 += element.victim + ',' + element.killer + '\n';
        }
        else {
            // this is a regular player kill

            // $ SELF KILLS CURRENTLY BREAK, SO GET READY TO FIX THAT
            // $ AMBIGUOUS means they already exist?
            if (element.killer == element.victim) {
                csvDataForD3 += element.victim + ',Self kills\n';
            }
            else {
                csvDataForD3 += element.victim + ',' + element.killer + '\n';
            }
        }
    })


    // $ cycle through the kill log and get parents of each kill
    // $ if the killer name contains '<' then the killer's parent is evironment kill, and it's victims is added to those kills


    //#endregion -------------------------------------------------------
    

 
    // ! print damage log
    if (blTestingVersion){
        console.log('arrTeams:',        arrTeams);
        console.log('arrPlayerTeam',    arrPlayerTeam);

        //console.log('arrKillerVictims', arrKillerVictims);
        console.log('arrKillLog',       arrKillLog);
        console.log('arrSurvivors',     arrSurvivors);
    
        //console.log('csvDataForD3',     csvDataForD3);
        //console.log(null_attacker);
    
        // ! print killfeed log
        // console.log('KillFeed log...');
        // for (let j = 0; j < arrKillFeedLog.length; j++) {
        //     console.log(arrKillFeedLog[j]);
        // }

        console.log('arrDamageLog...');
        for (let j = 0; j < arrDamageLog.length; j++){
            console.log(arrDamageLog[j]);
        }

        //console.dir(arr_T);
        console.log('human deaths: ' + human_deaths + ', ai deaths: ' + ai_deaths);

        console.log('done searching telemetry.');
    }



    var hooty_response = { matchDetails, arrPlayerCards, allHumanNames, allBotNames, arrSelfKills, csvDataForD3, playerTeamId, arrTeams, arrSurvivors, arrKillLog, 
                           arrEnvironmentKills, arrPlayersDamageLog, pubgApiMatchResponseInfo, pubgApiTelemetryResponseInfo };
    res.send(hooty_response);

})





// ! ------------------------------------------------------------------------------------------------------>
// ! Helper functions
// ! 

function writeCacheFileJSON(filename, data) {

    //#region // ! [Region]
    //

    try {

        // compress data before writing it...
        // https://www.geeksforgeeks.org/node-js-zlib-gzip-method/
        zlib.gzip(JSON.stringify(data), (err, buffer) => {
            if (err) {
                console.log('writeCacheFileJSON() zlib.gip error compressing' + err.message);
            }

            fs.writeFileSync(filename, buffer, function (err) {
                if (err) {
                    console.log('writeCacheFileJSON() fs.writeFileSync error compressing' + err.message);
                }
   
            })
        });

        
        // ---------------------------------------------------------------------->
        // fs.writeFileSync(filename, JSON.stringify(data, null, 0), function (err) {
        //     if (err) {
        //         console.log('error writing match cache file: ' + filename);
        //         throw 'writeCacheFileJSON() error for file ' + filename + ' -> ' + error.response.status + ', ' + error.response.statusText;
        //     }
        //     else {
        //         //console.log('created match cache file: ' + match_cache_file);
        //     }
        // })
    } 
    catch (error) {
        console.log('error writing match cache file: ' + filename);
        throw 'writeCacheFileJSON() error for file ' + filename + ' -> ' + error.code + ', ' + error.message;

        // $ verify this throw actually works back at the caller
    }

    //#endregion

}


function readCacheFileJSON(filename) {

    try {

        // i don't know how i got this working but it seems to work...

        // decompress data before sending it back...
        var zipData     = fs.readFileSync(filename);
        var unzipped    = zlib.gunzipSync(zipData);

        return JSON.parse(unzipped.toString('utf8'));

        // ----------------------------------------------------->
        //var data = fs.readFileSync(filename, {encoding: 'utf8'});
        //return JSON.parse(data);            
    } 
    catch (error) {
        
        // throw this back to the caller and let it's try/catch block handle it...
        throw 'readPlayerCacheFileJSON() error for file ' + filename + ' -> ' + error.response.status + ', ' + error.response.statusText;

        // $ verify this throw actually works back at the caller
    }
}


function CreateCacheFolders() {
    // create cache folder skeleton if it does not exist.

    //#region // ! [Region] Create cache skeleton...
    // 

    const cache_root = './cache/';
    const cache_matches = './cache/matches/'
    const cache_players = './cache/players/'
    const cache_tel     = './cache/telemetry/'

    const cache_platform_psn = './cache/players/psn/';
    const cache_platform_stadia = './cache/players/stadia/';
    const cache_platform_steam = './cache/players/steam/';
    const cache_platform_tournament = './cache/players/tournament/';
    const cache_platform_xbox = './cache/players/xbox/';

    // top level
    if (!fs.existsSync(cache_root)) {
        fs.mkdirSync(cache_root);
    }

    if (!fs.existsSync(cache_matches)) {
        fs.mkdirSync(cache_matches);
    }

    if (!fs.existsSync(cache_players)) {
        fs.mkdirSync(cache_players);
    }

    if (!fs.existsSync(cache_tel)) {
        fs.mkdirSync(cache_tel);
    }

    // ----------------------------
    if (!fs.existsSync(cache_platform_psn)) {
        fs.mkdirSync(cache_platform_psn);
    }

    if (!fs.existsSync(cache_platform_stadia)) {
        fs.mkdirSync(cache_platform_stadia);
    }

    if (!fs.existsSync(cache_platform_steam)) {
        fs.mkdirSync(cache_platform_steam);
    }

    if (!fs.existsSync(cache_platform_tournament)) {
        fs.mkdirSync(cache_platform_tournament);
    }

    if (!fs.existsSync(cache_platform_xbox)) {
        fs.mkdirSync(cache_platform_xbox);
    }

    //#endregion

}

// Purge cache files...
function clearCache() {

    //#region // ! [Region] Purge Cache
    //

    const playersCacheGlobPattern   = './cache/players/**/*.*';
    const matchesCacheGlobPattern   = './cache/matches/**/*.*';
    const telemetryCacheGlobPattern = './cache/telemetry/**/*.*'

    var purge_count = 0;

    //console.log(getDate() + ' -> '  + cacheGlobPattern);

    // check players cache...
    glob(playersCacheGlobPattern, function (err, files) {
        if (err){
            console.log(chalk.yellow(getDate() +  " purge glob error: " + err));
        } else {
            //console.log(files);

            files.forEach(file => {
                const stat = fs.statSync(file);

                //console.log('curr time: ' + Date.now() + ' birthtime: ' + stat.birthtimeMs + ' age: ' + (Date.now() - stat.birthtimeMs) + ' -> ' + file);
                //curr time: 1589928871171 
                //birthtime: 1589928825360.3643

                // purge cache files older than 30 minutes (1,800,000 milliseconds)
                // 15 minutes = 900,000 milliseconds
                if (Date.now() - stat.birthtimeMs > 900000) { 

                    
                    fs.unlinkSync(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green( getDate() + ' purged player file -> ' + file));
                            purge_count++;
                        }
                    })
                }
            })
        }
    })


    // check matches cache for files to purge...
    glob(matchesCacheGlobPattern, function (err, files) {
        if (err){
            console.log(chalk.yellow(getDate() +  " purge glob error: " + err));
        } else {
            //console.log(files);

            files.forEach(file => {
                const stat = fs.statSync(file);

                //console.log('curr time: ' + Date.now() + ' birthtime: ' + stat.birthtimeMs + ' age: ' + (Date.now() - stat.birthtimeMs) + ' -> ' + file);
                //curr time: 1589928871171 
                //birthtime: 1589928825360.3643

                // purge match cache files older than 3 days...
                // 24 * 60 * 60     =  86,400 seconds per day
                // 86,400 * 3       = 259,200 seconds per 3 days
                // 259,200 * 1,000  = 259,200,000 milliseconds per 3 days
                // 86,400,000 = 24 hours?
                if (Date.now() - stat.birthtimeMs > 86400000) {  // testing 24 hours

                    // 600,000 = 10 minutes
                    fs.unlinkSync(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green(getDate() + ' purged match file -> ' + file));
                            purge_count++;
                        }
                    })
                }
            })
        }
    })


    // check matches cache for files to purge...
    glob(telemetryCacheGlobPattern, function (err, files) {
        if (err){
            console.log(chalk.yellow(getDate() +  " purge glob error: " + err));
        } else {
            //console.log(files);

            files.forEach(file => {
                const stat = fs.statSync(file);

                //console.log('curr time: ' + Date.now() + ' birthtime: ' + stat.birthtimeMs + ' age: ' + (Date.now() - stat.birthtimeMs) + ' -> ' + file);
                //curr time: 1589928871171 
                //birthtime: 1589928825360.3643

                // purge match cache files older than 3 days...
                // 24 * 60 * 60     =  86,400 seconds per day
                // 86,400 * 3       = 259,200 seconds per 3 days
                // 259,200 * 1,000  = 259,200,000 milliseconds per 3 days
                // 86,400,000 = 24 hours?
                if (Date.now() - stat.birthtimeMs > 86400000) {  // testing 24 hours

                    // 600,000 = 10 minutes
                    fs.unlinkSync(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green(getDate() + ' purged match file -> ' + file));
                            purge_count++;
                        }
                    })
                }
            })
        }
    })
    
    if (purge_count > 0) {
        console.log(getDate() + ' ' + purge_count + ' cache files purged');
    }
    else {
        console.log(getDate() + ' no files to purge.');
    }


    //
    //#endregion ----------------------------------------------------------------------

}


function UpdateDatabase() {

    // at whatever the interval is, update the database with whatever rows you have
    
    if (!blTestingVersion && dbRowsToInsert != '') {
        // if there is something to insert then insert it

        console.log('Updating database at interval.');

        const client = new Client({
            connectionString: databaseURL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    
        client.connect();

        let rows = dbRowsToInsert;
        //dbRowsToInsert = ''; // clear all the rows to be inserted


        // dateTimeMS, dateTimeEN, searchedPlayer, searchedPlatform, rateLimitRemaining
        let queryString = `INSERT INTO pubgapi (datetimems, datetimeen, player, platform, remain, ip) VALUES \n${rows};`;
        console.log('queryString: ' + queryString);

        client.query(queryString, (err, res) => {
            if (err) {
                console.log('database error: ' + err);
            }
            else {
                dbRowsToInsert = '';
            }

            client.end();
        });
    }
}


function getDate() {
    // https://momentjs.com/timezone/docs/

    return moment().tz("America/Chicago").format('YYYY.MM.DD_hh:mm:ss.SSS A'); //moment().toISOString().substring(11,23);
}   



function getTimeSinceMatch(strDate) {
    // return x minutes, hours, or days

    const diffTime      = Math.abs(Date.now() - Date.parse(strDate));
    const diffMinutes   = Math.ceil(diffTime / (1000 * 60));
    const diffHours     = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays      = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    //console.log(diffTime + " milliseconds");
    //console.log(diffMinutes + " minutes");
    //console.log(diffHours + " hours");
    //console.log(diffDays + " days");


    if (diffMinutes < 60) {
        return diffMinutes + ' min. ago';
    }
    else if (diffHours < 24) {
        return diffHours + ' hours ago';
    }
    else {
        return diffDays + ' days ago';
    }
}



function printTeamRoster(dctRoster) {
    var strRoster = ''

    dctRoster.forEach(element => {
        strRoster += element.name + ', ';
    })

    return strRoster;
}

