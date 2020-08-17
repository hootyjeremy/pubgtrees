function getDate() {
    return moment().toISOString().substring(11,23);
    //return Date.now();
} 

function strBot(bot) {
	if (bot) {
		return 'BOT  ';
	}
	else {
		return 'HUMAN';
	}
}

function translateZone(zone) {
	var found = zone;

	// https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
	for (let [key, value] of Object.entries(zoneDictionary)) {
		if (key == zone) {
			found = value;
			break;
		}
	}

	return found;  
}

let zoneDictionary = {
	// Miramar
	"alcantara": "Alcantara",
    "ruins": "Ruins",
    "lacobreria": "La Cobreria",
    "trailerpark": "Trailer Park",
    "craterfields": "Crater Fields",
    "elpozo": "El Pozo",
    "watertreatment": "Water Treatment",
    "sanmartin": "San Martin",
    "heciendadelpatron": "Hacienda",
    "powergrid": "Power Grid",
    "cruzdelvalle": "Cruz del Valle",
    "torreahumada": "Torre Ahumada",
    "campomilitar": "Campo Militar",
    "tierrabronca": "Tierra Bronca",
    "elazahar": "El Azahar",
    "junkyard": "Junkyard",
    "minasgenerales": "Minas Generales",
    "graveyard": "Graveyard",
    "montenuevo": "Monte Nuevo",
    "ladrillera": "Ladrillera",
    "chumacera": "Chumacera",
    "pecado": "Pecado",
    "labendita": "La Bendita",
    "lmpala": "Impala",
    "losleones": "Los Leones",
    "puertoparaiso": "Puerto Paraiso",
    "loshigos": "Los Higos",
    "prison": "Prison",
    "minasdelsur": "Minas del Sur",
	"valledelmar": "Valle del Mar",
	
	// Vikendi
	"port": "Port",
    "cosmodrome": "Cosmodrome",
    "trevno": "Trevno",
    "peshkova": "Peshkova",
    "mountkreznic": "Mount Kreznic",
    "goroka": "Goroka",
    "dobromesto": "Dobro Mesto",
    "vihar": "Vihar",
    "movatra": "Movatra",
    "dinoland": "Dino Land",
    "tovar": "Tovar",
    "castle": "Castle",
    "podvosto": "Podvosto",
    "cementfactory": "Cement Factory",
    "cantra": "Cantra",
    "hotspring": "Hot Springs",
    "volnova": "Volnova",
    "abbey": "Abbey",
    "winery": "Winery",
    "milnar": "Milnar",
    "zabava": "Zabava",
    "krichas": "Krichas",
    "coalmine": "Coalmine",
	"lumberyard": "Lumber Yard",
    "pilnec": "Pilnec",
	"sawmill": "Sawmill",
	
	// Erangel
	"zharki": "Zharki",
    "shootingrange": "Shooting Range",
    "severny": "Severny",
    "stalber": "Stalber",
    "kameshki": "Kameshki",
    "yasnayapolyana": "Yasnaya",
    "lipovka": "Lipovka",
    "mansion": "Mansion",
    "shelter": "Shelter",
    //"prison": "Prison",
    "myltapower": "Mylta Power",
    "mylta": "Mylta",
    "farm": "Farm",
    "rozhok": "Rozhok",
    "school": "School",
    "georgopol": "Georgopol",
    "hospital": "Hospital",
    "gatka": "Gatka",
    "quarry": "Quarry",
    "primorsk": "Primorsk",
    "ferrypier": "Ferry Pier",
    "sosnovkamilitarybase": "Military Base",
    "novorepnoye": "Novorepnoye",
    //"ruins": "Ruins",
	"pochinki": "Pochinki",
	
	// Sanhok
	"kampong": "Kampong",
    "getaway": "Getaway",
    "lawaki": "Lakawi",
    "campbravo": "Camp Bravo",
    "airfield": "Airfield",
    "khao": "Khao",
    "tatmok": "Tat Mok", 
    "paradiseresort": "Paradise",
    "bootcamp": "Bootcamp",
    //"quarry": "Quarry",
    "cave": "Cave",
    "campalpha": "Camp Alpha",
    "campcharlie": "Camp Charlie",
    "bantai": "Ban Tai",
    "painan": "Pai NaN",
    "sahmee": "Sahmee",
    "nakham": "Na Kham",
    "tambang": "Tambang,",
    //"ruins": "Ruins",
	"hatinh": "Ha Tinh",
	
	// Kharakin
	"alhabar": "Al Habar",
    "alhayik": "Al Hayik",
    "bahrsahir": "Bahr Sahir",
    "bashara": "Bashara",
    "cargoship": "Cargo Ship",
	"hadiqanemo": "Hadiqa Nemo",
	
	

}