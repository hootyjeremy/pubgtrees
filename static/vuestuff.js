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

		isHidden: true,			// hide damage/health

		hitLocations: {},

		headPercentage: 0,
		bodyPercentage: 0,
		pelvisPercentage: 0,
		armPercentage: 0,
		legPercentage: 0,

		


		// teammates

		// attacker
		// victim
		// event time

	},
	methods: {

		updatePlayerReport: function (name, killer, playerTeam, killerTeam, arrPlayerCards, arrPlayersDamageLog, allBotNames, allHumanNames) {

			//console.log('vuePlayerReport.updatePlayerReport()');
			//console.log('isHidden: ' + this.isHidden);

			if (allBotNames.includes(name)) {
				document.getElementById('botReportDisclaimer').style.display = 'block';
				document.getElementById('div-reportStats').style.display = 'none';
			}
			else {
				document.getElementById('botReportDisclaimer').style.display = 'none';
				document.getElementById('div-reportStats').style.display = 'block';
			}


			this.selectedPlayer = name;

			//let hitLocations 	= new Object();
			this.hitLocations.head 	= 0;
			this.hitLocations.body 	= 0;
			this.hitLocations.pelvis = 0;
			this.hitLocations.arm  	= 0;
			this.hitLocations.leg 	= 0;


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

			

			// get damage log activity
			//#region // ! [region] arrPlayersDamageLog loop...
			//

			rowId = 0;
			this.arrPlayerReport = [];
			arrPlayersDamageLog.forEach(record => {

				if (record.attacker.name == this.selectedPlayer || record.victim.name == this.selectedPlayer) {

					let _event 	= '';
					//let _damage = '';
					let _info 	= '';		// this should be a combo string of random stuff like "self-kill, thirst, bleedout/no-revive/team-wipe"
					let _distance = '';		// $ BUG: bots have distance problems on kills

					let attackerName = record.attacker.name;
					let victimName = record.victim.name;

					let attackerHealth = '';
					let victimHealth = '';

					let armor = '';

					let attackerClass = '';
					let victimClass = '';
					let rowClass = '';

					let zone = '';

					// ! unicode characters
					// https://en.wikipedia.org/wiki/List_of_Unicode_characters

					if (record._T == 'LogPlayerTakeDamage') {

						// hit locations
						//if (victimName != attackerName) {
							if (attackerName == name) {
								if (record.damageReason == 'HeadShot') {
									this.hitLocations.head++;
								}
								else if (record.damageReason == 'TorsoShot') {
									this.hitLocations.body++;
								}
								else if (record.damageReason == 'PelvisShot') {
									this.hitLocations.pelvis++;
								}
								else if (record.damageReason == 'LegShot') {
									this.hitLocations.leg++;
								}
								else if (record.damageReason == 'ArmShot') {
									this.hitLocations.arm++;
								}
							}
						//}

												

						// skip adding a record if not chosen to show damage.
						if (this.isHidden) {
							return;
						}

						//_damage = (record.damage < 1) ? record.damage.toFixed(2) : parseInt(record.damage);

						// put damage into the event column...
						_event 			= (record.damage > 0 && record.damage < 2) ? record.damage.toFixed(1) : parseInt(record.damage);
						attackerHealth 	= (record.attacker.health > 0 && record.attacker.health < 2) ? record.attacker.health.toFixed(1): parseInt(record.attacker.health);
						victimHealth 	= (record.victim.healthAfterDamage > 0 && record.victim.healthAfterDamage < 2) ? record.victim.healthAfterDamage.toFixed(1) : parseInt(record.victim.healthAfterDamage);

						_info = this.resolveDamageReason(record.damageCauserName, record.damageReason, record.damageTypeCategory);

						// only show armor and vest if it is a headshot or a body shot
						if (record.damageReason == 'HeadShot') {
							armor = this.translateHead(record.victim.armor.head);
						}
						else if (record.damageReason == 'TorsoShot') {
							armor = this.translateVest(record.victim.armor.vest);
						}


						if (record.selfDamage){
							_info += ' (Self-damage)'
						}

						if (record.killingStroke){
							//_info += ' (kill/knock)'
						}

					}
					else if (record._T == 'LogPlayerMakeGroggy') {
						_event = '\u25BC'; // '\u2228'; //'\u25BD'; //'v';

						rowClass = 'rowKill';

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

						rowClass = 'rowKill';

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
						else if (record.distance == 0) {
							_distance = '- - - - -';
						}
						else {
							_distance = record.distance.toLocaleString('en') + ' m';
						}
					}


					// get a summed up weapon/damager word
					let _damager = this.resolveDamager(record.damageCauserName, record.damageReason, record.damageTypeCategory);



					//let _botAttacker = (allBotNames.includes(record.attacker.name)) ? '(BOT) ' : '';
					//let _botVictim   = (allBotNames.includes(record.victim.name))   ? '(BOT) ' : '';


					// ! set classes for the table data
					// selected player : attacker ---------------------------->
					if (record.attacker.name == this.selectedPlayer) {
						attackerClass = 'selectedPlayer'
					}					

					// selected player : victim ---------------------------->
					if (record.victim.name == this.selectedPlayer) {
						victimClass = 'selectedPlayer';
					}


					// bot: attacker ----------------------------------------->
					if (allBotNames.includes(record.attacker.name)) {
						attackerClass = 'botPlayer';
					}

					// bot: victim ----------------------------------------->
					if (allBotNames.includes(record.victim.name)) {
						victimClass = 'botPlayer';
					}


					// killer : attacker ------------------------------------->
					if (attackerName == killer && attackerName != name) {
						attackerClass = 'killer'

						// if the killer is a bot, then let it be known (since they are colored as killer and not bot anymore)
						if (allBotNames.includes(killer)) {
							attackerName = '[BOT] ' + attackerName;
						}
					}					

					// killer : victim ------------------------------------->
					if (victimName == killer && victimName != name) {
						victimClass = 'killer';

						// if the killer is a bot, then let it be known (since they are colored as killer and not bot anymore)
						if (allBotNames.includes(killer)) {
							victimName = '[BOT] ' + victimName;
						}
					}



					// killer teammate: attacker
					if (attackerName != killer && killer != '' && killerTeam != 0) {
						// check if they are on the killer team

						// need to skip this if a player's killer is on the same team
						let killedByTeammate = 0;		// if this is two (both killer and player are on the same team)
						killerTeam.teammates.forEach(teammate => {
							if (teammate.name == killer) {
								killedByTeammate++;
							}
							else if (teammate.name == name) {
								killedByTeammate++;
							}
						});


						killerTeam.teammates.forEach(teammate => {
							if (attackerName == teammate.name) {

								if (teammate.isBot) {
									attackerName = '[BOT] ' + attackerName;
								}
	
								if (killedByTeammate != 2) {
									attackerClass = 'killerTeammate';
								}
							}
						});

					}

					// killer teammate: victim
					if (victimName != killer && killer != '' && killerTeam != 0) {

						// need to skip this if a player's killer is on the same team
						let killedByTeammate = 0;
						killerTeam.teammates.forEach(teammate => {
							if (teammate.name == killer) {
								killedByTeammate++;
							}
							else if (teammate.name == name) {
								killedByTeammate++;
							}
						});

						
						// check if they are on the killer team
						killerTeam.teammates.forEach(teammate => {
							if (victimName == teammate.name) {
								if (teammate.isBot) {
									victimName = '[BOT] ' + victimName;
								}
	
								if (killedByTeammate != 2) {
									victimClass = 'killerTeammate';
								}
							}
						});
					}


					
					// player teammate: attacker
					if (attackerName != name) {
						// check if they are on the killer team
						playerTeam.teammates.forEach(teammate => {
							if (attackerName == teammate.name) {

								if (teammate.isBot) {
									attackerName = '[BOT] ' + attackerName;
								}
	
								attackerClass = 'playerTeammate';
							}
						});
					}

					// player teammate: victim
					if (victimName != name) {
						// check if they are on the killer team
						playerTeam.teammates.forEach(teammate => {
							if (victimName == teammate.name) {
								if (teammate.isBot) {
									victimName = '[BOT] ' + victimName;
								}
	
								victimClass = 'playerTeammate';
							}
						});
					}



					// don't show distance for grenades or molotov damage
					if (_damager == 'Grenade' || _damager == 'Molotov') {
						_distance = '';
					}

					if (record.victim.zone[0] != '') {
						zone = translateZone(record.victim.zone[0]);

					}

					this.arrPlayerReport.push({
						'rowId': rowId,
						'matchTime': record.matchTime,
						'attacker': attackerName,
						'victim': victimName,
						'event': _event,
						'damagerInfo': _damager,
						'distance': _distance,
						'info': _info,
						'attackerClass': attackerClass,
						'victimClass': victimClass,
						'attackerHealth': attackerHealth,
						'victimHealth': victimHealth,
						'zone': zone,
						'rowClass': rowClass,
						'armor': armor,
						// 'head': head,
						// 'vest': vest,
						

					});

					rowId++;
					//debugger;
				}


			})

			//#endregion -- arrPlayersDamage loop



			// get percentages of shots
			totalHits = this.hitLocations.head + this.hitLocations.body + this.hitLocations.pelvis + this.hitLocations.arm + this.hitLocations.leg;

			if (totalHits > 0) {
				this.headPercentage = ((this.hitLocations.head * 100) / totalHits).toFixed(1);
				this.bodyPercentage = ((this.hitLocations.body * 100) / totalHits).toFixed(1);
				this.pelvisPercentage = ((this.hitLocations.pelvis * 100) / totalHits).toFixed(1);
				this.armPercentage = ((this.hitLocations.arm * 100) / totalHits).toFixed(1);
				this.legPercentage = ((this.hitLocations.leg * 100) / totalHits).toFixed(1);
			}
		},
		clearPlayerReport: function () {
			this.arrPlayerReport = [];
		},
		resolveDamager: function (damageCauserName, damageReason, damageTypeCategory) {

			let _damager = '';


			if (damageTypeCategory == 'Gun') {
				_damager = damageCauserName;
			}
			else if (damageTypeCategory == 'Fall Damage'   || 
					 damageTypeCategory == 'Vehicle Crash' ||
					 damageTypeCategory == 'Vehicle Hit'   ||
					 damageTypeCategory == 'Punch') {
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
					r = 'Body';
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
		},
		translateHead(head) {
			
			let r = '';
			
			if (head == null) {
				r = 'static/images/gear/minus (1)-white-small.png';
			}
			else if (head == 'Item_Head_E_01_Lv1_C') {
				r = 'static/images/gear/helmet-level1.png';
			}
			else if (head == 'Item_Head_E_02_Lv1_C') {
				r = 'static/images/gear/helmet-level1.png';
			}
			else if (head == 'Item_Head_F_01_Lv2_C') {
				r = 'static/images/gear/helmet-level2.png';
			}
			else if (head == 'Item_Head_F_02_Lv2_C') {
				r = 'static/images/gear/helmet-level2.png';
			}
			else if (head == 'Item_Head_G_01_Lv3_C') {
				r = 'static/images/gear/helmet-level3.png';
			}

			return r;
		},
		translateVest(vest) {

			let r = '';
			if (vest == null) {
				r = 'static/images/gear/minus (1)-white-small.png';
			}
			else if (vest == 'Item_Armor_C_01_Lv3_C') {
				r = 'static/images/gear/vest-level3.png';
			}
			else if (vest == 'Item_Armor_D_01_Lv2_C') {
				r = 'static/images/gear/vest-level2.png';
			}
			else if (vest == 'Item_Armor_E_01_Lv1_C') {
				r = 'static/images/gear/vest-level1.png';
			}

			return r;
		}


	}
});