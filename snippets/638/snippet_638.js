
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Created by shpax on 11-Jul-16.
 */

var TABLES = {
    VILLAS: 342,
    FEATURES: 348,
    DIRECTIONS: 343,
    REGIONS: 345,
    SUB_REGIONS: 344,
    ADDITIONAL_FIELDS: 364,
    IMAGES: 428
};
var FIELDS_TO_TRUST = _defineProperty({}, TABLES.VILLAS, ['description', 'additional_info', 'f16', 'f15', 'f19']);

var BreadCrumb = function BreadCrumb(text, url) {
    _classCallCheck(this, BreadCrumb);

    this.url = url;
    this.text = text;
};

app.controller('villaCtrl', ['$scope', '$http', 'setCookieFact', '$sce', 'Database', function ($s, $h, setCookieFact, $sce, localDatabase) {
    $s.setCookieFact = setCookieFact;
    $s.currentVills = []; // CURRENT vills
    $s.villaInfo;
    $s.descriptionText1, $s.descriptionText2;
    $s.regionName;
    $s.nextVilla;
    $s.coordinates = [];
    $s.benefits = [];
    $s.breadcrumbs = [];
    $s.slides = [];
    $s.alts = [];
    $s.regionUrl = 'http://' + window.location.hostname;
    $s.directionUrl;
    $s.locHref = window.location.hostname + window.location.pathname;
    var fav = angular.element(document.querySelector('.favorite-add'))[0];
    console.log($s, 'scope');
    var path = window.location.pathname,
        villWords = path.substr(1).split('-').map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });

    $s.villName = villWords.reduce(function (prev, curr) {
        return prev + " " + curr;
    });

    /// ****** RENDER ****** ///

    $h.get('/api/data/table?t=342&connect[f8]=3&where[f18]=' + location.pathname.substr(1)).success(function (vills) {
        if (vills) initVilla(vills[0]);
    });

    function initVilla(villa) {

        villa.description = villa.description || '';
        if (villa.description.indexOf('</p>') != -1) {
            let paragraphs = villa.description.split('</p>');
            villa.description = paragraphs.shift() + '</p>';
            villa.additional_info = paragraphs.length ? paragraphs.join('</p>') : '';
        }

        FIELDS_TO_TRUST[TABLES.VILLAS].forEach(function (fieldName) {
            villa[fieldName] = $sce.trustAsHtml(villa[fieldName]);
        });
        $s.villaInfo = villa;
        $s.fieldValueId = villa.field_value_id;

        // $h.get('/api/data/table?t=' + TABLES.ADDITIONAL_FIELDS + '&where[f1]=' + villa.field_value_id).success(function (res) {
        //     return initAdditionalFields(res[0]);
        // });

        $h.get('/api/data/table?t=' + TABLES.IMAGES + '&where[f1]=' + villa.field_value_id).success(function (res) {
            return initSliderImages(res);
        });

        villa.benefits = villa.f12 || [];
        console.log(villa);

        if (villa.f8) {
            $s.directionUrl = 'http://' + $s.villaInfo.f8[0].url;
        }

        if (villa.f8) {
            var direction = villa.f8[0];
            localDatabase.request('/api/data/table?t=' + TABLES.VILLAS + '&where[f8]=' + direction.field_value_id + '&orderBy[f20]=desc&count=9', function (data) {
                if (data && data.length) {
                    $s.currentVills = data
                        .filter(r => r.field_value_id != villa.field_value_id)
                        .map(r => {
                            r.priceStr = r.min_price && r.max_price ? `$${villa.min_price} — $${villa.max_price}` : 'по запросу'
                            return r;
                        });
                    $s.currentVills.forEach(villa => {
                        localDatabase.request('api/data/table?t=' + TABLES.IMAGES + '&where[f1]=' + villa.field_value_id + '&orderBy[f3]=desc&count=1', img => {
                            if (img && img[0].f2) villa.img = img[0].f2;
                        })
                    })
                } else {
                    $s.currentVills = [];
                }
            });
        }

        makeBreadcrumbs(villa);
    }

    function makeBreadcrumbs(villa) {

        if (!villa.f8 || !villa.f8.length) return;

        var breadcrumbs = [];
        var direction = villa.f8[0];
        var subRegion = direction.f2 ? direction.f2[0] : null;
        var region = direction.f3 ? direction.f3[0] : null;

        if (region) {
            breadcrumbs.push(new BreadCrumb(region.f1, 'http://' + (region.f10 || region.f8)));
        }
        if (region && subRegion) {
            breadcrumbs.push(new BreadCrumb(subRegion.f1, 'http://' + (region.f10 || region.f8) + '/' + subRegion.f2));
        }

        breadcrumbs.push(new BreadCrumb(direction.f1, 'http://' + (region.f10 || region.f8) + '/' + (direction.url || direction.f6)));
        breadcrumbs.push(new BreadCrumb(villa.f1 || villa.name, location.toString()));

        $s.breadcrumbs = breadcrumbs;
    }

    function initAdditionalFields(fields) {
        var villa = $s.villaInfo;
        villa.addFields = fields || {};
        if (fields.f8) {
            var _fields$f8$split$map = fields.f8.split(',').map(function (val) {
                return val.trim();
            });

            var _fields$f8$split$map2 = _slicedToArray(_fields$f8$split$map, 2);

            var latitude = _fields$f8$split$map2[0];
            var longitude = _fields$f8$split$map2[1];

            var title = $s.targetDirect || 'No direction';
            $s.coordinates.push({ latitude: latitude, longitude: longitude, title: title });
            initialize($s.coordinates, $s.villaInfo.name); // create map
        } else {
            initialize();
        }
    }

    function initSliderImages(imageRows) {
        var villa = $s.villa;
        var slides = $s.slides;
        var alts = $s.alts;

        if (imageRows) imageRows.forEach(function (imageRow) {

            if (imageRow.f2) slides.push({
                src: imageRow.f2,
                alt: imageRow.f6
            });
            // slides.push(imageRow.f2);
            // alts.push(imageRow.f6);
        });
    }

    function isFav() {
        var result;
        $s.setCookieFact.getFavouritesVill().forEach(function (vill) {
            if (vill == $s.villaInfo.field_value_id) {
                result = true;
            }
        });
        return result;
    }

    $s.addFavTarget = function (villaId, event) {
        if (!event.target.classList.contains('active-like')) {
            event.target.classList.add('active-like');
            document.getElementById('modal').classList.add('show');
            return setCookieFact.setFavouriteVilla(villaId);
        } else {
            event.target.classList.remove('active-like');
            return setCookieFact.setFavouriteVilla(villaId);
        }
    };

    $s.isFavTarget = function (villaId) {
        var result;
        setCookieFact.getFavouritesVill().forEach(function (vill) {
            if (vill == villaId) {
                result = true;
            }
        });
        return result;
    };

    /// ****** RENDER ****** ///

    $s.prevVilla = function () {
        var result = function () {
            $s.currentVills.forEach(function (villa, index) {
                if (villa.name == $s.villaInfo.name) {
                    result = index;
                }
            });
            return result;
        }();

        if (fav.classList.contains('active')) {
            fav.classList.remove('active');
        }

        if (result == $s.currentVills.indexOf($s.currentVills[0])) {
            $s.villaInfo = $s.currentVills[$s.currentVills.length - 1];
            locateToNewUrl($s.villaInfo);
        } else {
            $s.villaInfo = $s.currentVills[result - 1];
            locateToNewUrl($s.villaInfo);
        }
    };
    $s.nextVilla = function () {
        var result = function () {
            $s.currentVills.forEach(function (villa, index) {
                if (villa.name == $s.villaInfo.name) {
                    result = index;
                }
            });
            return result;
        }();

        if (fav.classList.contains('active')) {
            fav.classList.remove('active');
        }

        if (result == $s.currentVills.length - 1) {
            $s.villaInfo = $s.currentVills[0];
            locateToNewUrl($s.villaInfo);
        } else {
            $s.villaInfo = $s.currentVills[result + 1];
            locateToNewUrl($s.villaInfo);
        }
    };
    $s.showVillaInfo = function (url) {
        window.location = 'http://' + url;
    };

    function locateToNewUrl(item) {
        var t = item.name.split(" ").map(function (word) {
            return word.charAt(0).toLowerCase() + word.slice(1);
        });
        var villaUrl = t.reduce(function (prev, curr) {
            return prev + "-" + curr;
        });
        window.location = 'http://' + item.url;
    }

    $s.addFav = function (villaId) {
        if (!event.target.classList.contains('active')) {
            document.getElementById('modal').classList.add('show');
            return setCookieFact.setFavouriteVilla(villaId);
        } else {
            return setCookieFact.setFavouriteVilla(villaId);
        }
    };
    $s.moreInfo = function (villa) {
        var t = villa.name.split(" ").map(function (word) {
            return word.charAt(0).toLowerCase() + word.slice(1);
        });
        var villaUrl = t.reduce(function (prev, curr) {
            return prev + "-" + curr;
        });
        window.location = 'http://' + villa.url;
    };

    $s.sendVillToHeader = function (villa) {
        $s.setCookieFact.addVill(villa.name);
        document.querySelector('.modal').classList.add('slide-in-top', 'show1');
        document.getElementById('effect-name').innerHTML = 'Отправить Заявку';
    };
    $s.setFavouriteVilla = function (villaId, event) {
        if (!event.target.classList.contains('active-like')) {
            document.getElementById('modal').classList.add('show');
            return $s.setCookieFact.setFavouriteVilla(villaId);
        } else {
            return $s.setCookieFact.setFavouriteVilla(villaId);
        }
    };

    var nameReg = /^[a-zA-Zа-яА-Я'][a-zA-Zа-яА-Я-' ]+[a-zA-Zа-яА-Я']?$/,
        emailReg = /^[\w\.-_\+]+@[\w-]+(\.\w{2,4})+$/,
        phoneReg = /^([+]+)*[0-9\x20\x28\x29-]{7,12}$/;

    $s.validateName = function () {
        if ($s.reqName != undefined) {
            if (!nameReg.test($s.reqName)) {
                document.getElementById('nameV').style.borderBottomColor = "red";
                return false;
            } else {
                document.getElementById('nameV').style.borderBottomColor = "#d0d0d0";
                return true;
            }
        } else if ($s.regName == undefined) {
            document.getElementById('nameV').style.borderBottomColor = "red";
            return false;
        } else {
            document.getElementById('nameV').style.borderBottomColor = "#d0d0d0";
            return true;
        }
    };
    $s.validatePhone = function () {
        if ($s.reqPhone != undefined) {
            if (!phoneReg.test($s.reqPhone)) {
                document.getElementById('phoneV').style.borderBottomColor = "red";
                return false;
            } else {
                document.getElementById('phoneV').style.borderBottomColor = "#d0d0d0";
                return true;
            }
        } else if ($s.regPhone == undefined) {
            document.getElementById('phoneV').style.borderBottomColor = "red";
            return false;
        } else {
            document.getElementById('phoneV').style.borderBottomColor = "#d0d0d0";
            return true;
        }
    };

    $s.validateEmail = function () {
        if ($s.reqEmail != undefined) {
            if (!emailReg.test($s.reqEmail)) {
                document.getElementById('emailV').style.borderBottomColor = "red";
                return false;
            } else {
                document.getElementById('emailV').style.borderBottomColor = "#d0d0d0";
                return true;
            }
        } else if ($s.regEmail == undefined) {
            document.getElementById('emailV').style.borderBottomColor = "red";
            return false;
        } else {
            document.getElementById('emailV').style.borderBottomColor = "#d0d0d0";
            return true;
        }
    };
    $s.validateComments = function () {

        if ($s.reqComments == undefined) {
            document.getElementById('commentsV').style.borderBottomColor = "red";
            return false;
        } else {
            document.getElementById('commentsV').style.borderBottomColor = "#d0d0d0";
            return true;
        }
    };

    var db = new DataManager();
    $s.sendReqDataVilla = function (villa, targetForm) {
        if ($s.validateName() == true && $s.validatePhone() == true && $s.validateEmail() == true && $s.validateComments() == true) {
            var formVilla = document.getElementById(targetForm),
                form = new FormData(formVilla),
                inputs = formVilla.querySelectorAll('input'),
                dataToAdmin = villa.url;

            form.append('data[f5]', villa.name);
            db.add(391, form, function (res) {
                console.log(res);
            });

            if (targetForm == 'form-villa-mobile') {
                sendMail($s.reqNameMobile, $s.reqPhoneMobile, $s.reqEmailMobile, $s.reqCommentsMobile, dataToAdmin);
            } else if (targetForm == 'form-villa') {
                sendMail($s.reqName, $s.reqPhone, $s.reqEmail, $s.reqComments, dataToAdmin);
            } else {
                console.log('Something wrong :(');
            }

            [].slice.call(inputs).forEach(function (input) {
                input.value = "";
            });
        } else {
            document.getElementById('nameV').style.borderBottomColor = "red";
            document.getElementById('phoneV').style.borderBottomColor = "red";
            document.getElementById('emailV').style.borderBottomColor = "red";
            document.getElementById('commentsV').style.borderBottomColor = "red";

            document.getElementById('nameVmobile').style.borderBottomColor = "red";
            document.getElementById('phoneVmobile').style.borderBottomColor = "red";
            document.getElementById('emailVmobile').style.borderBottomColor = "red";
            document.getElementById('commentsVmobile').style.borderBottomColor = "red";
        }
    };
    function sendMail(name, phone, email, comment, villa) {
        var f = new FormData();
        var sbj = "Проверка вил на доступность.";

        f.append('sbj', sbj);
        f.append('t', 'report_mail');

        f.append('r[name]', name);
        f.append('r[phone]', phone);
        f.append('r[email]', email);
        f.append('r[comment]', comment);
        f.append('r[vills]', villa);
        f.append('u', '74'); // твой юзер_ид. Если убрать, будет отправляться админу
        // f.append('r[email]', 'не указано'); // замена данных в шаблоне
        // f.append('r[message]', 'mgs'); // и т.д. ...

        ajaxPost('/api/mail/mailAdmin', f, true, function (res) {
            console.log(res);
        });
    }

    function ajaxPost(href, data, async, func, $s) {
        var xhr = getCrossXHR();
        async = async ? true : false;
        if (func) xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) func(xhr.responseText);
            if ($s) $s.notices.push('readyState - ' + xhr.readyState + '; status - ' + xhr.status + '; responce - ' + xhr.responseText);
        };
        xhr.open('POST', href, async);
        if ($s) $s.notices.push('3');
        if ($s) $s.notices.push(data.constructor.name);
        xhr.send(data);
    }

    function getCrossXHR() {
        var xmlhttp;
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
            xmlhttp = new XMLHttpRequest();
        }
        return xmlhttp;
    }

    var indexStep = 3;
    $s.index = 0;
    $s.incrementIndex = function () {
        $s.index += indexStep;
        if ($s.index >= $s.currentVills.length) {
            $s.index = 0;
        }
        console.log($s.index, 'index');
    };
    $s.decrementIndex = function () {
        $s.index -= indexStep;
        if ($s.index < 0) {
            $s.index = $s.currentVills.length - 2;
        }
        console.log($s.index, 'index');
    };

    function cutDesripction() {
        var sentences = $s.villaInfo.description.split('.');

        $s.descriptionText1 = function () {
            var result = sentences.slice(0, 5).reduce(function (prev, curr) {
                return prev + "." + curr;
            });
            return result + ".";
        }();

        $s.descriptionText2 = function () {
            var result = sentences.slice(5).reduce(function (prev, curr) {
                return prev + "." + curr;
            });
            return result + ".";
        }();
    }

    function villsOfTargetReg() {
        $h.get('/api/data/table?t=342').success(function (vills) {
            regionAdd(vills);
            vills.some(function (villa) {
                if (villa.region == $s.villaInfo.region) {
                    $s.currentVills.push(villa);
                }
            });
            // check the index of the villaInfo in currentVills
            checkVillaStatus($s.currentVills);

            $s.currentVills.forEach(function (villa, index) {
                if (villa.name == $s.villaInfo.name) {
                    $s.index = index;
                }
            });
            $s.prevVillName = $s.index > 0 ? $s.currentVills[$s.index - 1].name : $s.currentVills[$s.currentVills.length - 1].name;
            $s.nexVillName = $s.index >= $s.currentVills.length - 1 ? $s.currentVills[0].name : $s.currentVills[$s.index + 1].name;
        });
    }

    function checkVillaStatus(array) {
        $h.get('/api/data/table?t=364').success(function (vills) {
            console.log(vills);
            vills.forEach(function (villa) {
                array.forEach(function (elem) {
                    if (villa.f1 != undefined) {
                        if (elem.name == villa.f1[0].f1 && villa.status == 'hide') {
                            var position = array.indexOf(elem);
                            array.splice(position, 1);
                        }
                    }
                });
            });
        });
    }

    getCurrentVillRegionId = function getCurrentVillRegionId(villRegionId) {
        return villRegionId.match(/\d+/g)[0];
    };

    function filterByTableId(obj, tableId) {
        return obj.filter(function (el) {
            return el.table_id == tableId;
        });
    }
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
        console.log('swipe');
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
        console.log('swipe');
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
}]);

function filterByTableId(obj, tableId) {
    return obj.filter(function (el) {
        return el.table_id == tableId;
    });
}

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

var regionAdd = function regionAdd(vills) {

    regsWithDir.forEach(function (item) {
        item.dir.forEach(function (direct) {
            vills.forEach(function (villa) {
                if (villa.f8 != undefined && direct == villa.f8[0].f1) {
                    villa.region = item.reg;
                }
            });
        });
    });
};
var regionAddSingleTarget = function regionAddSingleTarget(villa) {

    regsWithDir.forEach(function (item) {
        item.dir.forEach(function (direct) {
            if (villa.f8 != undefined && direct == villa.f8[0].f1) {
                villa.region = item.reg;
            }
        });
    });
};

function initialize(coordinates, villaName) {
    if (arguments.length == 2) {

        var coordinates = [coordinates[0].latitude, coordinates[0].longitude];
        var mymap = L.map('map-id').setView(coordinates, 10);
        mymap.scrollWheelZoom.disable();

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'zardwi.02b6pmgg',
            accessToken: 'pk.eyJ1IjoiemFyZHdpIiwiYSI6ImNpbnZxOTRieTAwcHR2c2tsZng2amgwdmsifQ.HDmszTUL_ChtJUXtMLy9vQ'
        }).addTo(mymap);

        var vIcon = L.icon({
            iconUrl: '/files/villa/location-arrow.png',
            shadowUrl: '/files/villa/location.png',

            iconSize: [9, 15],
            shadowSize: [56, 80],
            iconAnchor: [6, 56],
            shadowAnchor: [28, 80],
            popupAnchor: [0, 0] // left and top

        });

        var marker = L.marker(coordinates, { icon: vIcon }).addTo(mymap);
        marker.bindPopup(villaName).openPopup();

        document.querySelector('.leaflet-popup').style.left = '0px';
        if (window.screen.width <= 768) {
            var popupWidth = villaName.length * 14;
            document.querySelector('.leaflet-popup-content').style.width = popupWidth.toString() + 'px';
        }
    } else {
        var coordinates = [50.4501, 30.5234];
        var mymap = L.map('map-id').setView(coordinates, 2);
        mymap.scrollWheelZoom.disable();

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'zardwi.02b6pmgg',
            accessToken: 'pk.eyJ1IjoiemFyZHdpIiwiYSI6ImNpbnZxOTRieTAwcHR2c2tsZng2amgwdmsifQ.HDmszTUL_ChtJUXtMLy9vQ'
        }).addTo(mymap);
    }
}

var benefits = [{
    name: 'Частный пляж',
    className: 'beach'
}, {
    name: 'Частный причал',
    className: 'pier'
}, {
    name: 'Кинозал',
    className: 'cinema-hall'
}, {
    name: 'Бассейн',
    className: 'swimm'
}, {
    name: 'Спорт Зал',
    className: 'sport'
}, {
    name: 'Сауна',
    className: 'sauna-bucket'

}, {
    name: 'Джакузи',
    className: 'jacuzzi'
}, {
    name: 'Wi-Fi',
    className: 'wi-fi'
}, {
    name: 'Зона для охраны',
    className: 'secure'
}, {
    name: 'Камин',
    className: 'fireplace'
}, {
    name: 'Барбекю',
    className: 'barbecue'
}, {
    name: 'Альфреско',
    className: 'alfresco'
}, {
    name: 'Кондиционер',
    className: 'conditioner'
}, {
    name: 'DVD-проигрыватель',
    className: 'dvd'
}, {
    name: 'Apple гарнитура',
    className: 'apple'
}];

window.addEventListener('load', function () {
    // open/hide readMore button
    var readMore = document.getElementsByClassName("readMore");
    for (var i = 0; i < readMore.length; i++) {
        var showHideText = function showHideText() {
            var blockParent = this.parentElement,
                readMoreInfo = blockParent.getElementsByClassName("readMoreInfo");
            for (var j = 0; j < readMore.length && this.innerHTML != "Скрыть"; j++) {
                var readMoreInfoAll = document.getElementsByClassName("readMoreInfo");
                readMoreInfoAll[j].classList.remove("active");
                readMore[j].innerHTML = "Читать дальше";
            }
            readMoreInfo[0].classList.toggle("active");
            if (this.innerHTML == "Читать дальше") {
                this.innerHTML = "Скрыть";
            } else {
                this.innerHTML = "Читать дальше";
            }
        };
        readMore[i].addEventListener('click', showHideText, false);
    }

    // toggle favorite
    var favorite = document.getElementById('favorite-add'),
        favoriteMobile = document.getElementById('favorite-add-mobile');

    function toggleFavorite() {
        favorite.classList.toggle('active');
        favoriteMobile.classList.toggle('active');
    }
    favorite.addEventListener('click', toggleFavorite, false);
    favoriteMobile.addEventListener('click', toggleFavorite, false);

    // toggle mobile button
    var mobileButton = document.getElementById('main-button-block'),
        button = mobileButton.getElementsByTagName('button');

    function toggleClassButton() {

        var thisBlockInfoId = this.getAttribute("name");

        for (var j = 0; j < button.length; j++) {

            var blockInfoId = button[j].getAttribute("name");

            button[j].classList.remove('active');
            document.getElementById(blockInfoId).classList.remove('active');
        }

        this.classList.add('active');
        document.getElementById(thisBlockInfoId).classList.add('active');
    }
    for (var i = 0; i < button.length; i++) {
        button[i].addEventListener('click', toggleClassButton, false);
    }
});

// smooth scroll
Scroller = {
    // control the speed of the scroller.
    // dont change it here directly, please use Scroller.speed=50;
    speed: 10,

    // returns the Y position of the div
    gy: function (_gy) {
        function gy(_x) {
            return _gy.apply(this, arguments);
        }

        gy.toString = function () {
            return _gy.toString();
        };

        return gy;
    }(function (d) {
        gy = d.offsetTop;
        if (d.offsetParent) while (d = d.offsetParent) {
            gy += d.offsetTop;
        }return gy;
    }),

    // returns the current scroll position
    scrollTop: function scrollTop() {
        body = document.body;
        d = document.documentElement;
        if (body && body.scrollTop) return body.scrollTop;
        if (d && d.scrollTop) return d.scrollTop;
        if (window.pageYOffset) return window.pageYOffset;
        return 0;
    },

    // attach an event for an element
    // (element, type, function)
    add: function add(event, body, d) {
        if (event.addEventListener) return event.addEventListener(body, d, false);
        if (event.attachEvent) return event.attachEvent('on' + body, d);
    },

    // kill an event of an element
    end: function end(e) {
        if (window.event) {
            window.event.cancelBubble = true;
            window.event.returnValue = false;
            return;
        }
        if (e.preventDefault && e.stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
    },

    // move the scroll bar to the particular div.
    scroll: function scroll(d) {
        i = window.innerHeight || document.documentElement.clientHeight;
        h = document.body.scrollHeight;
        a = Scroller.scrollTop();
        if (d > a) {
            if (h - d > i) a += Math.ceil((d - a) / Scroller.speed);else a += Math.ceil((d - a - (h - d)) / Scroller.speed);
        } else a = a + (d - a) / Scroller.speed;
        window.scrollTo(0, a);
        if (a == d || Scroller.offsetTop == a) clearInterval(Scroller.interval);
        Scroller.offsetTop = a;
    },
    // initializer that adds the renderer to the onload function of the window
    init: function init() {
        Scroller.add(window, 'load', Scroller.render);
    },

    // this method extracts all the anchors and validates then as # and attaches the events.
    render: function render() {
        a = document.getElementsByTagName('a');
        Scroller.end(this);
        window.onscroll;
        for (i = 0; i < a.length; i++) {
            l = a[i];
            if (l.href && l.href.indexOf('#') != -1 && (l.pathname == location.pathname || '/' + l.pathname == location.pathname)) {
                Scroller.add(l, 'click', Scroller.end);
                l.onclick = function () {
                    Scroller.end(this);
                    l = this.hash.substr(1);
                    a = document.getElementsByTagName('a');
                    for (i = 0; i < a.length; i++) {
                        if (a[i].name == l) {
                            clearInterval(Scroller.interval);
                            Scroller.interval = setInterval('Scroller.scroll(' + Scroller.gy(a[i]) + ')', 10);
                        }
                    }
                };
            }
        }
    }
};
// invoke the initializer of the scroller
Scroller.init();

$('.locate-to').click(function () {
    $('html, body').animate({
        scrollTop: $("#map-id").offset().top
    }, 2000);
});

//button availability
$('.availability-block.mobile button').click(function () {
    $('.mobile.form-block').addClass('form-act');
    $('.cancelItem').click(function () {
        $('.mobile.form-block').removeClass('form-act');
    });
});

//# sourceMappingURL=snippet_638-compiled.js.map