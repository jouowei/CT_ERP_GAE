//MVC的C
myApp.controller('queryForm', function ($scope, $http, $mdDialog, myService, myFactory) {
    $scope.kuo = order;
    $scope.query = function () {
        this.ID = ""
    };
    $scope.show = {
        ContentTable: false,
        SubmitBtn: false
    }
    $scope.queryData = function (ev) {
        showPleaseWait("請稍後...");
        if (typeof $scope.query.ID == "undefined" || $scope.query.ID.length == 0) {
            hidePleaseWait();
            return;
        } else {
            myFactory.data = new Object();
            myFactory.initData = new Object();
            myFactory.DataTable = false;
        }
        //用order ID 查詢 order
        let delivery_API = document.location.origin + "/delivery/" + $scope.query.ID;
        myService.getDataFromDB($http, delivery_API,function(r) {
            //空資料
            if (JSON.stringify(r) == "{}") {
                //用ship ID 查詢 ship
                let ship_API = document.location.origin + "/shippment/" + $scope.query.ID;
                myService.getDataFromDB($http, ship_API, function (i) {
                    if (JSON.stringify(i) == "{}" || i.length == 0) {
                        hidePleaseWait();
                        myService.showAlert($mdDialog, ev, "查詢不到資料", '請檢查單號是否正確');
                        return;
                    } else {
                        //找到ship_ID，用ship的Order_ID去找Order及ship
                        if (i.length > 0) {
                            if (i[0].order_ID.length > 0) {
                                let d = document.location.origin + "/delivery/" + i[0].order_ID
                                myService.getDataFromDB($http, d, function (j) {
                                    if (JSON.stringify(j) !== "{}" ) {
                                        if (j.order_ID.length > 0) {
                                            $scope.kuo = j;
                                            let k = document.location.origin + "/shippment/" + j.order_ID;
                                            myService.getDataFromDB($http, k, function (x) {
                                                if (x.length > 0) {
                                                    $scope.kuo.ships = x;
                                                    hidePleaseWait();
                                                    return;
                                                }
                                            });
                                        } else {
                                            $scope.kuo = new kuo_order();
                                            hidePleaseWait();
                                            return;
                                        }
                                    } else {
                                        hidePleaseWait();
                                        myService.showAlert($mdDialog, ev, "查詢不到資料", '請檢查單號是否正確');
                                        return;
                                    }
                                });
                            }
                        }
                    }
                });
            } else {
                $scope.kuo = r;
                let ship_API = document.location.origin + "/shippment/" + $scope.query.ID;
                myService.getDataFromDB($http, ship_API, function (y) {
                    if (JSON.stringify(y) !== "{}") {
                        $scope.kuo.ships = y;
                        hidePleaseWait();
                    }
                });
            }
        });
        myFactory.data = $scope.kuo;
        myFactory.initData = angular.copy($scope.kuo)
        if (myFactory.data.order_ID.length > 0) {
            myFactory.show = true;
        }
    }
});

myApp.controller('resultForm', function ($scope, $http, myService, myFactory) {
    $scope.kuo = myFactory;
    $scope.order_store = order_store;
    $scope.drivers = drivers;
    $scope.SubmitBtn = false;
    //資料驗證
    $scope.validateNcal = function () {
        let editedData = $scope.kuo.data;
        let rawData = $scope.kuo.initData;
        let confirmConent = "";
        $scope.SubmitBtn = true;
        if (rawData.delivery_date !== editedData.delivery_date) {
            confirmConent = '請確認配送日期：\n調整前：' + rawData.delivery_date + '\n調整後：' + editedData.delivery_date;
            let confirmAns = confirm(confirmConent);
            if (!confirmAns) {
                editedData.delivery_date = rawdata.delivery_fee;
                $scope.show.SubmitBtn = false;
                return;
            }
        } else if (rawData.comment == editedData.comment){
            alert('注意：修改紀錄必須填寫備註。');
            $scope.SubmitBtn = false;
            return;
        } else {
            for (i = 0; i < editedData.ships.length; i++){
                const editedShip = editedData.ships[i];
                const rawShip = rawData.ships[i];
                if (editedShip.ship_orderStore != rawShip.ship_orderStore){
                    confirmConent = '請確認 ' + editedShip.ship_ID+ ' 的發單門市：\n調整前：' + rawShip.ship_orderStore + '\n調整後：' + editedShip.ship_orderStore;
                    let confirmAns = confirm(confirmConent);
                    if (!confirmAns) { 
                        editedData.ship_orderStore = rawShip.ship_orderStore;
                        $scope.SubmitBtn = false;
                    }
                }
                if (editedShip.driver != rawShip.driver) {
                    confirmConent = '請確認 ' + editedShip.ship_ID + ' 的司機姓名：\n調整前：' + rawShip.driver + '\n調整後：' + editedShip.driver;
                    let confirmAns = confirm(confirmConent);
                    if (!confirmAns) {
                        editedData.driver = rawShip.driver;
                        $scope.SubmitBtn = false;
                    }
                }
                if (editedShip.amount_collect != rawShip.amount_collect || editedShip.paytype != rawShip.paytype) {
                    confirmConent = '請確認 ' + editedShip.ship_ID + ' 的預收款：\n調整前：' + rawShip.paytype + " " + rawShip.amount_collect + '元\n調整後：' + editedShip.paytype + " " + editedShip.amount_collect + '元';
                    let confirmAns = confirm(confirmConent);
                    if (!confirmAns) {
                        editedData.amount_collect = rawShip.amount_collect;
                        editedData.paytype = rawShip.paytype;
                        $scope.SubmitBtn = false;
                    }
                }
                if (editedShip.ship_datetime != rawShip.ship_datetime) {
                    confirmConent = '請確認 ' + editedShip.ship_ID + ' 的指定時間：\n調整前：' + rawShip.ship_datetime + '\n調整後：' + editedShip.ship_datetime;
                    let confirmAns = confirm(confirmConent);
                    if (!confirmAns) {
                        editedData.ship_datetime = rawShip.ship_datetime;
                        $scope.SubmitBtn = false;
                    }
                }
                if (editedShip.contact_info != rawShip.contact_info) {
                    confirmConent = '請確認 ' + editedShip.ship_ID + ' 的聯絡人：\n調整前：' + rawShip.contact_info + '\n調整後：' + editedShip.contact_info;
                    let confirmAns = confirm(confirmConent);
                    if (!confirmAns) {
                        editedData.contact_info = rawShip.contact_info;
                        $scope.SubmitBtn = false;
                    }
                }
            }
        }
        disableUI($scope.SubmitBtn); 
    };

    //送出資料
    $scope.submitForm = function () {
        //資料整理
        //console.log("calcuating order #" + index + "...");
        var order = $scope.kuo.data;
        order.updateduser = userID;
        showPleaseWait();
        //POST request
        if ($scope.SubmitBtn) {
            let SUBMIT_ORDER_API = document.location.origin + "/delivery/" + order.order_ID;
            try {
                $http
                    .post(SUBMIT_ORDER_API, JSON.stringify(order))
                    .then(function successCallback(response) {
                        if (response.status === 200) {
                            if (response.data === "資料更新成功") {                                
                                for(i = 0; i < order.ships.length; i++){
                                    let ship = order.ships[i];
                                    ship.updateduser = userID;
                                    let SUBMIT_SHIPS_API = document.location.origin + "/shippment/" + ship.ship_ID;
                                    $http
                                        .post(SUBMIT_SHIPS_API, JSON.stringify(ship))
                                        .then(function successCallback(response) {
                                            if (response.status === 200) {
                                                if (response.data === "資料更新成功") {
                                                } else {
                                                    throw '系統出現問題，請通知工程師處理 "level:1" \n' + response.data;
                                                }
                                            }
                                        },
                                        function errorCallback(response) {
                                            throw ('系統出現問題，請通知工程師處理 \n' + response.data);
                                        });
                                }
                                hidePleaseWait();
                                alert('資料更新成功');
                                setTimeout(function () {location.reload();}, 500);
                            }
                        } else {
                            throw '系統出現問題，請通知工程師處理 "level:1" \n' + response.data;
                        }
                    }, function errorCallback(response) {
                        return alert('系統出現問題，請通知工程師處理 \n' + response.data);
                    });
            } catch (err) {
                return alert(err);
            }
        };
    };
});