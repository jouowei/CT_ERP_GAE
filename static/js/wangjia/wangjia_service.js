var myApp = angular.module('wangjia',[]);

//MVC的M
myApp.service('myService', function() {

	this.cleanData = function(dataParsed) {
		return orderBuilder(dataParsed);
	}
	this.buildConfig = function(){
		return configBuilder();
	}
	this.getDieselDiscount = function ($http,API) {
		return getDieselDiscount($http, API);
	}
	this.getDataFromDB = function ($http, API, callback) {
		return getDataFromDB($http, API, callback);
	}
	this.convertOrder2Wangjia = function (order,ships) {
		return convert_DbData2Wangjia(order, ships);
	}
});

myApp.factory("myFactory", function () {
  	var commonData = new Array();
  	return {
  		data: commonData
  	};
});