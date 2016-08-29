"use strict";

var POPULAR_DIRECTIONS = ["ница", "ницца", "канны", "сен-тропе", "тоскана", "ибица", "доминикана", "бали", "марбелья", "сейшеллы", "мальдивы", "куршевель"];

var FIELDS = {
    NAME: 'f1',
    META_TITLE: 'f2',
    META_DESC: 'f5',
    META_KEYWORDS: 'f4',
    MIN_PRICE: 'f3',
    MAX_PRICE: 'f21',
    OBJECT_TYPE: 'f6',
    RECREATION_STYLE: 'f7',
    DIRECTION: 'f8',
    BEDROOMS: 'f9',
    BATHS: 'f10',
    PEOPLE: 'f11',
    BENEFITS: 'f12',
    DESCRIPTION: 'f13',
    COORDS: 'f14',
    ADDITIONAL_SERVICE: 'f15',
    BEDROOMS_DESC: 'f16',
    ADDRESS: 'f17',
    URL: 'f18',
    SERVICES: 'f19',
    STATUS: 'f20'
};

app.filter('endOfWordVills', function () {
    return function (countVills) {
        //debugger;
        var countVills = +countVills;
        if (countVills != 0) {
            var lastDigit = "" + countVills;
            if (lastDigit.slice(-2, -1) && +lastDigit.slice(-2, -1) == 1) {
                return '';
            } else {
                lastDigit = +lastDigit.slice(-1);
                switch (lastDigit) {
                    case 1:
                        return 'а';
                        break;
                    case 2:
                    case 3:
                    case 4:
                        return 'ы';
                        break;
                    default:
                        return '';
                }
            }
        }
    };
});

app.controller('MainPageCtrl', ['$scope', '$http', '$window', '$location', '$rootScope', 'SearchPageFact', 'Database', function ($s, $h, $location, $rootScope, $window, SearchPageFact, db) {
    $s.vills = [];
    $s.selectedAddress = "";
    $s.result = [];
    $s.regionNames = ['Испания', 'Азия', 'Карибы', 'Франция', 'Италия', 'Балканы', 'Шале'];
    $s.regions = [];
    $s.bestVillas = [];
    $s.searchPlaceholder = 'Введите название виллы или город...';
    $s.foo12 = 'foo12';
    $s.oh = 'oh12';
    localStorage.removeItem('searchValue');

    $s.villaImg = function (villa) {
        if (villa.image) return villa.image;else {
            $h.get('/api/data/table?t=428&field=f2&where[f1]=' + villa.field_value_id + '&orderBy[f3]=desc&count=1').success(function (img) {
                return villa.image = img;
            });
            villa.image = true;
            return '';
        }
    };

    // initialization
    db.request('/api/data/table?t=342&connect[f8]=3', function (rows) {
        if (rows && rows.length) {
            $s.directions = [];
            $s.subRegions = [];
            $s.directionIds = [];
            $s.popularDirections = [];
            $s.regions = [];

            $s.vills = rows.sort(function (row1, row2) {
                if (row1[FIELDS.STATUS] == row2[FIELDS.STATUS]) return 0;
                if (!row1[FIELDS.STATUS]) return 1;
                if (row1[FIELDS.STATUS].toLowerCase() == 'популярная') return -1;
                return 1;
            }).map(function (villa) {
                try {
                    villa.fullUrl = 'http://' + villa.f8[0].f3[0].f8 + '/' + villa.url;
                } catch (E) {
                    villa.fullUrl = 'http://arenda-vill.com/' + villa.url;
                }

                if (villa[FIELDS.DIRECTION]) {
                    (function () {
                        var direction = villa[FIELDS.DIRECTION][0];

                        villa.direction = direction;

                        var ind = void 0;
                        if (ind = $s.directionIds.indexOf(direction.field_value_id == -1)) {
                            $s.directions.push(direction);
                            $s.directionIds.push(direction.field_value_id);
                        } else direction = $s.directions[ind];

                        if (POPULAR_DIRECTIONS.indexOf(direction.f1.toLowerCase()) != -1) {
                            var popDir = void 0;
                            if (!(popDir = $s.popularDirections.filter(function (dir) {
                                return dir.field_value_id == direction.field_value_id;
                            }).pop())) {
                                popDir = direction;
                                $s.popularDirections.push(direction);
                            }
                            popDir.villas = popDir.villas || [];
                            if (popDir.villas.length < 3) popDir.villas.push(villa);
                        }

                        if (direction.f3) {
                            (function () {
                                var region = direction.f3[0];
                                if (!$s.regions.some(function (reg) {
                                    if (reg.field_value_id == region.field_value_id) {
                                        region = reg;
                                        return true;
                                    }
                                })) $s.regions.push(region);

                                region.villas = region.villas || [];
                                region.villas.push(villa);

                                region.directions = region.directions || [];
                                region.directions.push(direction);

                                if (direction.f2) {
                                    (function () {
                                        var subRegion = direction.f2[0];
                                        subRegion.region = region;
                                        if (!$s.subRegions.some(function (reg) {
                                            return reg.field_value_id == subRegion.field_value_id;
                                        })) {
                                            $s.subRegions.push(subRegion);
                                        }
                                    })();
                                }
                            })();
                        }
                    })();
                }

                return villa;
            });

            $s.regions.forEach(function (region) {
                region.directionsStr = "направлен";
                switch (region.directions.length % 10) {
                    case 1:
                        region.directionsStr += 'ие';
                        break;
                    case 2:
                    case 3:
                    case 4:
                        region.directionsStr += 'ия';
                        break;
                    default:
                        region.directionsStr += 'ий';
                }

                region.villasStr = "вилл";
                switch (region.villas.length % 10) {
                    case 1:
                        region.villasStr += 'а';
                        break;
                    case 2:
                    case 3:
                    case 4:
                        region.villasStr += 'ы';
                        break;
                    default:
                        region.villasStr += '';
                }
            });

            $s.popularDirections.forEach(function (direction) {
                $h.get('/api/data/table?t=428&' + direction.villas.map(function (villa) {
                    return "where[f1]=" + villa.field_value_id;
                }).join('&') + '&orderBy[f3]=desc&count=3').success(function (rows) {
                    direction.villas.forEach(function (villa) {
                        rows.forEach(function (row) {
                            if (row.f2 && row.f1.indexOf(villa.field_value_id) != -1) villa.image = row.f2;
                        });
                    });
                });
            });

            $s.searchStuff = [].concat($s.vills.filter(function (v) {
                return v.url && v.f8 && v.f8[0].f3;
            }).map(function (v) {
                return {
                    name: v.name || v.f1,
                    id: v.field_value_id,
                    url: v.f8[0].f3[0].f8 + '/' + v.url
                };
            }), $s.directions.filter(function (d) {
                return d.f3 && d.f6;
            }).map(function (d) {
                return {
                    name: d.f1,
                    id: d.field_value_id,
                    url: d.f3[0].f8 + '/' + d.f6
                };
            }), $s.subRegions.filter(function (s) {
                return s.f2;
            }).map(function (s) {
                return {
                    name: s.f1,
                    id: s.field_value_id,
                    url: s.region.f8 + '/' + s.f2
                };
            })).reduce(function (stuff, item) {
                if (!stuff.some(function (s) {
                    return s.url == item.url || s.id == item.id || s.name == item.name;
                })) stuff.push(item);
                return stuff;
            }, []);
            console.log($s.searchStuff);
        }
    });

    console.log($s, '---------------scope---------');

    $s.moreInfo = function (villa) {
        console.log(villa);
        $h.get('http://www.arenda-vill.com/api/data/table?t=345&where[field_value_id]=' + villa.f8[0].f3.replace(/\|/g, '') + '&field=f8').success(function (host) {
            window.location = 'http://' + host + '/' + villa.url;
        });
        // window.location = 'http://' + villa.url;
    };

    $s.locateToAboutUs = function () {
        window.location = 'http://www.arenda-vill.com/отдых-за-рубежом';
    };
    $s.setSearchValueEmpty = function () {
        $s.searchPlaceholder = "";
    };
    $s.setSearchValueText = function () {
        if ($s.selectedAddress == "") {
            $s.searchPlaceholder = 'Введите название виллы или город...';
        }
    };

    $s.searchResult = function (villa) {
        // if($s.selectedAddress !== "" && (villa.name.indexOf($s.selectedAddress) > -1 || villa.f8[0].f1.indexOf($s.selectedAddress) > -1)) {
        //     return true;
        // }
        //
        // if ($s.selectedAddress !== "" && (villa.name.search(RegExp($s.selectedAddress, "i")) > -1 || villa.f8[0].f1.search(RegExp($s.selectedAddress, "i")) > -1)) {
        //     return true;
        // }
        return villa.name.indexOf($s.selectedAddress) != -1 || villa.direction && villa.direction.f1 && villa.direction.f1.indexOf($s.selectedAddress != -1);
    };

    $s.checkIfEnterKeyWasPressed = function (evt) {
        var keyCode = evt.which || evt.keyCode;
        if (keyCode === 13) {
            $s.goToSearchPage();
        }
    };

    $s.goToSearchPage = function () {
        //localStorage.setItem('searchValue', $s.selectedAddress);
        window.location = "/лучшие-виллы#/" + $s.selectedAddress;
    };

    $s.goToSearchPageByRegion = function (region) {
        localStorage.setItem('regionFromMain', region);
        window.location = "/лучшие-виллы";
    };

    $s.goToSearchPageRecStyle = function (recStyle) {
        if (recStyle == 0) {
            localStorage.clear();
            localStorage.setItem('recStyle', 'Берег моря');
        } else if (recStyle == 1) {
            localStorage.clear();
            localStorage.setItem('recStyle', 'На природе');
        } else if (recStyle == 2) {
            localStorage.clear();
            localStorage.setItem('recStyle', 'В горах');
        } else {}
        window.location = "/лучшие-виллы";
    };
    $s.locateToRegion = function (url) {
        console.log(url);
        // window.location = 'http://' + url;
    };

    var regsWithDir = [{
        reg: 'Балканы',
        dir: ['Черногория', 'Хорватия', 'Пафос', 'Крит']
    }, {
        reg: 'Италия',
        dir: ['Сардиния', 'Озеро Комо', 'Тоскана', 'Сициля', 'Итальянские Альпы']
    }, {
        reg: 'Франция',
        dir: ['Куршевель', 'Шамони', 'Прованс', 'Канны', 'Сан Тропе', 'Ницца']
    }, {
        reg: 'Карибы',
        dir: ['Майами', 'Мексика', 'Пунта Кана']
    }, {
        reg: 'Азия',
        dir: ['Самуи', 'Пхукет', 'Сейшелы', 'Мальдивы', 'Маврикий', 'Гоа', 'Бали']
    }, {
        reg: 'Испания',
        dir: ['Ибица', 'Майорка', 'Барселона', 'Марбелья']
    }];

    var regionAdd = function regionAdd(villa) {
        var i;
        regsWithDir.forEach(function (item) {
            item.dir.forEach(function (direct) {
                if (direct == villa.f8[0].f1) {
                    villa.region = item.reg;
                }
            });
        });
    };
}]);

// app.controller('main-page-popular-controller', []);
// slider
var currentSlide = 0,
    globalSlideshowId,
    slideshowInterval = 8000;

window.addEventListener('load', function () {

    var widthClient = $(window).width();
    if (widthClient < 1007) {
        $('#region h1').addClass('v-line');
    }

    var arrows = true;
    var points = false;
    var t = document.getElementById('slideshow-ken-burns');
    var item = t.querySelectorAll('.item');
    var left;
    var right;

    item[currentSlide].classList.add('fx');
    if (arrows) {
        left = document.createElement('div');
        left.className = 'arrow arrowLeft';
        left.onclick = function () {
            runKenBurns('prev');
        };
        t.appendChild(left);
        right = document.createElement('div');
        right.className = 'arrow arrowRight';
        right.onclick = function () {
            runKenBurns('next');
        };
        t.appendChild(right);
    }
    if (points) {
        var p = document.createElement('div');
        p.className = 'points';
        for (var i = 0; i < item.length; i++) {
            p.innerHTML += '<div class="point' + (i == 0 ? ' active' : '') + '" onclick="runKenBurns(' + i + ')"></div>';
        }t.appendChild(p);
    }
    globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
});

function runKenBurns(step) {
    var item = document.getElementById('slideshow-ken-burns').querySelectorAll('.item'),
        point = document.getElementById('slideshow-ken-burns').querySelectorAll('.point'),
        last = item.length - 1,
        n;

    if (step == 'next') {
        n = currentSlide == last ? 0 : currentSlide + 1;
        clearInterval(globalSlideshowId);
        globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
    }
    if (step == 'prev') {
        n = currentSlide == 0 ? last : currentSlide - 1;
        clearInterval(globalSlideshowId);
        globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
    }
    if (parseInt(step) || parseInt(step) === 0) {
        if (parseInt(step) <= last && parseInt(step) >= 0) n = parseInt(step);
        clearInterval(globalSlideshowId);
        globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
    } else n = currentSlide == last ? 0 : currentSlide + 1;
    item[currentSlide].classList.remove('fx');
    item[n].classList.add('fx');
    if (point[currentSlide]) {
        point[currentSlide].classList.remove('active');
        point[n].classList.add('active');
    }
    currentSlide = n;
}

$(document).ready(function () {
    $('#foo').viewportChecker({
        callbackFunction: function callbackFunction(elem, action) {
            $('.animateReg').animateNumber({ number: 7 }, 3000);
            $('.animateDir').animateNumber({ number: 35 }, 3000);
            $('.animateObj').animateNumber({ number: 210 }, 3000);
        }
    });
});

//# sourceMappingURL=main-compiled.js.map

//# sourceMappingURL=main-compiled.js.map