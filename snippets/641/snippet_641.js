"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var currentSlide = 0;
var globalSlideshowId;
var slideshowInterval = 8000;
var TABLES = {
    VILLAS: 342,
    FEATURES: 348,
    DIRECTIONS: 343,
    REGIONS: 345,
    SUB_REGIONS: 344,
    ADDITIONAL_FIELDS: 364,
    IMAGES: 428
};
var coord = [{
    "title": "Канны",
    "longitude": "7.017369",
    "latitude": "43.552847"
}, {
    "id": 39,
    "title": "Vikingtokt",
    "longitude": "6.96781",
    "latitude": "60.96335"
}];

var BreadCrumb = function BreadCrumb(text, url) {
    _classCallCheck(this, BreadCrumb);

    this.url = url;
    this.text = text;
};

window.addEventListener('load', function () {
    $(document).ready(function () {

        (function ($) {
            $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');

            $('.tab ul.tabs li a').click(function (g) {
                var tab = $(this).closest('.tab'),
                    index = $(this).closest('li').index();

                tab.find('ul.tabs > li').removeClass('current');
                $(this).closest('li').addClass('current');

                tab.find('.tab_content').find('div.tabs_item').not('div.tabs_item:eq(' + index + ')').slideUp();
                tab.find('.tab_content').find('div.tabs_item:eq(' + index + ')').slideDown();

                g.preventDefault();
            });
        })(jQuery);
    });

    var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
    var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
    var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
    var is_safari = navigator.userAgent.indexOf("Safari") > -1;
    var is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
    if (is_chrome && is_safari) {
        is_safari = false;
    }
    if (is_chrome && is_opera) {
        is_chrome = false;
    }

    if (is_firefox) {
        var styleElem = document.body.appendChild(document.createElement("style"));
        styleElem.innerHTML = ".tab .tabs_item p span:before {display: inline-block;}";
    }
});

app.controller('descriptionCtrl', ['$scope', '$http', 'setCookieFact', '$sce', function ($s, $h, setCookieFact, $sce) {

    $s.targetDirect;
    $s.breadcrumbs = [];
    $s.template = {};
    $s.coordinates = {};
    $s.weather = {
        temp: [],
        precip: []
    };
    $s.currentVills = [];
    $s.hostname = window.location.hostname;
    $s.path = decodeURI(window.location.pathname.substr(1));
    $s.targetUrl = $s.hostname + "/" + $s.path;

    $h.get("/api/data/table?t=" + TABLES.SUB_REGIONS + "&where[f2]=" + location.pathname.substr(1)).success(initSubRegion);
    $h.get("/api/data/table?t=" + TABLES.DIRECTIONS + "&where[f6]=" + location.pathname.substr(1)).success(initDir);

    function initDir(data) {
        if (!data || !data.length) return;

        var dir = data[0];

        $h.get("/api/data/table?t=" + TABLES.IMAGES + "&where[f4]=" + dir.field_value_id).success(function (images) {
            $s.subDir.images = images;
        });
        // no subdirs in directions
        // $h.get(`/api/data/table?t=${TABLES.DIRECTIONS}&where[f2]=${dir.field_value_id}`)
        //     .success(dirs => {
        //         dir.directions = dirs || [];
        //         let where = dir.directions.map(dir => `where[f8][]=${dir.field_value_id}`).join('&');
        //         $h.get(`/api/data/table?t=${TABLES.VILLAS}&${where}`)
        //             .success(villas => {
        //                 $s.currentVills = villas;
        //                 checkVillaStatus($s.currentVills);
        //             })
        //     });
        $s.subDir = Object.assign({}, dir);
        var region = dir.f3 ? dir.f3[0] : null;
        var subRegion = dir.f2 ? dir.f2[0] : null;

        $s.subDir.f10 = dir.f7;
        $s.subDir.f11 = dir.f8;
        $s.subDir.f12 = dir.f9;
        $s.subDir.f13 = dir.f10;

        // desc
        $s.subDir.f3 = $sce.trustAsHtml(dir.f16);
        // clim
        $s.subDir.f7 = $sce.trustAsHtml(dir.f17);
        // infrastr
        $s.subDir.f8 = $sce.trustAsHtml(dir.f18);
        // key places
        $s.subDir.f9 = $sce.trustAsHtml(dir.f19);

        // map
        if (dir.f5) {
            $s.coordinates = {
                lat: getCoordinates(dir.f5, 'latitude'),
                lng: getCoordinates(dir.f5, 'longitude')
            };
            // рисуем карту
            initializeMap($s.coordinates, dir.f1);
        } else {
            initializeMap(); // рисуем карту если координаты не заданы в таблице
        }

        // temperatures graphs
        $s.weather.temp = (dir.f11 || '-----------').split('-');
        $s.weather.precip = (dir.f12 || '-----------').split('-');

        barChart($s.weather.temp, '#C49E21', '*C', '.chart-1');
        barChart($s.weather.precip, '#25B5E6', 'mm', '.chart-2');

        // todo: load proper villas

        var breadcrumbs = [];

        if (region) {
            breadcrumbs.push(new BreadCrumb(region.f1, "http://" + (region.f10 || region.f8)));
        }
        if (region && subRegion) {
            breadcrumbs.push(new BreadCrumb(subRegion.f1, "http://" + (region.f10 || region.f8) + "/" + subRegion.f2));
        }

        breadcrumbs.push(new BreadCrumb($s.subDir.f1, location.toString()));

        $s.breadcrumbs = breadcrumbs;

        $s.subDir.isDir = true;

        addDirectionVillas($s.subDir.field_value_id, true);
    }

    function initSubRegion(data) {
        if (!data || !data.length) return;

        var subDir = data[0];

        $h.get("/api/data/table?t=" + TABLES.IMAGES + "&where[f5]=" + subDir.field_value_id).success(function (images) {
            subDir.images = images;
        });
        $h.get("/api/data/table?t=" + TABLES.DIRECTIONS + "&where[f2]=" + subDir.field_value_id).success(function (dirs) {
            subDir.directions = dirs || [];
            var where = subDir.directions.map(function (dir) {
                return "where[f8][]=" + dir.field_value_id;
            }).join('&');
            $h.get("/api/data/table?t=" + TABLES.VILLAS + "&" + where).success(function (villas) {
                $s.currentVills = villas;
                checkVillaStatus($s.currentVills);
            });
        });

        $s.subDir = subDir;

        subDir.f3 = $sce.trustAsHtml(subDir.f3);
        subDir.f7 = $sce.trustAsHtml(subDir.f7);
        subDir.f8 = $sce.trustAsHtml(subDir.f8);
        subDir.f9 = $sce.trustAsHtml(subDir.f9);

        // map
        if (subDir.f4) {
            $s.coordinates = {
                lat: getCoordinates(subDir.f4, 'latitude'),
                lng: getCoordinates(subDir.f4, 'longitude')
            };
            // рисуем карту
            initializeMap($s.coordinates, subDir.f1);
        } else {
            initializeMap(); // рисуем карту если координаты не заданы в таблице
        }

        // temperatures graphs
        $s.weather.temp = (subDir.f5 || '-----------').split('-');
        $s.weather.precip = (subDir.f6 || '-----------').split('-');

        barChart($s.weather.temp, '#C49E21', '*C', '.chart-1');
        barChart($s.weather.precip, '#25B5E6', 'mm', '.chart-2');

        // todo: load proper villas

        $h.get("/api/data/table?t=" + TABLES.REGIONS + "&where[f4]=" + $s.subDir.field_value_id).success(function (data) {
            if (data) {
                var region = data.pop();

                var breadcrumbs = [];

                breadcrumbs.push(new BreadCrumb(region.f1, "http://" + (region.f10 || region.f8)));
                breadcrumbs.push(new BreadCrumb($s.subDir.f1, location.toString()));

                $s.breadcrumbs = breadcrumbs;
            }
        });

        $s.subDir.isDir = false;

        $h.get("/api/data/table?t=" + TABLES.DIRECTIONS + "&where[f2]=" + $s.subDir.field_value_id).success(function (data) {
            if (data && data.length) {

                var wheres = data.map(function (item) {
                    return "where[f8][]=" + item.field_value_id;
                }).join('&');

                $h.get("/api/data/table?t=" + TABLES.VILLAS + "&" + wheres).success(function (villas) {
                    $s.currentVills = villas;
                    checkVillaStatus($s.currentVills);
                });
            }
        });
    }

    function addDirectionVillas(direction_id) {
        var callCheckBool = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        $h.get("/api/data/table?t=" + TABLES.VILLAS + "&where[f8]=" + direction_id).success(function (data) {
            if (data) $s.currentVills = $s.currentVills.concat(data);
            if (callCheckBool) checkVillaStatus($s.currentVills);
        });
    }

    function checkVillaStatus(villas) {
        console.log($s.subDir);
        villas.forEach(function (villa) {
            villa.img = "/api/data/table?t=428&field=f2&where[f1]=" + villa.field_value_id + "&where[f3]=yes&as=image&count=1";
        });

        // $h.get('/api/data/table?t=364')
        //     .success(function(vills){
        //         console.log(vills);
        //         vills.forEach(function(villa){
        //             villas.forEach(function(elem){
        //                 if(villa.f1) {
        //                     if(elem.name == villa.f1[0].f1 && villa.status == 'hide') {
        //                         var position = villas.indexOf(elem);
        //                         villas.splice(position, 1);
        //                     }
        //                 }
        //             })
        //         })
        //     })
    }

    function cutText(string, index, part) {
        var sentences = string.split(".");
        if (part == 1) {
            var text = sentences.slice(0, index).join('.');
        } else {
            var text = sentences.slice(index).join('.');
        }
        return text;
    }
    function getCoordinates(coordinates, param) {
        if (param == 'latitude') {
            var result = coordinates.split(",")[0]; // latitude
        } else {
            var result = coordinates.split(",")[1]; // longitude
        }
        return result;
    }

    console.log($s, 'scope');

    $s.setFavouriteVilla = function (villaId, event) {
        if (!event.target.classList.contains('active-like')) {
            document.getElementById('modal').classList.add('show');
            return setCookieFact.setFavouriteVilla(villaId);
        } else {
            return setCookieFact.setFavouriteVilla(villaId);
        }
    };
    $s.showVillaInfo = function (villa) {

        window.location = 'http://' + location.host + '/' + villa.url;
    };

    $s.urlReg = [{
        name: 'Азия',
        url: 'http://www.arenda-vill-asia.com'
    }, {
        name: 'Карибы',
        url: 'http://www.arenda-vill-karibi.com'
    }, {
        name: 'Франция',
        url: 'http://www.arenda-vill-franciya.com/'
    }, {
        name: 'Италия',
        url: '/region' // http://www.arenda-vill-italiya.com
    }, {
        name: 'Испания',
        url: 'http://www.arenda-vill-ispaniya.com/'
    }, {
        name: 'Балканы',
        url: 'http://www.arenda-vill-balkany.com'
    }, {
        name: 'Альпы',
        url: '/region'
    }];

    $s.slidePoint = function (index) {
        var items = Array.prototype.slice.call(document.querySelectorAll('.item.ng-scope'));
        var points = Array.prototype.slice.call(document.querySelectorAll('.point.ng-scope'));

        var currentIndex = null;
        var currentPoint = null;
        points.forEach(function (point) {
            if (point.classList.contains('active')) {
                point.classList.remove('active');
            }
        });
        items.forEach(function (item) {
            if (item.classList.contains('fx')) {
                item.classList.remove('fx');
            }
        });
        items[index].classList.add('fx');
        points[index].classList.add('active');

        clearInterval(carousel);
        carousel = setInterval(function () {
            runCrousel();
        }, 8000);
    };
    $s.nextSlide = function () {
        var items = Array.prototype.slice.call(document.querySelectorAll('.item.ng-scope'));
        var points = Array.prototype.slice.call(document.querySelectorAll('.point.ng-scope'));

        var currentIndex = null;
        var currentPoint = null;
        points.forEach(function (point) {
            if (point.classList.contains('active')) {
                currentPoint = points.indexOf(point);
            }
        });
        items.forEach(function (item) {
            if (item.classList.contains('fx')) {
                currentIndex = items.indexOf(item);
            }
        });
        if (currentIndex < items.length - 1) {
            items[currentIndex].classList.remove('fx');
            points[currentIndex].classList.remove('active');

            items[currentIndex + 1].classList.add('fx');
            points[currentIndex + 1].classList.add('active');
        } else {
            items[currentIndex].classList.remove('fx');
            items[0].classList.add('fx');

            points[currentIndex].classList.remove('active');
            points[0].classList.add('active');
        }
        clearInterval(carousel);
        carousel = setInterval(function () {
            runCrousel();
        }, 8000);
    };
    $s.prevSlide = function () {
        var items = Array.prototype.slice.call(document.querySelectorAll('.item.ng-scope'));
        var points = Array.prototype.slice.call(document.querySelectorAll('.point.ng-scope'));

        var currentIndex = null;
        var currentPoint = null;
        points.forEach(function (point) {
            if (point.classList.contains('active')) {
                currentPoint = points.indexOf(point);
            }
        });
        items.forEach(function (item) {
            if (item.classList.contains('fx')) {
                currentIndex = items.indexOf(item);
            }
        });
        if (currentIndex == 0) {
            items[currentIndex].classList.remove('fx');
            points[currentIndex].classList.remove('active');

            items[items.length - 1].classList.add('fx');
            points[points.length - 1].classList.add('active');
        } else {
            items[currentIndex].classList.remove('fx');
            points[currentIndex].classList.remove('active');

            items[currentIndex - 1].classList.add('fx');
            points[currentIndex - 1].classList.add('active');
        }
        clearInterval(carousel);
        carousel = setInterval(function () {
            runCrousel();
        }, 8000);
    };

    var carousel = setInterval(function () {
        runCrousel();
    }, 8000);

    function runCrousel() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.item.ng-scope'));
        var points = Array.prototype.slice.call(document.querySelectorAll('.point.ng-scope'));

        function slide(array, className) {
            var lem = null;
            array.forEach(function (elem) {
                if (elem.classList.contains(className)) {
                    lem = array.indexOf(elem);
                }
            });

            if (lem < array.length - 1) {
                array[lem].classList.remove(className);
                array[lem + 1].classList.add(className);
            } else {
                array[lem].classList.remove(className);
                array[0].classList.add(className);
            }
        }
        slide(items, 'fx');
        slide(points, 'active');
    }
    window.onresize = function () {
        var wChart = document.getElementById('chart-1'),
            pChart = document.getElementById('chart-2');

        wChart.innerHTML = "";
        pChart.innerHTML = "";

        // рисуем график температуры
        barChart($s.weather.temp, '#C49E21', '*C', '.chart-1');

        // рисуем график влажности
        barChart($s.weather.precip, '#25B5E6', 'mm', '.chart-2');
    };
}]);
// function initializeSlider() {
//       var arrows = true;
//       var points = true;
//       var t = document.getElementById('slideshow-ken-burns');
//       var item = document.querySelectorAll('.item');
//       item[currentSlide].classList.add('fx');
//       if (arrows) {
//         left = document.createElement('div');
//         left.className = 'arrow arrowLeft';
//         left.onclick = function() { runKenBurns('prev');}
//         t.appendChild(left);
//         right = document.createElement('div');
//         right.className = 'arrow arrowRight';
//         right.onclick = function() { runKenBurns('next');}
//         t.appendChild(right);
//       }
//       if (points) {
//          p = document.createElement('div');
//          p.className = 'points';
//          for (i = 0; i < item.length; i++) p.innerHTML += '<div class="point'+(i==0?' active':'')+'" onclick="runKenBurns('+i+')"></div>';
//          t.appendChild(p);
//       }
//       globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
//   }
//   function runKenBurns(step) {
//     item = document.getElementById('slideshow-ken-burns').querySelectorAll('.item');
//     point = document.getElementById('slideshow-ken-burns').querySelectorAll('.point');
//     last = item.length-1;
//     if (step == 'next') {
//         n = currentSlide==last ? 0 : currentSlide+1;
//         clearInterval(globalSlideshowId);
//         globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
//     }
//     if (step == 'prev') {
//         console.log(currentSlide, 'slide');
//         n = currentSlide==0 ? last : currentSlide-1;
//         clearInterval(globalSlideshowId);
//         globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
//     }
//     if (parseInt(step) || parseInt(step)===0) {
//         if (parseInt(step) <= last && parseInt(step) >= 0) n = parseInt(step);
//             clearInterval(globalSlideshowId);
//             globalSlideshowId = setInterval(runKenBurns, slideshowInterval);
//     }
//     else {
//         n = currentSlide==last ? 0 : currentSlide+1;
//         item[currentSlide].classList.remove('fx');
//         item[n].classList.add('fx');
//     }   
//     if (point[currentSlide]) {
//         point[currentSlide].classList.remove('active');
//         point[n].classList.add('active');
//     }
//     currentSlide = n;
// } 

function barChart(w, color, text, deploy) {

    if (window.innerWidth <= 321) {
        var width = 280,
            widthIndex = 280,
            xIndex = 8;
    } else if (window.innerWidth <= 376) {
        var width = 335,
            widthIndex = 335,
            xIndex = 8;
    } else if (window.innerWidth <= 425) {
        var width = 385,
            widthIndex = 385,
            xIndex = 8;
    } else if (window.innerWidth <= 768) {
        var width = 710,
            widthIndex = 500,
            xIndex = 0;
    } else if (window.innerWidth <= 1024) {
        var width = 700,
            widthIndex = 500,
            xIndex = 0;
    } else {
        var width = 750,
            widthIndex = 500,
            xIndex = 0;
    }

    var height = 380,
        margin = 30,

    // color = '#' + 'C49E21';
    months = [{ mon: 'Янв' }, { mon: 'Фев' }, { mon: 'Мар' }, { mon: 'Апр' }, { mon: 'Май' }, { mon: 'Июн' }, { mon: 'Июл' }, { mon: 'Авг' }, { mon: 'Сен' }, { mon: 'Окт' }, { mon: 'Ноя' }, { mon: 'Дек' }];

    var keysMonths = Object.keys(months);
    var data = [];
    w.forEach(function (val) {
        data.push({
            temp: val
        });
    });

    months.forEach(function (mon, i) {
        data[i].mon = mon.mon;
    });

    var svg = d3.select(deploy).append("svg").attr("class", "axis").attr("width", width).attr("height", height);

    // длина оси X= ширина контейнера svg - отступ слева и справа
    var xAxisLength = width - 2 * margin;

    // длина оси Y = высота контейнера svg - отступ сверху и снизу
    var yAxisLength = height - 2 * margin;

    // функция интерполяции значений на ось Х 
    var scaleX = d3.scale.ordinal().rangeRoundBands([0, xAxisLength + margin], .1).domain(data.map(function (d) {
        return d.mon;
    }));

    if (deploy == ".chart-1") {
        var scaleY = d3.scale.linear().domain([40, 0]).range([0, yAxisLength]);
    } else {
        var scaleY = d3.scale.linear().domain([300, 0]).range([0, yAxisLength]);
    }

    // создаем ось X  
    var xAxis = d3.svg.axis().scale(scaleX).orient("bottom");

    // создаем ось Y                
    var yAxis = d3.svg.axis().scale(scaleY).orient("left");

    if (deploy == ".chart-1") {
        yAxis.tickValues([5, 10, 15, 20, 25, 30, 35, 40]);
    } else {
        // ".chart-2"
        yAxis.tickValues([50, 100, 150, 200, 250, 300]);
    }

    // отрисовка оси              
    svg.append("g").attr("class", "x-axis").attr("transform", // сдвиг оси вниз и вправо
    "translate(" + margin + "," + (height - margin) + ")").attr("stroke", color).call(xAxis);

    svg.append("g").attr("class", "y-axis").attr("transform", // сдвиг оси вниз и вправо на margin
    "translate(" + margin + "," + margin + ")").attr("stroke", color).call(yAxis);

    d3.select(".x-axis").selectAll("text").style("font-size", "120%");

    d3.select(".y-axis").selectAll("text").style("font-size", "120%");

    // рисуем горизонтальные линии
    d3.selectAll("g.y-axis g.tick").append("line").classed("grid-line", true).attr("x1", 0).attr("y1", 0).attr("x2", xAxisLength).attr("y2", 0).style("stroke-width", 1);

    var defs = svg.append("defs");

    // // create filter with id #drop-shadow
    // // height=130% so that the shadow is not clipped
    // var filter = defs.append("filter")
    //     .attr("id", "drop-shadow")
    //     .attr("height", "130%");

    // // SourceAlpha refers to opacity of graphic that this filter will be applied to
    // // convolve that with a Gaussian with standard deviation 3 and store result
    // // in blur
    // filter.append("feGaussianBlur")
    //     .attr("in", "SourceAlpha")
    //     .attr("stdDeviation", 11)
    //     .attr("result", "blur");

    // // translate output of Gaussian blur to the right and downwards with 2px
    // // store result in offsetBlur
    // filter.append("feOffset")
    //     .attr("dx", 10)
    //     .attr("dy", 5)
    //     .attr("result", "offsetBlur");

    // // overlay original SourceGraphic over translated blurred opacity by using
    // // feMerge filter. Order of specifying inputs is important!
    // var feMerge = filter.append("feMerge");

    // feMerge.append("feMergeNode")
    //     .attr("in", "offsetBlur")
    // feMerge.append("feMergeNode")
    //     .attr("in", "SourceGraphic");

    d3.selectAll('g.y-axis g.tick').style('stroke-width', 5);

    svg.append("g").append("text").attr("x", margin + 5).attr("y", margin - 11).attr("text-anchor", "end").style("font-size", "11px").text(text);

    svg.append("g").attr("transform", "translate(40, 0)").selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", function (d) {
        return scaleX(d.mon) - xIndex;
    }).attr("width", widthIndex / 12 - margin + 20).attr("y", function (d) {
        return scaleY(d.temp);
    }).attr("height", function (d) {
        return height - scaleY(d.temp) - 60;
    }).attr("fill", color);
    //   .style("filter", "url(#drop-shadow)");    
}

var map;

var json = [{ "id": 48,
    "title": "Helgelandskysten",
    "longitude": "7.017369",
    "latitude": "43.552847"
}];
// The JSON data

function initializeMap(coo, directName) {

    if (arguments.length == 2) {
        var coordinates = [coo.lat, coo.lng];
        var mymap = L.map('map').setView(coordinates, 12);
        mymap.scrollWheelZoom.disable();

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA          </a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'zardwi.02b6pmgg',
            accessToken: 'pk.eyJ1IjoiemFyZHdpIiwiYSI6ImNpbnZxOTRieTAwcHR2c2tsZng2amgwdmsifQ.HDmszTUL_ChtJUXtMLy9vQ'
        }).addTo(mymap);

        var vIcon = L.icon({
            iconUrl: '/files/villa/location_pin.png',
            iconSize: [56, 80],
            iconAnchor: [22, 76],
            popupAnchor: [-97, 0] // left and top

        });

        var marker = L.marker(coo, { icon: vIcon }).addTo(mymap);
        marker.bindPopup(directName).openPopup();
        marker.on('click', function (e) {
            document.querySelector('.leaflet-popup').style.left = '18px';
        });

        document.querySelector('.leaflet-popup').style.left = '18px';
    } else {
        var coordinates = [50.4501, 30.5234];
        var mymap = L.map('map').setView(coordinates, 2);
        mymap.scrollWheelZoom.disable();

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA          </a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'zardwi.02b6pmgg',
            accessToken: 'pk.eyJ1IjoiemFyZHdpIiwiYSI6ImNpbnZxOTRieTAwcHR2c2tsZng2amgwdmsifQ.HDmszTUL_ChtJUXtMLy9vQ'
        }).addTo(mymap);
    }
}

// Initialize the map

//# sourceMappingURL=snippet_641-compiled.js.map