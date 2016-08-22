'use strict';

// $(window).load(function () {
//     $('.img-block').click(function () {
//         submenu = $(this).parents('.region-block').find('info-menu');
//         $(submenu).sligeToggle();
//     })
// })

app.controller('directionsController', ['$scope', '$http', function ($s, $h) {
    // console.log('directionsController', $s);
    $s.directions = [];
    $s.regions = {};
    $s.regionsClasses = {
        "Испания": "img-spanish",
        "Азия": "img-asia",
        "Карибы": "img-caribs",
        "Франция": "img-france",
        "Италия": "img-italy",
        "Балканы": "img-balkans",
        "Шале": "img-alps",
        "Альпы": "img-alps"
    }, $s.selectedAddress = "";
    $s.result = [];
    $s.vills = [];
    // $h.get('/api/data/table?t=342')
    //     .success(function(vills) {
    //         if(vills && vills.length) {
    //             $s.vills = vills;
    //         }
    //     });
    $s.searchResult = function (villa) {
        if ($s.selectedAddress !== "" && (villa.name.search(RegExp($s.selectedAddress, "i")) > -1 || villa.f8[0].f1.search(RegExp($s.selectedAddress, "i")) > -1)) {
            return true;
        }
    };
    $s.goToSearchPage = function () {
        window.location = "/лучшие-виллы/#/" + $s.selectedAddress;
    };
    // $h.get('/api/data/table?t=343')
    //     .success(rows => {
    //         //rows = rows.
    //         $s.directions = rows;
    //         rows.forEach(row => {
    //             const regionName = row.f3[0].f1;
    //             const region_id =  row.f3[0].field_value_id;
    //
    //             $s.regions[regionName] = $s.regions[regionName]
    //                 || {
    //                     name        : regionName,
    //                     directions  : [],
    //                     id          : region_id
    //                 };
    //
    //             const region = $s.regions[regionName];
    //
    //             // adding subRegion if not exist
    //             if (row.f2 && row.f2[0]) {
    //                 const subRegion = row.f2[0];
    //                 if (!region.directions.some( item => item.name == subRegion.f1)) {
    //                     let name = subRegion.f1,
    //                         url = subRegion.url,
    //                         isDirection = false;
    //                     region.directions.push({ name, url, isDirection });
    //                 }
    //             }
    //
    //             //
    //         })
    //     });
    $h.get('/api/data/table?t=343').success(function (directions) {
        if (directions && directions.length) {
            directions = directions.sort(function (dir1, dir2) {
                if (dir1.f2 == dir2.f2) return 0;
                if (!dir1.f2) return -1;
                if (!dir2.f2) return 1;
                return dir1.f2[0].field_value_id - dir2.f2[0].field_value_id;
            });
            $s.directions = directions;
            $s.directions.forEach(function (direct) {
                if (direct.f2 != undefined) {
                    var regionName = direct.f3[0].f1,
                        subdirection = direct.f2[0],
                        directionName = direct.f1;

                    if (!$s.regions[regionName]) {
                        $s.regions[regionName] = {
                            name: regionName,
                            directions: [],
                            id: direct.f3[0].field_value_id
                        };
                    }

                    if (hasSubDirections(direct)) {
                        $s.regions[regionName].directions.push({
                            name: subdirection.f1,
                            url: direct.url
                        });
                    } else {
                        var alreadyExist = subdirectionExist(regionName, directionName);
                        switch (subdirectionExist(regionName, subdirection.f1)) {
                            case true:
                                $s.regions[regionName].directions.push({
                                    name: directionName,
                                    url: "http://" + direct.url,
                                    isDirection: true
                                });
                                break;
                            case false:
                                $s.regions[regionName].directions.push({
                                    name: subdirection.f1,
                                    url: "http://" + direct.f2[0].f2
                                });
                                $s.regions[regionName].directions.push({
                                    name: directionName,
                                    url: "http://" + direct.url,
                                    isDirection: true
                                });
                                break;
                        }
                    }
                } else {
                    if (direct.f3) {
                        var regionName = direct.f3[0].f1,
                            directionName = direct.f1;

                        if (!$s.regions[regionName]) {
                            $s.regions[regionName] = {
                                name: regionName,
                                directions: [],
                                id: direct.f3[0].field_value_id
                            };
                        }

                        $s.regions[regionName].directions.push({
                            name: directionName,
                            url: "http://" + direct.url,
                            isDirection: true
                        });
                    }
                }
            });
        }
        var regionKeys = Object.keys($s.regions);
        regionKeys.forEach(function (key) {
            $s.urlReg.forEach(function (u) {
                if ($s.regions[key].name == u.name) {
                    $s.regions[key].url = u.url;
                }
            });
        });
    });
    function hasSubDirections(direction) {
        return direction.f1 === direction.f2[0].f1;
    }

    function subdirectionExist(regionName, subdirName) {
        return $s.regions[regionName].directions.some(function (dir) {
            return dir.name === subdirName;
        });
    }

    $s.toTargetRegion = function (region) {
        localStorage.setItem("region", region.name);
        localStorage.setItem("regionId", region.id);
        window.location = region.url;
    };
    $s.toTargetDirection = function (direction) {
        localStorage.setItem('directName', direction.name);
        window.location = '/description';
    };

    $s.getUrl = function (baseUrl) {
        if (!baseUrl) return '#';
        baseUrl = baseUrl.replace(/https?:\/\//g, '').replace(/^\//g, '');
        var url = 'http://';
        if (!baseUrl.match(/arenda-vill/)) url += 'www.arenda-vill.com/';
        url += baseUrl;

        return url;
    };

    $s.urlReg = [{
        name: 'Азия',
        url: 'http://www.arenda-vill-asia.com'
    }, {
        name: 'Карибы',
        url: 'http://www.arenda-vill-kariby.com'
    }, {
        name: 'Франция',
        url: 'http://www.arenda-vill-franciya.com'
    }, {
        name: 'Италия',
        url: 'http://www.arenda-vill-italiya.com'
    }, {
        name: 'Испания',
        url: 'http://www.arenda-vill-ispaniya.com'
    }, {
        name: 'Балканы',
        url: 'http://www.arenda-vill-balkany.com'
    }, {
        name: 'Альпы',
        url: 'http://www.arenda-chalet.com'
    }];
}]);

//# sourceMappingURL=аренда-виллы-на-море-compiled.js.map