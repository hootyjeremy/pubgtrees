// 2020.05.23
// https://stackoverflow.com/questions/5797852/in-node-js-how-do-i-include-functions-from-my-other-files

module.exports = {

    exportTest: function () {
        console.log('calling exported function');
    },
    translateDamageCauserName: function (dmgName) {
        var found = 'damageCauserName not found: ' + dmgName;

        // https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
        for (let [key, value] of Object.entries(_damageCauserName)) {
            if (key == dmgName) {
                found = value;
                break;
            }
        }

        // if (found == 'damageCauserName not found: ' + dmgName) {
        //     console.log();
        // }

        return found;     
    },
    translateMapName: function (mapName) {
        var found = 'not found';

        // https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
        for (let [key, value] of Object.entries(_mapName)) {
            if (key == mapName) {
                found = value;
                break;
            }
        }

        return found;     
    },
    translateDamageTypeCategory: function (dmgType) {
        var found = 'damageTypeCategory not found: ' + dmgType;

        // https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
        for (let [key, value] of Object.entries(_damageTypeCategory)) {
            if (key == dmgType) {
                found = value;
                break;
            }
        }

        return found;   
    },
    isBot: function (accountId) {
        if (accountId.includes('account.')){
            return false;
        }
        else {
            return true;
        }
    },
    strIsHumanOrBot: function (accountId) {
        // return string "(ai)" or "(human)" if it's a bot
        if (this.isBot(accountId)) {
            return ('BOT');
        }
        else {
            return 'HUMAN';
        }
    },
    getDurationFromDatesTimestamp: function (dateStart, dateEnd) {
        var duration = Math.abs(Date.parse(dateEnd) - Date.parse(dateStart));

        const diffSeconds   = Math.ceil(duration / 1000);
        //const diffMinutes   = Math.ceil(duration / (1000 * 60));

        var strTimestamp = this.ConvertSecondsToMinutes(diffSeconds);


        return strTimestamp;
    },
    ConvertSecondsToMinutes: function (seconds) {
        var sec = parseInt(seconds);
    
        // https://stackoverflow.com/a/25279399/1940465
        var date = new Date(0);
        date.setSeconds(sec); // specify value for SECONDS here
    
        //console.log(date.toISOString());
    
        var timeString = date.toISOString().substr(14, 5);
    
        //console.log(timeString)
    
        return timeString;
    },
    getDistanceXYZ: function (location1, location2) {
        // returns distance in meters
        // https://documentation.pubg.com/en/telemetry-objects.html#location

        var x1 = parseInt(location1.x);
        var y1 = parseInt(location1.y);
        var z1 = parseInt(location1.z);

        var x2 = parseInt(location2.x);
        var y2 = parseInt(location2.y);
        var z2 = parseInt(location2.z);

        //var distance = Math.hypot(x2 - x1, y2 - y1);

        var distance = Math.sqrt( (Math.pow(x2 - x1, 2) + 
                                   Math.pow(y2 - y1, 2) + 
                                   Math.pow(z2 - z1, 2) * 1), 0.5 );



        //console.log(distance);

        return parseInt(distance / 100);    // return meters
    },

}



// https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/mapName.json
var _mapName = {
    "Desert_Main": "Miramar",
    "DihorOtok_Main": "Vikendi",
    "Erangel_Main": "Erangel",
    "Baltic_Main": "Erangel",
    "Range_Main": "Camp Jackal (Training Mode)",
    "Savage_Main": "Sanhok",
    "Summerland_Main": "Karakin"
}

// https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/damageTypeCategory.json
var _damageTypeCategory = {
    "Damage_BlueZone": "Bluezone",
    "Damage_Drown": "Drowning",
    "Damage_Explosion_BlackZone": "Blackzone",
    "Damage_Explosion_Breach": "Breach Explosion",
    "Damage_Explosion_JerryCan": "Jerrycan Explosion",
    "Damage_Explosion_Grenade": "Grenade Explosion",
    "Damage_Explosion_PanzerFaustBackBlast": "Panzerfaust Backblast",
    "Damage_Explosion_PanzerFaustWarhead": "Panzerfaust Explosion",
    "Damage_Explosion_RedZone": "Redzone",
    "Damage_Explosion_StickyBomb": "Sticky Bomb Explosion",
    "Damage_Explosion_Vehicle": "Vehicle Explosion",
    "Damage_Groggy": "Damage Groggy",
    "Damage_Gun": "Gun",
    "Damage_Instant_Fall": "Fall Damage",
    "Damage_Melee": "Melee",
    "Damage_MeleeThrow": "Melee Throw",
    "Damage_Molotov": "Molotov",
    "Damage_Punch": "Punch",
    "Damage_TrainHit": "Train Damage",
    "Damage_VehicleCrashHit": "Vehicle Crash",
    "Damage_VehicleHit": "Vehicle Hit",
    "SpikeTrap": "Spike Trap",
    "Damage_Explosion_C4": 'C4 Explosion'
}

//https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/damageCauserName.json
var _damageCauserName = {
    "AIPawn_Base_Male_C": "Bot",
    "AIPawn_Base_Female_C": "Bot",
    "AquaRail_A_01_C": "Aquarail",
    "AquaRail_A_02_C": "Aquarail",
    "AquaRail_A_03_C": "Aquarail",
    "BattleRoyaleModeController_Def_C": "Bluezone",
    "BattleRoyaleModeController_Desert_C": "Bluezone",
    "BattleRoyaleModeController_DihorOtok_C": "Bluezone",
    "BattleRoyaleModeController_Savage_C": "Bluezone",
    "BattleRoyaleModeController_Summerland_C": "Bluezone",
    "BlackZoneController_Def_C": "Blackzone",
    "Boat_PG117_C": "Boat",
    "BP_BRDM_C": "BRDM-2",
    "BP_DO_Circle_Train_Merged_C": "Train",
    "BP_DO_Line_Train_Dino_Merged_C": "Train",
    "BP_DO_Line_Train_Merged_C": "Train",
    "BP_FireEffectController_C": "Molotov Fire",
    "BP_M_Rony_A_01_C": "Rony",
    "BP_M_Rony_A_02_C": "Rony",
    "BP_M_Rony_A_03_C": "Rony",
    "BP_Mirado_A_02_C": "Mirado",
    "BP_Mirado_A_03_Esports_C": "Mirado",
    "BP_Mirado_Open_03_C": "Mirado",
    "BP_Mirado_Open_04_C": "Mirado",
    "BP_MolotovFireDebuff_C": "Molotov",
    "BP_Motorbike_04_C": "Motorcycle",
    "BP_Motorbike_04_Desert_C": "Motorcycle",
    "BP_Motorbike_04_SideCar_C": "Motorcycle (w/ Sidecar)",
    "BP_Motorbike_04_SideCar_Desert_C": "Motorcycle (w/ Sidecar)",
    "BP_Motorglider_C": "Motor Glider",
    "BP_Niva_01_C": "Zima",
    "BP_Niva_02_C": "Zima",
    "BP_Niva_03_C": "Zima",
    "BP_Niva_04_C": "Zima",
    "BP_Niva_05_C": "Zima",
    "BP_Niva_06_C": "Zima",
    "BP_Niva_07_C": "Zima",
    "BP_PickupTruck_A_01_C": "Pickup Truck",
    "BP_PickupTruck_A_02_C": "Pickup Truck",
    "BP_PickupTruck_A_03_C": "Pickup Truck",
    "BP_PickupTruck_A_04_C": "Pickup Truck",
    "BP_PickupTruck_A_05_C": "Pickup Truck",
    "BP_PickupTruck_A_esports_C": "Pickup Truck",
    "BP_PickupTruck_B_01_C": "Pickup Truck",
    "BP_PickupTruck_B_02_C": "Pickup Truck",
    "BP_PickupTruck_B_03_C": "Pickup Truck",
    "BP_PickupTruck_B_04_C": "Pickup Truck",
    "BP_PickupTruck_B_05_C": "Pickup Truck)",
    "BP_Scooter_01_A_C": "Scooter",
    "BP_Scooter_02_A_C": "Scooter",
    "BP_Scooter_03_A_C": "Scooter",
    "BP_Scooter_04_A_C": "Scooter",
    "BP_Snowbike_01_C": "Snowbike",
    "BP_Snowbike_02_C": "Snowbike",
    "BP_Snowmobile_01_C": "Snowmobile",
    "BP_Snowmobile_02_C": "Snowmobile",
    "BP_Snowmobile_03_C": "Snowmobile",
    "BP_Spiketrap_C": "Spike Trap",
    "BP_TukTukTuk_A_01_C": "Tukshai",
    "BP_TukTukTuk_A_02_C": "Tukshai",
    "BP_TukTukTuk_A_03_C": "Tukshai",
    "BP_Van_A_01_C": "Van",
    "BP_Van_A_02_C": "Van",
    "BP_Van_A_03_C": "Van",
    "Buff_DecreaseBreathInApnea_C": "Drowning",
    "Buggy_A_01_C": "Buggy",
    "Buggy_A_02_C": "Buggy",
    "Buggy_A_03_C": "Buggy",
    "Buggy_A_04_C": "Buggy",
    "Buggy_A_05_C": "Buggy",
    "Buggy_A_06_C": "Buggy",
    "Dacia_A_01_v2_C": "Dacia",
    "Dacia_A_01_v2_snow_C": "Dacia",
    "Dacia_A_02_v2_C": "Dacia",
    "Dacia_A_03_v2_C": "Dacia",
    "Dacia_A_03_v2_Esports_C": "Dacia",
    "Dacia_A_04_v2_C": "Dacia",
    "Jerrycan": "Jerrycan",
    "None": "None",
    "PanzerFaust100M_Projectile_C": "Panzerfaust Projectile",
    "PG117_A_01_C": "PG-117",
    "PlayerFemale_A_C": "Player",
    "PlayerMale_A_C": "Player",
    "ProjC4_C": "C4",
    "ProjGrenade_C": "Grenade",
    "ProjMolotov_C": "Molotov Cocktail",
    "ProjMolotov_DamageField_Direct_C": "Molotov Cocktail Fire Field",
    "ProjStickyGrenade_C": "Sticky Bomb",
    "RedZoneBomb_C": "Redzone",
    "RedZoneBombingField": "Redzone",
    "TslDestructibleSurfaceManager": "Destructible Surface",
    "Uaz_A_01_C": "UAZ",
    "Uaz_Armored_C": "UAZ (armored)",
    "Uaz_B_01_C": "UAZ",
    "Uaz_B_01_esports_C": "UAZ",
    "Uaz_C_01_C": "UAZ",
    "WeapAK47_C": "AKM",
    "WeapAUG_C": "AUG A3",
    "WeapAWM_C": "AWM",
    "WeapBerreta686_C": "S686",
    "WeapBerylM762_C": "Beryl",
    "WeapBizonPP19_C": "Bizon",
    "WeapCowbar_C": "Crowbar",
    "WeapCowbarProjectile_C": "Crowbar Throw",
    "WeapCrossbow_1_C": "Crossbow",
    "WeapDesertEagle_C": "Deagle",
    "WeapDP12_C": "DBS",
    "WeapDP28_C": "DP-28",
    "WeapFNFal_C": "SLR",
    "WeapG18_C": "P18C",
    "WeapG36C_C": "G36C",
    "WeapGroza_C": "Groza",
    "WeapHK416_C": "M416",
    "WeapKar98k_C": "Kar98k",
    "WeapJuliesKar98k_C": "Kar98k",
    "WeapM16A4_C": "M16A4",
    "WeapM1911_C": "P1911",
    "WeapM249_C": "M249",
    "WeapM24_C": "M24",
    "WeapM9_C": "P92",
    "WeapMachete_C": "Machete",
    "WeapMacheteProjectile_C": "Machete Throw",
    "WeapMini14_C": "Mini 14",
    "WeapMk14_C": "Mk14",
    "WeapMk47Mutant_C": "Mutant",
    "WeapMosinNagant_C": "Mosin Nagant",
    "WeapMP5K_C": "MP5K",
    "WeapNagantM1895_C": "R1895",
    "WeapMosinNagant_C_9": "Mosin-Nagant",
    "WeapPan_C": "Pan",
    "WeapPanProjectile_C": "Pan Throw",
    "WeapPanzerFaust100M1_C": "Panzerfaust",
    "WeapQBU88_C": "QBU",
    "WeapQBZ95_C": "QBZ",
    "WeapRhino_C": "R45",
    "WeapSaiga12_C": "S12K",
    "WeapSawnoff_C": "Sawed-off",
    "WeapSCAR-L_C": "SCAR-L",
    "WeapSickle_C": "Sickle",
    "WeapSickleProjectile_C": "Sickle Throw",
    "WeapSKS_C": "SKS",
    "WeapThompson_C": "Tommy Gun",
    "WeapUMP_C": "UMP9",
    "WeapUZI_C": "Micro Uzi",
    "WeapVector_C": "Vector",
    "WeapVSS_C": "VSS",
    "Weapvz61Skorpion_C": "Skorpion",
    "WeapWin94_C": "Win94",
    "WeapWinchester_C": "S1897"
}
