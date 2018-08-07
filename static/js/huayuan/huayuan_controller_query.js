//MVC的C
myApp.controller('queryForm', function ($scope, $http, $mdDialog, myService, myFactory) {
    var result = function(){
        this.order = new order();
        this.ships = new Array();
    }
    $scope.viewDatas = new Array();
    $scope.query = function () {
        this.shipDate = "",
        this.orderID = ""
    };
    $scope.queryData = function (ev) {
        let delivery_API = document.location.origin + "/delivery/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        let ship_API = document.location.origin + "/shippment/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        var rawdata = new viewData();
        $scope.viewDatas = new Array();
        showPleaseWait("請稍候...");
        myService.getDataFromDB($http, delivery_API,function(response) {
            result.order = response;
            if (JSON.stringify(result.order) == "{}") {
                myService.showAlert($mdDialog, ev, "查詢不到資料", '請檢查"配送日期"與"單號"');
            } else {
                rawdata.order_ID = result.order.order_ID;
                rawdata.clientname = result.order.clientname;
                rawdata.delivery_date = result.order.delivery_date;
                rawdata.delivery_fee = Math.round(result.order.delivery_fee);
                rawdata.shipUnits = result.order.ship_units;
                rawdata.comment = result.order.comment;
                rawdata.initOrder = {
                    order_ID: result.order.order_ID,
                    ship_ID: result.order.ship_ID,
                    delivery_fee: Math.round(result.order.delivery_fee),
                    shipUnits: result.order.ship_units,
                    comment: result.order.comment
                }
                myService.getDataFromDB($http, ship_API, function (response) {
                    result.ships = response;
                    if (result.ships.length > 0) {
                        let drivers = new Array();
                        for(i=0;i<result.ships.length;i++){
                            drivers.push(result.ships[i].driver);
                            rawdata.ship_ID = result.ships[i].ship_ID;
                        }
                        rawdata.driver = drivers;
                        $scope.viewDatas.push(rawdata);
                        myFactory.data = $scope.viewDatas;
                        myFactory.show = true;
                    } else {
                        myService.showAlert($mdDialog, ev, "查詢不到資料", '請檢查"配送日期"與"單號"');
                    }
                });
            }
        });
        hidePleaseWait();
        disableUI(false);
    }
    
});

myApp.controller('resultForm', function ($scope, $http, $mdDialog, myService, myFactory) {
    $scope.viewDatas = myFactory;
    $scope.show = {
        SubmitBtn: false
    }
    $scope.orderPrice = 0;

    //輸入材積數後的運費計算 (目前為單一價格)
    $scope.updatePrice = function (index) {
        $scope.viewDatas.data[index].delivery_fee = myService.calTotalPrice($scope.viewDatas.data[index].shipUnits);
    };
    //資料驗證
    $scope.validateNcal = function (rawdata, ev) {
        $scope.orderPrice = 0;
        let boolPass = true;
        for (i = 0; i < rawdata.length; i++) {
            let editedShip = rawdata[i];
            if (editedShip.delivery_fee <= 0) {
				myService.showAlert($mdDialog, ev, "第" + (i+1) + "行錯誤", "運費不得為0");
                $scope.show.SubmitBtn = false;
                disableUI(false);
                boolPass = false
                break;
            } else if (parseInt(editedShip.shipUnits) > parseInt(editedShip.delivery_fee)) {
				myService.showAlert($mdDialog, ev, "第" + (i+1) + "行錯誤", "運費低於件數");
                $scope.show.SubmitBtn = false;
                disableUI(false);
                boolPass = false
                break;
            } else if (editedShip.comment.length == 0 ) {
                myService.showAlert($mdDialog, ev, "注意", '修改紀錄必須填寫備註。');
                $scope.show.SubmitBtn = false;
                disableUI(false);
                boolPass = false
                break;
            }
            $scope.show.SubmitBtn = true;
            disableUI(true);
        }
        if (!boolPass) {
            return boolPass;
        }
        if ($scope.show.SubmitBtn) {
            for (let j = 0; j < $scope.viewDatas.data.length; j++) {
                let editedShip = rawdata[j];
                const initShip = $scope.viewDatas.data[j].initOrder;
                if(initShip.order_ID == editedShip.order_ID){
                    if (initShip.shipUnits != editedShip.shipUnits) {
                        let confirmAns = confirm("請確認件數： \n 調整前：" + initShip.shipUnits +
                            "\n 調整後：" +editedShip.shipUnits);
                        if (!confirmAns) {
                            editedShip.shipUnits = initShip.shipUnits;
                            $scope.show.SubmitBtn = false;
                            disableUI(false);
                            boolPass = false
                            break;
                        }
                    }
                    if (initShip.comment == editedShip.comment) {
                        myService.showAlert($mdDialog, ev, "注意", '修改紀錄必須填寫備註。');
                        $scope.show.SubmitBtn = false;
                        disableUI(false);
                        boolPass = false
                        break;
                    }
                }
            }
            if (!boolPass) {
                return boolPass;
            }
        };
    };

    //送出資料
    $scope.submitForm = function (ev) {
        if (!$("input[type=button]")[0].disabled){
            if(!$scope.validateNcal($scope.viewDatas.data, ev)){
                return;
            }
        }
        //資料整理
        var arrFinalData = [];
        $scope.viewDatas.data.forEach(function (x, index) {
            console.log("calcuating order #" + index + "...");
            x.updateduser = userID;
            arrFinalData.push(x);
        });
        //POST request
        if ($scope.show.SubmitBtn) {
            showPleaseWait("請稍候...");
            for (let i = 0; i < arrFinalData.length; i++) {
                const order = arrFinalData[i];
                var SUBMIT_ORDER_API = document.location.origin + "/delivery/" + order.order_ID;

                try {
                    $http
                        .post(SUBMIT_ORDER_API, JSON.stringify(order))
                        .then(function (response) {
                                if (response.status === 200) {
                                    alert(response.data);
                                    if (response.data === "資料更新成功") {
                                        hidePleaseWait();
                                        setTimeout(function () {
                                            location.reload();
                                        }, 100);
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
            }
        };
    };
});
