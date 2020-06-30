function getDate() {
    return moment().toISOString().substring(11,23);
    //return Date.now();
} 
