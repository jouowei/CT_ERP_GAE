//MVC的C
myApp.controller('queryForm', function ($scope, $http, $mdDialog, myService, myFactory) {
    var result = function(){
        this.order = new order();
        this.ships = new Array();
    }
    $scope.wangjias = new Array();
    $scope.query = function () {
        this.shipDate = "",
        this.orderID = ""
    };
    $scope.queryData = function (ev) {
        let delivery_API = document.location.origin + "/delivery/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        let ship_API = document.location.origin + "/shippment/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        var rawdata = new wangjia();
        $scope.wangjias = new Array();
        showPleaseWait("請稍候...");
        myService.getDataFromDB($http, delivery_API,function(response) {
            if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]") {
                myService.getDataFromDB($http, ship_API, function (response) {
                    if (JSON.stringify(response) == "{}" || JSON.stringify(response) == "[]") {
                        myService.showAlert($mdDialog, ev, "查詢不到資料", '請檢查"配送日期"與"出貨單號"');
                    } else {
                        let delivery_API_2 = document.location.origin + "/delivery/" + response[0].order_ID;
                        myService.getDataFromDB($http, delivery_API_2, function (response) {
                            if (JSON.stringify(response) !== "{}" || JSON.stringify(response) == "[]") {
                                rawdata = myService.handleDataToWangjia(response,ev, $http, $mdDialog);
                            }
                        });
                    }

                });
            } else {
                rawdata = myService.handleDataToWangjia(response,ev, $http, $mdDialog);
                $scope.wangjias.push(rawdata);
                myFactory.data = $scope.wangjias;
                myFactory.rawdata = $scope.wangjias;
                myFactory.show = true;
            }
        });
        hidePleaseWait();
    }
    
});

myApp.controller('resultForm', function ($scope, $http, $mdDialog, myService, myFactory) {
    $scope.wangjias = myFactory;
    $scope.show = {
        SubmitBtn: false
    }
    $scope.orderPrice = 0;
    //資料驗證
    $scope.validateNcal = function (rawdata, ev) {
        $scope.orderPrice = 0;
        for (i = 0; i < rawdata.length; i++) {
            let editedShip = rawdata[i];
            if (editedShip.delivery_fee <= 0) {
				myService.showAlert($mdDialog, ev, "第" + (i+1) + "行錯誤", "運費不得為0");
                $scope.show.SubmitBtn = false;
                disableUI(false);
                break;
            } else if (parseInt(editedShip.good_size) > parseInt(editedShip.delivery_fee)) {
				myService.showAlert($mdDialog, ev, "第" + (i+1) + "行錯誤", "運費低於材積數");
                $scope.show.SubmitBtn = false;
                disableUI(false);
                break;
            } else if (editedShip.comment.length == 0 ) {
                myService.showAlert($mdDialog, ev, "注意", '修改紀錄必須填寫備註。');
                $scope.show.SubmitBtn = false;
                disableUI(false);
                break;
            }
            $scope.show.SubmitBtn = true;
            disableUI(true);
        }
        if ($scope.show.SubmitBtn) {
            for (let j = 0; j < $scope.wangjias.data.length; j++) {
                let editedShip = rawdata[j];
                const initShip = $scope.wangjias.data[j].initOrder;
                if(initShip.order_ID == editedShip.order_ID){
                    if (initShip.delivery_fee != editedShip.delivery_fee) {
                        let confirmAns = confirm("請確認運費： \n 調整前：" + initShip.delivery_fee +
                            "\n 調整後：" + editedShip.delivery_fee);
                        if (!confirmAns) {
                            editedShip.delivery_fee = initShip.delivery_fee;
                            $scope.show.SubmitBtn = false;
                            disableUI(false);
                            break;
                        }
                    }
                    if (initShip.good_size != editedShip.good_size) {
                        let confirmAns = confirm("請確認材積數： \n 調整前：" + initShip.good_size +
                            "\n 調整後：" +editedShip.good_size);
                        if (!confirmAns) {
                            editedShip.good_size = initShip.good_size;
                            $scope.show.SubmitBtn = false;
                            disableUI(false);
                            break;
                        }
                    }
                    if (initShip.comment == editedShip.comment) {
                        myService.showAlert($mdDialog, ev, "注意", '修改紀錄必須填寫備註。');
                        $scope.show.SubmitBtn = false;
                        disableUI(false);
                        break;
                    }
                }
            }
        };
            
    };

    //送出資料
    $scope.submitForm = function () {
        //資料整理
        var arrFinalData = [];
        $scope.wangjias.data.forEach(function (x, index) {
            console.log("calcuating order #" + index + "...");
            var submitOrder;
            var submitShips = [];
            submitOrder = new order();
            submitOrder.updateduser = userID;
            submitOrder.order_ID = x.order_ID;
            submitOrder.good_size = x.good_size;
            submitOrder.delivery_fee = x.delivery_fee;
            submitOrder.comment = x.comment;
            arrFinalData.push(submitOrder);
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