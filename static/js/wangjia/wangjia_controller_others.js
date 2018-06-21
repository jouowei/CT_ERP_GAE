myApp.controller('inputForm', function ($scope, $http, $mdDialog) {
    //旺家其他收入
    var wangjia_other = function () {
        this.order_ID = ""; //交貨單號 (日期四碼+"-"+亂數10碼)
        this.ships = []; //銷售單/調撥單號 
        this.delivery_date = ""; //開單日期
        this.clientname = "旺家"; //客戶名稱
        this.business_type = "旺家"
        this.delivery_fee = ''; //運費
        this.comment = ""; //備註
        this.updateduser = userID; 
    };

    var ship_other = function () {
        this.ship_ID = ''; //order_ID+流水號
        this.ship_driver = ''; //司機姓名
        this.ship_deleted = ''; //此單狀態 (''=正常,'1'=刪除)
        this.ship_datetime = ''; //出貨日期 (送到客戶端)
        this.contact_info = ''; //客戶連絡電話 or 地址
        this.shipUnits = 0; //數量
        this.itemName = ""; //物料品名
        this.unitprice = ""; //單價
        this.amount_collect = ""; //未稅價 (單價*數量)
        this.comment = ""; //備註
    };

    $scope.show = {
        SubmitBtn: false
    }
    $scope.order = new wangjia_other();
    $scope.order.ships = new Array();
    $scope.order.ships.push(new ship_other());
    $scope.items = manualItems;
    //新增一筆送貨單
    $scope.addNewShip = function () {
        $scope.order.ships.push(new ship_other());
        $scope.focusIndex = $scope.order.ships.length - 1;
        $scope.order.ships.forEach(function (x, index) {
            if (x.ship_deleted === "1") {
                $scope.focusIndex = $scope.focusIndex - 1;
            }
        });
    };
    //刪除一筆送貨單
    $scope.deleteShip = function (ship) {
        ship.ship_deleted = "1";
        $scope.focusIndex = $scope.order.ships.length;
    };
    //只顯示ship_deleted=0的單子
    $scope.customFilter = function (obj) {
        if (obj.ship_deleted.length == 0) {
            return obj;
        }
    };
    //根據品項找到對應的單價
    $scope.updateUnitP = function (selectedValue,index) {
        $scope.items.forEach(function (x) {
            if (x == selectedValue) {
                $scope.order.ships[index].unitprice = x.unitprice;
                $scope.updatePrice(index);
            }
        });
    };
    //根據品項找到對應的單價
    $scope.updatePrice = function (index) {
        $scope.order.ships[index].amount_collect = $scope.order.ships[index].unitprice * $scope.order.ships[index].shipUnits;
    };
     //驗證資料 & 計算價格
    $scope.validateNcal = function(ev){
        $scope.order.delivery_fee = 0;
        let index = 1;
        if ($scope.order.order_ID == null || $scope.order.order_ID.length == 0) {
            $scope.order.order_ID = "other" + "_" + randomWord(6);
        }
        for (i = 0; i < $scope.order.ships.length; i++) {
            let x = $scope.order.ships[i];
            if(x.ship_deleted == "1"){
                continue;
            }
            else{
                if (x.ship_datetime == null || x.ship_datetime.length == 0) {
                    $scope.showAlert(ev, "第" + index + "行錯誤", "請填入正確日期");
                    $scope.show.SubmitBtn = false;
                    break;
                } else if(x.contact_info == null || x.contact_info.length == 0) {
                    $scope.showAlert(ev, "第" + index + "行錯誤", "請填寫客戶名稱");
                    $scope.show.SubmitBtn = false;
                    break;
                } else if (x.amount_collect == null || x.amount_collect.length == 0 || x.amount_collect == 0) {
                    $scope.showAlert(ev, "第" + index + "行價格錯誤", "單價如果為0，請通知工程師修改");
                    $scope.show.SubmitBtn = false;
                    break;
                } else if(x.comment == null || x.comment.length == 0) {
                    $scope.showAlert(ev, "第" + index + "行備註為空", "特殊收入需填寫備註");
                    $scope.show.SubmitBtn = false;
                    break;
                } else if (x.ship_ID == null || x.ship_ID.length == 0 || x.ship_ID.length != 14) {
                    if (index.toString().length < 2) {
                        x.ship_ID = moment(x.ship_datetime).format('MMDD') + "_" + $scope.order.order_ID.slice(-6) + "_0" + index.toString();
                    } else if (index.toString().length == 2) {
                        x.ship_ID = moment(x.ship_datetime).format('MMDD') + "_" + $scope.order.order_ID.slice(-6) + "_" + index.toString();
                    }
                } else {
                    $scope.order.delivery_fee = $scope.order.delivery_fee + x.amount_collect;
                    $scope.show.SubmitBtn = true;
                }
                index = index + 1;
           }
        }
    };
    //Modal版錯誤視窗
    $scope.showAlert = function (ev, title="", content="", ok = "確認") {
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.body))
                .clickOutsideToClose(true)
                .title(title)
                .textContent(content)
                .ok(ok)
                .targetEvent(ev)
        );
    };

	//送出資料
	$scope.submitForm = function (ev) {
		//資料整理
		var submitOrder = new wangjia_other();
        var submitShips = [];
        const order = $scope.order;
		submitOrder = order;
		submitOrder.updateduser = userID;
        for (i = 0; i < order.ships.length; i++) {
            const ship = order.ships[i];
            if (ship.ship_deleted !== "1") {
                let submitShip = new ship_other();
                submitShip = ship;
                submitShip.ship_driver = "旺家-庫房";
                submitShip.ship_datetime = moment(ship.ship_datetime).format('YYYY-MM-DD');
                submitShips.push(submitShip);
            }
        }
		submitOrder.ships = submitShips;
		if ($scope.show.SubmitBtn){
			//POST request
			disableUI(true);
			showPleaseWait("請稍候，資料儲存中...");
            var SUBMIT_ORDER_API = document.location.origin +"/order";
			try {
				$http
					.post(SUBMIT_ORDER_API, JSON.stringify(submitOrder))
					.then(function (response) {
							if (response.status === 200) {
								hidePleaseWait();
								$scope.showAlert(ev, response.data);
								setTimeout(function () {
									location.reload();
								}, 100);
							} else {
							    $scope.showAlert(ev, response.data);
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

