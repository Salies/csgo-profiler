"use strict";

var express = require('express')
var request = require('request');
var pug = require('pug');
var async = require('async');
var app = express()

app.set('view engine', 'pug')

var key = "key_here";

app.get('/', function(req, res) {
    res.render('index', {
        enter: "Enter a SteamID64, Custom URL or Steam Profile URL.",
        made: 'Made with <a href="https://www.youtube.com/watch?v=VRyX-lEGbfQ" style="color:#fff;text-decoration:none" target="_blank"> ❤ </a> by <a href="https://github.com/salies" style="color:#fff;text-decoration:none" target="_blank">Salies</a>.<a class="github-button" href="https://github.com/salies/csgo-profiler" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star salies/csgo-profiler on GitHub">Star</a>'
    });
});

app.get('/:input', (req, res) => {

    let raw = req.params.input;

    function morre(param) {
        res.render('error', {
            message: param,
            made: 'Made with <a href="https://www.youtube.com/watch?v=VRyX-lEGbfQ" style="color:#fff;text-decoration:none" target="_blank"> ❤ </a> by <a href="https://github.com/salies" style="color:#fff;text-decoration:none" target="_blank">Salies</a>.<a class="github-button" href="https://github.com/salies/csgo-profiler" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star salies/csgo-profiler on GitHub">Star</a>'
        });
    }

    async.waterfall([
        function(callback) {
            let url = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${raw}`;
            request(url, function(error, response, res) {
                let r = JSON.parse(res);
                if (r.response.success == 42 && isNaN(raw) === false && raw.length == 17) {
                    //when the value is a steam64 id
                    let inp = raw;
                    callback(null, inp)
                } else if (r.response.success == 42) {
                    //when the value was not found and it's not a steam64 id
                    morre("This profile does not exist.");
                } else {
                    let inp = r.response.steamid; //when it's a vanity url
                    callback(null, inp)
                }
            });
        },
        function(inp, callback) {
            let sum_url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${inp}`;
            request(sum_url, function(error, response, res) {
                let result = JSON.parse(res);
                if (result.response.players == undefined) { //error parsing part 2
                    morre("This profile does not exist.");;
                } else if (result.response.players[0].communityvisibilitystate == 1 || result.response.players[0].communityvisibilitystate == 5) {
                    //if everything's ok but the profile is private
                    morre("This profile is either private or friends-only, thus further info cannot be requested.");
                }
                //create an array with the retrived data
                var sum = {
                    name: result.response.players[0].personaname,
                    url: result.response.players[0].profileurl,
                    avatar: result.response.players[0].avatarfull,
                    realname: result.response.players[0].realname,
                    country: result.response.players[0].loccountrycode,
                    personastate: result.response.players[0].personastate,
                    profileurl: result.response.players[0].profileurl,
                    group: result.response.players[0].primaryclanid
                };

                callback(null, [inp, sum])
            });
        }
    ], function(err, results) {
        var input = results[0];
        var summary = results[1];
        let ban_url = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${key}&steamids=${input}`,
            cs_url = `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${key}&steamid=${input}`;
        async.parallel({ //parallel to get things faster
            ban: function(callback) {
                request(ban_url, function(error, response, res) {
                    let result = JSON.parse(res);
                    //create an array with the retrived data
                    var ban = {
                        vac: result.players[0].VACBanned,
                        nvac: result.players[0].NumberOfVACBans,
                        comu: result.players[0].CommunityBanned,
                        econo: result.players[0].EconomyBan
                    };

                    callback(null, ban)
                });
            },
            stats: function(callback) {
                //welcome to the verification (if) hell
                request(cs_url, function(error, response, res) {
                    if (res.startsWith("<") === true) {
                        morre("This player has never played Counter-Strike: Global Offensive.");
                        let result = undefined;
                    } else {
                        let result = JSON.parse(res);
                        if (result.playerstats == undefined) {
                            morre("This player has never played Counter-Strike: Global Offensive.");
                        } else {
                            let p = result.playerstats.stats;
                            //create an array SOME OF the retrived data, 'cause it's too much to hop it all in - so these are just the ones I'm gonna print in "big letters"
                            var gun_names = {
                                knife: "Knife",
                                hegrenade: "HE Grenade",
                                glock: "Glock-18",
                                deagle: "Desert Eagle",
                                elite: "Dual Berettas",
                                fiveseven: "Five-SeveN",
                                xm1014: "XM1014",
                                mac10: "MAC-10",
                                ump45: "UMP-45",
                                p90: "P90",
                                awp: "AWP",
                                ak47: "AK-47",
                                aug: "AUG",
                                famas: "FAMAS",
                                g3sg1: "G3SG1",
                                m249: "M249",
                                hkp2000: "P2000 / USP-S",
                                p250: "P250",
                                sg556: "SG 553",
                                scar20: "SCAR-20",
                                ssg08: "SSG 08",
                                mp7: "MP7",
                                mp9: "MP9",
                                nova: "Nova",
                                negev: "Negev",
                                sawedoff: "Sawed-Off",
                                bizon: "PP-Bizon",
                                tec9: "Tec-9",
                                mag7: "MAG-7",
                                m4a1: "M4A4 / M4A1-S",
                                galilar: "Galil AR",
                                molotov: "Molotov",
                                taser: "Zeus x27"
                            };
                            var guns = [];

                            var map_names = {
                                cs_assault: "Assault",
                                cs_italy: "Italy",
                                cs_office: "Office",
                                de_aztec: "Aztec",
                                de_cbble: "Cobblestone",
                                de_dust2: "Dust II",
                                de_dust: "Dust",
                                de_inferno: "Inferno",
                                de_nuke: "Nuke",
                                de_train: "Train",
                                de_house: "Old Safehouse",
                                de_bank: "Bank",
                                de_vertigo: "Vertigo",
                                ar_monastery: "Monastery",
                                ar_shoots: "Shoots",
                                ar_baggage: "Baggage",
                                de_lake: "Lake",
                                de_sugarcane: "Sugarcane",
                                de_stmarc: "St. Marc",
                                de_shorttrain: "Shorttrain",
                                de_safehouse: "Safehouse",
                                cs_militia: "Militia"
                            };
                            var maps = [];

                            //smart tricky part - loop for organizing info and not making a monster array (on thefirst ones)
                            for (let i = 0; i < p.length; i++) {
                                if ((p[i].name).startsWith("total_kills_") && p[i].name !== "total_kills_headshot" && p[i].name !== "total_kills_enemy_weapon" && p[i].name !== "total_kills_enemy_blinded" && p[i].name !== "total_kills_knife_fight" && p[i].name !== "total_kills_against_zoomed_sniper") {
                                    let gn = eval("gun_names." + (p[i].name).replace("total_kills_", ""));
                                    guns.push({
                                        name: gn,
                                        kills: p[i].value
                                    });
                                }

                                if ((p[i].name).startsWith("total_wins_map_")) {
                                    let mn = eval("map_names." + (p[i].name).replace("total_wins_map_", ""));
                                    maps.push({
                                        name: mn,
                                        rounds_won: p[i].value
                                    });
                                }
                            }

                            guns.sort(function(a, b) {
                                if (a.kills < b.kills) return 1;
                                if (a.kills > b.kills) return -1;
                                return 0;
                            });

                            maps.sort(function(a, b) {
                                if (a.rounds_won < b.rounds_won) return 1;
                                if (a.rounds_won > b.rounds_won) return -1;
                                return 0;
                            });

                            var prestats = [
                                p[p.findIndex(item => item.name === 'total_kills')],
                                p[p.findIndex(item => item.name === 'total_deaths')],
                                p[p.findIndex(item => item.name === 'total_time_played')], //time in hours
                                p[p.findIndex(item => item.name === 'total_planted_bombs')],
                                p[p.findIndex(item => item.name === 'total_defused_bombs')],
                                p[p.findIndex(item => item.name === 'total_wins')], //rounds
                                p[p.findIndex(item => item.name === 'total_kills_headshot')],
                                p[p.findIndex(item => item.name === 'total_matches_played')],
                                p[p.findIndex(item => item.name === 'total_matches_won')],
                                p[p.findIndex(item => item.name === 'total_mvps')],
                                guns,
                                maps
                            ];

                            if (prestats.includes(undefined) === true) {
                                morre("This player doesn't have enough info to be fully profiled.")
                            } else {


                                //One single master array, the unification of the great and small. I hear the notes but the arrangement is wrong, and I'm starting to doubt, but I can't give up now...
                                var stats = {
                                    kills: p[p.findIndex(item => item.name === 'total_kills')].value,
                                    deaths: p[p.findIndex(item => item.name === 'total_deaths')].value,
                                    time: Math.round(p[p.findIndex(item => item.name === 'total_time_played')].value / 60 / 60), //time in hours
                                    planted: p[p.findIndex(item => item.name === 'total_planted_bombs')].value,
                                    defused: p[p.findIndex(item => item.name === 'total_defused_bombs')].value,
                                    wins: p[p.findIndex(item => item.name === 'total_wins')].value, //rounds
                                    headshots: p[p.findIndex(item => item.name === 'total_kills_headshot')].value,
                                    matches_played: p[p.findIndex(item => item.name === 'total_matches_played')].value,
                                    matches_won: p[p.findIndex(item => item.name === 'total_matches_won')].value,
                                    mvps: p[p.findIndex(item => item.name === 'total_mvps')].value,
                                    top_guns: guns,
                                    top_maps: maps
                                }

                                callback(null, stats);
                            }
                        }
                    }
                });
            },
        }, function(err, results) {
            var ban = results.ban;
            var cstats = results.stats;

            //if he's a TRUE PIRUHEAD!!!
            if (summary.group == "103582791440531649") {
                console.log("CABEÇA DE PERU!!!");
            }

            let statuses = ["Offline", "Online", "Busy", "Away", "Snooze", "Looking To Trade", "Looking To Play"];
            let status = statuses[summary.personastate];
            var countries={AF:"Afghanistan",AX:"Aland Islands",AL:"Albania",DZ:"Algeria",AS:"American Samoa",AD:"Andorra",AO:"Angola",AI:"Anguilla",AQ:"Antarctica",AG:"Antigua And Barbuda",AR:"Argentina",AM:"Armenia",AW:"Aruba",AU:"Australia",AT:"Austria",AZ:"Azerbaijan",BS:"Bahamas",BH:"Bahrain",BD:"Bangladesh",BB:"Barbados",BY:"Belarus",BE:"Belgium",BZ:"Belize",BJ:"Benin",BM:"Bermuda",BT:"Bhutan",BO:"Bolivia",BA:"Bosnia And Herzegovina",BW:"Botswana",BV:"Bouvet Island",BR:"Brazil",IO:"British Indian Ocean Territory",BN:"Brunei Darussalam",BG:"Bulgaria",BF:"Burkina Faso",BI:"Burundi",KH:"Cambodia",CM:"Cameroon",CA:"Canada",CV:"Cape Verde",KY:"Cayman Islands",CF:"Central African Republic",TD:"Chad",CL:"Chile",CN:"China",CX:"Christmas Island",CC:"Cocos (Keeling) Islands",CO:"Colombia",KM:"Comoros",CG:"Congo",CD:"Congo, Democratic Republic",CK:"Cook Islands",CR:"Costa Rica",CI:"Cote D'Ivoire",HR:"Croatia",CU:"Cuba",CY:"Cyprus",CZ:"Czech Republic",DK:"Denmark",DJ:"Djibouti",DM:"Dominica",DO:"Dominican Republic",EC:"Ecuador",EG:"Egypt",SV:"El Salvador",GQ:"Equatorial Guinea",ER:"Eritrea",EE:"Estonia",ET:"Ethiopia",FK:"Falkland Islands (Malvinas)",FO:"Faroe Islands",FJ:"Fiji",FI:"Finland",FR:"France",GF:"French Guiana",PF:"French Polynesia",TF:"French Southern Territories",GA:"Gabon",GM:"Gambia",GE:"Georgia",DE:"Germany",GH:"Ghana",GI:"Gibraltar",GR:"Greece",GL:"Greenland",GD:"Grenada",GP:"Guadeloupe",GU:"Guam",GT:"Guatemala",GG:"Guernsey",GN:"Guinea",GW:"Guinea-Bissau",GY:"Guyana",HT:"Haiti",HM:"Heard Island & Mcdonald Islands",VA:"Holy See (Vatican City State)",HN:"Honduras",HK:"Hong Kong",HU:"Hungary",IS:"Iceland",IN:"India",ID:"Indonesia",IR:"Iran, Islamic Republic Of",IQ:"Iraq",IE:"Ireland",IM:"Isle Of Man",IL:"Israel",IT:"Italy",JM:"Jamaica",JP:"Japan",JE:"Jersey",JO:"Jordan",KZ:"Kazakhstan",KE:"Kenya",KI:"Kiribati",KR:"Korea",KW:"Kuwait",KG:"Kyrgyzstan",LA:"Lao People's Democratic Republic",LV:"Latvia",LB:"Lebanon",LS:"Lesotho",LR:"Liberia",LY:"Libyan Arab Jamahiriya",LI:"Liechtenstein",LT:"Lithuania",LU:"Luxembourg",MO:"Macao",MK:"Macedonia",MG:"Madagascar",MW:"Malawi",MY:"Malaysia",MV:"Maldives",ML:"Mali",MT:"Malta",MH:"Marshall Islands",MQ:"Martinique",MR:"Mauritania",MU:"Mauritius",YT:"Mayotte",MX:"Mexico",FM:"Micronesia, Federated States Of",MD:"Moldova",MC:"Monaco",MN:"Mongolia",ME:"Montenegro",MS:"Montserrat",MA:"Morocco",MZ:"Mozambique",MM:"Myanmar",NA:"Namibia",NR:"Nauru",NP:"Nepal",NL:"Netherlands",AN:"Netherlands Antilles",NC:"New Caledonia",NZ:"New Zealand",NI:"Nicaragua",NE:"Niger",NG:"Nigeria",NU:"Niue",NF:"Norfolk Island",MP:"Northern Mariana Islands",NO:"Norway",OM:"Oman",PK:"Pakistan",PW:"Palau",PS:"Palestinian Territory, Occupied",PA:"Panama",PG:"Papua New Guinea",PY:"Paraguay",PE:"Peru",PH:"Philippines",PN:"Pitcairn",PL:"Poland",PT:"Portugal",PR:"Puerto Rico",QA:"Qatar",RE:"Reunion",RO:"Romania",RU:"Russian Federation",RW:"Rwanda",BL:"Saint Barthelemy",SH:"Saint Helena",KN:"Saint Kitts And Nevis",LC:"Saint Lucia",MF:"Saint Martin",PM:"Saint Pierre And Miquelon",VC:"Saint Vincent And Grenadines",WS:"Samoa",SM:"San Marino",ST:"Sao Tome And Principe",SA:"Saudi Arabia",SN:"Senegal",RS:"Serbia",SC:"Seychelles",SL:"Sierra Leone",SG:"Singapore",SK:"Slovakia",SI:"Slovenia",SB:"Solomon Islands",SO:"Somalia",ZA:"South Africa",GS:"South Georgia And Sandwich Isl.",ES:"Spain",LK:"Sri Lanka",SD:"Sudan",SR:"Suriname",SJ:"Svalbard And Jan Mayen",SZ:"Swaziland",SE:"Sweden",CH:"Switzerland",SY:"Syrian Arab Republic",TW:"Taiwan",TJ:"Tajikistan",TZ:"Tanzania",TH:"Thailand",TL:"Timor-Leste",TG:"Togo",TK:"Tokelau",TO:"Tonga",TT:"Trinidad And Tobago",TN:"Tunisia",TR:"Turkey",TM:"Turkmenistan",TC:"Turks And Caicos Islands",TV:"Tuvalu",UG:"Uganda",UA:"Ukraine",AE:"United Arab Emirates",GB:"United Kingdom",US:"United States",UM:"United States Outlying Islands",UY:"Uruguay",UZ:"Uzbekistan",VU:"Vanuatu",VE:"Venezuela",VN:"Viet Nam",VG:"Virgin Islands, British",VI:"Virgin Islands, U.S.",WF:"Wallis And Futuna",EH:"Western Sahara",YE:"Yemen",ZM:"Zambia",ZW:"Zimbabwe"};            
            var g = "";
            for (let i = 0; i < cstats.top_guns.length; i++) {
                g += String("<span>" + (i + 1) + ". <span style='color: #66c0f4;'>" + cstats.top_guns[i].name + " </span>(" + cstats.top_guns[i].kills + "</span> kills)</span><br>");
            }
            var m = "";
            for (let i = 0; i < cstats.top_maps.length; i++) {
                m += String("<span>" + (i + 1) + ". <span style='color: #66c0f4;'>" + cstats.top_maps[i].name + " </span>(" + cstats.top_maps[i].rounds_won + "</span> rounds won)</span><br>");
            }

            var ban_s = {
                vac: "<span style='color:#67bf5a'>Clean</span>",
                community: "<span style='color:#67bf5a'>Clean</span>",
                economy: "<span style='color:#67bf5a'>Clean</span>"
            };

            if (ban.vac !== false) {
                ban_s.vac = "<span style='color:#C93E3E'>Banned</span>";
            } else if (ban.comu !== false) {
                ban_s.community = "<span style='color:#C93E3E'>Banned</span>";
            } else if (ban.econo !== 'none') {
                ban_s.economy = `<span style='color:#C93E3E'>${ban_s.economy}</span>`;
            }

            let isis = ((cstats.planted * 100) / (cstats.planted + cstats.defused)).toFixed(2);
            var b = `VAC Record: ${ban_s.vac}<br>Community Ban Record: ${ban_s.community}<br>Economy Status: ${ban_s.economy}<br><br><span style="font-size: 12px;">${isis}% chance of this player joining the ISIS.</span>`;

            var render = {
                made: 'Made with <a href="https://www.youtube.com/watch?v=VRyX-lEGbfQ" style="color:#fff;text-decoration:none" target="_blank"> ❤ </a> by <a href="https://github.com/salies" style="color:#fff;text-decoration:none" target="_blank">Salies</a>.<a class="github-button" href="https://github.com/salies/csgo-profiler" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star salies/csgo-profiler on GitHub">Star</a>',
                name: summary.name,
                realname: summary.realname,
                countrycode: summary.country,
                avatar: summary.avatar,
                status: status,
                country: countries[summary.country],
                steamlink: '<a href="' + summary.url + '" style="color:#fff">Steam Profile</a>',
                kd: ((cstats.kills) / (cstats.deaths)).toFixed(2),
                kills: cstats.kills,
                deaths: cstats.deaths,
                time: cstats.time,
                planted: cstats.planted,
                defused: cstats.defused,
                rounds_won: cstats.wins,
                headshots: cstats.headshots,
                matches_played: cstats.matches_played,
                matches_won: cstats.matches_won,
                pm: ((cstats.matches_won * 100) / cstats.matches_played).toFixed(2) + "%",
                mvps: cstats.mvps,
                guns: g,
                maps: m,
                bans: b
            }

            res.render('profile', render);
        });
    });
}).listen(80); //or whatever port or server
