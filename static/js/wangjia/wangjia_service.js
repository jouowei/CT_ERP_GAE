var myApp = angular.module('wangjia',['ngMaterial', 'material.svgAssetsCache']);

//MVC的M
myApp.service('myService', function() {

	this.cleanData = function(unparsedData) {
		return orderBuilder(unparsedData);
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
	this.showAlert = function ($mdDialog, ev, title = "", content = "", ok = "確認") {
		return showAlert($mdDialog, ev, title, content, ok);
	}
	this.calTotalPrice = function(unit, clientType, cargo, area) {
		return calTotalPrice(unit, clientType, cargo, area);
	}
});

myApp.factory("myFactory", function () {
  	var commonData = new Array();
  	var DataTable = false;
  	return {
		data: commonData,
		show: DataTable
  	};
});