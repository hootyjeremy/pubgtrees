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