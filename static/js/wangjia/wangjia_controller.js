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
	$scope.workbook;
	$scope.getSheetName = function(){
		dataParsed = new Array();
		var files = $('#files')[0].files;
		if (files.length > 0){
			for (var i = 0; i < files.length; i++){
				if (files[i].size > 1024 * 1024 * 10){
					alert("資料量過大，請拆成幾個10MB以下的檔案");
					return;	
				}
				if (files[i].type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || files[i].type === "application/vnd.ms-excel" || files[i].type === "text/csv") {
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
		$scope.intOrderPrice = intOrderPrice;
	};


	//驗證與POST request
    $scope.validateNcal = function(rawdata,doSubmit){
		//驗證
		var orderSize = 0;
		var orderPrice = 0;
		for (i = 0; i< rawdata.length; i++){
			if (rawdata[i].driver.length == 0){
				alert('送貨單號： ' + rawdata[i].order_ID+'的司機是空的');
				return false;
				break;
			} else if (rawdata[i].delivery_fee == 0) {
				alert('送貨單號：' + rawdata[i].order_ID + '的運費不正確，請確認內容');
				return false;
				break;
			} else {
				orderSize += rawdata[i].good_size;
				orderPrice += rawdata[i].delivery_fee;
			}
			$scope.intOrderSize = intOrderSize;
			$scope.intOrderPrice = intOrderPrice;
		}

		//資料整理
		var arrFinalData = [];
		rawdata.forEach(function(x,index){
			console.log("calcuating order #"+index+"...");
			var submitOrder;
			var submitShips = [];
			submitOrder = new order();
			submitOrder.order_ID = x.order_ID;
			submitOrder.delivery_date = x.pickupdate;
			submitOrder.clientname = x.clientname;
			submitOrder.good_size = x.good_size;
			submitOrder.delivery_fee = x.delivery_fee;
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

		//送出資料
		$scope.submitForm = function () {
			//POST request
			$("input[type=button]").attr("disabled", "disabled");
			$("input[type=text]").attr("disabled", "disabled");
			$("input[type=select]").attr("disabled", "disabled");
			
			/*
			var SUBMIT_ORDER_API = "https://jt-erp.appspot.com/order";
			var SUBMIT_ORDER_API = "https://ct-erp.appspot.com/order";
			*/
			var SUBMIT_ORDER_API = "http://localhost/order";
			try{
				$http({
					url: SUBMIT_ORDER_API,                         
					method: "POST",
					data: JSON.stringify(arrFinalData),
					headers:{'Content-Type': 'application/json','Access-Control-Allow-Origin': '*' }
				})
				.then(function(response) {
					if (response.status === 200) {
						alert(response.data);
						if (response.data === "新增成功"){
							setTimeout(function(){ location.reload(); }, 500);
						}
					} 
					else {
						throw '系統出現問題，請通知工程師處理 "level:1" \n'+ response.data;
					}
				},
				function errorCallback(response) {
					return alert('系統出現問題，請通知工程師處理 \n'+response.data);
				});
			}
			catch(err){
				return alert(err);
			}
		};
	};
});