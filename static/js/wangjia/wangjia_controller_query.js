//MVC的C
myApp.controller('queryForm', function ($scope, $http, myService, myFactory) {
    var result = function(){
        this.order = new order();
        this.ships = new Array();
    }
    $scope.wangjias = new Array();
    $scope.query = function () {
        this.shipDate = "",
        this.orderID = ""
    };
    $scope.queryData = function () {
        let delivery_API = document.location.origin + "/delivery/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        let ship_API = document.location.origin + "/shippment/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        
        myService.getDataFromDB($http, delivery_API,function(response) {
            result.order = response;
            if (JSON.stringify(result.order) == "{}") {
                alert("查詢不到資料! \n請檢查'配送日期'與'出貨單號'");
            } else {
                myService.getDataFromDB($http, ship_API, function (response) {
                    result.ships = response;
                    if (result.ships.length > 0) {
                        $scope.wangjias = myService.convertOrder2Wangjia(result.order, result.ships);
                        myFactory.data = $scope.wangjias;
                        myFactory.show = true;
                    } else {
                        alert("查詢不到資料! \n請檢查'配送日期'與'出貨單號'");
                    }
                });
            }
        });
    }
    
});

myApp.controller('resultForm', function ($scope, $http, myService, myFactory) {
    $scope.wangjias = myFactory;
    $scope.show = {
        SubmitBtn: false
    }
    //資料驗證
    $scope.validateNcal = function (rawdata) {
        for (i = 0; i < rawdata.length; i++) {
            if (rawdata[i].delivery_fee == 0) {
                alert('送貨單號：' + rawdata[i].order_ID + '的運費不正確，請確認內容');
                $scope.show.SubmitBtn = false;
                break;
            } else if (parseInt(rawdata[i].good_size) > parseInt(rawdata[i].delivery_fee)) {
                alert('送貨單號：' + rawdata[i].order_ID + '的運費低於材積數，請確認內容');
                $scope.show.SubmitBtn = false;
                break;
            } else if (rawdata[i].comment.length == 0){
                alert('注意：修改紀錄必須填寫備註。');
                $scope.show.SubmitBtn = false;
                break;
            }
            $scope.show.SubmitBtn = true;
            disableUI(true);
            if ($scope.show.SubmitBtn) {
                for (let j = 0; j < $scope.wangjias.data.length; j++) {
                    const ship = $scope.wangjias.data[j].initOrder;
                    if(ship.order_ID == rawdata[i].order_ID){
                        if (ship.delivery_fee != rawdata[i].delivery_fee) {
                            let confirmAns = confirm("請確認運費： \n 調整前：" + ship.delivery_fee +
                                "\n 調整後：" + rawdata[i].delivery_fee);
                            if (!confirmAns) {
                                rawdata[i].delivery_fee = ship.delivery_fee;
                                $scope.show.SubmitBtn = false;
                                disableUI(false);
                                break;
                            }
                        }
                        if (ship.good_size != rawdata[i].good_size) {
                            let confirmAns = confirm("請確認材積數： \n 調整前：" + ship.good_size +
                                "\n 調整後：" + rawdata[i].good_size);
                            if (!confirmAns) {
                                rawdata[i].good_size = ship.good_size;
                                $scope.show.SubmitBtn = false;
                                disableUI(false);
                                break;
                            }
                        }
                        if (ship.comment == rawdata[i].comment) {
                            alert('注意：修改紀錄必須填寫備註。');
                            $scope.show.SubmitBtn = false;
                            disableUI(false);
                            break;
                        }
                    }
                }
            };
        }
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
                
            }
        };
    };
});