const express       = require('express');
const bodyParser    = require('body-parser');
const axios         = require('axios');
const moment        = require('moment-timezone');   //require('moment');
const app           = express();
const port          = 3000;
const fs            = require('fs');
const path          = require('path');
const glob          = require('glob');
const chalk         = require('chalk');             // https://www.npmjs.com/package/chalk


// ! Global variables...
var   apiKey    = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjZDhlMDFkMC02ODAwLTAxMzgtZTQ4Ny0wNjc0ZmE5YWVjOGYiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0Ijo'
      apiKey   += 'xNTg3Njk1MTM1LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6Im1pbmlzdGVya2F0YW9rIn0.HiuLi97rFSW-ho5zE1XBYmpV9E6M0Nj90qXIY1TWsco';
const strLine   = "--------------------------------------------";


// ? what is this app receiving from the user?
// ? what is this app requesting from the pubg api?
// ? what is this app receiving  from the pubg api?
// ? what is this app responding to the user with?


// ---------------------------->
// ! Cache Purging...
setInterval(clearCache, 300000); // check for cache clear every 5 minutes (300,000 milliseconds)


app.use(bodyParser.json());

// alias, literal
app.use('/', express.static(__dirname));    // so that root/pubg.js and root/index.html can be found

// ------------------------------------------------------------->
app.listen(port, () => {
    console.log(chalk.blue(strLine));
    console.log(chalk.blue(getDate() + ' -> listening on port ' + port));
});



// ------------------------------------------------------------->
// ? this doesn't seem to do anything...
app.get('/', (req, res) => {
    console.log('request:  ' + req);
    console.log('response: ' + res);

    res.sendFile(__dirname + '/index.html');
});



// ------------------------------------------------------------->
app.get('/getplayermatches', async (req, res) => {

    var match_floor = new Number(req.query.match_floor);  // i don't know why this is catching a string. maybe the query converts it?
    const strPlayerName = req.query.player_name;

    console.log(strLine);
    console.log('/getplayer called -> ' + req.query.platform + '/' + req.query.player_name);
    console.log('match_floor: ' + match_floor);

    // console.log('request ip: ' + req.ip);
    // console.log('req.query.endpoint:     ' + req.query.endpoint);
    // console.log('req.query.platform:     ' + req.query.platform);
    // console.log('req.query.player_name:  ' + req.query.player_name);
    // console.log('req.query.match_id:     ' + req.query.match_id);
    // console.log('req.query.telemetry_id: ' + req.query.telemetry_id);

    // player url: https://api.pubg.com/shards/steam/players?filter[playerNames]=hooty__
    // match  url: https://api.pubg.com/shards/steam/matches/066befe1-6320-44c6-8a66-2a9578ad87ba

    var base_url    = "https://api.pubg.com/shards/";
    var player_url  = '';
    var match_url   = '';

    var player_data;            // player_data is the data portion of the full pubgapi_player_response (whether from api or cache)
    var blPlayerCacheExists;

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
    // ! PLAYER DATA ->
    //#region : fetch player_data
    //

    const player_cache_file     = './cache/players/' + req.query.platform + '/'     + req.query.player_name + '.json';
    //const player_cache_file_404 = './cache/players/' + req.query.platform + '/404/' + req.query.player_name + '.txt';


    // ---------------------------------------------------------->
    // ? filename searches are not case sensitive so Hooty__ == hooty__ therefore need to come up with another way to cache 404 not found players. 
    // ? or just not worry about it since you will get that info from pubg api anyway
    // 404 -> verify that the searched player 404 file doesn't exist...
    // if (fs.existsSync(player_cache_file_404)) {
    //     // if this file exists, then we know the pubg api already returned a 404 player not found. this will prevent from spamming the pubg api for non existent players.

    //     console.log('404: player does not exist -> ' + req.query.platform + '/' + req.query.player_name);

    //     var _response_json = { pubg_response_status: 404, pubg_response_statusText: 'Not Found' };

    //     res.send(_response_json);
    //     return;
    // }


    // -------------------------------------------------------------->
    // ! READ CACHE FILE -> if you can get the player cache from the file, then get it...
    try {

        //console.log('retrieving from cache file: ' + player_cache_file);

        player_data = fs.readFileSync(player_cache_file, {encoding: 'utf8'});

        //console.log(pubgapi_player_response);

        player_data = JSON.parse(player_data);
        player_data = player_data.data[0];   // only get "data" portion from cache file

        blPlayerCacheExists = true;

        //console.log('blPlayerCacheExists: ' + blPlayerCacheExists);
    }
    catch (err) {
        blPlayerCacheExists = false;

        //console.log('error reading cache file: ' + player_cache_file);

        if (err.code != "ENOENT") {
            console.log('player cache file read error: ' + err.code);
        }
    }



    // ---------------------------------------------------------------------------------------->
    // ! FETCH PUBG API -> if the cache file doesn't exist, then fetch from the pubg api and create the cache file
    if (!blPlayerCacheExists) { 

        //console.log('no cache file. fetching from pubg api -> ' + player_url);

        var pubgapi_player_response;

        try 
        {
            pubgapi_player_response = await axios.get(player_url, { 
                headers: {
                    Authorization: 'Bearer ' + apiKey,
                    Accept: 'application/vnd.api+json'
                }
            })
        }
        catch (error)
        {
            if (error.response.status != 200) {
                console.log('could not fetch player from pubg api: ' + player_url);
                console.log('error.response.status: ' + error.response.status + ' -> error.response.statusText: ' + error.response.statusText);

                var _response_json = { pubg_response_status: error.response.status, pubg_response_statusText: error.response.statusText };

                
                // if the player is not found, then create an entry in the 404 cache folder
                // if (error.response.status == 404) {
                //     fs.writeFile(player_cache_file_404, 'not found', function (err) {
                //         if (err) {
                //             console.log(err +  ' -> error writing 404 cache file: ' + player_cache_file_404);
                //         }
                //         else {
                //             console.log('wrote 404 cache file: ' + player_cache_file_404);
                //         }
                //     })
                // }

                res.send(_response_json);
                return;
            }
        }


        // ----------------------------->
        // ! WRITE CACHE FILE -> write player's cache file...
        fs.writeFile(player_cache_file, JSON.stringify(pubgapi_player_response.data, null, 2), function (err) {
            if (err) {
                console.log('error writing cache file: ' + player_cache_file);
            }
            else {
                //console.log('created player cache file: ' + player_cache_file);
            }
        });


        player_data = pubgapi_player_response.data.data[0];
    }
    //#endregion ---------------------------------------------------------------------------------------------->

    console.log('player_data -> ', player_data);

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

        var match_cache_file = './cache/matches/' + player_data.relationships.matches.data[i].id + '.json';
        var pubgapi_match_response;
        var match_data;
        var _cached;


        // -------------------------------------------------->
        // #region : // ! fetch match_data from cache or api
        //

        if (fs.existsSync(match_cache_file)) {
            // a cache file exists

            try 
            {
                match_data = fs.readFileSync(match_cache_file, {encoding: 'utf8'});
                match_data = JSON.parse(match_data);
    
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
            }
            catch (error) 
            {
                // handle fetch errors...
                if (error.response.status != 200) {
                    console.log('could not fetch match from pubg api: ' + match_url + player_data.relationships.matches.data[i].id)
                }

                continue; // ? get next match if this one fails? does any data need to be sent back to the client? probably not.
            }            

            // create cache file for this match response...
            fs.writeFileSync(match_cache_file, JSON.stringify(pubgapi_match_response.data, null, 2), function (err) {
                //console.log('writing match cache...');

                if (err) {
                    console.log('error writing match cache file: ' + match_cache_file);
                }
                else {
                    //console.log('created match cache file: ' + match_cache_file);
                }
            })

            //console.log(i + '. ' + getDate(), pubgapi_match_response.data);
            match_data = pubgapi_match_response.data;

            //console.log(i +  '. ' + getDate() + ' (fetched) ' , match_data);       
            _cached = '(fetched)';

        }
        //#endregion fetch
        //

        
        // -------------------------------------------------->
        //#region // ! Loop through match's included[] array
        //

        // filter out irregular games (and the training map)
		if (
			(match_data.data.attributes.gameMode != "solo"  &&	match_data.data.attributes.gameMode != "solo-fpp" 	&&
			match_data.data.attributes.gameMode  != "duo" 	&&	match_data.data.attributes.gameMode != "duo-fpp" 	&&
            match_data.data.attributes.gameMode  != "squad" &&	match_data.data.attributes.gameMode != "squad-fpp") ||
            match_data.data.attributes.mapName == "Range_Main"  ) {

            console.log('skipping match gameMode or map: ' + match_data.data.attributes.gameMode + ', ' + match_data.data.attributes.mapName);
            
            // recalculate match_ceiling if you skip a match. 
            // if (match_ceiling + 1 <= player_data.relationships.matches.data.length) {
            //     match_ceiling++;
            // }

			continue;
        }


        var damageDealt, kills, winPlace, timeSurvived, participantID, match_telemetry_url;
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
                    timeSurvived 	= ConvertSecondsToMinutes(included.attributes.stats.timeSurvived);                
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

                const telemetry_url_cache = './cache/matches/' + player_data.relationships.matches.data[i].id + '.telemetry.json';
                const telemetry_json = { 'matchID': player_data.relationships.matches.data[i].id, 'telemetry_url': included.attributes.URL };

                // cache the telemetry url for when the user asks for it. if they want to analyze a match, get it's url here. 
                // if the cache doesn't exist, try the cached match file. if that doesn't exist, fetch match from the pubg api.
                fs.writeFile(telemetry_url_cache, JSON.stringify(telemetry_json, null, 2) , function (err) {
                    if (err) {
                        console.log(err +  ' -> error writing telemetry url cache: ' + telemetry_url_cache);
                    }
                })
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
        //


        // ? you could probably send the telmetry url to the client here instead of having to maintain a telemetryUrlCache file
        matchArray[matchIndex] = { 
            'strPlayerName':    strPlayerName,
            'timeSinceMatch':   getTimeSinceMatch(match_data.data.attributes.createdAt),
            'duration':         match_data.data.attributes.duration,
            'gameMode':         match_data.data.attributes.gameMode, 
            'matchType':        match_data.data.attributes.matchType,   // official vs. competitive
            'mapName':          GetTranslatedMapName(match_data.data.attributes.mapName),
            'teamRoster':       dctTeamRoster,
            'damageDealt':      damageDealt,
            'kills':            kills,
            'DBNOs':            DBNOs,
            'winPlace':         winPlace,
            'matchID':          match_data.data.id,
         };

        console.log(i + '. ' + _cached + ": " + matchArray[matchIndex].timeSinceMatch + ', ' + matchArray[matchIndex].gameMode + ', ' + matchArray[matchIndex].mapName + 
                    ', [' + printTeamRoster(dctTeamRoster) + ']');

        //console.log(match_data);

        matchIndex++;

    }   // matches[i] loop


    //console.log(getDate() + ' after get matches');
    //console.log(matchArray);

    // $ if no matches, then the client should be made aware
    var response_data = { 
        'totalMatches'  : player_data.relationships.matches.data.length,
        'matches'       : matchArray,
    };

    res.json(response_data);
})



app.get('/getmatchtelemetry', async (req, res) => {
    console.log('/getmatchtelemetry');
    console.log('player: ' + req.query.platform + '/' + req.query.player_name + ', matchID: ' + req.query.matchID);

    // $ the telemetry url should always exist as long as a match cache exists since it is created at the same time.
    // $ for now, i'm not doing anything if the telemetry url cache doesn't exist. need to implement that later.
    // $ the only reason it shouldn't exist is if the client leaves the screen open for longer than the match purge time (24 hours?)

    const telemetryUrlCacheFile = './cache/matches/' + req.query.matchID + '.telemetry.json';
    var   telemetry_url; 

    if (fs.existsSync(telemetryUrlCacheFile)) {
        // cache file for match-telemetry exists
        //console.log('telemetry url cache file exists: ' + telemetryUrlCacheFile);

        try {
            var data = fs.readFileSync(telemetryUrlCacheFile, {encoding: 'utf8'});
            data = JSON.parse(data);
            
            telemetry_url = data.telemetry_url;
    
            //console.log('telemetry: ' + telemetry_url);
            }
        catch (err) {
            console.log('error reading telemetryUrlCacheFile: ' + err + ' -> for file ' + telemetryUrlCacheFile);
        }
    }
    else {
        console.log('no telemetry url cache file for: ' + telemetryUrlCacheFile);

        // $ fetch match and then telemetry url from pubg api...
    }



    // $ fetch the actual telemetry here (from cache or pubg api)
    var telemetry_response; 

    try {
        telemetry_response = await axios.get(telemetry_url, {
            headers: {
                Accept: 'application/vnd.api+json'
            }
        });

        console.dir(telemetry_response.data);
    }
    catch (error) {
        if (error.response.status != 200) {
            console.log('could not fetch telemetry url from pubg api: ' + telemetry_url);
            console.log(error.response.status + ': ' + error.response.statusText);
        }
    }


    // https://telemetry-cdn.playbattlegrounds.com/bluehole-pubg/steam/2020/05/20/10/23/e6d1e557-9a83-11ea-a919-266ad624e35b-telemetry.json
    // $ telemetry is 23 megabytes??? i don't think i'll cache this stuff unless it's only here for a few minutes
    // const telemetryCacheFile = './cache/telemetry/' + path.parse(telemetry_url).base;
    // fs.writeFile(telemetryCacheFile, JSON.stringify(telemetry_response.data, null, 2), function (err) {
    //     if (err) {
    //         console.log(chalk.yellow('error writing telemetryCacheFile: ' + telemetryCacheFile));
    //         console.log(err);
    //     } else {
    //         // no errror
    //     }
    // })

    console.log('searching telemetry...');

    // arr_T = [];
    // arr_Tindex = 0;

    var ai_deaths       = 0;
    var human_deaths    = 0;

    for (let i = 0; i < telemetry_response.data.length; i++){
        //console.log('_T: ' + telemetry_response.data[i]._T);

        var i_string = new String(i);
        // _T types...
        // if (!arr_T.includes(telemetry_response.data[i]._T)) {
        //     arr_T[arr_Tindex] = telemetry_response.data[i]._T;
        //     arr_Tindex++;
        // }

        // if (telemetry_response.data[i]._T == 'LogPlayerCreate') {
        //     console.log('LogPlayerCreate: ' + telemetry_response.data[i]._D + ' -> ' + telemetry_response.data[i].character.accountId + ', ' + telemetry_response.data[i].character.name );
        // }




        if (telemetry_response.data[i]._T == 'LogPlayerKill') {
            try {
                // $ verify that fields exist or are defined before looking at them so that this doesn't throw errors

                var victim_player_type = (telemetry_response.data[i].victim.accountId.includes('account')) ? 'human' : 'ai   ';
                
                // $ damage causer
                // https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/damageCauserName.json

                // if the player didn't die to a killer (environment)
                if (telemetry_response.data[i].killer == null) {
                    var killer_player_type = 'environment??';

                    console.log('(' + i_string.padStart(5, ' ') + ') ' + telemetry_response.data[i]._T + ': ' + ' [' + telemetry_response.data[i].damageTypeCategory.padEnd(20, ' ') + 
                                ' -> ' + telemetry_response.data[i].victim.name.padEnd(20, ' ') + ']  ' + killer_player_type + ' -> '  + victim_player_type + ' (environment death?)');

                }
                else {
                    // if they did die to a player killer

                    var killer_player_type = (telemetry_response.data[i].killer.accountId.includes('account')) ? 'human' : 'ai   ';
                    var damage_info = '';
                    var suicide = '';

                    if (telemetry_response.data[i].victim.accountId.includes('account')) {
                        human_deaths++;
                    }
                    else {
                        ai_deaths++;
                    }
    
                    // suicide
                    if (telemetry_response.data[i].killer.accountId == telemetry_response.data[i].victim.accountId) {
                        suicide = '*suicide*'; 
                    }


                    // damage info
                    damage_info = telemetry_response.data[i].damageTypeCategory;

                    if (telemetry_response.data[i].damageTypeCategory != 'Damage_Groggy' && telemetry_response.data[i].damageTypeCategory != 'Damage_Instant_Fall' ){
                        damage_info += '/' + telemetry_response.data[i].damageCauserName;
                    }



                    // console.log(i + ', ' + telemetry_response.data[i]._T + ': Killer: ' + telemetry_response.data[i].killer.accountId.padEnd(40, ' ') + ' [' + telemetry_response.data[i].killer.name.padEnd(20, ' ') + 
                    // ' -> victim: ' + telemetry_response.data[i].victim.name.padEnd(20, ' ') + '] ' + telemetry_response.data[i].victim.accountId);
                    console.log('(' + i_string.padStart(5, ' ') + ') ' + telemetry_response.data[i]._T + ': ' + ' [' + telemetry_response.data[i].killer.name.padEnd(20, ' ') + 
                                ' -> ' + telemetry_response.data[i].victim.name.padEnd(20, ' ') + ']  ' + killer_player_type + ' -> '  + victim_player_type + ' ' + suicide + ' ' + damage_info);
                }



            }
            catch (err) {
                console.log('(' + i_string.padStart(5, ' ') + ') error: ' + err);
            }

        }
    }  

    //console.dir(arr_T);
    console.log('human deaths: ' + human_deaths + ', ai deaths: ' + ai_deaths);

    console.log('done searching telemetry.');

    res.send();

})





// ! ------------------------------------------------------------------------------------------------------>
// ! Helper functions
// ! 

// Purge cache files...
function clearCache() {

    console.log(chalk.blue(getDate() + ' purging cache files...'));

    // Purge ----------------------------------------------------->
    //#region ...
    //

    const playersCacheGlobPattern   = './cache/players/**/*.*';
    const matchesCacheGlobPattern   = './cache/matches/**/*.*';

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

                    
                    fs.unlink(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green( getDate() + ' purged player file -> ' + file));
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
                    fs.unlink(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green( getDate() + ' purged match file -> ' + file));
                        }
                    })
                }
            })
        }
    })
    //#endregion

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
        return diffMinutes + ' minutes ago';
    }
    else if (diffHours < 24) {
        return diffHours + ' hours ago';
    }
    else {
        return diffDays + ' days ago';
    }

}


function GetTranslatedMapName(map_name) {
	switch (map_name) {
		case "Desert_Main":
			map_name = "Miramar";
			break;
		case "DihorOtok_Main":
			map_name = "Vikendi";
			break;
		case "Erangel_Main":
			map_name = "Erangel";
			break;
		case "Baltic_Main":
			map_name = "Erangel";
			break;
		case "Range_Main":
			map_name = "Camp Jackal";
			break;
		case "Savage_Main":
			map_name = "Sanhok";
			break;
		case "Summerland_Main":
			map_name = "Karakin";
			break;
		default:
	}

	return map_name;
}


function ConvertSecondsToMinutes(seconds) {
	var sec = parseInt(seconds);

	// https://stackoverflow.com/a/25279399/1940465
	var date = new Date(0);
	date.setSeconds(sec); // specify value for SECONDS here

	//console.log(date.toISOString());

	var timeString = date.toISOString().substr(14, 5);

	//console.log(timeString)

	return timeString;
}


function printTeamRoster(dctRoster) {
    var strRoster = ''

    dctRoster.forEach(element => {
        strRoster += element.name + ', ';
    })

    return strRoster;
}