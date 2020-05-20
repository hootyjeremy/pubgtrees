const express       = require('express');
const bodyParser    = require('body-parser');
const axios         = require('axios');
const moment        = require('moment-timezone');   //require('moment');
const app           = express();
const port          = 3000;
const fs            = require('fs');
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

    var player_data; // player_data is the data portion of the full pubgapi_player_response (whether from api or cache)
    var blPlayerCacheExists;


    base_url   += req.query.platform + '/';
    player_url  = base_url + req.query.endpoint + '?filter[playerNames]=' + req.query.player_name;

    var match_url = base_url + 'matches/';
    //console.log('match_url: ' + match_url);


    // player_url: 'https://api.pubg.com/shards/steam/players?filter[playerNames]=hooty__'
    //console.log('player_url: ' + player_url);


    const player_cache_file     = './cache/players/' + req.query.platform + '/'     + req.query.player_name + '.json';
    const player_cache_file_404 = './cache/players/' + req.query.platform + '/404/' + req.query.player_name + '.txt';



    // ---------------------------------------------------------->
    // ! 404 -> verify that the searched player 404 file doesn't exist...
    if (fs.existsSync(player_cache_file_404)) {
        // if this file exists, then we know the pubg api already returned a 404 player not found. this will prevent from spamming the pubg api for non existent players.

        console.log('404: player does not exist -> ' + req.query.platform + '/' + req.query.player_name);

        var _response_json = { pubg_response_status: 404, pubg_response_statusText: 'Not Found' };

        res.send(_response_json);
        return;
    }


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
        console.log('player cache file read error: ' + err.code);
    }



    // ---------------------------------------------------------------------------------------->
    // ! FETCH PUBG API -> if the cache file doesn't exist, then fetch from the pubg api and create the cache file
    if (!blPlayerCacheExists) { 

        console.log('no cache file. fetching from pubg api -> ' + player_url);

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
                if (error.response.status == 404) {
                    fs.writeFile(player_cache_file_404, 'not found', function (err) {
                        if (err) {
                            console.log(err +  ' -> error writing 404 cache file: ' + player_cache_file_404);
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
        // ! WRITE CACHE FILE -> write player's cache file...
        fs.writeFile(player_cache_file, JSON.stringify(pubgapi_player_response.data, null, 2), function (err) {
            if (err) {
                console.log('error writing cache file: ' + player_cache_file);
            }
            else {
                console.log('created player cache file: ' + player_cache_file);
            }
        });


        player_data = pubgapi_player_response.data.data[0];
    }


    console.log('player_data -> ', player_data);




    // ------------------------------------------------------->
    // ! MATCH DATA ->

    // only want to pull 10 matches at a time depending on match_offset, but also no more than the end of matches
    const match_ceiling = (match_offset + 10 > player_data.relationships.matches.data.length) ? player_data.relationships.matches.data.length : match_offset + 10 ; 

    //console.log(getDate() + ' before get matches');

    //console.log('matches.length: ' + player_data.relationships.matches.data.length);
    //console.log('match_offset:   ' + match_offset);
    //console.log('match_ceiling:  ' + match_ceiling);

    var match_data_response;    // an array of json objects about each match


    for (let i = match_offset; i < match_ceiling; i++) {
        //console.log(i + '. ' + getDate() + ' -> match_url: ' + match_url + player_data.relationships.matches.data[i].id);

        // # check for match cache file first. if not there, then get it from the pubg api
        var match_cache_file = './cache/matches/' + player_data.relationships.matches.data[i].id + '.json';
        var pubgapi_match_response;
        var match_data;

        // ! fetch from cache or pubg api...
        if (fs.existsSync(match_cache_file)) {
            // a cache file exists

            try 
            {
                match_data = fs.readFileSync(match_cache_file, {encoding: 'utf8'});
                match_data = JSON.parse(match_data);
    
                console.log(i +  '. ' + getDate() + ' (cached) ' , match_data);       

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

                continue; // get next match if this one fails? does any data need to be sent back to the client? probably not.
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

            console.log(i +  '. ' + getDate() + ' (fetched) ' , match_data);       

        }




    }   // matches loop


    //console.log(getDate() + ' after get matches');


    
    // # if no matches, then the client should be aware
    var response_data = { 'totalMatches' : player_data.relationships.matches.data.length };

    res.json(response_data);

})






// ! Purge cache files...
function clearCache() {

    console.log(chalk.blue(getDate() + ' purging cache files...'));

    const cacheGlobPattern = './cache/**/*.*';
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
                // 10 minutes = 600,000 milliseconds
                if (Date.now() - stat.birthtimeMs > 1800000) { 

                    
                    fs.unlink(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green( getDate() + ' purged player cache file because of retention -> ' + file));
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
                // 24 * 60 * 60 =  86,400 seconds per day
                // 86,400 * 3   = 259,200 seconds per 3 days
                // 259,200 * 1,000 = 259,200,000 milliseconds per 3 days
                if (Date.now() - stat.birthtimeMs > 259200000) {

                    // 600,000 = 10 minutes
                    fs.unlink(file, (err) =>{
                        if (err) {
                            console.log(getDate() + ' error purging cache file: ' + file + ' -> ' + err);
                        } else {
                            console.log(chalk.green( getDate() + ' purged match cache file because of retention -> ' + file));
                        }
                    })
                }
            })
        }
    })

}




function getDate() {

    // https://momentjs.com/timezone/docs/
    return moment().tz("America/Chicago").format('YYYY.MM.DD_hh:mm:ss.SSS A'); //moment().toISOString().substring(11,23);    

}   