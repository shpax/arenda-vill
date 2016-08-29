'use strict';

var TABLES = {
    VILLAS: 342,
    FEATURES: 348,
    DIRECTIONS: 343,
    REGIONS: 345,
    SUB_REGIONS: 344,
    ADDITIONAL_FIELDS: 364,
    IMAGES: 428
};

app.controller('regionCtrl', ['$scope', '$http', 'setCookieFact', function ($s, $h, setCookieFact) {
    $s.targetRegion;
    $s.titleRegion;
    $s.pretext;
    $s.subRegions = null;
    $s.currentVills = []; // CURRENT vills
    $s.regionCoordinates = [];
    $s.dirCoordinates = [];
    $s.destination = window.location.hostname;
    console.log($s);

    var domens = [{
        url: 'www.arenda-vill-italiya.com',
        region: 'Италия',
        id: '32955'
    }, {
        url: 'www.arenda-vill-ispaniya.com',
        region: 'Испания',
        id: '32765'
    }, {
        url: 'www.arenda-vill-franciya.com',
        region: 'Франция',
        id: '32954'
    }, {
        url: 'www.arenda-vill-asia.com',
        region: 'Азия',
        id: '32921'
    }, {
        url: 'www.arenda-vill-kariby.com',
        region: 'Карибы',
        id: '32953'
    }, {
        url: 'www.arenda-vill-balkany.com',
        region: 'Балканы',
        id: '32957'
    }, {
        url: 'www.arenda-chalet.com',
        region: 'Шале',
        id: '36281'
    }];

    // настройки панели выезжющей из-под хедера

    // 	$('.item.direction').mouseover(function(e){
    //     $('.sub').animate({
    //         top: '78px'
    //     }, 300);
    // })

    // $('.item.direction').mouseleave(function(e){

    //     var y = e.clientY;
    //     if(y < 0) {
    //         $('.sub').animate({
    //             top: '34px'
    //         }, 200);
    //     }
    // })

    // $('.sub').on('mouseleave',function(){
    //     $('.sub').animate({
    //         top: '34px'
    //     }, 200);
    // })

    var regName, regId;
    domens.forEach(function (d) {
        if (d.url == $s.destination) {
            regName = d.region;
            regId = d.id;
        }
    });

    var indexStep = 3;
    $s.index = 0;
    $s.incrementIndex = function () {
        $s.index += indexStep;
        if ($s.index >= $s.currentVills.length) {
            $s.index = 0;
        }
    };
    $s.decrementIndex = function () {
        $s.index -= indexStep;
        if ($s.index < 0) {
            $s.index = $s.currentVills.length - 2;
        }
    };

    $s.setFavouriteVilla = function (villaId, event) {
        if (!event.target.classList.contains('active-like')) {
            document.getElementById('modal').classList.add('show');
            return setCookieFact.setFavouriteVilla(villaId);
        } else {
            return setCookieFact.setFavouriteVilla(villaId);
        }
    };

    $s.locateToAbousUs = function () {
        window.location = 'http://www.arenda-vill.com/отдых-за-рубежом';
    };

    $s.moreInfo = function (villa) {
        var t = villa.name.split(" ").map(function (word) {
            return word.charAt(0).toLowerCase() + word.slice(1);
        });
        var villaUrl = t.reduce(function (prev, curr) {
            return prev + "-" + curr;
        });
        window.location = window.location.origin + "/" + villaUrl;
    };
    $s.locateToDirections = function () {
        window.location = 'http://arenda-vill.com/аренда-виллы-на-море';
    };
    $h.get('/api/data/table?t=' + TABLES.REGIONS + '&where[f8]=' + location.host) // check about name of target region
    .success(function (data) {
        $s.targetRegion = data;

        data.forEach(function (sub) {
            if (sub.f1 == regName && sub.f4 != undefined) {
                $s.subRegions = [];
                sub.f4.forEach(function (s) {
                    if (s.f4) {
                        $s.subRegions.push({
                            name: s.f1,
                            lat: s.f4.split(",")[0],
                            lng: s.f4.split(",")[1],
                            url: s.f2
                        });
                    }
                });
            }
        });
        var latitude, longitude;
        if ($s.targetRegion[0].f3) {
            latitude = $s.targetRegion[0].f3.split(',')[0];
            longitude = $s.targetRegion[0].f3.split(',')[1];
        }

        $s.regionCoordinates.push({
            latitude: latitude || '0',
            longitude: longitude || '0'
        });

        $h.get('/api/data/table?t=' + TABLES.DIRECTIONS).success(function (directions) {
            directions.forEach(function (dir) {
                if (dir.f3 != undefined && dir.f3[0].f1 == $s.targetRegion[0].f1 && dir.f7) {
                    var coords = [];
                    if (coords = dir.f5.match(/([\d.]+)\s*,\s*([\d.]+)/)) $s.dirCoordinates.push({
                        name: dir.f1,
                        latitude: coords[1],
                        longitude: coords[2],
                        url: dir.url
                    });
                }
            });

            if ($s.subRegions == null) {
                initialize($s.regionCoordinates, $s.dirCoordinates, domens);
            } else {
                initialize($s.regionCoordinates, $s.dirCoordinates, regName, $s.subRegions);
            }
        });

        if ($s.targetRegion[0].f1.slice(-1) == 'я') {
            $s.titleRegion = $s.targetRegion[0].f1.slice(0, -1) + 'и';
            $s.pretext = 'в';
            if ($s.targetRegion[0].f1 == 'Франция') {
                $s.pretext = 'во';
            }
        } else if ($s.targetRegion[0].f1.slice(-1) == 'ы') {
            if ($s.targetRegion[0].f1 == 'Альпы') {
                $s.titleRegion = $s.targetRegion[0].f1.slice(0, -1) + 'ах';
                $s.pretext = 'в';
            } else {
                $s.titleRegion = $s.targetRegion[0].f1.slice(0, -1) + 'ах';
                $s.pretext = 'на';
            }
        } else {
            $s.titleRegion = $s.targetRegion[0].f1;
            $s.pretext = 'в';
        }

        if ($s.targetRegion[0].f1.toLowerCase().indexOf('шале') != -1) $s.pretext = '';
    });

    $h.get("api/data/tableRows?r=" + regId).success(function (data) {
        $s.regionId = data[0].field_value_id;
        $h.get('/api/data/table?t=' + TABLES.VILLAS + '&connect[f8]=2').success(handleVillas);
    });

    function handleVillas(vills) {

        var favouriteVillsFromCookies = setCookieFact.getFavouritesVill();

        vills.forEach(function (vill) {

            var villRegionId;
            try {
                villRegionId = vill.f8[0].f3.match(/\d+/).pop();
            } catch (e) {
                villRegionId = null;
            }

            if (villRegionId === $s.regionId) {
                $s.currentVills.push(vill);

                vill.inFavourites = false;
                vill.inFavourites = favouriteVillsFromCookies ? favouriteVillsFromCookies.some(function (cookieId) {
                    return vill.field_value_id == cookieId;
                }) : false;

                checkVillaStatus($s.currentVills);
            }
        });

        $h.get('/api/data/table?t=' + TABLES.ADDITIONAL_FIELDS).success(handleAdditionalFields);
    }

    function handleAdditionalFields(rows) {

        var table_id = TABLES.ADDITIONAL_FIELDS;

        rows.filter(function (row) {
            return row.f1;
        }).forEach(function (row) {
            row.villaId = row.f1[0].field_value_id;
            $s.currentVills.some(function (villa) {
                if (villa.field_value_id == row.villaId) {
                    var values = [row];
                    villa.addFields = { table_id: table_id, values: values };
                }
            });
        });
    }

    function checkVillaStatus(array) {
        $h.get('/api/data/table?t=364').success(function (vills) {
            vills.forEach(function (villa) {
                array.forEach(function (elem) {
                    if (villa.f1) {
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
    ///////////////////////// for mobile //////////////////////////////

    $s.directions = [];
    $h.get('/api/data/table?t=343').success(function (data) {
        console.log(data, 'directions');
        var dirStore = [];
        var subRegionStore = [];
        data.forEach(function (direct) {
            if (direct.f3 != undefined && direct.f3[0].f1 == regName) {
                if (direct.f2 == undefined) {
                    dirStore.push({
                        name: direct.f1,
                        url: direct.url,
                        img: direct.f4
                    });
                } else {
                    subRegionStore.push(direct);

                    subRegionStore.forEach(function (elem, i) {
                        if (findEquality($s.directions, elem) != false) {
                            $s.directions.push({
                                sub: [],
                                name: elem.f2[0].f1,
                                url: elem.f2[0].f2,
                                img: elem.f4
                            });
                        }
                    });
                    $s.directions.forEach(function (r) {
                        data.forEach(function (d) {

                            if (d.f3 != undefined && d.f3[0].f1 == regName && d.f2 != undefined) {
                                if (d.f2[0].f1 == r.name) {
                                    r.sub.push({
                                        name: d.f1,
                                        url: d.url,
                                        img: d.f4
                                    });
                                }
                            }
                        });
                    });
                }
            }
        });
        $s.directions.forEach(function (elem) {
            elem.sub = unique(elem.sub); // удаляем повтоярющиеся элементы
        });
        dirStore.forEach(function (d) {
            $s.directions.push(d); // добовляем самостоятельные направления
        });
    });
    function findEquality(array, elem) {
        var result = null;
        array.forEach(function (a) {
            if (a.name == elem.f2[0].f1) {
                result = false;
            }
        });
        return result;
    }
    function unique(arr) {
        var result = [];

        nextInput: for (var i = 0; i < arr.length; i++) {
            var str = arr[i]; // для каждого элемента
            for (var j = 0; j < result.length; j++) {
                // ищем, был ли он уже?
                if (result[j].name == str.name) continue nextInput; // если да, то следующий
            }
            result.push(str);
        }

        return result;
    }

    //     if(d.f3[0].f1 == regName && d.f2 != undefined) {
    //         $s.directions.push({
    //             sub: [],
    //             name: d.f2[0].f1,
    //             url: d.f2[0].f2,
    //             img: d.f4
    //         })
    //     }
    //     else if(d.f3[0].f1 == regName && d.f2 == undefined) {
    //         $s.directions.push({
    //             name: d.f1,
    //             url: d.url,
    //             img: d.f4
    //         });
    //     }
    //   })

    //   $s.directions.forEach(function(direct){
    //       data.forEach(function(data){
    //         if(data.f2 != undefined) {
    //             if(direct.name == data.f2[0].f1) {
    //                 direct.sub.push(data);
    //             }
    //         }
    //       })
    //   })

    // })

    $s.locateTo = function (url) {
        window.location = 'http://' + url;
    };

    function initialize(region, directions, targetRegion, subRegions) {

        switch (targetRegion) {
            case 'Карибы':
                var zoomView = 5;
                break;
            case 'Балканы':
                var zoomView = 5;
                break;
            case 'Азия':
                var zoomView = 4;
                break;
            default:
                var zoomView = 6;
                break;

        }

        var view = [region[0].latitude, region[0].longitude];
        var mymap = L.map('map').setView(view, zoomView);
        mymap.scrollWheelZoom.disable();
        window.map = mymap;

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by                          -sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'zardwi.02b6pmgg',
            accessToken: 'pk.eyJ1IjoiemFyZHdpIiwiYSI6ImNpbnZxOTRieTAwcHR2c2tsZng2amgwdmsifQ.HDmszTUL_ChtJUXtMLy9vQ'
        }).addTo(mymap);

        var subIcon = L.icon({
            iconUrl: '/files/villa/location_pin.png',
            iconSize: [42, 60],
            iconAnchor: [22, 76],
            popupAnchor: [-97, 0] // left and top

        });

        var dirIcon = L.icon({
            iconUrl: '/files/villa/location_pin_small.png',
            iconSize: [30, 42],
            iconAnchor: [10, 40],
            popupAnchor: [0, 5]
        });
        if (subRegions != null) {
            subRegions.forEach(function (sub) {
                var marker = L.marker([sub.lat, sub.lng], { icon: subIcon }).addTo(mymap);
                var link2 = $('<span class="custom-popup">' + sub.name + '</span>').click(function () {
                    window.location = 'http://' + location.host + '/' + sub.url;
                })[0];
                marker.bindPopup(link2);
            });
        }
        if (directions && directions.length) {
            directions.forEach(function (dir) {
                // if (!dir.f3) return;
                var marker = L.marker([dir.latitude, dir.longitude], { icon: dirIcon }).addTo(mymap);
                var link = $('<span class="custom-popup-small">' + dir.name + '</span>').click(function () {
                    window.location = 'http://' + location.host + '/' + dir.url;
                })[0];
                marker.bindPopup(link);
                marker.on('click', function (e) {
                    e.target._popup._contentNode.style.height = "16px";
                    e.target._popup._contentNode.style.lineHeight = "30%";
                    document.querySelector('.leaflet-popup-content-wrapper').style.right = "60px";
                });
            });
        }

        // var marker = L.marker(coordinates).addTo(mymap);
    }
}]);

function filterByTableId(obj, tableId) {
    return obj.filter(function (el) {
        return el.table_id == tableId;
    });
}

window.addEventListener('load', function () {

    count_slide = $('.slideshow .slide-item').length;
    var i = 0;
    var whatHide = false;
    var timeSlide = 5000;

    (function () {
        if (i < count_slide) {
            if (whatHide) x = count_slide;else x = i;
            z = i + 1;
            if (i >= 1 || whatHide) {
                $('.slideshow').find('.slide-item-' + x).hide(500).parent('.slideshow').find('.slide-item-' + z).show(500);
                whatHide = false;
            }
            i++;
        } else {
            i = 0;whatHide = true;
        }
        if (whatHide) t = 0;else t = timeSlide;
        setTimeout(arguments.callee, t);
    })();

    //     $(function() {
    //     var down = false;
    // $('#content-1').touchstart(function() {
    //     down = true;
    // }).touchend(function() {
    //     down = false;
    // });
    //     var slides = $('#content-1 .block-info .w30').length;
    //     //var slideWidth = $('#slider').width();
    //     var slideWidth = $('#content-1 .block-info .w30').width()+20;
    //   var aantalitemszichtbaar =$('#content-1 .block-info').width()/($('#content-1 .block-info').width()+20);
    //     var min = 0;
    //     var max = -((slides - aantalitemszichtbaar) * slideWidth);

    //     $("#content-1 .block-info").width(slides*slideWidth).draggable({
    //         axis: 'x',
    //         drag: function (event, ui) {
    //             if(down) {
    //             if (ui.position.left > min) ui.position.left = min;
    //             if (ui.position.left < max) ui.position.left = max;
    //             }
    //         }
    //     });
    // });
    jQuery(document).ready(function ($) {

        setTimeout(setDropDown(), 1000);

        function setDropDown() {
            $('.arrow-more').click(function () {
                $(this).parents('.w30').find('.down').slideToggle();
                if ($(this).hasClass('active-more')) {
                    $(this).removeClass("active-more");
                } else {
                    $(this).addClass("active-more");
                }
            });
        }

        $('.locate-to').click(function () {
            $('html, body').animate({
                scrollTop: $("#map").offset().top - 78 - 100
            }, 1500);
        });

        var galleryItems = $('.cd-gallery').children('li');

        galleryItems.each(function () {
            var container = $(this),

            // create slider dots
            sliderDots = createSliderDots(container);
            //check if item is on sale
            // 		updatePrice(container, 0);

            // update slider when user clicks one of the dots
            sliderDots.on('click', function () {
                var selectedDot = $(this);
                if (!selectedDot.hasClass('selected')) {
                    var selectedPosition = selectedDot.index(),
                        activePosition = container.find('.cd-item-wrapper .selected').index();
                    if (activePosition < selectedPosition) {
                        nextSlide(container, sliderDots, selectedPosition);
                    } else {
                        prevSlide(container, sliderDots, selectedPosition);
                    }

                    // updatePrice(container, selectedPosition);
                }
            });

            // update slider on swipeleft
            container.find('.cd-item-wrapper').on('swipeleft', function () {
                var wrapper = $(this);
                if (!wrapper.find('.selected').is(':last-child')) {
                    var selectedPosition = container.find('.cd-item-wrapper .selected').index() + 1;
                    nextSlide(container, sliderDots);
                    // updatePrice(container, selectedPosition);
                }
            });

            // update slider on swiperight
            container.find('.cd-item-wrapper').on('swiperight', function () {
                var wrapper = $(this);
                if (!wrapper.find('.selected').is(':first-child')) {
                    var selectedPosition = container.find('.cd-item-wrapper .selected').index() - 1;
                    prevSlide(container, sliderDots);
                    // updatePrice(container, selectedPosition);
                }
            });

            // preview image hover effect - desktop only
            container.on('mouseover', '.move-right, .move-left', function (event) {
                hoverItem($(this), true);
            });
            container.on('mouseleave', '.move-right, .move-left', function (event) {
                hoverItem($(this), false);
            });

            // update slider when user clicks on the preview images
            container.on('click', '.move-right, .move-left', function (event) {
                event.preventDefault();
                if ($(this).hasClass('move-right')) {
                    var selectedPosition = container.find('.cd-item-wrapper .selected').index() + 1;
                    nextSlide(container, sliderDots);
                } else {
                    if ($(this).hasClass('move-left')) {
                        var selectedPosition = container.find('.cd-item-wrapper .selected').index() - 1;
                        prevSlide(container, sliderDots);
                    }
                }
                // 			updatePrice(container, selectedPosition);
            });
        });

        function createSliderDots(container) {
            var dotsWrapper = $('<ol class="cd-dots"></ol>').insertAfter(container.children('a'));
            container.find('.cd-item-wrapper li').each(function (index) {
                var dotWrapper = index == 0 ? $('<li class="selected"></li>') : $('<li></li>'),
                    dot = $('<a href="#0"></a>').appendTo(dotWrapper);
                dotWrapper.appendTo(dotsWrapper);
                dot.text(index + 1);
            });
            return dotsWrapper.children('li');
        }

        function hoverItem(item, bool) {
            item.hasClass('move-right') ? item.toggleClass('hover', bool).siblings('.selected, .move-left').toggleClass('focus-on-right', bool) : item.toggleClass('hover', bool).siblings('.selected, .move-right').toggleClass('focus-on-left', bool);
        }

        function nextSlide(container, dots, n) {
            var visibleSlide = container.find('.cd-item-wrapper .selected'),
                navigationDot = container.find('.cd-dots .selected');
            if (typeof n === 'undefined') n = visibleSlide.index() + 1;
            visibleSlide.removeClass('selected');
            container.find('.cd-item-wrapper li').eq(n).addClass('selected').removeClass('move-right hover').prevAll().removeClass('move-right move-left focus-on-right').addClass('hide-left').end().prev().removeClass('hide-left').addClass('move-left').end().next().addClass('move-right');
            navigationDot.removeClass('selected');
            dots.eq(n).addClass('selected');
        }

        function prevSlide(container, dots, n) {
            var visibleSlide = container.find('.cd-item-wrapper .selected'),
                navigationDot = container.find('.cd-dots .selected');
            if (typeof n === 'undefined') n = visibleSlide.index() - 1;
            visibleSlide.removeClass('selected focus-on-left');
            container.find('.cd-item-wrapper li').eq(n).addClass('selected').removeClass('move-left hide-left hover').nextAll().removeClass('hide-left move-right move-left focus-on-left').end().next().addClass('move-right').end().prev().removeClass('hide-left').addClass('move-left');
            navigationDot.removeClass('selected');
            dots.eq(n).addClass('selected');
        }

        // 	function updatePrice(container, n) {
        // 		var priceTag = container.find('.cd-price'),
        // 			selectedItem = container.find('.cd-item-wrapper li').eq(n);
        // 		if( selectedItem.data('sale') ) {
        // 			// if item is on sale - cross old price and add new one
        // 			priceTag.addClass('on-sale');
        // 			var newPriceTag = ( priceTag.next('.cd-new-price').length > 0 ) ? priceTag.next('.cd-new-price') : $('<em class="cd-new-price"></em>').insertAfter(priceTag);
        // 			newPriceTag.text(selectedItem.data('price'));
        // 			setTimeout(function(){ newPriceTag.addClass('is-visible'); }, 100);
        // 		} else {
        // 			// if item is not on sale - remove cross on old price and sale price
        // 			priceTag.removeClass('on-sale').next('.cd-new-price').removeClass('is-visible').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
        // 				priceTag.next('.cd-new-price').remove();
        // 			});
        // 		}
        // 	}
    });
});

//# sourceMappingURL=snippet_637-compiled.js.map