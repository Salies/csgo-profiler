const rp = require('request-promise');

function parseSteamVanity(key, vanity){
    return rp({uri:`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${vanity}`, json:true}).then(res =>{
        if(res.response.success!==1){
            return false;
        }
        else{
            return res.response.steamid;
        }
    }).catch(err => {
        return false;
    });
}

module.exports = function(key, input){
    if(isNaN(input)===false && input.length === 17){ //Steam64ID
        return input;
    }
    else{ //possibily a vanity
        return parseSteamVanity(key, input).then(results =>{
            return results; 
        });
    }
}