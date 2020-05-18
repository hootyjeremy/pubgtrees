const express       = require('express');
const bodyParser    = require('body-parser');
const fetch         = require('node-fetch');    // https://stackoverflow.com/questions/48433783/referenceerror-fetch-is-not-defined
const axios         = require('axios');
const moment        = require('moment');
//const path      = require('path');
const app           = express();
const port          = 3000;
const fs            = require('fs');

const apiKey        = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjZDhlMDFkMC02ODAwLTAxMzgtZTQ4Ny0wNjc0ZmE5YWVjOGYiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTg3Njk1MTM1LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6Im1pbmlzdGVya2F0YW9rIn0.HiuLi97rFSW-ho5zE1XBYmpV9E6M0Nj90qXIY1TWsco';


// ! Global variables...
var strLine         = "--------------------------------------------";


// ? what is this app receiving from the user?
// ? what is this app requesting from the pubg api?
// ? what is this app receiving  from the pubg api?
// ? what is this app responding to the user with?


app.use(bodyParser.json());

// alias, literal
app.use('/', express.static(__dirname));    // so that root/pubg.js and root/index.html can be found

// ------------------------------------------------------------->
app.listen(port, () => {
    console.log(strLine);
    console.log(getDate() + ' -> listening on port ' + port)
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

    var match_offset = new Number(req.query.match_offset);  // i don't know why this is catching a string. maybe the query converts it?


    console.log(strLine);

    console.log('/getplayer called -> ' + req.query.platform + '/' + req.query.player_name);
    console.log('match_offset: ' + match_offset);


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

    var player_data; // player_data is the data portion of the full pubg_player_response (whether from api or cache)
    var blPlayerCacheExists;


    base_url   += req.query.platform + '/';
    player_url  = base_url + req.query.endpoint + '?filter[playerNames]=' + req.query.player_name;

    var match_url = base_url + 'matches/';
    //console.log('match_url: ' + match_url);


    // player_url: 'https://api.pubg.com/shards/steam/players?filter[playerNames]=hooty__'
    //console.log('player_url: ' + player_url);


    const player_cache_file     = './cache/' + req.query.platform + '/'     + req.query.player_name + '.json';
    const player_cache_file_404 = './cache/' + req.query.platform + '/404/' + req.query.player_name + '.txt';



    // ---------------------------------------------------------->
    // ! verify that the searched player 404 file doesn't exist...
    if (fs.existsSync(player_cache_file_404)) {
        // if this file exists, then we know the pubg api already returned a 404 player not found. this will prevent from spamming the pubg api for non existent players.

        console.log('404: player does not exist -> ' + req.query.platform + '/' + req.query.player_name);

        var _response_json = { pubg_response_status: 404, pubg_response_statusText: 'Not Found' };

        res.send(_response_json);
        return;
    }


    // -------------------------------------------------------------->
    // ! if you can get the player cache from the file, then get it...
    try {

        console.log('retrieving from cache file: ' + player_cache_file);


        player_data = fs.readFileSync(player_cache_file, {encoding: 'utf8'});


        //console.log(pubg_player_response);

        player_data = JSON.parse(player_data);
        player_data = player_data.data[0];   // only get "data" portion from cache file

        blPlayerCacheExists = true;

        //console.log('blPlayerCacheExists: ' + blPlayerCacheExists);
    }
    catch (err) {
        blPlayerCacheExists = false;
        //pubg_player_response = '';

        //console.log('error reading cache file: ' + player_cache_file);
        console.log('error code: ' + err.code);
    }



    // ---------------------------------------------------------------------------------------->
    // ! if the cache file doesn't exist, then fetch from the pubg api and create the cache file
    if (!blPlayerCacheExists) { 

        console.log('no cache file. fetching from pubg api -> ' + player_url);

        var pubg_player_response;

        try 
        {
            pubg_player_response = await axios.get(player_url, { 
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
                if (error.response.status == 404) {
                    fs.writeFile(player_cache_file_404, 'not found', function (err) {
                        if (err) {
                            console.log('error writing 404 cache file: ' + player_cache_file_404);
                        }
                        else {
                            console.log('wrote 404 cache file: ' + player_cache_file_404);
                        }
                    })
                }

                res.send(_response_json);
                return;
            }
        }


        // ----------------------------->
        // ! write player's cache file...
        fs.writeFile(player_cache_file, JSON.stringify(pubg_player_response.data), function (err) {
            if (err) {
                console.log('error writing cache file: ' + player_cache_file);
            }
            else {
                console.log('created player cache file: ' + player_cache_file);
            }
        });


        player_data = pubg_player_response.data.data[0];
    }


    console.log('player_data -> ', player_data);




    // ------------------------------------------------------->
    // ! get match data

    // ? why not cache the pulled match data as long as the player data is cached? when player data cache is deleted, delete their match data? this way you don't have to keep hitting the server?

    // if there are more than 10 matches, just get the first 10. if there are less than 10 matches, get them all...
    //var match_range = (player_data.relationships.matches.data.length <= 10) ? player_data.relationships.matches.data.length : 10 ;

    // if (matches.length < match_offset + 10) then match_ceiling is match.length
    // if not, then match_ceiling is match_offset + 10;
    const match_ceiling = (match_offset + 10 > player_data.relationships.matches.data.length) ? player_data.relationships.matches.data.length : match_offset + 10 ; 

    //console.log(getDate() + ' before get matches');

    //console.log('matches.length: ' + player_data.relationships.matches.data.length);
    //console.log('match_offset:   ' + match_offset);
    //console.log('match_ceiling:  ' + match_ceiling);

    for (let i = match_offset; i < match_ceiling; i++) {
        console.log(i + '. ' + getDate() + ' -> match_url: ' + match_url + player_data.relationships.matches.data[i].id);
        

        // match_url + id: https://api.pubg.com/shards/steam/matches/ba57018d-6e6f-46ea-bcd4-ebd8bbcefd28
        var pubg_match_response = await axios.get(match_url + player_data.relationships.matches.data[i].id, {
            headers: {
                Accept: 'application/vnd.api+json'
            }
        });
        
        // # HANDLE GET() ERRORS
        
        // # will need to build the tailored json response with the data that vue will use to create a table

        //console.log(getDate() + ' pubg_match_response.data...');
        
        //console.log(getDate() + ' (' + i + ') -> ', pubg_match_response.data);

    }

    //console.log(getDate() + ' after get matches');





    var response_data = { 'totalMatches' : player_data.relationships.matches.data.length };

    res.json(response_data);

})









function getDate() {
    return moment().toISOString().substring(11,23);
}   