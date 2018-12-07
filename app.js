const express = require('express'), rp = require('request-promise'), ejs = require('ejs'), steamParser = require('./steamParser.js'), key = 'KEY', app = express();

app.use(express.static(__dirname + '/assets'));
app.set('view engine', 'ejs');

function steamRequest(id, call){
    return rp({uri:`https://api.steampowered.com/${call}${id}&key=${key}`, json:true}).then(res =>{
        return res;
    }).catch(err =>{
        return false;
    });
}

app.get('/', (req, res) => {
    res.render('index', {title:'CS:GO Profiler'});
});

app.get('/:input', (req, res) => {
    steamParser(key, req.params.input).then(id =>{
        if(id === false){
            res.render('error', {title: 'Error - CS:GO Profiler', error: "This account does not exist."});
            return false; //are these return statements really necessary? I could swear the render() function included a return, but if I remose these there's an undefined error (caused by the function keeping running)
        }
        //verifying if player has cs:go
        steamRequest(id, 'IPlayerService/GetOwnedGames/v1/?appids_filter[0]=730&steamid=').then(own =>{ // return in here(?)
            if(own.response.game_count===0){
                res.render('error', {title: 'Error - CS:GO Profiler', error: "This player doesn't own Counter-Strike: Global Offensive."});
                return false;
            }
            else if(own.response.game_count===0 && own.response.games.playtime_forever===0){
                res.render('error', {title: 'Error - CS:GO Profiler', error: "This player owns Counter-Strike: Global Offensive, but has never played it."});
                return false;
            }
            else{
                steamRequest(id, 'ISteamUserStats/GetUserStatsForGame/v2/?appid=730&steamid=').then(p => { //check if Steam new privacy settings stuff didn't fuck things up
                    if (p === false) {
                        res.render('error', {title: 'Error - CS:GO Profiler', error: "The app was not able to retrive the player's CS:GO data. This is probably due to the privacy settings of the profile."});
                        return false;
                    }
                    else { //unecessary else? kek, gonna leave it here just fore the lolz
                        //fetching basic steam data
                        Promise.all([ //optimize this so I don't call id everytime?
                            steamRequest(id, 'ISteamUser/GetPlayerSummaries/v2/?steamids='),
                            steamRequest(id, 'ISteamUser/GetPlayerBans/v1/?steamids=')
                        ]).then((results) => {
                            //renders shit
                            results.push(p); //pushes previously acquired data into current array of responses
                            console.log(results);
                            res.render('profile', {title:`${results[0].response.players[0].personaname}'s Profile - CS:GO Profiler`, data:results});
                            return true;
                        }).catch(err =>{
                            res.render('error', {title: 'Error - CS:GO Profiler', error: "An unexpected error occoured. Please try again later or open up an error thread on GitHub."});
                            return false;
                        })
                    }
                });
            }
        });
    });
})

app.listen(process.env.PORT || 8080);