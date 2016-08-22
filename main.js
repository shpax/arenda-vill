"use strict";

var app = angular.module('villaApp', ["isteven-multi-select", "ngCookies", "ngRoute", "ngTouch"])
// .run(['$rootScope', function($rootScope){
//   console.log($rootScope);
// }])
  .factory("setCookieFact", ['$rootScope', '$cookies', function ($rootScope, $cookies) {
var favToString;
var iframeArrId = ['balkany-iframe', 'italiya-iframe', 'franciya-iframe', 'kariby-iframe', 'asia-iframe', 'ispaniya-iframe', 'main-iframe'];
var cookieObj = {
  vills: [],
  villUrl: []
},
    inFavourites = false;
cookieObj.getFavouritesVill = function () {
  var favs = [];
  if ($cookies.get("favourite")) {
    // debugger;
    favs = $cookies.get("favourite").split(',');
  }
  return favs;
};

cookieObj.getVills = function () {
  return cookieObj.vills;
};
cookieObj.getVillsUrl = function () {
  return cookieObj.villUrl;
};
cookieObj.addVill = function (villa) {
  cookieObj.vills.push(villa);
};
cookieObj.addVillUrl = function (villa) {
  cookieObj.villUrl.push(villa);
};
cookieObj.clearVills = function () {
  cookieObj.vills = [];
};

var favArr = cookieObj.getFavouritesVill();
cookieObj.favCounter = favArr.length;

cookieObj.setFavouriteVilla = function (val) {
  if (favArr && favArr[0] != "undefined") {
    var add = true;
    // check if id exist
    favArr.forEach(function (item, index) {
      if (item == val) {
        favArr.splice(index, 1);
        add = false;
        inFavourites = false;
      }
    });
    if (add) {
      favArr.push(val);
      inFavourites = true;
    }
    cookieObj.favCounter = favArr.length;

    favToString = favArr.toString();
    createIframes(favToString);
    for (var i = 0; i < iframeArrId.length; i++) {
      (function (param) {
        var iframeId = document.getElementById(param);
        iframeId.onload = function () {
          //console.log("Айфрейм "+param+" загрузился");
          iframeId.remove();
        };
      })(iframeArrId[i]);
    }

    $cookies.put("favourite", favArr.toString());
  } else {
    cookieObj.favCounter = 1;

    favToString = favArr.toString();
    createIframes(favToString);
    for (var i = 0; i < iframeArrId.length; i++) {
      (function (param) {
        var iframeId = document.getElementById(param);
        iframeId.onload = function () {
          //  console.log("Айфрейм "+param+" загрузился");
          iframeId.remove();
        };
      })(iframeArrId[i]);
    }

    $cookies.put("favourite", val);
    inFavourites = true;
  }
  $rootScope.$broadcast('dataPassed');

  return inFavourites;
};
cookieObj.clearFavouriteVilla = function () {
  createIframes('');
  for (var i = 0; i < iframeArrId.length; i++) {
    (function (param) {
      var iframeId = document.getElementById(param);
      iframeId.onload = function () {
        //  console.log("Айфрейм "+param+" загрузился");
        iframeId.remove();
      };
    })(iframeArrId[i]);
  }

  $cookies.put("favourite", '');
  // $cookies.remove("favourite");
  $rootScope.$broadcast('dataPassed');
};
function createIframes(idVillsInString) {

  var iframes = '<iframe style="display:none;" id="balkany-iframe" src="http://www.arenda-vill-balkany.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="italiya-iframe" src="http://www.arenda-vill-italiya.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="franciya-iframe" src="http://www.arenda-vill-franciya.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="kariby-iframe" src="http://www.arenda-vill-kariby.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="asia-iframe" src="http://www.arenda-vill-asia.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="ispaniya-iframe" src="http://www.arenda-vill-ispaniya.com/fav?favourite=' + idVillsInString + '"></iframe><iframe style="display:none;" id="main-iframe" src="http://www.arenda-vill.com/fav?favourite=' + idVillsInString + '"></iframe>';
  document.body.insertAdjacentHTML('beforeEnd', iframes);
}

return cookieObj;
}])
  .factory("SearchPageFact", ['$rootScope', function ($rootScope) {
var searchObj = {};
searchObj.searchValue = '';
searchObj.recreationStyle = [];
searchObj.selectedRegion = '';
searchObj.selectedPopularDirection = '';

searchObj.getSearchValue = function (test) {
  // console.log(test);
  test(this.searchValue);
};

searchObj.setSearchValue = function (value) {
  this.searchValue = value;
  $rootScope.$broadcast('mainPageDataPassed');
};

// console.log(this.searchValue);

return searchObj;
}])
  .service("Database", ["$http", function ($h) {
    localStorage.db = localStorage.db || '{}';
    const db = JSON.parse(localStorage.db);
    this.request = function(req, handler) {

        // uncomment to use LS caching

        // if (db[req]) {
        //     handler(db[req]);
        // } else

        $h.get(req).success(res => {
            db[req] = res;
            handler(db[req]);
            // localStorage.setItem('db', JSON.stringify(db));
        })
    }
  }]);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  // $locationProvider.html5Mode({
  //   enable: true,
  //   requireBase: false
  // })
  // $locationProvider.html5Mode(true);
  // $routeProvider
  //   .when("/",
  //     {
  //       templateUrl : "/",
  //       controller : 'MainPageCtrl'
  //     }
  //   )
  //   .when(
  //     "/search-vill/:search",
  //     {
  //       templateUrl : "/search-vill",
  //       controller : 'VillaSearchCtrl'
  //     }
  //   )
  //   // .when("/search-vill/:search",{
  //   //   templateUrl : "/search-vill.html",
  //   //   controller : 'VillaSearchCtrl'
  //   // })
  //   .otherwise({
  //     redirectTo: '/'
  //   })
}]);

// .directive("loading", function(){
//   return {
//     restrict: 'E',
//     link: function(scope, element, attr) {
//       scope.$watch('loading', function(val){
//         if(val) {
//           // console.log(element);
//           document.getElementById('loader-wrapper').style.display = 'block';
//           console.log("work");
//         } else {
//           console.log("stopped");
//           document.getElementById('loader-wrapper').style.display = 'none';
//         }
//       })
//     },
//     template: '<div id="loader-wrapper"><div id="loader"></div></div>',
//     replace: true
//   }
// });

var foo = 'foo';
// code for html
$(document).ready(function () {

  var globus = $('.breadcrumb > li:first-child img');
  if (globus.attr('src') == '/files/villa/globus.png') {

    globus.mouseover(function () {
      globus.attr('src', '/files/villa/globus_hover.png');
    });
    globus.mouseleave(function () {
      globus.attr('src', '/files/villa/globus.png');
    });
  }

  if (globus.attr('src') == '/files/villa/globus-white.png') {

    globus.mouseover(function () {
      globus.attr('src', '/files/villa/globus_hover.png');
    });
    globus.mouseleave(function () {
      globus.attr('src', '/files/villa/globus-white.png');
    });
  }
});

window.addEventListener('load', function () {

  var visibleHeight = document.documentElement.clientHeight,
      visibleWidth = document.documentElement.clientWidth;
  if (visibleWidth > 768) {
    if (document.getElementById('head')) {
      var block = $('#head .block-info').height();
      $('#head .block-info').css('padding-top', (visibleHeight - block) / 2.5 + 'px');
      document.getElementById('head').style.height = visibleHeight - 76 + 'px';
      try {
        document.getElementById('slideshow-ken-burns').style.height = visibleHeight - 76 + 'px';
      } catch (e) {}
    }
  }
  showContent();

  window.addEventListener('sroll', function () {
    showContent();
  });

  $(function () {
    $('a[href*=#]:not([href=#])').click(function () {
      if ( /*location.pathname.replace(/^\/,'') == this.pathname.replace(/^\/,'') && */location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        if (target.length) {
          $('html,body').animate({
            scrollTop: target.offset().top - 76 + 'px'
          }, 700);
          return false;
        }
      }
    });
  });
});

function showContent() {
  var t = $(window).height() * 0.6 + $(window).scrollTop(),
      nor = document.querySelectorAll('.normal'),
      topp = 0;

  for (var i = 0; i < nor.length; i++) {
    topp = getOffsetTop(nor[i]);
    //alert(top);
    if (topp <= t) {
      nor[i].classList.remove('animateDownOpacity');
      nor[i].classList.remove('animateLeftOpacity');
      nor[i].classList.remove('animateRightOpacity');
    }
  }
}

function getOffsetTop(elem) {
  var top = 0,
      left = 0;

  while (elem) {
    top = top + parseFloat(elem.offsetTop);
    left = left + parseFloat(elem.offsetLeft);
    elem = elem.offsetParent;
  }
  return Math.round(top);
}

// createIframe("testiframe", "http://www.arenda-vill-kariby.com/fav?villa_id=111113");
//  var iframe = document.getElementById('testiframe');
//  iframe.onload = function(){
//      console.log("Айфрейм загрузился");
//      iframe.remove();
/*  };*/

//# sourceMappingURL=main-compiled.js.map

//# sourceMappingURL=main-compiled.js.map

//# sourceMappingURL=main-compiled.js.map

//# sourceMappingURL=main-compiled.js.map