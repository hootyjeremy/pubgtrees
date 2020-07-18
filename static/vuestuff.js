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


let vmTreeD3 = new Vue({
	el: "#d3-tree01",
	data: {
		// matchId: null,
		// mapName: null,
		// matchType: null,
		// gameMode: null,
		// age: null,
		// humans: null,
	},
	methods: {
		// updateTreeTable: function (objMatchInfo) {
		// 	this.age = objMatchInfo.age;
		// 	this.matchId = objMatchInfo.matchId;
		// 	this.mapName = objMatchInfo.mapName;
		// 	this.matchType = objMatchInfo.matchType;
		// 	this.gameMode = objMatchInfo.gameMode;
		// 	this.humans = objMatchInfo.humans;
		// }
	}

});