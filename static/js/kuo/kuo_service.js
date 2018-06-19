var myApp = angular.module('kuo', []);

myApp.service('myService', function () {
    this.getDataFromDB = function ($http, API, callback) {
        return getDataFromDB($http, API, callback);
    }
});

//依照欄位key篩選data
myApp.filter('unique', function () {
    return function (input, key) {
        var unique = {};
        var uniqueList = [];
        for (var i = 0; i < input.length; i++) {
            if (typeof unique[input[i][key]] == "undefined") {
                unique[input[i][key]] = "";
                uniqueList.push(input[i]);
            }
        }
        return uniqueList;
    };
});

//自動focus到最後一行
myApp.directive('customAutofocus', function () {
    return {
        restrict: 'A',

        link: function (scope, element, attrs) {
            scope.$watch(function () {
                return scope.$eval(attrs.customAutofocus);
            }, function (newValue) {
                if (newValue == true) {
                    element[0].focus();
                }
            });
        }
    };
});

myApp.factory("myFactory", function () {
    var commonData = new Array();
    var initData = new Array();
    var DataTable = false;
    return {
        data: commonData,
        initData: initData,
        show: DataTable
    };
});