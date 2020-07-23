// ! VUE STUFF ------------------------------------------------------------------->


// Vue.component('custom_row', {
// 	props: ['match_prop'],
// 	methods: {
// 	},	
// 	template:  ``
// })



let vm = new Vue({
	el: "#vueapp",
	data: {
		match_data: [],
		strTeamRoster: '',
	},
	created: function () {
	},
	methods: {
		getMatchData: function (matches_array) {

			// add 'isActive" here so that it can be toggled
			// matches_array.forEach(element => {
			// 	element.isActive = false;
			// });

			this.match_data = matches_array;

			//console.dir(this.match_data);
        },
        resolveMatchType: function (match_type) {
			if (match_type == 'competitive') {
				return 'Ranked'
			} else {
				return 'Unranked'
			}
        },
        resolveKnocks: function (mode, knocks) {
            if (mode == 'solo' || mode == 'solo-fpp') {
                return '-';
            }
            else {
                return knocks;
            }
		},
		printRoster: function (matchRoster, player_name) {			
			var strRoster = '';

			for (let i = 0; i < matchRoster.length; i++){
				// strRoster += matchRoster[i].name;

				// if (i + 1 < matchRoster.length) {
				// 	strRoster += ',';
                // }


                if (matchRoster[i].name != player_name) {
                    strRoster += ', ' + matchRoster[i].name;
                }

			}
        
            if (strRoster != '') {
                strRoster = player_name + strRoster;
            }
            else {
                strRoster = player_name;
            }

            if (matchRoster.length == 1){
				//strRoster = '-';
				strRoster = player_name;
            }

			return strRoster;
		},
		analyzeMatch: function (_matchId, index) {
			//console.log('analyzeMatch() -> ' + _matchID);

			// console.log(this.match_data);
			// this.match_data.isActive = !isActive;

			// let tmpMatchDetails = new Object();
			// tmpMatchDetails.matchId 	= _matchID;
			// tmpMatchDetails.matchType 	= _matchType;
			// tmpMatchDetails.mapName 	= _mapName;
			// tmpMatchDetails.gameMode 	= _gameMode;
			// tmpMatchDetails.age 		= _age;
			// tmpMatchDetails.humans 		= _participantCount;


			//vmTreeD3.updateTreeTable(tmpMatchDetails);


			for (let i = 0; i < this.match_data.length; i++) {
				//console.log('index: ' + index);

				// get classlist of each row from id

				if (i == index) {
					document.getElementById('matchRow' + i).classList.add('activeMatchRow');
				}
				else{
					document.getElementById('matchRow' + i).classList.remove('activeMatchRow');
				}

			}

			GetTelemetry(_matchId);

		}
    },
    
})


let vueMatchInfo = new Vue({
	el: '#d3-tree01',
	data: {
		createdAt: null,
		duration: null,
		gameMode: null,
		id: null,
		mapName: null,
		matchType: null,
		shardId: null
	},
	methods: {
		updateTreeMatchDetails: function (matchDetails) {
			this.createdAt	= matchDetails.createdAt;
			this.duration 	= matchDetails.duration;
			this.gameMode	= matchDetails.gameMode.toUpperCase();
			this.id 		= matchDetails.id;
			this.mapName 	= matchDetails.mapName.toUpperCase();
			this.matchType 	= vm.resolveMatchType(matchDetails.matchType);
			this.shardId 	= matchDetails.shardId;
		},
	}
})


let vuePlayerReport = new Vue({
	el: "#div-modal",
	data: {

		// $ need a "player card" array that is created on the server that reads each player's match stats (kills, damage, knocks, etc.) for a header before the reporting lines
		selectedPlayer: null,	
		
		// $ if the player is a bot, don't make a player card summary since that info doesn't exist.
		// ! arrPlayerCards
		kills: null,
		damageDealt: null,
		DBNOs: null,
		timeSurvived: null,		
		winPlace: null,
		teamKills: null,


		rowId: null,					// id for rows
		arrPlayerReport: [], 	// (report rows) use this array for dumping the arrPlayersLog into with the player's context 

		// rowTime: null,
		// rowAttackerName: null, 
		// rowVictimName: null, 
		// rowAction: null,
		
		



		// teammates

		// attacker
		// victim
		// event time

	},
	methods: {

		updatePlayerReport: function (name, playerTeamId, arrPlayerCards, arrPlayersDamageLog, allBotNames) {

			//console.log('vuePlayerReport.updatePlayerReport()');

			if (allBotNames.includes(name)) {
				document.getElementById('botReportDisclaimer').style.display = 'block';
				document.getElementById('div-reportStats').style.display = 'none';
			}
			else {
				document.getElementById('botReportDisclaimer').style.display = 'none';
				document.getElementById('div-reportStats').style.display = 'block';
			}


			this.selectedPlayer = name;

			// ! get playercard info...

			this.kills 			= '(invalid, bot)';
			this.damageDealt 	= '(invalid, bot)';
			this.DBNOs 			= '(invalid, bot)';
			this.timeSurvived	= '(invalid, bot)';
			this.winPlace 		= '(invalid, bot)';
			this.teamKills 		= '(invalid, bot)';

			arrPlayerCards.forEach(element => {
				if (element.name == name) {
					this.kills 			= element.kills;
					this.damageDealt 	= parseInt(element.damageDealt).toLocaleString('en') ;
					this.DBNOs 			= element.DBNOs;
					this.timeSurvived	= element.timeSurvived;
					this.winPlace 		= element.winPlace;
					this.teamKills 		= element.teamKills;
				}
			});

			//console.dir(this.match_data);


			// ! get damage log activity
			// ? separate for damage and kills, and even teammate knock/revive stuff

			rowId = 0;
			this.arrPlayerReport = [];
			arrPlayersDamageLog.forEach(record => {

				if (record.attacker.name == this.selectedPlayer || record.victim.name == this.selectedPlayer) {

					let _event 	= '';
					let _damage = '';
					let _info 	= '';		// this should be a combo string of random stuff like "self-kill, thirst, bleedout/no-revive/team-wipe"
					let _distance = '';		// $ BUG: bots have distance problems on kills

					// ! unicode characters
					// https://en.wikipedia.org/wiki/List_of_Unicode_characters

					if (record._T == 'LogPlayerTakeDamage') {

						// skip adding a record if not chosen to show damage.
						if (!blShowDamage) {
							return;
						}


						_damage = parseInt(record.damage);

						_info = this.resolveDamageReason(record.damageCauserName, record.damageReason, record.damageTypeCategory);

						if (record.selfDamage){
							_info += ' (Self-damage)'
						}

						if (record.killingStroke){
							//_info += ' (kill/knock)'
						}
					}
					else if (record._T == 'LogPlayerMakeGroggy') {
						_event = '\u25BC'; // '\u2228'; //'\u25BD'; //'v';

						if (record.teammateKnock) {
							_info += ' (Teammate-knock)';
						}
						else if (record.selfKnock) {
							_info += ' (Self-knock)';
						}
						else {
							//_info = '(knock)'
						}
					}
					else if (record._T == 'LogPlayerRevive') {

						// don't bother showing the player reviving teammates. just show when the player is revived.
						if (record.attacker.name == this.selectedPlayer) {
							return;
						}

						_event = '\u2227'; //'\u25B2';  //'^';

						//_info = '(revive)'
					}
					else if (record._T == 'LogPlayerKill') {
						_event = '\u2573'; // '╳'; // 'x';

						//_info = '(kill)';

						if (record.isThirst) {
							_info += ' (Thirsted)';
						}

						if (record.isSelfKill) {
							_info += ' (Self-kill)';
						}

						if (record.isNoRevive) {
							_info += ' (Bleedout/No-revive)';
						}
						else if (record.isTeamWipe) {
							_info += ' (Bleedout/Team-wiped)';
						}
					}


					// correct for distance errors ----->
					if (record.distance != null) {
						if (record.distance == -1) {
							// invalid bot stuff
							_distance = '- - - - -';
						}
						else {
							_distance = record.distance.toLocaleString('en') + ' m';
						}
					}


					// get a summed up weapon/damager word
					let _damager = this.resolveDamager(record.damageCauserName, record.damageReason, record.damageTypeCategory);



					let _botAttacker = (allBotNames.includes(record.attacker.name)) ? '(BOT) ' : '';
					let _botVictim   = (allBotNames.includes(record.victim.name))   ? '(BOT) ' : '';

					this.arrPlayerReport.push({
						'rowId': rowId,
						'matchTime': record.matchTime,
						'attacker': _botAttacker + record.attacker.name,
						'victim': _botVictim + record.victim.name,
						'event': _event,
						'damagerInfo': _damager,
						'damage': _damage,
						'distance': _distance,
						'info': _info,
						
					});

					rowId++;
					//debugger;
				}
			})
		},
		clearPlayerReport: function () {
			this.arrPlayerReport = [];
		},
		resolveDamager: function (damageCauserName, damageReason, damageTypeCategory) {

			let _damager = '';


			if (damageTypeCategory == 'Gun') {
				_damager = damageCauserName;
			}
			else if (damageTypeCategory == "Fall Damage"   		|| 
					 damageTypeCategory == "Vehicle Crash") {
				_damager = damageTypeCategory;
			}
			else if (damageTypeCategory == 'Grenade Explosion') {
				_damager = damageCauserName;
			}
			else if (damageTypeCategory == 'Bluezone') {
				_damager = damageTypeCategory;
			}
			else if (damageTypeCategory == 'Melee') {
				_damager = damageCauserName;
			}
			else if (damageTypeCategory == 'Molotov') {
				_damager = 'Molotov';
			}
			else {
				console.log(strLine);
				console.log('unaccounted damager...');
				console.log('damageTypeCategory', damageTypeCategory + ' | damageCauserName', damageCauserName + ' + damageReason', damageReason);
			}

			return _damager;
		},
		resolveDamageReason: function (damageCauserName, damageReason, damageTypeCategory) {
			let r = '';

			if (damageReason != undefined && damageReason != 'NonSpecific') {

				r = damageReason;

				if (damageReason == 'TorsoShot') {
					r = 'Torso';
				}
				else if (damageReason == 'LegShot') {
					r = 'Leg';
				}
				else if (damageReason == 'ArmShot') {
					r = 'Arm';
				}
				else if (damageReason == 'HeadShot') {
					r = 'Headshot';
				}
				else if (damageReason == 'PelvisShot') {
					r = 'Pelvis';
				}

			}

			return r;
		}

	}
});