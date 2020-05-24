// 2020.05.23
// https://stackoverflow.com/questions/5797852/in-node-js-how-do-i-include-functions-from-my-other-files

module.exports = {

    exportTest: function () {
        console.log('calling exported function');
    },
    translateDamageCauserName: function (dmgName) {
        var found = 'not found';

        // https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
        for (let [key, value] of Object.entries(_damageCauserName)) {
            if (key == dmgName) {
                found = value;
                break;
            }
        }

        return found;     
    },
    GetTranslatedMapName: function (mapName) {
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
    translatedDamageTypeCategory: function (dmgType) {
        var found = 'not found';

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
    }
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
    "Damage_Groggy": "Bleed-out",
    "Damage_Gun": "Gun", // "Gun Damage"
    "Damage_Instant_Fall": "Fall Damage",
    "Damage_Melee": "Melee",
    "Damage_MeleeThrow": "Melee Throw",
    "Damage_Molotov": "Molotov",
    "Damage_Punch": "Punch",
    "Damage_TrainHit": "Train Damage",
    "Damage_VehicleCrashHit": "Vehicle Crash",
    "Damage_VehicleHit": "Vehicle",
    "SpikeTrap": "Spike Trap"
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
    "Boat_PG117_C": "PG-117",
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
    "BP_Mirado_Open_03_C": "Mirado (open top)",
    "BP_Mirado_Open_04_C": "Mirado (open top)",
    "BP_MolotovFireDebuff_C": "Molotov Fire Damage",
    "BP_Motorbike_04_C": "Motorcycle",
    "BP_Motorbike_04_Desert_C": "Motorcycle",
    "BP_Motorbike_04_SideCar_C": "Motorcycle (w/ Sidecar)",
    "BP_Motorbike_04_SideCar_Desert_C": "Motorcycle (w/ Sidecar)",
    "BP_Motorglider_C": "Motor Glider",
    "BP_Niva_01_C": "Zima",
    "BP_Niva_02_C": "Zima",
    "BP_Niva_03_C": "Zima",
    "BP_Niva_04_C": "Zima",
    "BP_PickupTruck_A_01_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_A_02_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_A_03_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_A_04_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_A_05_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_A_esports_C": "Pickup Truck (closed top)",
    "BP_PickupTruck_B_01_C": "Pickup Truck (open top)",
    "BP_PickupTruck_B_02_C": "Pickup Truck (open top)",
    "BP_PickupTruck_B_03_C": "Pickup Truck (open top)",
    "BP_PickupTruck_B_04_C": "Pickup Truck (open top)",
    "BP_PickupTruck_B_05_C": "Pickup Truck (open top)",
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
    "ProjGrenade_C": "Frag Grenade",
    "ProjMolotov_C": "Molotov Cocktail",
    "ProjMolotov_DamageField_Direct_C": "Molotov Cocktail Fire Field",
    "ProjStickyGrenade_C": "Sticky Bomb",
    "RedZoneBomb_C": "Redzone",
    "RedZoneBombingField": "Redzone",
    "TslDestructibleSurfaceManager": "Destructible Surface",
    "Uaz_A_01_C": "UAZ (open top)",
    "Uaz_Armored_C": "UAZ (armored)",
    "Uaz_B_01_C": "UAZ (soft top)",
    "Uaz_B_01_esports_C": "UAZ (soft top)",
    "Uaz_C_01_C": "UAZ (hard top)",
    "WeapAK47_C": "AKM",
    "WeapAUG_C": "AUG A3",
    "WeapAWM_C": "AWM",
    "WeapBerreta686_C": "S686",
    "WeapBerylM762_C": "Beryl",
    "WeapBizonPP19_C": "Bizon",
    "WeapCowbar_C": "Crowbar",
    "WeapCowbarProjectile_C": "Crowbar Projectile",
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
    "WeapM16A4_C": "M16A4",
    "WeapM1911_C": "P1911",
    "WeapM249_C": "M249",
    "WeapM24_C": "M24",
    "WeapM9_C": "P92",
    "WeapMachete_C": "Machete",
    "WeapMacheteProjectile_C": "Machete Projectile",
    "WeapMini14_C": "Mini 14",
    "WeapMk14_C": "Mk14 EBR",
    "WeapMk47Mutant_C": "Mk47 Mutant",
    "WeapMP5K_C": "MP5K",
    "WeapNagantM1895_C": "R1895",
    "WeapMosinNagant_C_9": "Mosin-Nagant",
    "WeapPan_C": "Pan",
    "WeapPanProjectile_C": "Pan Projectile",
    "WeapPanzerFaust100M1_C": "Panzerfaust",
    "WeapQBU88_C": "QBU88",
    "WeapQBZ95_C": "QBZ95",
    "WeapRhino_C": "R45",
    "WeapSaiga12_C": "S12K",
    "WeapSawnoff_C": "Sawed-off",
    "WeapSCAR-L_C": "SCAR-L",
    "WeapSickle_C": "Sickle",
    "WeapSickleProjectile_C": "Sickle Projectile",
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
