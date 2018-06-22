var myApp = angular.module('wangjia',['ngMaterial', 'material.svgAssetsCache']);

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
	this.convertOrder2Wangjia = function (order = new order(),ships = new ships()) {
		return convert_DbData2Wangjia(order, ships);
	}
	this.showAlert = function ($mdDialog, ev, title = "", content = "", ok = "確認") {
		return showAlert($mdDialog, ev, title, content, ok);
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