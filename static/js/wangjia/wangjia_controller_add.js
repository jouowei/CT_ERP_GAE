//MVC的C
myApp.controller('formCtrl', function($scope,$http,myService) {
	$scope.drivers = drivers;
	$scope.orders = [];
	$scope.sheetsList = [];
	$scope.workbook;
	$scope.dieselPriceToday = "";
	$scope.show = { TabPicker: false, DataTable: false, SubmitBtn: false };
	$scope.getSheetName = function () {
		$scope.oilInfo = myService.getDieselDiscount($http, document.location.origin + "/diselprice");
		$scope.show.SubmitBtn = false;
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
							$scope.show.TabPicker = true;
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

	//傳入sheetname後將資料帶出
	$scope.parseFiles = function (sheetName) { 
		var headerNames = XLSX.utils.sheet_to_json($scope.workbook.Sheets[sheetName], {
			header: 1
		})[1];
		var dataParsed = XLSX.utils.sheet_to_json($scope.workbook.Sheets[sheetName], {
			header: headerNames
		});
		//移除標頭
		dataParsed.splice(0, 2);
		$scope.wangjias = myService.cleanData(dataParsed);
		//把初始運費先倒到 delivery_fee_before_discount
		let orderPrice = 0;
		for (i = 0; i < $scope.wangjias.length; i++) {
			/*
			delivery_fee_before_discount -> 最初的油價係數 * 最初算出來的運費
			delivery_fee -> 手動修改油價係數，調整後的運費 (一開始兩者相同)
			*/
			let initFee = parseInt(parseInt($scope.wangjias[i].delivery_fee) * parseFloat($scope.oilInfo.initRate));
			$scope.wangjias[i].delivery_fee_before_discount = initFee;
			$scope.wangjias[i].delivery_fee = initFee;
			orderSize += parseFloat($scope.wangjias[i].good_size);
			orderPrice += parseInt($scope.wangjias[i].delivery_fee);
		};
		$scope.show.DataTable = true;
		$scope.orderSize = orderSize;	//整張表的總材積數
		$scope.orderPrice = orderPrice; //整張表的總額
		$scope.before_intOrderPrice = orderPrice; //初始運費總額
	};

	//資料驗證
    $scope.validateNcal = function(rawdata){
		let orderSize = 0;
		let orderPrice = 0;
		let currentOrderPrice = $scope.orderPrice; //目前運費總額
		for (i = 0; i< rawdata.length; i++){
			if (rawdata[i].driver.length == 0){
				alert('送貨單號： ' + rawdata[i].order_ID + '的司機是空的');
				$scope.oilInfo.rate = $scope.oilInfo.initRate;
				$scope.show.SubmitBtn = false;
				break;
			} else if (rawdata[i].delivery_fee == 0) {
				alert('送貨單號：' + rawdata[i].order_ID + '的運費不正確，請確認內容');
				$scope.oilInfo.rate = $scope.oilInfo.initRate;
				$scope.show.SubmitBtn = false;
				break;
			} else if (rawdata[i].good_size > rawdata[i].delivery_fee){
				alert('送貨單號：' + rawdata[i].order_ID + '的運費低於材積數，請確認內容');
				$scope.oilInfo.rate = $scope.oilInfo.initRate;
				$scope.show.SubmitBtn = false;
				break;
			}
			//重新計算運費(原始運費 / 原始油價係數 * 新油價係數)
			rawdata[i].delivery_fee = parseInt(rawdata[i].delivery_fee_before_discount) / parseFloat($scope.oilInfo.initRate) * parseFloat($scope.oilInfo.rate);
			//調整後的total運費
			orderPrice += parseInt(rawdata[i].delivery_fee); 
			$scope.show.SubmitBtn = true;
		}
		$scope.orderPrice = orderPrice;
		if ($scope.show.SubmitBtn){
			if ($scope.orderPrice != currentOrderPrice) {
				let confirmAns = confirm("請確認是否更改運費： \n 調整前：" + currentOrderPrice +
					"\n 調整後：" + orderPrice);
				if (confirmAns) {
					$scope.show.SubmitBtn = true;
					return;
				} else {
					$scope.show.SubmitBtn = false;
					return;
				}
			} else {
				$scope.show.SubmitBtn = true;
				return;
			};
		};
	}; 
	
	//送出資料
	$scope.submitForm = function () {
		//資料整理
		var arrFinalData = [];
		$scope.wangjias.forEach(function (x, index) {
			console.log("calcuating order #" + index + "...");
			var submitOrder;
			var submitShips = [];
			submitOrder = new order();
			submitOrder.updateduser = userID;
			submitOrder.order_ID = x.order_ID;
			submitOrder.delivery_date = x.pickupdate;
			submitOrder.clientname = x.clientname;
			submitOrder.good_size = x.good_size;
			submitOrder.delivery_fee = x.delivery_fee;
			submitOrder.delivery_fee_before_discount = x.delivery_fee_before_discount;
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
		if ($scope.show.SubmitBtn){
			//POST request
			$("input[type=button]").attr("disabled", "disabled");
			$("input[type=text]").attr("disabled", "disabled");
			$("input[type=select]").attr("disabled", "disabled");

			//var SUBMIT_ORDER_API = "https://jt-erp.appspot.com/order";
			//var SUBMIT_ORDER_API = "https://ct-erp.appspot.com/order";
            //var SUBMIT_ORDER_API = "http://localhost/order";
            var SUBMIT_ORDER_API = document.location.origin +"/order";
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
	};
});