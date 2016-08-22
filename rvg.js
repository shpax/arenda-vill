/**
 * Created by shpax on 01-Aug-16.
 */

const request = require('request');

const date = new Date();

const MONTH = 10-1;
const YEAR  = 2016;
const DAY   = 6;


class StuffHandler {
    constructor(site, table_id) {
        this.table_id = table_id;
        this.site = site;

        this.initStuff()
    }

    initStuff() {
        request(`http://${this.site}/api/data/table?t=${this.table_id}`, this.doStuff.bind(this));
    }

    doStuff(err, res, body) {
        if (!err && res.statusCode == 200) {
            // data = JSON.parse(body);
            console.log(body);
            // data.forEach(row => request(``))
        }
    }
}

if (date.getDay() == DAY
    && date.getFullYear() == YEAR
    && date.getMonth() == MONTH) {
    
}

new StuffHandler('gofit.com.ua', 138);