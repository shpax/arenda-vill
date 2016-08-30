'use strict';

app.filter('endOfWordBedrooms', function () {
  return function (countBedrooms) {

    var countBedrooms = +countBedrooms;
    if (countBedrooms != 0) {
      var lastDigit = "" + countBedrooms;
      if (lastDigit.slice(-2, -1) && +lastDigit.slice(-2, -1) == 1) {
        return 'ен';
      } else {
        lastDigit = +lastDigit.slice(-1);
        switch (lastDigit) {
          case 1:
            return 'ьня';
            break;
          case 2:
          case 3:
          case 4:
            return 'ьни';
            break;
          default:
            return 'ен';
        }
      }
    }
  };
});
app.filter('endOfWordGuests', function () {
  return function (countGuests) {
    //debugger;
    var countGuests = +countGuests;
    if (countGuests != 0) {
      var lastDigit = "" + countGuests;
      if (lastDigit.slice(-2, -1) && +lastDigit.slice(-2, -1) == 1) {
        return 'ей';
      } else {
        lastDigit = +lastDigit.slice(-1);
        switch (lastDigit) {
          case 1:
            return 'ь';
            break;
          case 2:
          case 3:
          case 4:
            return 'я';
            break;
          default:
            return 'ей';
        }
      }
    }
  };
});
app.controller('VillaSearchCtrl', ['$scope', '$http', 'setCookieFact', '$rootScope', '$routeParams', '$location', "SearchPageFact", 'Database', function ($s, $h, setCookieFact, $rootScope, $routeParams, $location, SearchPageFact, db) {

  $s.directions = [];
  $s.arrDirections = [];
  $s.loading = true;
  $s.rCounts = [];
  $s.gCounts = [];
  $s.recreationStyles = ['Виллы у моря', 'Поместья и Замки', 'Шале в горах'];
  $s.filterResult = [];
  $s.selectedDir;
  $s.selectedRegion = [];
  $s.selectedRoom = {};
  $s.selectedGuest = {};
  $s.selectedMinPrice = {};
  $s.selectedMaxPrice = {};
  $s.selectedRecreationStyle = [];
  $s.check = [];
  $s.checkBenefit = [];
  $s.selectedSpecialBenefit = [];
  $s.specialStaticBenefitsArr = ["Сауна", "Баня", "Джакузи", "Спорт Зал", "Доступ к подъемнику", "Кинозал", "Частный пляж", "Зона для гостей", "Зона для охраны", "Частный причал", "Бассейн"];
  // $s.regions = [{name:'Испания',},{name:'Италия'},{name:'Азия'},{name:'Карибы'},{name:'Альпы'},{name:'Франция'},{name:'Балканы'}];
  $s.regions = [];
  $s.regionsId = [];
  $s.regionsMapping = [];
  $s.arrFiltersStatus = [true, true, true, true, true, true, true, true, true];
  $s.showResetButton = true;
  $s.villsFieldValueIdArr = [];
  var villsGlobal = [],
      query;
  $s.$watch('filteredVills.length', function () {
    if ($s.filteredVills) {
      var lastDigit = "" + $s.filteredVills.length;
      lastDigit = +lastDigit.slice(-1);
      switch ($s.filteredVills.length) {
        case 1:
          $s.endOfWord = 'т';
          break;
        case 2:
          $s.endOfWord = 'тa';
          break;
        case 3:
          $s.endOfWord = 'та';
          break;
        case 4:
          $s.endOfWord = 'та';
          break;
        default:
          $s.endOfWord = 'тов';
      }
    }
  });

  console.log($s, 'scope');

  var temp = localStorage.recStyle || '';
  $s.searchValue = decodeURIComponent(location.hash.substring(2)) || '';

  // query = $routeParams.search;

  $s.setFavouriteVilla = function (villaId, event) {
    if (!event.target.classList.contains('active-like')) {
      document.getElementById('modal').classList.add('show');
      // localStorage.setItem('liked', villaId);
      return setCookieFact.setFavouriteVilla(villaId);
    } else {
      return setCookieFact.setFavouriteVilla(villaId);
    }
  };

  $s.addFav = function (villaId, event) {
    if (!event.target.classList.contains('active-like')) {
      event.target.classList.add('active-like');
      document.getElementById('modal').classList.add('show');
      return setCookieFact.setFavouriteVilla(villaId);
    } else {
      event.target.classList.remove('active-like');
      return setCookieFact.setFavouriteVilla(villaId);
    }
  };

  $s.isFav = function (villaId) {
    var result;
    setCookieFact.getFavouritesVill().forEach(function (vill) {
      if (vill == villaId) {
        result = true;
      }
    });
    return result;
  };

  db.request('/api/data/table?t=428&connect[f1]=0', function (images) {
    images = images.filter(function (img) {
      return img.f1 && img.f2;
    }).map(function (img) {
      img.f1 = img.f1.replace(/\|/g, '');
      return img;
    });
    db.request('/api/data/table?t=342', function (vills) {

      vills.forEach(function (villa) {
        villa.images = images.filter(function (img) {
          return img.f1 == villa.field_value_id && img.f2;
        }).sort(function (v1, v2) {
          if (v1.f3 == v2.f3) return 0;
          if (v1.f3 == 'yes') return -1;
          return 1;
        });
        villa.img = (villa.images[0] || { f2: '' }).f2;
      });

      if (vills && vills.length) {
        var gallery1 = function gallery1(additionalFields) {
          return additionalFields[0].f9;
        };

        var gallery2 = function gallery2(villa) {
          return villa.images.map(function (img) {
            return img.f2;
          });
        };

        $s.vills = villsGlobal = vills.filter(function (villa) {
          return !!villa.url;
        });
        checkVillaStatus($s.vills);
        var roomMinValue = 999,
            roomMaxValue = 0,
            guestMinValue = 999,
            guestMaxValue = 0,
            minPrice = 999,
            maxPrice = 0,
            favouriteVillsFromCookies = setCookieFact.getFavouritesVill();
        vills.forEach(function (villa) {
          // get max/min rooms and persons value
          $s.villsFieldValueIdArr.push(villa.field_value_id);
          villa.r_counter = isParamCorrect(villa, villa.r_counter, 'r_counter');
          villa.person_counter = isParamCorrect(villa, villa.person_counter, 'person_counter');
          villa.min_price = isParamCorrect(villa, villa.min_price, 'min_price');
          villa.max_price = isParamCorrect(villa, villa.max_price, 'max_price');

          if (villa.min_price && villa.max_price) {
            villa.priceStr = '$' + villa.min_price + ' — $' + villa.max_price;
          } else {
            villa.priceStr = 'цена по запросу';
          }

          villa.inFavourites = false;
          villa.inFavourites = favouriteVillsFromCookies ? favouriteVillsFromCookies.some(isEqual) : false;
          var objDirection = {};
          if (villa.f8) {
            objDirection.name = villa.f8[0].f1;
            objDirection.idRegion = +villa.f8[0].f3.replace(/\|/g, "");
            objDirection.showDir = true;
            objDirection.villCount = countVills(vills, objDirection.name);
            $s.arrDirections.push(objDirection);
            //получаем массив id по которым получим регионы в 343 таблице
            $s.regionsId.push(+villa.f8[0].f3.replace(/\|/g, ""));
          }
          function countVills(vills, direction) {
            var counter = 0;
            vills.forEach(function (villa) {
              if (villa.f8 != undefined && villa.f8[0].f1 == direction) {
                counter += 1;
              }
            });
            return counter;
          }
          function isEqual(cookieId) {
            return villa.field_value_id == cookieId;
          }
          if (villa.r_counter > roomMaxValue) {
            roomMaxValue = parseInt(villa.r_counter);
          }
          if (villa.r_counter < roomMinValue) {
            roomMinValue = parseInt(villa.r_counter);
          }
          if (villa.person_counter > guestMaxValue) {
            guestMaxValue = parseInt(villa.person_counter);
          }

          if (villa.person_counter < guestMinValue) {
            guestMinValue = parseInt(villa.person_counter);
          }
          if (villa.min_price < minPrice) {
            if (villa.min_price !== '') {
              minPrice = parseInt(villa.min_price);
            }
          }

          if (villa.max_price > maxPrice) {
            if (villa.max_price !== '') {
              maxPrice = parseInt(villa.max_price);
            }
          }

          // if($s.recreationStyles && $s.recreationStyles.length) {
          //     var villaRecreationStyle = villa.recreation_style,
          //         add = true;
          //     $s.recreationStyles.forEach(function(style) {
          //         if(style == villaRecreationStyle) {
          //             add = false;
          //         }
          //
          //         add ? $s.recreationStyles.push(villaRecreationStyle) : "";
          //     })
          // } else {
          //     $s.recreationStyles.push(villa.recreation_style);
          // }
          //
          // $h.get('api/data/connectedWith?r='+ villa.field_value_id)
          // .success(function(result) {
          //   if(result) {
          //      debugger;
          //         villa.additionalFields = filterByTableId(result, 364);
          //         if(villa.additionalFields[0]) {

          //           villa.best = villa.additionalFields[0].f6 ? parseInt(villa.additionalFields[0].f6) : 0;
          //           villa.date_of_addition = villa.additionalFields[0].f5 ? new Date(villa.additionalFields[0].f5) : 0;
          //           villa.gallery = gallery1(villa.additionalFields);

          //           if(villa.additionalFields[0].f10 == 'hide') {
          //           $s.arrDirections.forEach(function(dir){
          //               if(dir.name == villa.f8[0].f1) {
          //                   var index = $s.arrDirections.indexOf(dir);
          //                   $s.arrDirections.splice(index, 1);
          //               }
          //           })
          //         } 
          //         }

          //         villa.gallery = gallery2(villa);

          //   }
          // });
        });
        // var dm = new DataManager();
        // //debugger;
        // dm.table(428).where('f3', 'yes').where('f1', $s.villsFieldValueIdArr).success(function (imgTable) {
        //   debugger;
        //   console.log(imgTable);
        //   // $s.vills = $s.vills.map(function(villa){
        //   //     var imgUrl;
        //   //     imgTable.forEach(function(img){
        //   //         if (villa.field_value_id == img.f1.split('|')[1]){
        //   //             imgUrl = img.f2;
        //   //         }
        //   //     });
        //   //     if(imgUrl){
        //   //         villa.img = imgUrl;
        //   //     }
        //   //     return villa;
        //   // });
        //   $s.$apply();
        // });

        $s.rCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        $s.gCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // var rCounts = parseInt(roomMaxValue / roomMinValue); //count and write rooms value to select options array
        // var rCount = roomMinValue;
        // while(rCount <= roomMaxValue) {
        //     //debugger;
        //   if(rCount + rCounts <= roomMaxValue) {
        //     $s.rCounts.push(rCount);
        //   } else {
        //     $s.rCounts.push(roomMaxValue);
        //   }
        //   rCount += rCounts;
        // }

        // var gStep = parseInt(guestMaxValue / guestMinValue); //count and write guests value to select options array
        // var gCount = guestMinValue;
        // while(gCount <= guestMaxValue) {
        //   if(gCount + gStep <= guestMaxValue) {
        //     $s.gCounts.push(gCount);
        //   } else {
        //     $s.gCounts.push(guestMaxValue);
        //   }
        //   gCount += gStep;
        // }

        // set min/max prices
        minPrice = Math.floor(minPrice / 100) * 100;
        maxPrice = Math.ceil(maxPrice / 100) * 100;
        $s.selectedMinPrice = $s.minPrice = $s.resetMinPrice = minPrice;
        $s.selectedMaxPrice = $s.maxPrice = $s.resetMaxPrice = maxPrice;

        jQuery("#slider").slider({
          min: minPrice,
          max: maxPrice,
          values: [minPrice, maxPrice],
          range: true,
          step: 100,
          stop: function stop(event, ui) {
            $s.selectedMinPrice = $s.minPrice = jQuery("#slider").slider("values", 0);
            jQuery("input#minCost").val(jQuery("#slider").slider("values", 0));
            $s.selectedMaxPrice = $s.maxPrice = jQuery("#slider").slider("values", 1);
            jQuery("input#maxCost").val(jQuery("#slider").slider("values", 1));
            $s.$digest();
          },
          slide: function slide(event, ui) {
            $s.selectedMinPrice = $s.minPrice = jQuery("#slider").slider("values", 0);
            jQuery("input#minCost").val(jQuery("#slider").slider("values", 0));
            $s.selectedMaxPrice = $s.maxPrice = jQuery("#slider").slider("values", 1);
            jQuery("input#maxCost").val(jQuery("#slider").slider("values", 1));
          }
        });

        jQuery("input#minCost").keyup(function () {
          var value1 = jQuery("input#minCost").val();
          var value2 = jQuery("input#maxCost").val();

          if (parseInt(value1) > parseInt(value2)) {
            value1 = value2;
            jQuery("input#minCost").val(value1);
          }
          jQuery("#slider").slider("values", 0, value1);
          $s.selectedMinPrice = value1;
        });

        jQuery("input#maxCost").keyup(function () {
          var value1 = jQuery("input#minCost").val();
          var value2 = jQuery("input#maxCost").val();

          if (value2 > maxPrice) {
            value2 = maxPrice;jQuery("input#maxCost").val(maxPrice);
          }
          if (parseInt(value1) > parseInt(value2)) {
            value2 = value1;
            jQuery("input#maxCost").val(value2);
          }
          jQuery("#slider").slider("values", 1, value2);
          $s.selectedMaxPrice = value2;
        });
        jQuery("#button-reset").click(function () {
          jQuery("#slider").slider({ values: [$s.resetMinPrice, $s.resetMaxPrice] });
        });

        // !!! set min/max prices !!!
      } else {}
      $s.loading = false;

      // удаление повторов из списка направлений
      //debugger;
      $s.arrDirections = unicObjListByName($s.arrDirections);
      $s.regionsId = unic($s.regionsId);

      db.request('/api/data/table?t=343', function (regions) {
        regions.forEach(function (region) {
          if (region.f3 != undefined) {
            if ($s.regionsId.indexOf(+region.f3[0].field_value_id) !== -1) {
              var regionNameAndId = {};
              regionNameAndId.name = region.f3[0].f1;
              regionNameAndId.id = +region.f3[0].field_value_id;
              $s.regions.push(region.f3[0].f1);
              $s.regionsMapping.push(regionNameAndId);
            }
          }
        });
        $s.regions = unic($s.regions);
        $s.regions = $s.regions.map(function (item) {
          var makedObj = {};
          makedObj.name = item;
          return makedObj;
        });
        $s.regionsMapping = unicObjListById($s.regionsMapping);

        checkboxlayer($s.regions); // стилизируем мультиселект
        // setHandlers();
      });

      //функция удаления дублирующих значений из массива
      function unic(arr) {
        var result = [];
        nextElem: for (var i = 0; i < arr.length; i++) {
          var direction = arr[i];
          for (var j = 0; j < result.length; j++) {
            if (result[j] === direction) continue nextElem;
          }
          result.push(direction);
        }
        return result;
      }
      function unicObjListById(arr) {
        var result = [];
        nextElem: for (var i = 0; i < arr.length; i++) {
          var arrElem = arr[i].id;
          for (var j = 0; j < result.length; j++) {
            if (result[j].id === arrElem) continue nextElem;
          }
          result.push(arr[i]);
        }
        return result;
      }
      function unicObjListByName(arr) {
        var result = [];
        nextElem: for (var i = 0; i < arr.length; i++) {
          var arrElem = arr[i].name;
          for (var j = 0; j < result.length; j++) {
            if (result[j].name === arrElem) continue nextElem;
          }
          result.push(arr[i]);
        }
        return result;
      }
    });
  });
  function isParamCorrect(villa, param, paramKey) {
    var testValue = parseInt(param);
    var result = null;
    if (isNaN(testValue) == false) {
      // поле заполнено корректно
      result = testValue;
    } else {
      console.log(villa.name + ' ' + paramKey + ' is empty');
      result = '';
    }
    return result;
  }
  function checkVillaStatus(array) {}
  // $h.get('/api/data/table?t=364').success(function (vills) {
  //   vills.forEach(function (villa) {
  //     array.forEach(function (elem) {
  //
  //       if (villa.f1 && villa.f1[0].f1 && elem.name == villa.f1[0].f1 && villa.status == 'hide') {
  //         var position = array.indexOf(elem);
  //         array.splice(position, 1);
  //       }
  //     });
  //   });
  // });

  // Сортировка
  $s.orderByField = 'min_price';
  $s.reverseSort = true;
  // !!! Сортировка !!!
  //фильтр по направлениям
  $s.byDirection = function (villa) {
    if ($s.selectedDir != '-- Все направления --' && villa.f8 != undefined) {
      $s.arrFiltersStatus[1] = false;
      return villa.f8[0].f1 == $s.selectedDir;
    } else {
      $s.arrFiltersStatus[1] = true;
      return true;
    }
  };
  //изменение направлений в зависимости от региона
  $s.$watch('selectedRegion', function () {

    if ($s.selectedRegion.length == 0) {
      $s.arrDirections.forEach(function (dir) {
        dir.showDir = true;
      });
    } else {
      $s.arrDirections.forEach(function (dir) {
        dir.showDir = false;
      });

      $s.selectedRegion.forEach(function (reg) {
        nextSelectedRegion: for (var i = 0; i < $s.arrDirections.length; i++) {
          for (var j = 0; j < $s.regionsMapping.length; j++) {
            if ($s.regionsMapping[j].name == reg.name) {
              if ($s.regionsMapping[j].id == $s.arrDirections[i].idRegion) {
                $s.arrDirections[i].showDir = true;
                continue nextSelectedRegion;
              }
            }
          }
        }
      });
    }
  });

  $s.openSlt = function () {
    var dSlt = document.getElementById('directionsSelect');

    var evt1 = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: 20
    });
    // при клике селект региона закрывается
    var evt2 = new MouseEvent("mousedown", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: 20
    });
    // при mousedown открывается селект направлений
    dSlt.dispatchEvent(evt1);
    dSlt.dispatchEvent(evt2);
  };
  //фильтр по регионам
  $s.byRegion = function (villa) {
    if ($s.selectedRegion.length == 0) {
      $s.arrFiltersStatus[0] = true;
      return true;
    } else {
      $s.arrFiltersStatus[0] = false;
      if (villa.f8 != undefined) {
        var idRegion = +villa.f8[0].f3.replace(/\|/g, "");
        for (var i = 0; i < $s.selectedRegion.length; i++) {
          for (var j = 0; j < $s.regionsMapping.length; j++) {
            if ($s.regionsMapping[j].name == $s.selectedRegion[i].name && idRegion == $s.regionsMapping[j].id) {
              return true;
            } else {
              continue;
            }
          }
        }
      }
      return false;
    }
  };

  $s.$watch('selectedDir', function () {
    setHandlers('directionsSelect');
  });

  $s.$watch('selectedRoom', function () {
    setHandlers('roomsSelect');
    setOrderByField('r_counter');
  });

  $s.$watch('selectedGuest', function () {
    setHandlers('guestsSelect');
    setOrderByField('person_counter');
  });

  var setOrderByField = function setOrderByField(param, event) {

    $s.orderByField = param;
    $s.reverseSort = false;
  };
  $s.byRoom = function (villa) {

    if ($s.selectedRoom != '-- Количество спален --') {
      $s.arrFiltersStatus[2] = false;
      return parseInt(villa.r_counter) >= parseInt($s.selectedRoom);
    } else {
      // $s.orderByField = 'min_price';
      // $s.reverseSort = true;
      $s.arrFiltersStatus[2] = true;
      return true;
    }
  };

  $s.byGuest = function (villa) {
    if ($s.selectedGuest != '-- Количество гостей --') {
      $s.arrFiltersStatus[3] = false;
      return parseInt(villa.person_counter) >= parseInt($s.selectedGuest);
    } else {
      // $s.orderByField = 'min_price';
      // $s.reverseSort = true;
      $s.arrFiltersStatus[3] = true;
      return true;
    }
  };

  $s.byMinPrice = function (villa) {
    if (parseInt($s.selectedMinPrice) > parseInt(villa.min_price)) {
      $s.arrFiltersStatus[4] = false;
    } else {
      $s.arrFiltersStatus[4] = true;
    }
    return parseInt(villa.min_price) >= parseInt($s.selectedMinPrice);
  };

  $s.byMaxPrice = function (villa) {

    if (parseInt($s.selectedMaxPrice) < parseInt(villa.max_price)) {
      $s.arrFiltersStatus[5] = false;
    } else {
      $s.arrFiltersStatus[5] = true;
    }
    return parseInt(villa.max_price) <= parseInt($s.selectedMaxPrice) || !villa.max_price && !villa.min_price;
  };
  $s.$watchCollection('arrFiltersStatus', function () {

    var status = $s.arrFiltersStatus.every(function (status) {
      return status;
    });
    if (status) {
      $s.showResetButton = false;
    } else {
      $s.showResetButton = true;
    }
  });
  //функция сброса фильтров
  $s.resetFilters = function () {

    //   if(localStorage.getItem("query")) {
    //      var query = localStorage.getItem("query");
    //      $s.regions.forEach(function(region) {
    //       if(region.f1.indexOf(query) > -1 ) {
    //          region.selected = false;
    //       }
    //      })
    //   }
    //   if(localStorage.getItem("regionFromMain")) {
    //      var query = localStorage.getItem('regionFromMain');
    //      $s.regions.forEach(function(region) {
    //       if(region.f1.indexOf(query) > -1 ) {
    //          region.selected = false;
    //       }
    //      })
    //   }
    //   localStorage.clear;

    $s.selectedRegion = [];
    $s.regions.forEach(function (reg) {
      reg.selected = false;
    });
    $s.selectedDir = '-- Все направления --';
    $s.selectedRoom = '-- Количество спален --';
    $s.selectedGuest = '-- Количество гостей --';
    $s.selectedMinPrice = $s.resetMinPrice;
    $s.selectedMaxPrice = $s.resetMaxPrice;
    //jQuery("input#minCost").keyup();
    //jQuery("input#maxCost").keyup();
    for (var key in $s.check) {

      $s.check[key] = false;
    }
    $s.selectedRecreationStyle = [];
    for (var key in $s.checkBenefit) {

      $s.checkBenefit[key] = false;
    }
    $s.selectedSpecialBenefit = [];
    $s.bySearch = '';
    $s.searchValue = '';
    $s.showResetButton = false;
  };
  // массив с выбранными типами отдыха
  $s.setRecreationStyle = function (currentStyle, check) {
    if (!check) {
      $s.selectedRecreationStyle = $s.selectedRecreationStyle.filter(function (item) {
        return item !== currentStyle;
      });
    } else {
      $s.selectedRecreationStyle.push(currentStyle);
    }
  };
  //debugger;
  switch ($s.searchValue) {
    case 'Виллы у Моря':
      $s.searchValue = '';
      $s.selectedRecreationStyle.push('Виллы у Моря');
      $s.check[0] = true;
      break;
    case 'Поместья и Замки':
      $s.searchValue = '';
      $s.selectedRecreationStyle.push('Поместья и Замки');
      $s.check[1] = true;
      break;
    case 'Шале в горах':
      $s.searchValue = '';
      $s.selectedRecreationStyle.push('Шале в горах');
      $s.check[2] = true;
      break;

  }
  // $s.setRecreationStyle = function(value) {
  //   var add = true;
  //   var remove;
  //   if($s.selectedRecreationStyle && $s.selectedRecreationStyle.length) {
  //     $s.selectedRecreationStyle.forEach(function(style) {
  //       if(style == value) {
  //         add = false;
  //         $s.selectedRecreationStyle.splice($s.selectedRecreationStyle.indexOf(style), 1);
  //       }
  //     });
  //     if(add) {
  //       $s.selectedRecreationStyle.push(value);
  //     }
  //   } else {
  //     $s.selectedRecreationStyle.push(value);

  //   }

  // }

  // if(temp && temp!= '') {
  //   $s.setRecreationStyle(temp);
  //   localStorage.removeItem('recStyle');   
  // }

  // if(localStorage.searchValue) {
  //   localStorage.removeItem('searchValue');   
  // }

  // $s.check = function(check) {

  //   var result = false;

  //   $s.recreationStyles.forEach(function(item){
  //     if(item == temp && item == check) {
  //      result = true;
  //    }
  //  });
  //   return result;
  // };
  //Фильтр по выбранным типам отдыха
  $s.byRecreationStyle = function (villa) {
    if ($s.selectedRecreationStyle.length == 0) {
      $s.arrFiltersStatus[6] = true;
      return true;
    } else {
      $s.arrFiltersStatus[6] = false;
      for (var i = 0; i < $s.selectedRecreationStyle.length; i++) {
        if (villa.recreation_style === $s.selectedRecreationStyle[i]) {
          return true;
        }
      }
    }
  };

  // $s.byRecreationStyle = function(villa) {

  //   if($s.selectedRecreationStyle && $s.selectedRecreationStyle.length) {
  //     var show = false;
  //     $s.selectedRecreationStyle.forEach(function(style) {
  //       if(style == villa.recreation_style) {
  //         show = true;
  //         return;

  //       }
  //     })
  //     if(show) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   } else {
  //     return true;
  //   }
  // }
  //Массив
  $s.setSpecBenefit = function (currentBenefit, check) {
    if (!check) {
      $s.selectedSpecialBenefit = $s.selectedSpecialBenefit.filter(function (item) {
        return item !== currentBenefit;
      });
    } else {
      $s.selectedSpecialBenefit.push(currentBenefit);
    }
  };
  $s.bySpecBenefit = function (villa) {

    if ($s.selectedSpecialBenefit.length == 0) {
      $s.arrFiltersStatus[7] = true;
      return true;
    } else {
      if (villa.f12) {
        $s.arrFiltersStatus[7] = false;
        for (var i = 0; i < $s.selectedSpecialBenefit.length; i++) {
          for (var j = 0; j < villa.f12.length; j++) {
            //debugger;
            if (villa.f12[j].f1 === $s.selectedSpecialBenefit[i]) {
              //debugger;
              return true;
            }
          }
        }
      }
    }
  };
  $s.$watch('searchValue', function () {
    //location.hash ="#/"+$s.searchValue;
    //debugger;
    // if($s.searchValue == 'В горах'){
    //   //debugger;
    //   $s.searchValue ='';
    // }else{
    //   //debugger;
    $s.bySearch = $s.searchValue;
    //}
  });
  $s.$watch('bySearch', function () {
    if ($s.bySearch) {
      $s.arrFiltersStatus[8] = false;
    } else {
      $s.arrFiltersStatus[8] = true;
    }
  });

  // $s.bySearch = function(villa) {
  //   if(searchValue && searchValue != '') {
  //     if(villa.name.indexOf(searchValue) > -1) {
  //       $s.selectedRecreationStyle.push(villa.recreation_style);
  //       $s.selectedRecreationStyle.splice(1);   
  //     }
  //     return villa.name.indexOf(searchValue) > -1;
  //   } else {
  //     return true;
  //   }
  // }

  // !!! filters !!!

  //multiSelect
  $s.localLang = {
    // selectAll       : "Tick all",
    // selectNone      : "Tick none",
    // reset           : "Undo all",
    // search          : "Type here to search...",
    nothingSelected: "-- Выберите регион --" //default-label is deprecated and replaced with this.
  };

  $s.sayHi = function (data) {};
  //!!!multiSelect!!!

  $s.showVillaInfo = function (villa) {
    var url = 'http://';

    if (villa.f8) {
      $h.get('/api/data/table?t=345&where[field_value_id]=' + villa.f8[0].f3.replace(/\|/g, '') + '&field=f8').success(function (host) {
        window.location = '' + url + host + '/' + villa.url;
      });
      return;
    }

    if (!villa.url.match(/arenda-vill/)) url += 'www.arenda-vill.com/';

    url += villa.url;

    window.location = url;
  };

  function hasSubDirections(direction) {
    return direction.f1 === direction.f2[0].f1;
  }

  function subdirectionExist(regionName, subdirName) {
    return $s.regions[regionName].directions.some(function (dir) {
      return dir.name === subdirName;
    });
  }

  function regions() {
    db.request('/api/data/table?t=343', function (directions) {

      if (directions && directions.length) {
        $s.directions = directions;
        $s.directions.forEach(function (direct) {
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
              url: direct.f6
            });
          } else {

            var alreadyExist = subdirectionExist(regionName, directionName);
            switch (subdirectionExist(regionName, subdirection.f1)) {
              case true:
                $s.regions[regionName].directions.push({
                  name: directionName,
                  url: direct.f6,
                  isDirection: true
                });
                break;
              case false:
                $s.regions[regionName].directions.push({
                  name: subdirection.f1,
                  url: direct.f6
                });
                $s.regions[regionName].directions.push({
                  name: directionName,
                  url: direct.f6,
                  isDirection: true
                });
                break;
            }
          }
        });
      }
      // var regionKeys = Object.keys($s.regions)
      // regionKeys.forEach(function(key) {
      //   $s.urlReg.forEach(function(u){
      //     if($s.regions[key].name == u.name) {
      //       $s.regions[key].url = u.url;
      //     }
      //   })

      // })
    });
  }
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

  $s.$on('ngRepeatFinished', function () {
    getSlider();
    if (is_safari) {
      var btns = document.getElementsByClassName('button-arrow');
      Array.prototype.slice.call(btns).forEach(function (b) {
        b.style.minWidth = '150px';
        if (window.innerWidth <= 768) {
          b.style.top = '-15px';
        }
      });
    }

    if (is_firefox) {
      if (window.innerWidth <= 1024) {
        var styleElem = document.head.appendChild(document.createElement("style"));
        styleElem.innerHTML = "#liked.blocks .button-arrow a:after {top: -4px;}";
      }
    }
  });
  $s.modalSlide = function (argument) {
    console.log('121r423modal');
  };
}]);

function filterByTableId(obj, tableId) {
  return obj.filter(function (el) {
    return el.table_id == tableId;
  });
}

app.directive('onFinishRender', function ($timeout) {
  return {
    restrict: 'A',
    link: function link(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
        });
      }
    }
  };
});
function checkboxlayer(regions) {
  var mSlct = document.querySelector('.checkboxLayer');
  if (!mSlct) {
    setTimeout(function () {
      checkboxlayer(regions);
    }, 100);
    return;
  }
  mSlct.style.minWidth = '0px';
  mSlct.style.borderRadius = '0px';
  mSlct.style.color = '#666666';

  var checkboxContainter = document.querySelector('.checkBoxContainer');
  checkboxContainter.style.height = '170px';

  console.log($('.multiSelectItem'));

  var checkboxItem = document.querySelectorAll('.multiSelectItem');
  // checkboxItem.style.backgroundImage = 'linear-gradient( #C3B1B1, #E0BDBD )';
  $('.multiSelectItem').css('background-image', 'linear-gradient( #FF0000, #999 ) !important');

  if (regions.length > 5) {
    checkboxContainter.style.overflowY = 'scroll';
  } else {
    checkboxContainter.style.overflowY = 'hidden';
  }
}

function setHandlers(selectId) {
  var slt = document.getElementById(selectId);
  if (slt != null) {
    var foo = slt.options[slt.selectedIndex];
    Array.prototype.slice.call(slt.options).forEach(function (o) {
      if (o.classList.contains('s-background')) {
        o.classList.remove('s-background');
      }
    });
    if (slt.selectedIndex != 0) {
      foo.classList.add('s-background');
    }
  }
}

function getSlider() {
  im = document.getElementsByClassName('openImage');
  for (i = 0; i < im.length; i++) {
    im[i].onclick = function () {
      var index = 0;
      var items = [];
      var pswpElement = document.querySelectorAll('.pswp')[0];
      var g = document.querySelectorAll('img[gallery="' + this.getAttribute('gallery') + '"]');
      var gal = this.getAttribute('gallery');
      for (x = 0; x < g.length; x++) {
        if (g[x] == this) index = x;
        items[x] = {
          src: g[x].src,
          w: g[x].getAttribute('w'),
          h: g[x].getAttribute('h')
        };
        g[x].id;
      }
      var options = {
        index: index,

        getThumbBoundsFn: function getThumbBoundsFn(index) {
          var thumbnail = document.querySelectorAll('img[gallery="' + gal + '"]')[index];
          var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
          var rect = thumbnail.getBoundingClientRect();
          return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
        },

        shareEl: false,
        zoomEl: true
      };
      var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();
    };
  }
}

/* слайдер цен */

// jQuery("#slider").slider({
//  min: 0,
//  max: 30000,
//  values: [1000,27000],
//  range: true,
//  stop: function(event, ui) {
//    jQuery("input#minCost").val(jQuery("#slider").slider("values",0));
//    jQuery("input#maxCost").val(jQuery("#slider").slider("values",1));

//     },
//     slide: function(event, ui){
//    jQuery("input#minCost").val(jQuery("#slider").slider("values",0));
//    jQuery("input#maxCost").val(jQuery("#slider").slider("values",1));
//     }
// });

// jQuery("input#minCost").change(function(){

//  var value1=jQuery("input#minCost").val();
//  var value2=jQuery("input#maxCost").val();

//     if(parseInt(value1) > parseInt(value2)){
//    value1 = value2;
//    jQuery("input#minCost").val(value1);
//  }
//  jQuery("#slider").slider("values",0,value1);
// });

// jQuery("input#maxCost").change(function(){

//  var value1=jQuery("input#minCost").val();
//  var value2=jQuery("input#maxCost").val();

//  if (value2 > 30000) { value2 = 30000; jQuery("input#maxCost").val(30000)}

//  if(parseInt(value1) > parseInt(value2)){
//    value2 = value1;
//    jQuery("input#maxCost").val(value2);
//  }
//  jQuery("#slider").slider("values",1,value2);
// });

// фильтрация ввода в поля
// jQuery('input').keypress(function(event){
//  var key, keyChar;
//  if(!event) var event = window.event;

//  if (event.keyCode) key = event.keyCode;
//  else if(event.which) key = event.which;

//  if(key==null || key==0 || key==8 || key==13 || key==9 || key==46 || key==37 || key==39 ) return true;
//  keyChar=String.fromCharCode(key);

//  if(!/\d/.test(keyChar)) return false;

// });

//});

$(window).load(function () {

  $('option').mouseover(function () {
    console.log('over');
  });

  $('.sort:first-of-type li:not(:first-of-type)').click(function () {
    $(this).toggleClass('active-sort');
  });
  $('.w30 button.button-add').click(function () {
    $(this).toggleClass('active-ad');
    if ($(this).children().text() == "Добавить в заявку") $(this).children().text("Добавлено");else $(this).children().text("Добавить в заявку");
  });
  $('.sort:last-of-type li:nth-of-type(3)').click(function () {
    $('#liked').addClass('blocks');
    $(this).addClass('active-tab');
    $('.sort:last-of-type li:nth-of-type(2)').removeClass('active-tab');
  });
  $('.sort:last-of-type li:nth-of-type(2)').click(function () {
    $('#liked').removeClass('blocks');
    $(this).addClass('active-tab');
    $('.sort:last-of-type li:nth-of-type(3)').removeClass('active-tab');
  });
  $('.mob-list li').click(function () {
    if ($(this).hasClass('act-filt')) {
      $(this).removeClass('act-filt');
    } else {
      $(this).addClass('act-filt');
    }
  });
  $('.last-btn').click(function () {
    var datatype = $(this).attr('data-type');
    $('.' + datatype).slideToggle();
    //console.log($('[data-type="'+datatype+'"]'));
    $('[data-type="' + datatype + '"]').removeClass('act-filter');
    $('body').removeClass('active');
  });
  $('.sort-filt li:not(:nth-of-type(2))').click(function () {
    var datatype = $(this).attr('data-type');
    $('.' + datatype).slideToggle();
    if ($(this).hasClass('act-filter')) {
      $(this).removeClass('act-filter');
      $('.' + datatype).removeClass('display');
      $('body').removeClass('active');
    } else {
      if ($('.sort-filt li:not(:nth-of-type(2))').hasClass('act-filter')) {
        var notThisType = $('.sort-filt li:not(:nth-of-type(2)).act-filter').attr('data-type');
        if (datatype != notThisType) {
          $('.' + notThisType).removeClass('display').css('display', 'none');
          $('body').removeClass('active');
          $('.sort-filt li:not(:nth-of-type(2))').removeClass('act-filter');
        }
      }
      $(this).addClass('act-filter');
      $('.' + datatype).addClass('display');
      $('body').addClass('active');
    }
    // $('.'+datatype).toggle();
  });
});

//# sourceMappingURL=лучшие-виллы-compiled.js.map

//# sourceMappingURL=лучшие-виллы-compiled.js.map

//# sourceMappingURL=лучшие-виллы-compiled.js.map