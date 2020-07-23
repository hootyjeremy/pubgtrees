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

		updatePlayerReport: function (name, playerTeamId, arrPlayerCards, arrPlayersDamageLog) {

			//console.log('vuePlayerReport.updatePlayerReport()');

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


					if (record._T == 'LogPlayerTakeDamage') {

						// skip adding a record if not chosen to show damage.
						if (!blShowDamage) {
							return;
						}


						_damage = parseInt(record.damage);

						if (record.selfDamage){
							_info += ' (self-damage)'
						}

						if (record.killingStroke){
							//_info += ' (kill/knock)'
						}
					}
					else if (record._T == 'LogPlayerMakeGroggy') {
						_event = 'v';

						if (record.teammateKnock) {
							_info += ' (teammate-knock)';
						}
						else if (record.selfKnock) {
							_info += ' (self-knock)';
						}
						else {
							_info = '*knock*'
						}
					}
					else if (record._T == 'LogPlayerRevive') {
						_event = '^';

						_info = '*revive*'
					}
					else if (record._T == 'LogPlayerKill') {
						_event = 'x';

						_info = '*kill*';

						if (record.isThirst) {
							_info += ' (thirst)';
						}

						if (record.isSelfKill) {
							_info += ' (self-kill)';
						}

						if (record.isNoRevive) {
							_info += ' (bleedout/no-revive)';
						}
						else if (record.isTeamWipe) {
							_info += ' (bleedout/team-wiped)';
						}
					}



					if (record.distance != null) {
						_distance = record.distance.toLocaleString('en') + ' m';
					}



					this.arrPlayerReport.push({
						'rowId': rowId,
						'matchTime': record.matchTime,
						'attacker': record.attacker.name,
						'victim': record.victim.name,
						'event': _event,
						'damage': _damage,
						'distance': _distance,
						'info': _info,
						
					});

					rowId++;
					//debugger;
				}
			})
		},
		resolveZeroes: function (number) {
			if (number == 0) {
				return '-';
			}
			else {
				return number;
			}
		},

	}
});