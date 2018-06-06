var myApp = angular.module('wangjia_form',[]);

//MVC的M
myApp.service('myService', function() {
	this.cleanData = function (dataParsed) {
		return orderBuilder(dataParsed);
	}
	this.buildConfig = function(){
		return configBuilder();
	}
});

//MVC的C
myApp.controller('formCtrl', function($scope,$http,myService) {
	$scope.drivers = drivers;
	$scope.orders = [];
	$scope.sheetsList = [];
	$scope.showTabPicker = false;
	$scope.showTable = false;
	$scope.showSubmitBtn= false;
	$scope.workbook;
	$scope.discountRate = "";
	$scope.dieselPriceToday = "";
	$scope.getDieselDiscount = function(){
		var getOilPriceInJson_API = "http://localhost/diselprice";
		$http({
			method: 'GET',
			url: getOilPriceInJson_API
		})
		.then(function (response) {
			if (response.status === 200) {
				$scope.dieselPriceToday = parseInt(response.data);
				for (i = 0; i < wangjia_dieselDiscount.length; i++) {
					if (wangjia_dieselDiscount[i].maxDieselPrice >= parseInt(response.data)) {
							$scope.discountRate = wangjia_dieselDiscount[i].discount;
							return;
					    }
					}
			} else {
				throw '油價資料來源出錯 \n' + response.data;
			}
		},
		function errorCallback(response) {
			alert('油價伺服器錯誤 \n' + response.data);
		});
	}

	$scope.getSheetName = function(){
		dataParsed = new Array();
		var files = $('#files')[0].files;
		if (files.length > 0){
			for (var i = 0; i < files.length; i++){
				if (files[i].size > 1024 * 1024 * 10){
					alert("資料量過大，請拆成幾個10MB以下的檔案");
					return;	
				}
				if (files[i].type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
				|| files[i].type === "application/vnd.ms-excel" 
				|| files[i].type === "text/csv") {
					//xlsx
					var reader = new FileReader();
					reader.onload = function (evt) {
						var data = evt.target.result;
						$scope.workbook = XLSX.read(data, {type: 'binary'});
						$scope.sheetsList = $scope.workbook.SheetNames;
						if ($scope.sheetsList.length > 0) {
							$scope.showTabPicker = true;
						}
					}
					reader.readAsBinaryString(files[i]);
				} else {
					alert("檔案：'" + files[i].name + "'的資料格式不正確，請另存為xlsx檔案後再試");
					return;
				};
			};
		};
	};
	$scope.parseFiles = function (sheetName) { //指定sheetname
		var headerNames = XLSX.utils.sheet_to_json($scope.workbook.Sheets[sheetName], {
			header: 1
		})[1];
		var dataParsed = XLSX.utils.sheet_to_json($scope.workbook.Sheets[sheetName], {
			header: headerNames
		});
		//移除標頭
		dataParsed.splice(0, 2);
		$scope.wangjias = myService.cleanData(dataParsed);
		$scope.showTable = true;
		$scope.intOrderSize = intOrderSize;
		$scope.before_intOrderPrice = intOrderPrice;
		$scope.after_intOrderPrice = $scope.before_intOrderPrice * parseFloat($scope.discountRate);
	};


	//驗證
    $scope.validateNcal = function(rawdata){
		var orderSize = 0;
		var orderPrice = 0;
		for (i = 0; i< rawdata.length; i++){
			if (rawdata[i].driver.length == 0){
				alert('送貨單號： ' + rawdata[i].order_ID+'的司機是空的');
				$scope.showSubmitBtn = false;
				break;
			} else if (rawdata[i].delivery_fee == 0) {
				alert('送貨單號：' + rawdata[i].order_ID + '的運費不正確，請確認內容');
				$scope.showSubmitBtn = false;
				break;
			} else if (rawdata[i].good_size > rawdata[i].delivery_fee){
				alert('送貨單號：' + rawdata[i].order_ID + '的運費低於材積數，請確認內容');
				$scope.showSubmitBtn = false;
				break;
			} else {
				orderSize += rawdata[i].good_size;
				orderPrice += rawdata[i].delivery_fee;
				$scope.showSubmitBtn = true;
			}
			$scope.intOrderSize = intOrderSize;
			$scope.before_intOrderPrice = intOrderPrice;
			$scope.after_intOrderPrice = $scope.before_intOrderPrice * parseFloat($scope.discountRate);
		}
		if ($scope.showSubmitBtn){
			//重新計算運費
			//1.重新計算所有order的運費
			const typed_discountRate = $('#diesel_discount').val();
			//1.1 先檢查各車次(order)的運費是否正確
			let typed_deliveryFee = 0; 
			for(i = 0; i < rawdata.length; i++){
				typed_deliveryFee += parseFloat(rawdata[i].delivery_fee);
			}
			//1.2 算出所有order的運費總額
			const typed_after_fee = parseInt(parseFloat(typed_discountRate) * parseInt(typed_deliveryFee));
			
			if (typed_after_fee != $scope.after_intOrderPrice) {
				let confirmAns = confirm("請確認是否更改油價係數： \n 調整前：" + $scope.after_intOrderPrice 
					+"\n 調整後：" + typed_after_fee);
				if (confirmAns){
					$scope.after_intOrderPrice = typed_after_fee;
					$scope.discountRate = typed_discountRate;
					$scope.showSubmitBtn = true;
				} else {
					$('#diesel_discount').val($scope.discountRate);
					$('#total_delivery_fee').val($scope.after_intOrderPrice);
					$scope.showSubmitBtn = false;
				}
			} else {
				$scope.showSubmitBtn = true;
			}
		};
	}; 
	
	//送出資料
	$scope.submitForm = function (rawdata) {
		//資料整理
		var arrFinalData = [];
		rawdata.forEach(function (x, index) {
			console.log("calcuating order #" + index + "...");
			var submitOrder;
			var submitShips = [];
			submitOrder = new order();
			submitOrder.order_ID = x.order_ID;
			submitOrder.delivery_date = x.pickupdate;
			submitOrder.clientname = x.clientname;
			submitOrder.good_size = x.good_size;
			submitOrder.delivery_fee = x.after_intOrderPrice;
			submitOrder.delivery_fee_before_discount = x.before_intOrderPrice;
			submitOrder.comment = x.comment;
			var submitShip = new ship();
			submitShip.ship_driver = x.driver;
			submitShip.ship_ID = x.ship_ID.toString();
			submitShip.ship_datetime = x.shipdate;
			submitShip.ship_area = x.ship_area;
			submitShip.ship_district = x.ship_district;
			submitShip.contact_info = x.contact_info;
			submitShips.push(submitShip);
			submitOrder.ships = submitShips;
			arrFinalData.push(submitOrder);
		});

		//POST request
		$("input[type=button]").attr("disabled", "disabled");
		$("input[type=text]").attr("disabled", "disabled");
		$("input[type=select]").attr("disabled", "disabled");

		/*
		var SUBMIT_ORDER_API = "https://jt-erp.appspot.com/order";
		var SUBMIT_ORDER_API = "https://ct-erp.appspot.com/order";
		*/
		var SUBMIT_ORDER_API = "http://localhost/order";
		try {
			$http
				.post(SUBMIT_ORDER_API, JSON.stringify(arrFinalData))
				.then(function (response) {
						if (response.status === 200) {
							alert(response.data);
							if (response.data === "新增成功") {
								setTimeout(function () {
									location.reload();
								}, 500);
							}
						} else {
							throw '系統出現問題，請通知工程師處理 "level:1" \n' + response.data;
						}
					},
					function errorCallback(response) {
						return alert('系統出現問題，請通知工程師處理 \n' + response.data);
					});
		} catch (err) {
			return alert(err);
		}
	};
});