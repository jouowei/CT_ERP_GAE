//MVC的C
myApp.controller('formCtrl', function ($scope, $http, $mdDialog, myService) {
	$scope.drivers = drivers;
	$scope.orders = [];
	$scope.sheetsList = [];
	$scope.workbook;
	$scope.dieselPriceToday = "";
	$scope.show = { TabPicker: false, DataTable: false, SubmitBtn: false};
	$scope.getSheetName = function () {
		$scope.oilInfo = myService.getDieselDiscount($http, document.location.origin + "/diselprice");
		$scope.show.SubmitBtn = false;
		$scope.show.DataTable = false;
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
	$scope.parseFiles = function (sheetName, ev) {
		if(typeof $scope.oilInfo == "undefined"){
			$scope.oilInfo = myService.getDieselDiscount($http, document.location.origin + "/diselprice");
		} 
		$scope.show.SubmitBtn = false;
		$scope.show.DataTable = false;
		unparsedData = $scope.workbook.Sheets[sheetName];
		if (typeof XLSX.utils.sheet_to_json(unparsedData, {header: 1})[1] == "undefined") {
			myService.showAlert($mdDialog, ev, "請檢查內容", "資料表"+ sheetName +"為空");
		} else {
			showPleaseWait("請稍候...");
			//將資料轉為wangjia格式
			$scope.wangjias = myService.cleanData(unparsedData);
			//計算總運費&總材積數，儲存初始值			
			//把初始運費先倒到 delivery_fee_before_discount
			let orderPrice = 0;
			let orderSize = 0;
			if ($scope.wangjias.length > 0){
				for (i = 0; i < $scope.wangjias.length; i++) {
					/*
					delivery_fee_before_discount -> 最初的油價係數 * 最初算出來的運費
					delivery_fee -> 手動修改油價係數，調整後的運費 (一開始兩者相同)
					*/
					$scope.oilInfo.rate = $scope.oilInfo.initRate;
					let initFee = parseInt(parseFloat($scope.wangjias[i].delivery_fee) * parseFloat($scope.oilInfo.initRate));
					$scope.wangjias[i].delivery_fee_before_discount = initFee;
					$scope.wangjias[i].delivery_fee = initFee;
					orderSize += parseFloat($scope.wangjias[i].good_size);
					orderPrice += parseFloat($scope.wangjias[i].delivery_fee);
				};
				$scope.show.DataTable = true;
				$scope.orderSize = parseInt(orderSize);	//整張表的總材積數
				$scope.orderPrice = parseInt(orderPrice); //整張表的總額
				$scope.before_intOrderPrice = orderPrice; //初始運費總額
			} else {
				myService.showAlert($mdDialog, ev, "資料錯誤", "格式不正確或檔案為空");
			}
			hidePleaseWait();
		}
	};

    //輸入材積數後的運費計算 (目前因為各種設定價格無差異，先使用"高雄市""乾貨""其他通路"的價格設定)
    $scope.updatePrice = function (index) {
		$scope.wangjias[index].delivery_fee = myService.calTotalPrice($scope.wangjias[index].good_size,"return","","");
    };

	//資料驗證
    $scope.validateNcal = function(ev) {
		let rawdata = $scope.wangjias;
		let orderSize = 0;
		let orderPrice = 0;
		const currentOrderPrice = $scope.orderPrice; //目前運費總額
		const currentOrderSize = $scope.orderSize; //目前材積數總額
		const currentOilRate = $scope.oilInfo.rate; //目前油價係數
		for (let i = 0; i < rawdata.length; i++) {
			const ship = rawdata[i];
			if (ship.driver.length == 0) {
				myService.showAlert($mdDialog, ev, "第" + (i+1) + "行錯誤", "請選擇配送司機");
				$scope.oilInfo.rate = $scope.oilInfo.initRate;
				$scope.orderPrice = currentOrderPrice;
				$scope.show.SubmitBtn = false;
				break;
			} else if (ship.delivery_fee == 0) {
				let confirmAns = confirm("第" + (i + 1) + "行運費為0，請確認是否正確");
				if (!confirmAns) {
					$scope.oilInfo.rate = $scope.oilInfo.initRate;
					$scope.orderPrice = currentOrderPrice;
					$scope.show.SubmitBtn = false;
					break;
				}
			} else if (ship.good_size > ship.delivery_fee) {
				myService.showAlert($mdDialog, ev, "第" + (i + 1) + "行錯誤", "運費低於材積數，請確認內容");
				$scope.oilInfo.rate = $scope.oilInfo.initRate;
				$scope.orderPrice = currentOrderPrice;
				$scope.show.SubmitBtn = false;
				break;
			}
			if(ship.data_type == "銷貨"){
				//重新計算運費(原始運費 / 原始油價係數 * 新油價係數)
				ship.delivery_fee = parseFloat(ship.delivery_fee_before_discount) / parseFloat($scope.oilInfo.initRate) * parseFloat($scope.oilInfo.rate);
			} else if (ship.data_type == "退貨"){
				ship.delivery_fee = parseFloat(ship.delivery_fee) / parseFloat($scope.oilInfo.initRate) * parseFloat($scope.oilInfo.rate);
			}
			//調整後的total運費
			orderPrice += parseInt(ship.delivery_fee); 
			orderSize += parseInt(ship.good_size); 
			$scope.show.SubmitBtn = true;
		}
		if ($scope.show.SubmitBtn) {
			if (parseInt(orderSize) != currentOrderSize) {
				let confirmAns = confirm("請確認總材積數：\n 調整前：" + currentOrderSize +
					"\n 調整後：" + parseInt(orderSize));
				if (confirmAns) {
					$scope.orderSize = parseInt(orderSize);
				} else {
					$scope.orderPrice = currentOrderPrice;
					$scope.show.SubmitBtn = false;
				}
			};
			if (parseInt(orderPrice) != currentOrderPrice) {
				let confirmAns = confirm("請確認總運費金額： \n 調整前：" + currentOrderPrice +
					"\n 調整後：" + parseInt(orderPrice));
				if (confirmAns) {
					$scope.orderPrice = parseInt(orderPrice);
					return;
				} else {
					$scope.orderPrice = currentOrderPrice;
					$scope.show.SubmitBtn = false;
					return;
				}
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
			submitOrder.delivery_date = x.shipdate;
			submitOrder.clientname = x.clientname;
			submitOrder.good_size = x.good_size;
			submitOrder.delivery_fee = x.delivery_fee;
			submitOrder.delivery_fee_before_discount = x.delivery_fee_before_discount;
			submitOrder.comment = x.comment;
			for (i = 0; i < x.driver.length; i++) {
				let submitShip = new ship();
				submitShip.ship_driver = x.driver[i];
				submitShip.ship_ID = x.ship_ID.toString();
				submitShip.ship_datetime = x.shipdate;
				submitShip.ship_area = x.ship_area;
				submitShip.ship_district = x.ship_district;
				submitShip.contact_info = x.contact_info;
				submitShips.push(submitShip);
			}
			submitOrder.ships = submitShips;
			arrFinalData.push(submitOrder);
		});
		if ($scope.show.SubmitBtn){
			//POST request
			disableUI(true);
			showPleaseWait("請稍候...");
            var SUBMIT_ORDER_API = document.location.origin +"/order";
			try {
				$http
					.post(SUBMIT_ORDER_API, JSON.stringify(arrFinalData))
					.then(function (response) {
							if (response.status === 200) {
								hidePleaseWait();
								alert(response.data);
								setTimeout(function () {
									location.reload();
								}, 100);
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