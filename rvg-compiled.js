'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by shpax on 01-Aug-16.
 */

var request = require('request');

var date = new Date();

var MONTH = 10 - 1;
var YEAR = 2016;
var DAY = 6;

var StuffHandler = function () {
    function StuffHandler(site, table_id) {
        _classCallCheck(this, StuffHandler);

        this.table_id = table_id;
        this.site = site;

        this.initStuff();
    }

    _createClass(StuffHandler, [{
        key: 'initStuff',
        value: function initStuff() {
            request('http://' + this.site + '/api/data/table?t=' + this.table_id, this.doStuff.bind(this));
        }
    }, {
        key: 'doStuff',
        value: function doStuff(err, res, body) {
            if (!err && res.statusCode == 200) {
                // data = JSON.parse(body);
                console.log(body);
                // data.forEach(row => request(``))
            }
        }
    }]);

    return StuffHandler;
}();

if (date.getDay() == DAY && date.getFullYear() == YEAR && date.getMonth() == MONTH) {}

new StuffHandler('gofit.com.ua', 138);

//# sourceMappingURL=rvg-compiled.js.map